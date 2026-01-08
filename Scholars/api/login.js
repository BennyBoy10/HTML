import { MongoClient } from "mongodb";

// MongoDB connection URI
const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

export default async function handler(req, res) {

  // Handle preflight request
if (req.method === 'OPTIONS') {
res.status(200).end();
  return;
}
  
  // Only allow POST requests
if (req.method !== "POST") {
  console.log("Method not allowed:", req.method);
return res.status(405).json({ 
  success: false, 
  message: "🚫 Method Not Allowed!" 
});
}

  const { email, password } = req.body;
  console.log("Login attempt for email:", email);
  
  // Validate input
if (!email || !password) {
  console.log("Missing email or password");
  return res.status(400).json({ 
  success: false, 
  message: "⚠️ Missing email or password!" 
});
}

  const client = new MongoClient(uri);
  
  try {
  console.log("Connecting to MongoDB...");
  await client.connect();
  console.log("Connected successfully to MongoDB");
  
  const db = client.db("Scholars");
  const users = db.collection("Users");
  
  console.log("Looking for user with email:", email);
  // Find user by email
  const user = await users.findOne({ email });
  
if (!user) {
  console.log("User not found with email:", email);
return res.status(401).json({ 
  success: false, 
  message: "❌ User not found!" 
});
}

if (!user.verified) {
  console.log("Email not verified for user:", email);
return res.status(400).json({
  success: false,
  message: "Your email is not verified. Please verify your email to login.",
  unverified: true
});
}

  console.log("User found, checking password...");
if (user.password !== password) {
  console.log("Password mismatch for email:", email);
  return res.status(401).json({ 
  success: false, 
  message: "❌ Incorrect password" 
});
}

  console.log("Login successful for email:", email);
  // Login successful
res.status(200).json({ 
  success: true, 
  message: "✅ Login successful!" ,
user: {
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  education: user.education,
  DOB: user.DOB,
  nationality: user.nationality,
  address: user.address,
  field: user.program,
  essay: user.statement,
  paymentStatus: user.paymentStatus,
  submissionStatus: user.submissionStatus,
},
});

} catch (err) {
  console.error("❌ Error during login process:", err);
res.status(500).json({ 
  success: false, 
  message: "❌ Network error - connection failed" 
});
} finally {
  console.log("Closing MongoDB connection");
  await client.close();
}
}
