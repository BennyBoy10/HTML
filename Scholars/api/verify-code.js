// api/verify-code.js
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

export default async function handler(req, res) {
  console.log("🔔 Received verification request:", req.method, req.url);
  
if (req.method !== "POST") {
  console.log("❌ Method not allowed:", req.method);
  return res.status(405).send("Method Not Allowed 🚫");
}

  const { email, code } = req.body;
  console.log("🔍 Verification attempt for email:", email);
  
if (!email || !code) {
  console.log("⚠️ Validation failed - missing email or code");
  return res.status(400).json({ error: "⚠️ Missing email or verification code" });
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

  console.log("👤 Looking up user:", email);
  const user = await users.findOne({ email });

if (!user) {
  console.log("❌ User not found:", email);
  return res.status(400).send("❌ User not found!");
}

  console.log("✅ User found, checking verification status");
  
if (user.verified) {
  console.log("ℹ️ User already verified:", email);
  return res.status(200).send("✅ Account is already verified. Proceed to login!");
}

/*
var currentTime = new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
});
*/

  var currentTime = new Date();

  console.log("🔑 Checking verification code...");
  console.log("📨 Submitted code:", code);
  console.log("🗄️ Stored code:", user.verificationCode);
  console.log("⏰ Code expiration:", user.codeExpires);
  console.log("⏰ Current time:", currentTime);

  // Check if code matches and hasn't expired
if (user.verificationCode !== code) {
  console.log("❌ Verification code mismatch/expired");
  return res.status(400).send("❌ Invalid/Expired verification code!");
}

// Check if code has expired (simple Date object comparison)
if (new Date() > new Date(user.codeExpires)) {
  console.log("❌ Verification code expired");
  return res.status(400).send("❌ Verification code has expired!");
}

  console.log("✅ Code is valid, updating user verification status");
  
  // Update user to mark as verified and clear verification data
  await users.updateOne(
  { email },
  { 
  $set: { verified: true },
  $unset: { verificationCode: "", codeExpires: "" }
}
);

  console.log("🎉 User successfully verified:", email);
res.status(200).send("✅ Account verified successfully! Proceed to log in.");
} catch (err) {
  console.error("💥 Error during verification:", err.message);
res.status(500).send("❌ Error during verification!");
} finally {
  console.log("🔚 Closing MongoDB connection...");
  await client.close();
  console.log("✅ MongoDB connection closed");
}
}



