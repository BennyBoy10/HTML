// api/payment.js
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

export default async function handler(req, res) {
  console.log("🔔 Received payment update request:", req.method, req.url);

if (req.method !== "POST") {
  console.log("❌ Method not allowed:", req.method);
  return res.status(405).send("Method Not Allowed 🚫");
}

  const { email, paymentStatus, paymentReference } = req.body;

  console.log("📝 Payment update for email:", email);

if (!email || !paymentStatus) {
  console.log("⚠️ Validation failed - missing required fields");
  return res.status(400).json({ error: "⚠️ Missing required fields" });
}

  const client = new MongoClient(uri);
  console.log("🔄 Creating MongoDB client");

try {
  console.log("🔗 Attempting to connect to MongoDB...");
  await client.connect();
  console.log("✅ Successfully connected to MongoDB");

  const db = client.db("Scholars");
  const users = db.collection("Users");
  console.log("📊 Using database: Scholars, collection: Users");

  console.log("👤 Checking if user exists with email:", email);
  const existingUser = await users.findOne({ email });

if (!existingUser) {
  console.log("❌ User not found with email:", email);
  return res.status(404).json({ error: "❌ User not found." });
}

const updatedAt = new Date().toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}).replace(',', '');

  console.log("💾 Updating user payment status...");
const updateResult = await users.updateOne(
{ email },
{
$set: {
  paymentStatus,
  paymentReference: paymentReference || "",
  updatedAt
} 
}
);

if (updateResult.modifiedCount === 0) {
  console.log("⚠️ No documents were modified during update for:", email);
  return res.status(500).json({ error: "❌ Failed to update payment data." });
}

  console.log("✅ Payment data successfully updated for:", email);
console.log("📊 Update result:", {
  matchedCount: updateResult.matchedCount,
  modifiedCount: updateResult.modifiedCount
});

res.status(200).json({ 
  success: true,
  message: "✅ Payment status updated successfully!",
data: {
  paymentStatus,
  paymentReference,
  updatedAt
}
});

} catch (err) {
  console.error("💥 Error occurred during payment update:", err.message);
  console.error("🔍 Error details:", err);

if (err.name === "MongoNetworkError") {
  console.log("❌ MongoDB network error - connection failed");
  res.status(500).json({ error: "❌ Database connection failed. Please try again." });
} else if (err.name === "MongoTimeoutError") {
  console.log("❌ MongoDB timeout error - operation took too long");
  res.status(500).json({ error: "❌ Database operation timeout. Please try again." });
} else {
  console.log("❌ Server error during payment update");
  res.status(500).json({ error: "❌ Error updating payment! Please try again." });
}
} finally {
  console.log("🔚 Closing MongoDB connection...");
  await client.close();
  console.log("✅ MongoDB connection closed");
}
}
