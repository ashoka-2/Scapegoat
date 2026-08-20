import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedAttributes: { type: Object, default: {} },
    variantId: { type: String, default: null },
});

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: Number,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderItems: [orderItemSchema],
        shippingAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            pincode: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            required: [true, "Payment method is required"],
            enum: ["COD", "Card", "UPI", "NetBanking", "Razorpay"],
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
            razorpayOrderId: { type: String, index: true, sparse: true },
            razorpayPaymentId: { type: String, unique: true, sparse: true },
            razorpaySignature: { type: String },
            currency: { type: String, default: "INR" },
            amount: { type: Number },
            cartCheckout: { type: Boolean, default: false },
        },
        itemsPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        discountPrice: {
            type: Number,
            default: 0.0,
        },
        coupon: {
            code: { type: String, default: null },
            discountAmount: { type: Number, default: 0 },
            couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["Payment Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Processing",
        },
        sellerPayouts: [
            {
                seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                amount: { type: Number, default: 0 },
                isSettled: { type: Boolean, default: false },
                settledAt: { type: Date },
                transactionRef: { type: String, default: "" },
                notes: { type: String, default: "" }
            }
        ]
    },
    { timestamps: true }
);

orderSchema.pre("save", async function () {
    if (!this.orderId) {
        const Order = mongoose.model("Order");
        // Find the highest existing orderId and increment by 1 (survives deletions & gaps)
        const lastOrder = await Order.findOne({}, { orderId: 1 }).sort({ orderId: -1 }).lean();
        this.orderId = lastOrder && lastOrder.orderId ? lastOrder.orderId + 1 : 1001;
    }
});

// Fast lookups for Customer order history
orderSchema.index({ user: 1, createdAt: -1 });

// Fast lookups for Seller dashboard (find all orders containing items from a specific seller)
orderSchema.index({ "orderItems.seller": 1, createdAt: -1 });
// Fast lookups for Admin filtering by status
orderSchema.index({ status: 1 });

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;
