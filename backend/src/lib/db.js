import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in environment");
    }

    // Fail fast: don't buffer operations while disconnected.
    mongoose.set("bufferCommands", false);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected : ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log("MongoDB connection error:", error);
    throw error;
  }
};