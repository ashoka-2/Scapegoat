import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import cartModel from "../models/cart.model.js";
import sellerCustomerModel from "../models/sellerCustomer.model.js";
import WebhookEvent from "../models/webhookEvent.model.js";
import { broadcastUpdate, emitToSeller, emitToUser } from "../services/socket.service.js";
import { config } from "../config/config.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const getProductPrice = (product, cartItem) =>
    cartItem?.variant?.price?.amount || product.sellingPrice?.amount || product.maxPrice?.amount || 0;

const getProductImage = (product) =>
    product.images?.[0]?.url || (typeof product.images?.[0] === "string" ? product.images[0] : "") || "";

const createRazorpayClient = () => {
    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment.");
    }
    return new Razorpay({ key_id: config.RAZORPAY_KEY_ID, key_secret: config.RAZORPAY_KEY_SECRET });
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress, paymentMethod, items: customItems } = req.body;

        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({ success: false, message: "Shipping address and payment method are required." });
        }

        if (paymentMethod === "Razorpay") {
            return res.status(400).json({
                success: false,
                message: "Use the Razorpay checkout endpoint to create and verify online payments.",
            });
        }
        if (paymentMethod !== "COD") {
            return res.status(400).json({ success: false, message: "Unsupported payment method." });
        }

        let orderItems = [];
        let itemsPrice = 0;

        if (customItems && customItems.length > 0) {
            // Direct Buy-Now flow
            for (const item of customItems) {
                const product = await productModel.findById(item.product);
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
                }

                if (product.seller.toString() === userId.toString()) {
                    return res.status(400).json({ success: false, message: `You cannot purchase your own product: "${product.title}"` });
                }

                // Atomic stock check and deduction
                const updatedProduct = await productModel.findOneAndUpdate(
                    { _id: product._id, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );

                if (!updatedProduct) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${product.title}". Someone else may have just purchased it.`,
                    });
                }

                const price = product.sellingPrice?.amount || product.maxPrice?.amount || 0;
                const imgUrl = product.images?.[0]?.url || (typeof product.images?.[0] === "string" ? product.images[0] : "") || "";

                orderItems.push({
                    product: product._id,
                    seller: product.seller,
                    name: product.title,
                    image: imgUrl,
                    price,
                    quantity: item.quantity,
                });

                itemsPrice += price * item.quantity;
            }
        } else {
            // Checkout from Cart
            const cart = await cartModel.findOne({ user: userId }).populate("items.product");
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ success: false, message: "Your cart is empty." });
            }

            for (const cartItem of cart.items) {
                const product = cartItem.product;
                if (!product) continue;

                if (product.seller && product.seller.toString() === userId.toString()) {
                    return res.status(400).json({ success: false, message: `You cannot purchase your own product: "${product.title}"` });
                }

                // Atomic stock check and deduction
                const updatedProduct = await productModel.findOneAndUpdate(
                    { _id: product._id, stock: { $gte: cartItem.quantity } },
                    { $inc: { stock: -cartItem.quantity } },
                    { new: true }
                );

                if (!updatedProduct) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${product.title}". Please adjust your cart.`,
                    });
                }

                const price = cartItem.variant?.price?.amount || product.sellingPrice?.amount || product.maxPrice?.amount || 0;
                const imgUrl = product.images?.[0]?.url || (typeof product.images?.[0] === "string" ? product.images[0] : "") || "";

                orderItems.push({
                    product: product._id,
                    seller: product.seller,
                    name: product.title,
                    image: imgUrl,
                    price,
                    quantity: cartItem.quantity,
                    selectedAttributes: cartItem.selectedAttributes || {},
                    variantId: cartItem.variantId || null,
                });

                itemsPrice += price * cartItem.quantity;
            }

            // Clear user's cart after successful order creation
            cart.items = [];
            await cart.save();
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ success: false, message: "No valid items to order." });
        }

        const shippingPrice = itemsPrice > 1999 ? 0 : 99;
        const taxPrice = 0; // Tax excluded by default
        const totalPrice = itemsPrice + shippingPrice;

        const order = await orderModel.create({
            user: userId,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid: paymentMethod !== "COD",
            paidAt: paymentMethod !== "COD" ? new Date() : null,
            status: "Processing",
        });

        // Notify sellers in real-time & save permanent customer connection
        const sellerIds = [...new Set(orderItems.map((item) => item.seller.toString()))];
        for (const sellerId of sellerIds) {
            emitToSeller(sellerId, "new_order", { orderId: order._id, totalPrice: order.totalPrice });
            await sellerCustomerModel.findOneAndUpdate(
                { seller: sellerId, customer: userId },
                { lastInteractionType: "order", lastInteractionAt: new Date() },
                { upsert: true, new: true }
            ).catch(() => {});
        }

        broadcastUpdate("order_created", { orderId: order._id });

        const populatedOrder = await orderModel.findById(order._id).populate("user", "fullname email contact");

        return res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            order: populatedOrder,
        });
    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to place order." });
    }
};

/**
 * @desc Create a Razorpay payment order from server-validated cart contents
 * @route POST /api/orders/razorpay/create-order
 * @access Private
 */
export const createRazorpayOrder = async (req, res) => {
    try {
        const { shippingAddress } = req.body;
        const userId = req.user._id;

        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: "Shipping address is required." });
        }

        const cart = await cartModel.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        const orderItems = [];
        let itemsPrice = 0;

        for (const cartItem of cart.items) {
            const product = cartItem.product;
            if (!product || product.status !== "published") {
                return res.status(400).json({ success: false, message: "One or more products are no longer available." });
            }
            if (product.seller?.toString() === userId.toString()) {
                return res.status(400).json({ success: false, message: `You cannot purchase your own product: "${product.title}"` });
            }
            if (product.stock < cartItem.quantity || product.stockStatus === "outofstock") {
                return res.status(400).json({ success: false, message: `Insufficient stock for "${product.title}".` });
            }

            const price = getProductPrice(product, cartItem);
            orderItems.push({
                product: product._id,
                seller: product.seller,
                name: product.title,
                image: getProductImage(product),
                price,
                quantity: cartItem.quantity,
                selectedAttributes: cartItem.selectedAttributes || {},
                variantId: cartItem.variantId || null,
            });
            itemsPrice += price * cartItem.quantity;
        }

        const shippingPrice = itemsPrice > 1999 ? 0 : 99;
        const totalPrice = itemsPrice + shippingPrice;

        // Retry loop handles race condition where two concurrent orders get the same orderId
        let internalOrder;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                internalOrder = await orderModel.create({
                    user: userId,
                    orderItems,
                    shippingAddress,
                    paymentMethod: "Razorpay",
                    itemsPrice,
                    taxPrice: 0,
                    shippingPrice,
                    totalPrice,
                    isPaid: false,
                    status: "Payment Pending",
                    paymentResult: { status: "created", currency: "INR", amount: Math.round(totalPrice * 100), cartCheckout: true },
                });
                break; // success — exit retry loop
            } catch (err) {
                if (err.code === 11000 && attempt < 2) {
                    // Duplicate orderId — retry (pre-save hook will recalculate)
                    continue;
                }
                throw err;
            }
        }

        try {
            const razorpayOrder = await createRazorpayClient().orders.create({
                amount: Math.round(totalPrice * 100),
                currency: "INR",
                receipt: `sc_${internalOrder._id.toString().slice(-20)}`,
                notes: { scapegoatOrderId: internalOrder._id.toString(), userId: userId.toString() },
            });

            internalOrder.paymentResult.razorpayOrderId = razorpayOrder.id;
            await internalOrder.save();

            return res.status(201).json({
                success: true,
                keyId: config.RAZORPAY_KEY_ID,
                internalOrderId: internalOrder._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            });
        } catch (error) {
            await orderModel.findByIdAndDelete(internalOrder._id);
            throw error;
        }
    } catch (error) {
        console.error("Create Razorpay order error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Unable to start Razorpay checkout." });
    }
};

/**
 * @desc Verify Razorpay checkout signature and fulfil the internal order
 * @route POST /api/orders/razorpay/verify
 * @access Private
 */
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { internalOrderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        if (!internalOrderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Incomplete Razorpay payment response." });
        }

        const order = await orderModel.findOne({ _id: internalOrderId, user: req.user._id, paymentMethod: "Razorpay" });
        if (!order) return res.status(404).json({ success: false, message: "Payment order not found." });

        if (order.isPaid) {
            if (order.paymentResult?.razorpayPaymentId === razorpay_payment_id) {
                return res.status(200).json({ success: true, message: "Payment already verified.", order });
            }
            return res.status(409).json({ success: false, message: "This order has already been paid." });
        }

        const serverOrderId = order.paymentResult?.razorpayOrderId;
        if (!serverOrderId || serverOrderId !== razorpay_order_id) {
            return res.status(400).json({ success: false, message: "Payment order does not match this checkout." });
        }

        const expectedSignature = crypto
            .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
            .update(`${serverOrderId}|${razorpay_payment_id}`)
            .digest("hex");
        const signatureMatches =
            expectedSignature.length === razorpay_signature.length &&
            crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));
        if (!signatureMatches) {
            return res.status(400).json({ success: false, message: "Payment signature verification failed." });
        }

        // Stock is deducted only after a genuine, verified payment. If an item
        // becomes unavailable during this short window, restore any earlier
        // deductions before returning the conflict.
        const deductedItems = [];
        for (const item of order.orderItems) {
            const updatedProduct = await productModel.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
            if (!updatedProduct) {
                await Promise.all(
                    deductedItems.map((deductedItem) =>
                        productModel.findByIdAndUpdate(deductedItem.product, { $inc: { stock: deductedItem.quantity } })
                    )
                );
                return res.status(409).json({
                    success: false,
                    message: `"${item.name}" is no longer available. Please contact support with payment ID ${razorpay_payment_id}.`,
                });
            }
            deductedItems.push(item);
        }

        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "Processing";
        order.paymentResult.id = razorpay_payment_id;
        order.paymentResult.razorpayPaymentId = razorpay_payment_id;
        order.paymentResult.razorpaySignature = razorpay_signature;
        order.paymentResult.status = "verified";
        order.markModified("paymentResult");
        await order.save();

        if (order.paymentResult.cartCheckout) {
            await cartModel.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
        }

        const sellerIds = [...new Set(order.orderItems.map((item) => item.seller.toString()))];
        for (const sellerId of sellerIds) {
            emitToSeller(sellerId, "new_order", { orderId: order._id, totalPrice: order.totalPrice });
            await sellerCustomerModel.findOneAndUpdate(
                { seller: sellerId, customer: req.user._id },
                { lastInteractionType: "order", lastInteractionAt: new Date() },
                { upsert: true, new: true }
            ).catch(() => {});
        }
        broadcastUpdate("order_created", { orderId: order._id });

        const populatedOrder = await orderModel.findById(order._id).populate("user", "fullname email contact");
        return res.status(200).json({ success: true, message: "Payment verified and order placed successfully!", order: populatedOrder });
    } catch (error) {
        console.error("Verify Razorpay payment error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Unable to verify payment." });
    }
};

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.id)
            .populate("user", "fullname email contact profilePic")
            .populate({
                path: "orderItems.product",
                select: "title slug images price seller",
                populate: { path: "seller", select: "fullname email contact role storeName" }
            })
            .populate("orderItems.seller", "fullname email contact role storeName")
            .populate("sellerPayouts.seller", "fullname email contact role storeName");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Deep fallback: If any orderItems.seller is missing populated fields, resolve from userModel
        if (Array.isArray(order.orderItems)) {
            for (let i = 0; i < order.orderItems.length; i++) {
                const item = order.orderItems[i];
                const sellerRaw = item.seller;
                const isUnpopulated = !sellerRaw || !sellerRaw.email;

                if (isUnpopulated) {
                    const sellerIdToLookup =
                        (sellerRaw?._id || sellerRaw) ||
                        (item.product?.seller?._id || item.product?.seller);

                    if (sellerIdToLookup && mongoose.Types.ObjectId.isValid(sellerIdToLookup)) {
                        const sellerDoc = await userModel.findById(sellerIdToLookup)
                            .select("fullname email contact role storeName")
                            .lean();
                        if (sellerDoc) {
                            order.orderItems[i].seller = sellerDoc;
                        }
                    }
                }
            }
        }

        // Allow buyer, seller, or admin
        const currentUserId = req.user._id.toString();
        const isBuyer = (order.user?._id || order.user)?.toString() === currentUserId;
        const isSeller = order.orderItems.some((item) => {
            const itemSellerId = (item.seller?._id || item.seller)?.toString();
            const productSellerId = (item.product?.seller?._id || item.product?.seller)?.toString();
            return itemSellerId === currentUserId || productSellerId === currentUserId;
        });
        const isAdmin = req.user.role === "admin";

        if (!isBuyer && !isSeller && !isAdmin) {
            return res.status(403).json({ success: false, message: "Not authorized to view this order." });
        }

        return res.status(200).json({ success: true, order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get seller's orders
 * @route   GET /api/orders/seller-orders
 * @access  Private/Seller
 */
export const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const orders = await orderModel.find({ "orderItems.seller": sellerId })
            .populate("user", "fullname email contact")
            .populate("orderItems.product", "title slug images price")
            .populate("orderItems.seller", "fullname email contact")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Seller/Admin
 */
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatus = ["Processing", "Shipped", "Delivered", "Cancelled"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value." });
        }

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Restore stock if transitioning to Cancelled
        if (status === "Cancelled" && order.status !== "Cancelled") {
            for (const item of order.orderItems) {
                await productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity },
                });
            }
        }

        order.status = status;
        if (status === "Delivered") {
            order.isDelivered = true;
            order.deliveredAt = new Date();
        }

        await order.save();
        emitToUser(order.user.toString(), "order_status_updated", { orderId: order._id, status, order });
        broadcastUpdate("order_status_updated", { orderId: order._id, status });

        return res.status(200).json({ success: true, message: "Order status updated.", order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Cancel own order (buyer only, only when Processing)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (order owner)
 */
export const cancelMyOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id.toString();

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Only the buyer who placed the order can cancel
        if (order.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You can only cancel your own orders." });
        }

        // Only allow cancellation when status is Processing
        if (order.status !== "Processing") {
            const reason =
                order.status === "Shipped"
                    ? "This order has already been shipped and cannot be cancelled."
                    : order.status === "Delivered"
                    ? "This order has already been delivered."
                    : "This order is already cancelled.";
            return res.status(400).json({ success: false, message: reason });
        }

        // Restore stock for all items
        for (const item of order.orderItems) {
            await productModel.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
            });
        }

        order.status = "Cancelled";
        await order.save();

        // Notify sellers
        const sellerIds = [...new Set(order.orderItems.map((item) => item.seller.toString()))];
        for (const sellerId of sellerIds) {
            emitToSeller(sellerId, "order_cancelled", { orderId: order._id });
        }

        emitToUser(userId, "order_status_updated", { orderId: order._id, status: "Cancelled", order });
        broadcastUpdate("order_status_updated", { orderId: order._id, status: "Cancelled" });

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully. Stock has been restored.",
            order,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update seller payout settlement status (Admin only)
 * @route   PUT /api/orders/:id/payout/:sellerId
 * @access  Private/Admin
 */
export const updateSellerPayout = async (req, res) => {
    try {
        const { id, sellerId } = req.params;
        const { isSettled, transactionRef, notes } = req.body;

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (!order.sellerPayouts) order.sellerPayouts = [];

        const existingIdx = order.sellerPayouts.findIndex(
            (p) => p.seller?.toString() === sellerId.toString()
        );

        if (existingIdx >= 0) {
            order.sellerPayouts[existingIdx].isSettled = isSettled;
            order.sellerPayouts[existingIdx].settledAt = isSettled ? new Date() : null;
            if (transactionRef !== undefined) order.sellerPayouts[existingIdx].transactionRef = transactionRef;
            if (notes !== undefined) order.sellerPayouts[existingIdx].notes = notes;
        } else {
            const sellerAmount = order.orderItems
                .filter((item) => (item.seller?._id || item.seller)?.toString() === sellerId.toString())
                .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

            order.sellerPayouts.push({
                seller: sellerId,
                amount: sellerAmount,
                isSettled,
                settledAt: isSettled ? new Date() : null,
                transactionRef: transactionRef || "",
                notes: notes || "",
            });
        }

        await order.save();
        return res.status(200).json({
            success: true,
            message: `Seller payout ${isSettled ? "marked as settled" : "updated"}.`,
            order,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Handle Razorpay Webhooks with Idempotency & Replay Protection
 * @route   POST /api/orders/razorpay/webhook
 * @access  Public (Secured with Razorpay HMAC SHA-256 signature)
 */
export const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET || config.RAZORPAY_KEY_SECRET;

        if (!signature) {
            return res.status(400).json({ success: false, message: "Missing Razorpay webhook signature header." });
        }

        // 1. Verify Webhook HMAC SHA-256 Signature
        const payloadString = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(payloadString)
            .digest("hex");

        const isValid =
            signature.length === expectedSignature.length &&
            crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

        if (!isValid) {
            console.warn("⚠️ [Razorpay Webhook] Invalid webhook signature received.");
            return res.status(400).json({ success: false, message: "Invalid webhook signature." });
        }

        const event = req.body;
        const eventId =
            req.headers["x-razorpay-event-id"] ||
            event.event_id ||
            event.id ||
            (event.payload?.payment?.entity?.id ? `${event.event}_${event.payload.payment.entity.id}` : null) ||
            `evt_${Date.now()}`;

        const eventType = event.event;
        const paymentEntity = event.payload?.payment?.entity || {};
        const razorpayOrderId = paymentEntity.order_id || event.payload?.order?.entity?.id;
        const razorpayPaymentId = paymentEntity.id;

        // 2. IDEMPOTENCY CHECK: Ensure we never double-process or double-fulfill
        const existingEvent = await WebhookEvent.findOne({ eventId });
        if (existingEvent) {
            console.log(`🛡️ [Razorpay Webhook] Duplicate event "${eventId}" safely ignored (idempotent).`);
            return res.status(200).json({
                success: true,
                message: "Duplicate webhook event already processed (idempotent)",
                eventId,
                status: existingEvent.status,
            });
        }

        // Record incoming webhook to lock processing
        await WebhookEvent.create({
            eventId,
            eventType: eventType || "unknown",
            entityId: razorpayPaymentId || razorpayOrderId || null,
            provider: "razorpay",
            status: "processed",
            payload: event,
        });

        // 3. Process specific payment events
        if (eventType === "payment.captured" || eventType === "order.paid") {
            const internalOrderId = paymentEntity.notes?.scapegoatOrderId;

            const order = await orderModel.findOne({
                $or: [
                    { _id: internalOrderId },
                    { "paymentResult.razorpayOrderId": razorpayOrderId },
                ].filter(Boolean),
            });

            if (order && !order.isPaid) {
                // Deduct stock atomically if not yet deducted
                for (const item of order.orderItems) {
                    await productModel.findOneAndUpdate(
                        { _id: item.product, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } }
                    );
                }

                order.isPaid = true;
                order.paidAt = new Date();
                order.status = "Processing";
                if (!order.paymentResult) order.paymentResult = {};
                order.paymentResult.id = razorpayPaymentId;
                order.paymentResult.razorpayPaymentId = razorpayPaymentId;
                order.paymentResult.status = "verified_webhook";
                order.markModified("paymentResult");
                await order.save();

                // Clear buyer's cart if applicable
                if (order.paymentResult.cartCheckout && order.user) {
                    await cartModel.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });
                }

                // Notify sellers in real-time
                const sellerIds = [...new Set(order.orderItems.map((item) => (item.seller?._id || item.seller)?.toString()).filter(Boolean))];
                for (const sellerId of sellerIds) {
                    emitToSeller(sellerId, "new_order", { orderId: order._id, totalPrice: order.totalPrice });
                }

                console.log(`✅ [Razorpay Webhook] Order ${order._id} fulfilled successfully via webhook ${eventId}`);
            }
        } else if (eventType === "payment.failed") {
            const internalOrderId = paymentEntity.notes?.scapegoatOrderId;
            const order = await orderModel.findOne({
                $or: [
                    { _id: internalOrderId },
                    { "paymentResult.razorpayOrderId": razorpayOrderId },
                ].filter(Boolean),
            });

            if (order && !order.isPaid) {
                order.status = "Payment Failed";
                await order.save();
                console.log(`⚠️ [Razorpay Webhook] Order ${order._id} marked as Payment Failed.`);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Webhook processed and verified successfully",
            eventId,
        });
    } catch (error) {
        console.error("❌ [Razorpay Webhook Error]:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error processing webhook." });
    }
};

