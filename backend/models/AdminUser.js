import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      index: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false, // Опционально для OAuth пользователей
    },
    name: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin", "editor", "viewer"],
    },
    social: {
      vk: String,
      yandex: String,
      mailru: String,
      provider: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.AdminUser ||
  mongoose.model("AdminUser", AdminUserSchema);
