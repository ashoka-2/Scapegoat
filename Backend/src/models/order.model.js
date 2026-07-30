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
    // We snapshot the name, image, and price because if the seller changes the product details later, 
    // the customer's receipt must still show what they actually bought and the price they paid.
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
    {
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
            enum: ["COD", "Card", "UPI", "NetBanking"],
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
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
            enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Processing",
        }
    },
    { timestamps: true }
);

// Fast lookups for Customer order history
orderSchema.index({ user: 1, createdAt: -1 });
// Fast lookups for Seller dashboard (find all orders containing items from a specific seller)
orderSchema.index({ "orderItems.seller": 1, createdAt: -1 });
// Fast lookups for Admin filtering by status
orderSchema.index({ status: 1 });

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;
