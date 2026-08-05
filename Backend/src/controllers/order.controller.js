import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import cartModel from "../models/cart.model.js";
import sellerCustomerModel from "../models/sellerCustomer.model.js";
import { broadcastUpdate, emitToSeller, emitToUser } from "../services/socket.service.js";

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
            .populate("user", "fullname email contact")
            .populate("orderItems.product", "title slug images price seller");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Allow buyer, seller, or admin
        const isBuyer = order.user._id.toString() === req.user._id.toString();
        const isSeller = order.orderItems.some((item) => item.seller?.toString() === req.user._id.toString());
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
