import mongoose from "mongoose";
import dns from "node:dns";

// Some dev machines point Node's DNS resolver at a loopback address (e.g. a
// stopped VPN / local DNS proxy). That breaks the SRV lookup `mongodb+srv://`
// needs, surfacing as `querySrv ECONNREFUSED`. Fall back to public DNS only in
// that broken case so working/production resolvers are left untouched.
const dnsServers = dns.getServers();
if (dnsServers.length === 0 || dnsServers.every((s) => s.startsWith("127."))) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

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