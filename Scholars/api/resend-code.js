// api/resend-code.js
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

async function sendVerificationEmail(email, verificationCode) {
try {
  console.log("📧 Preparing to resend verification email to:", email);

// Read and modify the template
  const templatePath = path.join(process.cwd(), 'public', 'Template.html');
  let htmlContent = fs.readFileSync(templatePath, 'utf8');

// Replace the code in the template
htmlContent = htmlContent.replace(
  '<div class="code"></div>',
  `<div class="code">${verificationCode}</div>`
);

// Create verification link with encoded data
  const encodedEmail = encodeURIComponent(email);
  const encodedCode = encodeURIComponent(verificationCode);
//  const verificationLink = `https://globalscholars.vercel.app/Verify-Email?email=${encodedEmail}&code=${encodedCode}`;
  const verificationLink = `http://localhost:3000/Verify-Email?email=${encodedEmail}&code=${encodedCode}`;

// Replace the button link in the template
htmlContent = htmlContent.replace(
  'href="#"',
  `href="${verificationLink}"`
);

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
  user: "globalnaijascholars@gmail.com",
  pass: "wqjt zptv drhm dhds"
},
});

// Send email
await transporter.sendMail({
  from: "Inferno Prime",
  to: email,
  subject: "New Verification Code 🚀",
  html: htmlContent,
});

  console.log("✅ New verification email sent to:", email);
  return true;
} catch (error) {
  console.error("❌ Error resending verification email:", error);
  return false;
}
}

export default async function handler(req, res) {
  console.log("🔔 Received resend code request:", req.method, req.url);
  
if (req.method !== "POST") {
  console.log("❌ Method not allowed:", req.method);
  return res.status(405).send("Method Not Allowed 🚫");
}

  const { email } = req.body;
  console.log("📧 Resend code request for email:", email);
  
if (!email) {
  console.log("⚠️ Validation failed - missing email");
  return res.status(400).json({ error: "⚠️ Missing email" });
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
  return res.status(200).send("✅ Account is already verified!");
}

// Generate new verification code and set expiration (30 minutes from now)
  const newVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const newCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  console.log("🔑 Generated new verification code:", newVerificationCode);
  console.log("⏰ New code expires at:", newCodeExpires);

// Update user with new verification code
  await users.updateOne(
  { email },
  { 
  $set: { 
    verificationCode: newVerificationCode,
    codeExpires: newCodeExpires
}
}
  );

  console.log("✅ New verification code saved to database");

// Send verification email with new code
  console.log("📧 Sending new verification email...");
  const emailSent = await sendVerificationEmail(email, newVerificationCode);

if (emailSent) {
  console.log("✅ New verification code sent to:", email);
res.status(200).send("✅ New verification code sent to your email!");
} else {
  console.log("⚠️ Failed to send new verification email for:", email);
res.status(500).send("❌ Failed to send new verification code!");
}
} catch (err) {
  console.error("💥 Error during resend code process:", err.message);
res.status(500).send("❌ Error sending new verification code!");
} finally {
  console.log("🔚 Closing MongoDB connection...");
  await client.close();
  console.log("✅ MongoDB connection closed");
}
}

