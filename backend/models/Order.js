import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    // Backward-compat: прямой email (для admin-заказов без customer ref)
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productId: String,
        sku: String,
        name: String,
        qty: { type: Number, default: 1 },
        price: Number,
        size: String,
        editionNumber: Number,
        addons: [
          {
            type: {
              type: String,
              enum: ["matching-painting"],
            },
            name: String,
            canvas: {
              type: String,
              enum: ["cotton", "linen", "silk"],
            },
            size: {
              type: String,
              enum: ["40x50", "50x70", "70x100"],
            },
            price: Number,
          },
        ],
      },
    ],
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String,
    },
    billingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    payment: {
      method: {
        type: String,
        enum: ["stripe", "paypal"],
        default: "stripe",
      },
      transactionId: String,
      amount: Number,
      currency: { type: String, default: "USD" },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paidAt: Date,
    },
    // Backward-compat: flat amount/currency
    amount: Number,
    currency: { type: String, default: "rub", lowercase: true },
    status: {
      type: String,
      enum: [
        "new",
        "pending",
        "processing",
        "paid",
        "fulfilled",
        "shipped",
        "delivered",
        "canceled",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    tracking: {
      carrier: String,
      trackingNumber: String,
      shippedAt: Date,
      deliveredAt: Date,
    },
    totals: {
      subtotal: Number,
      shipping: Number,
      tax: Number,
      total: Number,
    },
    notes: {
      customer: String,
      internal: String,
    },
    emailSent: {
      confirmation: { type: Boolean, default: false },
      welcome: { type: Boolean, default: false },
      shipping: { type: Boolean, default: false },
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Generate unique order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `HV${year}${month}${random}`;
  }
  next();
});

// Virtual: backward-compat alias `number` -> `orderNumber`
orderSchema.virtual("number").get(function () {
  return this.orderNumber;
});

orderSchema.index({ customer: 1 });
orderSchema.index({ email: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "payment.status": 1 });

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;
