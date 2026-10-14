import crypto from "crypto";
import mongoose from "mongoose";
import billModel from "../models/bill.model.js";
import productModel from "../models/product.model.js";
import userModel from "../models/user.model.js";
import orderModel from "../models/order.model.js";
import { emitToUser } from "../services/socket.service.js";

const getUserId = (req) => String(req.user?._id || req.user?.id || "");
const getErrorStatus = (error) => error.status || (error.name === "VersionError" ? 409 : 500);
const calculateSubtotal = (items) => Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeBillItems = async (sellerId, input) => {
  if (!Array.isArray(input) || input.length > 100) throw Object.assign(new Error("A bill can contain up to 100 item rows."), { status: 400 });
  if (!input.length) return [];
  const ids = [...new Set(input.map((row) => String(row.productId || row.product || "")))];
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) throw Object.assign(new Error("One or more products are invalid."), { status: 400 });
  const products = await productModel.find({ _id: { $in: ids }, seller: sellerId, status: { $ne: "trash" } });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  return input.map((row) => {
    const product = productMap.get(String(row.productId || row.product || ""));
    if (!product) throw Object.assign(new Error("A product was removed or is no longer in your catalogue. Refresh the bill and try again."), { status: 409 });
    const variantId = row.variantId ? String(row.variantId) : null;
    const variant = variantId ? product.variants.id(variantId) : null;
    if (variantId && !variant) throw Object.assign(new Error(`${product.title} no longer has the selected variant.`), { status: 409 });
    const quantity = Number(row.quantity);
    const price = Number(row.price);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) throw Object.assign(new Error("Quantity must be a whole number from 1 to 9,999."), { status: 400 });
    if (!Number.isFinite(price) || price < 0 || price > 100000000) throw Object.assign(new Error("Enter a valid item price."), { status: 400 });
    const primaryImage = variant?.images?.find((image) => image.isPrimary)?.url || variant?.images?.[0]?.url || product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url || "";
    return { product: product._id, variantId, name: variant?.name ? `${product.title} · ${variant.name}` : product.title, image: primaryImage, price: Math.round(price * 100) / 100, quantity };
  });
};

const adjustStock = async (item, delta, session) => {
  if (!delta) return;
  const productQuery = productModel.findById(item.product).select("manageStock status");
  if (session) productQuery.session(session);
  const product = await productQuery.lean();
  if (!product) throw Object.assign(new Error("A product in this bill was removed."), { status: 409 });
  if (delta > 0 && product.status === "trash") throw Object.assign(new Error(`${item.name} was removed from the catalogue. Remove it from this bill before payment.`), { status: 409 });
  if (!product.manageStock) return;
  const filter = { _id: item.product, ...(delta > 0 ? { status: { $ne: "trash" } } : {}) };
  let update;
  let options = {};
  if (item.variantId) {
    if (delta > 0) {
      filter.variants = { $elemMatch: { _id: item.variantId, stock: { $gte: delta } } };
      update = { $inc: { "variants.$.stock": -delta } };
    } else {
      filter["variants._id"] = item.variantId;
      update = { $inc: { "variants.$.stock": -delta } };
    }
  } else {
    if (delta > 0) filter.stock = { $gte: delta };
    update = { $inc: { stock: -delta } };
  }
  const result = await productModel.updateOne(filter, update, { ...options, ...(session ? { session } : {}) });
  if (!result.modifiedCount) throw Object.assign(new Error(`${item.name} has insufficient stock. The bill was not changed.`), { status: 409 });
  if (!item.variantId) {
    const availabilityFilter = { _id: item.product, stock: delta > 0 ? { $lte: 0 } : { $gt: 0 } };
    const stockStatus = delta > 0 ? "outofstock" : "instock";
    await productModel.updateOne(availabilityFilter, { $set: { stockStatus } }, session ? { session } : {});
  }
};

const itemCounts = (items) => {
  const counts = new Map();
  items.forEach((item) => {
    const key = `${item.product}:${item.variantId || ""}`;
    const row = item.toObject ? item.toObject() : item;
    counts.set(key, { ...row, quantity: (counts.get(key)?.quantity || 0) + item.quantity });
  });
  return counts;
};

const applyInventoryDifference = async (oldItems, newItems, session) => {
  const before = itemCounts(oldItems);
  const after = itemCounts(newItems);
  const keys = new Set([...before.keys(), ...after.keys()]);
  for (const key of keys) {
    const oldItem = before.get(key);
    const nextItem = after.get(key);
    const delta = (nextItem?.quantity || 0) - (oldItem?.quantity || 0);
    if (delta > 0) await adjustStock(nextItem, delta, session);
  }
  for (const key of keys) {
    const oldItem = before.get(key);
    const nextItem = after.get(key);
    const delta = (nextItem?.quantity || 0) - (oldItem?.quantity || 0);
    if (delta < 0) await adjustStock(oldItem, delta, session);
  }
};

export const listSellerBills = async (req, res) => {
  try {
    const filter = { seller: getUserId(req), status: { $ne: "cancelled" } };
    if (req.query.customerId && mongoose.Types.ObjectId.isValid(req.query.customerId)) filter.customer = req.query.customerId;
    const bills = await billModel.find(filter)
      .populate("customer", "fullname email contact role")
      .sort({ updatedAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: bills });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const deleteSellerBill = async (req, res) => {
  try {
    const bill = await billModel.findOneAndUpdate(
      { _id: req.params.id, seller: getUserId(req), status: { $ne: "cancelled" } },
      { $set: { status: "cancelled", changeRequest: null } },
      { new: true, runValidators: true },
    );
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found." });
    return res.json({ success: true, message: "Bill deleted from your active bill list." });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const searchSellerCatalog = async (req, res) => {
  try {
    const filter = { seller: getUserId(req), status: { $ne: "trash" } };
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(10, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * pageSize;
    const rawIds = String(req.query.ids || "").split(",").filter(Boolean).slice(0, 60);
    if (rawIds.length) {
      const ids = rawIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      filter._id = { $in: ids };
    } else {
      const query = String(req.query.q || "").trim().slice(0, 80);
      if (!query) {
        const recentProducts = await billModel.aggregate([
          { $match: { seller: new mongoose.Types.ObjectId(getUserId(req)), status: "paid" } },
          { $unwind: "$items" },
          { $sort: { paidAt: -1, updatedAt: -1 } },
          { $group: { _id: "$items.product", lastSoldAt: { $first: "$paidAt" } } },
          { $sort: { lastSoldAt: -1 } },
          { $skip: skip },
          { $limit: pageSize + 1 },
        ]);
        if (!recentProducts.length) {
          if (page > 1) return res.json({ success: true, data: [], hasMore: false, page });
          const products = await productModel.find(filter).select("title sku images variants sellingPrice maxPrice stock manageStock status").sort({ updatedAt: -1 }).skip(skip).limit(pageSize + 1).lean();
          const hasMore = products.length > pageSize;
          return res.json({ success: true, data: products.slice(0, pageSize), hasMore, page });
        }
        const hasMore = recentProducts.length > pageSize;
        const ids = recentProducts.slice(0, pageSize).map((row) => row._id);
        const products = await productModel.find({ ...filter, _id: { $in: ids } }).select("title sku images variants sellingPrice maxPrice stock manageStock status").lean();
        const position = new Map(ids.map((id, index) => [String(id), index]));
        products.sort((a, b) => position.get(String(a._id)) - position.get(String(b._id)));
        return res.json({ success: true, data: products, hasMore, page });
      }
      const rx = new RegExp(escapeRegex(query), "i");
      filter.$or = [
        { title: rx }, { description: rx }, { shortDescription: rx }, { sku: rx }, { tags: rx },
        { "variants.name": rx }, { "variants.sku": rx }, { "variants.barcode": rx },
        { "attributes.name": rx }, { "attributes.options": rx },
      ];
      const price = Number(query.replace(/[₹,\s]/g, ""));
      if (Number.isFinite(price) && price >= 0) {
        filter.$or.push({ "sellingPrice.amount": price }, { "maxPrice.amount": price }, { "variants.price.amount": price });
      }
    }
    const products = await productModel.find(filter).select("title sku images variants sellingPrice maxPrice stock manageStock status").sort({ updatedAt: -1 }).skip(rawIds.length ? 0 : skip).limit(rawIds.length ? 60 : pageSize + 1).lean();
    const hasMore = rawIds.length ? false : products.length > pageSize;
    if (!rawIds.length && hasMore) products.pop();
    // Exact catalogue matches appear ahead of broader substring matches.
    const query = String(req.query.q || "").trim();
    if (query.length) {
      products.sort((a, b) => {
        const exact = (product) => [product.title, product.sku, product.shortDescription, ...(product.tags || [])].some((field) => field && field.toLowerCase() === query.toLowerCase());
        return Number(exact(b)) - Number(exact(a));
      });
    }
    return res.json({ success: true, data: products, hasMore, page });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const searchBillCustomers = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim().slice(0, 80);
    if (!query) {
      const recent = await billModel.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(getUserId(req)), status: "paid", customer: { $ne: null } } },
        { $sort: { paidAt: -1, updatedAt: -1 } },
        { $group: { _id: "$customer", lastBillAt: { $first: "$paidAt" } } },
        { $sort: { lastBillAt: -1 } },
        { $limit: 5 },
      ]);
      const ids = recent.map((row) => row._id);
      const onlineRows = await orderModel.aggregate([
        { $match: { "orderItems.seller": new mongoose.Types.ObjectId(getUserId(req)) } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$user", lastOrderAt: { $first: "$createdAt" } } },
        { $limit: 30 },
      ]);
      const offlineIds = new Set(ids.map(String));
      const onlineIds = onlineRows.map((row) => row._id).filter((id) => !offlineIds.has(String(id))).slice(0, Math.max(0, 5 - ids.length));
      const orderedIds = [...ids, ...onlineIds];
      const users = await userModel.find({ _id: { $in: orderedIds }, isBanned: { $ne: true }, role: { $in: ["buyer", "seller"] } }).select("fullname email contact role").lean();
      const position = new Map(orderedIds.map((id, index) => [String(id), index]));
      users.sort((a, b) => position.get(String(a._id)) - position.get(String(b._id)));
      return res.json({ success: true, data: users });
    }
    const rx = new RegExp(escapeRegex(query), "i");
    const digits = query.replace(/\D/g, "");
    const contactRx = digits.length >= 5 ? new RegExp(digits.split("").map(escapeRegex).join("\\D*"), "i") : rx;
    const users = await userModel.find({ role: { $in: ["buyer", "seller"] }, isBanned: { $ne: true }, $or: [{ fullname: rx }, { contact: contactRx }, { email: rx }] })
      .select("fullname email contact role").sort({ fullname: 1 }).limit(5).lean();
    return res.json({ success: true, data: users });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const createBill = async (req, res) => {
  try {
    let customer = null;
    if (req.body.customerId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.customerId)) return res.status(400).json({ success: false, message: "Select a valid customer." });
      customer = await userModel.findOne({ _id: req.body.customerId, role: { $in: ["buyer", "seller"] }, isBanned: { $ne: true } }).select("_id");
      if (!customer) return res.status(400).json({ success: false, message: "This account cannot be billed." });
    }
    const bill = await billModel.create({
      billNumber: `SG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      seller: getUserId(req),
      ...(customer ? { customer: customer._id } : {}),
      guestCustomer: customer ? { name: "", phone: "" } : { name: "Walk-in customer", phone: "" },
    });
    await bill.populate("customer", "fullname email contact role");
    return res.status(201).json({ success: true, data: bill });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getMyBills = async (req, res) => {
  try {
    const bills = await billModel.find({ customer: getUserId(req), status: { $ne: "cancelled" } })
      .populate("seller", "fullname profilePic").sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, count: bills.length, data: bills });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getBill = async (req, res) => {
  try {
    const id = getUserId(req);
    const bill = await billModel.findOne({ _id: req.params.id, $or: [{ seller: id }, { customer: id }] })
      .populate("customer", "fullname email contact role").lean();
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found." });
    return res.json({ success: true, data: bill });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateDraftBill = async (req, res) => {
  try {
    const bill = await billModel.findOne({ _id: req.params.id, seller: getUserId(req) });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found." });
    if (bill.status !== "draft") return res.status(409).json({ success: false, message: "Paid bills need customer approval before they can be changed." });
    const { items, customerId, guestCustomer } = req.body;
    if (customerId !== undefined) {
      if (!customerId) bill.customer = null;
      else {
        if (!mongoose.Types.ObjectId.isValid(customerId)) return res.status(400).json({ success: false, message: "Select a valid customer." });
        const customer = await userModel.findById(customerId).select("isBanned role");
        if (!customer || customer.isBanned || customer.role === "admin") return res.status(400).json({ success: false, message: "This account cannot be billed." });
        bill.customer = customer._id;
      }
    }
    if (guestCustomer !== undefined) {
      bill.guestCustomer = bill.customer
        ? { name: "", phone: "" }
        : {
          name: String(guestCustomer?.name || "Walk-in customer").trim().slice(0, 120),
          phone: String(guestCustomer?.phone || "").trim().slice(0, 30),
        };
    }
    if (items !== undefined) bill.items = await normalizeBillItems(getUserId(req), items);
    bill.subtotal = calculateSubtotal(bill.items);
    await bill.save();
    return res.json({ success: true, data: bill });
  } catch (error) { return res.status(getErrorStatus(error)).json({ success: false, message: error.message }); }
};

export const markBillPaid = async (req, res) => {
  let session;
  try {
    const paymentMethod = String(req.body.paymentMethod || "").toLowerCase();
    if (!["cash", "upi", "card", "other"].includes(paymentMethod)) return res.status(400).json({ success: false, message: "Choose a valid payment method." });
    session = await mongoose.startSession();
    let bill;
    await session.withTransaction(async () => {
      bill = await billModel.findOne({ _id: req.params.id, seller: getUserId(req), status: "draft" }).session(session);
      if (!bill) {
        const existing = await billModel.exists({ _id: req.params.id, seller: getUserId(req) }).session(session);
        throw Object.assign(new Error(existing ? "Only a draft bill can be marked paid." : "Bill not found."), { status: existing ? 409 : 404 });
      }
      if (!bill.items.length) throw Object.assign(new Error("Add at least one item before completing payment."), { status: 400 });
      for (const item of bill.items) await adjustStock(item, item.quantity, session);
      bill.status = "paid";
      bill.paymentMethod = paymentMethod;
      bill.paidAt = new Date();
      await bill.save({ session });
    });
    if (bill.customer) emitToUser(bill.customer, "bill_updated", { billId: bill._id, status: bill.status });
    return res.json({ success: true, data: bill });
  } catch (error) { return res.status(getErrorStatus(error)).json({ success: false, message: error.message }); }
  finally { if (session) await session.endSession(); }
};

export const requestBillChange = async (req, res) => {
  try {
    const bill = await billModel.findOne({ _id: req.params.id, seller: getUserId(req) }).populate("customer", "fullname");
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found." });
    if (bill.status !== "paid") return res.status(409).json({ success: false, message: "Only paid bills need a customer change request." });
    if (!bill.customer) return res.status(409).json({ success: false, message: "Walk-in bills have no signed-in customer to approve edits. Create a corrected bill instead." });
    if (bill.changeRequest?.state === "pending") return res.status(409).json({ success: false, message: "A change request is already waiting for this customer." });
    const items = await normalizeBillItems(getUserId(req), req.body.items);
    if (!items.length) return res.status(400).json({ success: false, message: "A paid bill cannot be changed to an empty bill." });
    bill.changeRequest = { requestId: crypto.randomUUID(), state: "pending", items, subtotal: calculateSubtotal(items), requestedAt: new Date(), decidedAt: null };
    await bill.save();
    emitToUser(bill.customer._id, "bill_change_requested", { billId: bill._id, billNumber: bill.billNumber, sellerName: req.user.fullname, requestId: bill.changeRequest.requestId });
    return res.json({ success: true, data: bill });
  } catch (error) { return res.status(getErrorStatus(error)).json({ success: false, message: error.message }); }
};

export const decideBillChange = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    let bill;
    let changeState;
    await session.withTransaction(async () => {
      bill = await billModel.findOne({ _id: req.params.id, customer: getUserId(req), status: "paid", "changeRequest.state": "pending", "changeRequest.requestId": req.params.requestId }).session(session);
      if (!bill) throw Object.assign(new Error("This change request is no longer pending."), { status: 409 });
      const change = bill.changeRequest;
      if (req.body.approve === true) {
        await applyInventoryDifference(bill.items, change.items || [], session);
        bill.items = change.items;
        bill.subtotal = change.subtotal;
        change.state = "approved";
      } else change.state = "rejected";
      change.decidedAt = new Date();
      await bill.save({ session });
      changeState = change.state;
    });
    emitToUser(bill.seller, "bill_updated", { billId: bill._id, status: bill.status, changeState });
    return res.json({ success: true, data: bill });
  } catch (error) { return res.status(getErrorStatus(error)).json({ success: false, message: error.message }); }
  finally { if (session) await session.endSession(); }
};
