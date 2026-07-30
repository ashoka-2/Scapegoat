import mongoose from "mongoose";

import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    fullname:{
        type:String,
        required:[true,"Full name is required"],
        trim:true,
    },
    email:{
        type:String,
        unique:true,
        required:[true,"Email is required"],
        trim:true,
        lowercase:true,
    },
    contact:{
        type:String,
        unique:[true,"This number is already taken by another user."],
        required:[true,"Contact is required"],
        trim:true,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    password:{
        type:String,
        required: function() {
            return !this.googleId;
        },
        select:false,
    },
    role:{
        type:String,
        enum:["buyer","seller","admin"],
        default:"buyer",
    },
    profilePic:{
        type:String,
        default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
    },
    verified:{
        type:Boolean,
        default:false,
    },
    isBanned:{
        type:Boolean,
        default:false,
    },
    profileCompleted: {
        type: Boolean,
        default: false,
    },
    addresses: [addressSchema]
},{
    timestamps:true
});

userSchema.pre("save",async function (){
    if(!this.isModified("password")) return;

    if (this.password){
        this.password = await bcrypt.hash(this.password,10)
    }
});

userSchema.methods.comparePassword = async function (password){
    if(!this.password) return false;
    return await bcrypt.compare(password,this.password);
};



userSchema.index({ role: 1 });

const userModel = mongoose.model("User",userSchema);

export default userModel;