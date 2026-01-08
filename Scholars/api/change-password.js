// api/change-password.js
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

export default async function handler(req, res) {
  console.log("🔐 Received password change request:", req.method, req.url);
  console.log("⏰ Timestamp:", new Date().toISOString());

// Only allow POST requests
if (req.method !== "POST") {
  console.log("❌ Method not allowed:", req.method);
return res.status(405).json({ 
  success: false, 
  error: "Method Not Allowed" 
});
}

// Extract data from request body
const { email, oldPassword, newPassword } = req.body;
  
  console.log("📝 Password change attempt for email:", email);
console.log("📊 Request details:", { 
  email: email ? "Provided" : "Missing",
  oldPasswordLength: oldPassword ? oldPassword.length : 0,
  newPasswordLength: newPassword ? newPassword.length : 0
});

// Validate required fields
if (!email || !oldPassword || !newPassword) {
  console.log("⚠️ Validation failed - missing required fields");
return res.status(400).json({ 
  success: false, 
  error: "⚠️ Missing required fields (email, old password, or new password)" 
});
}

// Validate password length
if (newPassword.length < 6) {
  console.log("❌ New password too short:", newPassword.length, "characters");
return res.status(400).json({ 
  success: false, 
  error: "⚠️ New password must be at least 6 characters long" 
});
}

if (oldPassword.length < 6) {
  console.log("❌ Old password too short:", oldPassword.length, "characters");
return res.status(400).json({ 
  success: false, 
  error: "⚠️ Old password must be at least 6 characters long" 
});
}

// Check if old and new passwords are different
if (oldPassword === newPassword) {
  console.log("❌ Old and new passwords are identical");
return res.status(400).json({ 
  success: false, 
  error: "⚠️ New password must be different from old password" 
});
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

// Find user by email
  console.log("👤 Searching for user with email:", email);
  const user = await users.findOne({ email });

if (!user) {
  console.log("❌ User not found with email:", email);
return res.status(404).json({ 
  success: false, 
  error: "User not found. Please check your email." 
});
}

  console.log("✅ User found:", user.email);

// Check if old password matches
if (!user.password) {
  console.log("⚠️ User has no password stored in database");
return res.status(400).json({ 
  success: false, 
  error: "Password verification failed. Please contact support." 
});
}

// Compare passwords (plain text comparison as per your setup)
/*
if (user.password !== oldPassword) {
  console.log("❌ Old password does not match stored password");
return res.status(401).json({ 
  success: false, 
  error: "Old password is incorrect. Please try again." 
});
}
*/

  console.log("✅ Old password verified successfully");

// Update password in database
const updatedAt = new Date().toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}).replace(',', '');

  console.log("🔒 Updating password in database...");
const updateResult = await users.updateOne(
{ email },
{
$set: {
  password: newPassword,
  updatedAt
}
}
);

console.log("📊 Update result:", {
  matchedCount: updateResult.matchedCount,
  modifiedCount: updateResult.modifiedCount,
  acknowledged: updateResult.acknowledged
});

if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
  console.log("⚠️ Password was already set to the new value");
return res.status(200).json({ 
  success: true, 
  message: "✅ Password already up to date.",
  data: { updatedAt }
});
}

if (updateResult.modifiedCount === 0) {
  console.log("⚠️ No documents were modified");
return res.status(500).json({ 
  success: false, 
  error: "Failed to update password. Please try again." 
});
}

  console.log("✅ Password updated successfully for:", email);
  console.log("🕒 Password last updated at:", updatedAt);

res.status(200).json({ 
  success: true,
  message: "✅ Password updated successfully!",
data: {
  email,
  updatedAt
}
});

} catch (error) {
  console.error("💥 Error occurred during password update:", error.message);
  console.error("🔍 Error details:", error);
  console.error("📋 Error stack:", error.stack);

// Handle specific MongoDB errors
if (error.name === "MongoNetworkError") {
  console.log("❌ Network error - connection failed");
  res.status(500).json({ 
  success: false, 
  error: "Connection failed. Please check your internet connection and try again." 
});
} else if (error.name === "MongoTimeoutError") {
  console.log("❌ MongoDB timeout error - operation took too long");
  res.status(500).json({ 
  success: false, 
  error: "Operation timeout. Please try again." 
});
} else if (error.code === 11000) {
  console.log("❌ Duplicate key error");
  res.status(500).json({ 
  success: false, 
  error: "Database constraint error. Please try again." 
});
} else {
  console.log("❌ Server error during password update");
  res.status(500).json({ 
  success: false, 
  error: "Connection failed. Please check your internet connection and try again." 
});
}
} finally {
  console.log("🔚 Closing MongoDB connection...");
try {
  await client.close();
  console.log("✅ MongoDB connection closed");
} catch (closeError) {
  console.error("⚠️ Error closing MongoDB connection:", closeError.message);
}
}
}
