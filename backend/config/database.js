import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Modern MongoDB connection without deprecated options
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/haorivision",
      {
        // Remove deprecated options:
        // - useNewUrlParser: true (default since driver v4.0.0)
        // - useUnifiedTopology: true (default since driver v4.0.0)

        // Modern connection options
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
      },
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
