import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    walletAddress: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      default: null,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    nftCertificates: [
      {
        tokenId: String,
        contractAddress: String,
        openseaUrl: String,
        productId: String,
        mintedAt: Date,
      },
    ],
    totalSpent: {
      type: Number,
      default: 0,
    },
    vipTier: {
      type: String,
      enum: ["standard", "silver", "gold", "platinum"],
      default: "standard",
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ["web", "dm", "event"],
      default: "web",
    },
    product_id: {
      type: String,
      default: null,
    },
    purchase_date: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
customerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
customerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
customerSchema.methods.generateReferralCode = function () {
  const code = `HAORI${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  this.referralCode = code;
  return code;
};

customerSchema.index({ email: 1 });
customerSchema.index({ source: 1 });
customerSchema.index({ createdAt: -1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
