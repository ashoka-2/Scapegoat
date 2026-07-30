import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: [true, "Price amount is required"],
            min: [0, "Price cannot be negative"],
        },
        currency: {
            type: String,
            enum: ["INR", "USD", "EUR", "AED"],
            required: [true, "Currency is required"],
        },
    },
    { _id: false }
);

export default priceSchema;