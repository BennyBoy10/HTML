// application.js
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

export default async function handler(req, res) {
  console.log("🔔 Received application form request:", req.method, req.url);
  
if (req.method !== "POST") {
  console.log("❌ Method not allowed:", req.method);
  return res.status(405).send("Method Not Allowed 🚫");
}

const { 
  firstName, 
  lastName, 
  email, 
  phone, 
  DOB, 
  nationality, 
  address, 
  education, 
  field, 
  essay,
  paymentStatus,
  submissionStatus
} = req.body;

  console.log("📝 Application form submission for email:", email);
  
  // Validate required fields
if (!firstName || !lastName || !email || !phone || !DOB || !nationality || !address || !education || !field || !essay) {
  console.log("⚠️ Validation failed - missing required fields");
console.log("📋 Received data:", {
  firstName: !!firstName,
  lastName: !!lastName,
  email: !!email,
  phone: !!phone,
  DOB: !!DOB,
  nationality: !!nationality,
  address: !!address,
  education: !!education,
  field: !!field,
  essay: !!essay
});
  return res.status(400).json({ error: "⚠️ Missing required fields" });
}

  const fullName = `${firstName} ${lastName}`;
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
  return res.status(404).json({ error: "❌ User not found. Please sign up first." });
}

if (!existingUser.verified) {
  console.log("❌ User email not verified for:", email);
  return res.status(400).json({ error: "❌ Please verify your email before submitting application." });
}

  console.log("✅ User found and verified - proceeding with application update");

// Get current timestamp for submission
const applicationSubmittedAt = new Date().toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}).replace(',', '');

  const updatedAt = applicationSubmittedAt;

  console.log("📅 Application submission timestamp:", applicationSubmittedAt);

  // Update user with application data
  console.log("💾 Updating user with application data...");
const updateResult = await users.updateOne(
{ email },
{ 
$set: { 
  fullName,
  phone,
  education,
  DOB,
  address,
  nationality,
  program: field,
  statement: essay,
  applicationSubmittedAt,
  submissionStatus: "Submitted",
  paymentStatus,
  updatedAt
} 
}
);

if (updateResult.modifiedCount === 0) {
  console.log("⚠️ No documents were modified during update for:", email);
  return res.status(500).json({ error: "❌ Failed to update application data. Try again in 1 minute!" });
}

  console.log("✅ Application data successfully updated for:", email);
console.log("📊 Update result:", {
  matchedCount: updateResult.matchedCount,
  modifiedCount: updateResult.modifiedCount
});

  // Fetch updated user to verify changes
  console.log("🔍 Verifying updated user data...");
  const updatedUser = await users.findOne({ email });
  
if (updatedUser) {
  console.log("✅ User data verified successfully");
console.log("📋 Updated fields:", {
  fullName: updatedUser.fullName,
  program: updatedUser.program,
  submissionStatus: updatedUser.submissionStatus,
  paymentStatus: updatedUser.paymentStatus,
  applicationSubmittedAt: updatedUser.applicationSubmittedAt
});
}

  console.log("🎉 Application form submitted successfully for:", email);
res.status(200).json({ 
  success: true,
  message: "✅ Application submitted successfully! 🎉",
data: {
  submissionStatus: "Submitted",
  paymentStatus,
  applicationSubmittedAt
}
});

} catch (err) {
  console.error("💥 Error occurred during application submission:", err.message);
  console.error("🔍 Error details:", err);

if (err.name === "MongoNetworkError") {
  console.log("❌ MongoDB network error - connection failed");
  res.status(500).json({ error: "❌ Database connection failed. Please try again." });
} else if (err.name === "MongoTimeoutError") {
  console.log("❌ MongoDB timeout error - operation took too long");
  res.status(500).json({ error: "❌ Database operation timeout. Please try again." });
} else {
  console.log("❌ Server error during application submission");
  res.status(500).json({ error: "❌ Error submitting application! Please try again." });
}
} finally {
  console.log("🔚 Closing MongoDB connection...");
  await client.close();
  console.log("✅ MongoDB connection closed");
}
}

