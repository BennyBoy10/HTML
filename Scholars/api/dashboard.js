// api/dashboard.js
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

export default async function handler(req, res) {
  console.log("🎛️ Received dashboard user data request:", req.method, req.url);
  
if (req.method !== "POST") {
  console.log("❌ Method not allowed:", req.method);
  return res.status(405).send("Method Not Allowed 🚫");
}

try {
  const { email } = req.body;
  
  console.log("📧 Request to fetch user data for email:", email || "No email provided");

if (!email) {
  console.log("⚠️ Missing email in request body");
  return res.status(400).json({ 
  success: false, 
  error: "⚠️ Email is required to fetch user data" 
});
}

  const client = new MongoClient(uri);
  console.log("🔄 Creating MongoDB client for user data fetch");

try {
  console.log("🔗 Attempting to connect to MongoDB...");
  await client.connect();
  console.log("✅ Successfully connected to MongoDB");

  const db = client.db("Scholars");
  const users = db.collection("Users");
  console.log("📊 Using database: Scholars, collection: Users");

  console.log("🔍 Searching for user with email:", email);
  const user = await users.findOne({ email });

if (!user) {
  console.log("❌ User not found in database for email:", email);
  return res.status(404).json({ 
  success: false, 
  error: "❌ User not found in database" 
});
}

  console.log("✅ User found in database");

  // Extract only the fields we need for the dashboard
const userData = {
  fullName: user.fullName || "",
  email: user.email || "",
  phone: user.phone || "",
  education: user.education || "",
  DOB: user.DOB || "",
  address: user.address || "",
  nationality: user.nationality || "",
  program: user.program || "",
  statement: user.statement || "",
  paymentStatus: user.paymentStatus || "Pending",
  submissionStatus: user.submissionStatus || "Pending",
  applicationSubmittedAt: user.applicationSubmittedAt || "",
  paymentReference: user.paymentReference || "",
  updatedAt: user.updatedAt || ""
};

  console.log("📋 User data extracted successfully");
  console.log("📊 Data summary:", {
  hasFullName: !!userData.fullName,
  hasPhone: !!userData.phone,
  hasEducation: !!userData.education,
  hasDOB: !!userData.DOB,
  hasAddress: !!userData.address,
  hasNationality: !!userData.nationality,
  hasProgram: !!userData.program,
  hasStatement: !!userData.statement,
  paymentStatus: userData.paymentStatus,
  submissionStatus: userData.submissionStatus
});

  console.log("🎉 Sending user data to frontend");
  res.status(200).json({ 
  success: true, 
  message: "✅ User data retrieved successfully",
  data: userData
});

} catch (dbError) {
  console.error("💥 MongoDB error during user data fetch:", dbError.message);
  console.error("🔍 Error details:", dbError);

if (dbError.name === "MongoNetworkError") {
  console.log("❌ MongoDB network error - connection failed");
  res.status(500).json({ 
  success: false, 
  error: "❌ Database connection failed. Please try again." 
});
} else if (dbError.name === "MongoTimeoutError") {
  console.log("❌ MongoDB timeout error - operation took too long");
  res.status(500).json({ 
  success: false, 
  error: "❌ Database operation timeout. Please try again." 
});
} else {
  console.log("❌ Unexpected database error");
  res.status(500).json({ 
  success: false, 
  error: "❌ Error fetching user data! Please try again." 
});
}
} finally {
  console.log("🔚 Closing MongoDB connection...");
  await client.close();
  console.log("✅ MongoDB connection closed");
}

} catch (error) {
  console.error("💥 Server error in dashboard-user API:", error.message);
  console.error("🔍 Error stack:", error.stack);
  res.status(500).json({ 
  success: false, 
  error: "❌ Internal server error. Please try again later." 
});
}
}

