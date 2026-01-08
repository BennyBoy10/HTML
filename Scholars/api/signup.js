// signup.js
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const uri = "mongodb+srv://bennyboy100:BennyBoy10MongoDB@registration.zwmngxc.mongodb.net/?retryWrites=true&w=majority&appName=Registration";

async function sendVerificationEmail(email, verificationCode) {
try {
  console.log("📧 Preparing to send verification email to:", email);

// Read and modify the template
  const templatePath = path.join(process.cwd(), 'public', 'Template.html');
/*
  let htmlContent = fs.readFileSync(templatePath, 'utf8');

// Replace the code in the template
htmlContent = htmlContent.replace(
  '<div class="code"></div>',
  `<div class="code">${verificationCode}</div>`
);
*/

let htmlContent = fs.readFileSync(templatePath, 'utf8');

// Replace user name and verification code in the template
htmlContent = htmlContent
  .replace('<span id="name"></span>', `<span id="name">${email.split("@")[0]}</span>`)
  .replace('<div class="code"></div>', `<div class="code">${verificationCode}</div>`);



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
  subject: "Verify Your Email! 🚀",
  html: htmlContent,
});

  console.log("✅ Verification email sent to:", email);
  return true;
} catch (error) {
  console.error("❌ Error sending verification email:", error);
  return false;
}
}

export default async function handler(req, res) {
  console.log("🔔 Received request:", req.method, req.url);
  
if (req.method !== "POST") {
  console.log("❌ Method not allowed:", req.method);
  return res.status(405).send("Method Not Allowed 🚫");
}

  const { fullName, email, phone, password, education } = req.body;
  console.log("📧 Registration attempt for email:", email);
  
if (!fullName || !email || !phone || !password || !education) {
  console.log("❌ Validation failed - missing required fields");
  return res.status(400).json({ error: "❌ Missing required fields" });
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

  console.log("🔍 Creating unique index on email field...");
  await users.createIndex({ email: 1 }, { unique: true });
  console.log("✅ Unique index created on email field");

  console.log("👤 Checking if user already exists...");
  const existingUser = await users.findOne({ email });

if (existingUser) {
if (existingUser.verified) {
  console.log("❌ User already exists with email:", email);
  return res.status(400).send("❌ Email already exists!");
} else {
  console.log("📧 Email exists but not verified - updating information and resending verification");

  // Generate new verification code and set expiration (30 minutes from now)
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  var codeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

/*
//var formattedCodeExpires = new Date().toLocaleString("en-GB", {
var codeExpires = new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
});
*/

  console.log("🔑 Generated new verification code:", verificationCode);
  console.log("⏰ Code expires at:", codeExpires);

// Update user with new information and verification code
await users.updateOne(
  { email },
{
$set: { 
  fullName,
  phone,
  password,
  education,
  verificationCode,
  codeExpires
} 
}
);

/*
var firstName = fullName.split(" ")[0];

// Replace the code in the template
htmlContent = htmlContent.replace(
  '<span id="name"></span>',
  `<span id="name">${firstName}</span>`
);
*/

  console.log("✅ User information and verification code updated for unverified user");

// Send verification email
  console.log("📧 Sending new verification email...");
  const emailSent = await sendVerificationEmail(email, verificationCode);

if (emailSent) {
  console.log("✅ New verification email sent to:", email);
  return res.status(200).send("✅ Information updated! New verification email sent! 🎉");
} else {
  console.log("❌ Information updated but email failed to send for:", email);
  return res.status(200).send("✅ Information updated! But we couldn't send the verification email.");
}
}
}

  console.log("✅ Email is available, proceeding with registration");

// Generate verification code and set expiration (30 minutes from now)
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  var codeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

/*
//var formattedCodeExpires = new Date().toLocaleString("en-GB", {
var codeExpires = new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
});
*/

  console.log("🔑 Generated verification code:", verificationCode);
  console.log("⏰ Code expires at:", codeExpires);

  console.log("💾 Inserting new user into database...");
await users.insertOne({ 
  fullName,
  email, 
  phone,
  password, 
  education,
  verified: false,
  verificationCode,
  codeExpires,
createdAt: new Date().toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}).replace(',', ''),
  paymentStatus: "Pending",
  submissionStatus: "Pending"
});

  console.log("✅ User successfully saved to database");

// Send verification email
  console.log("📧 Sending verification email...");
  const emailSent = await sendVerificationEmail(email, verificationCode);

if (emailSent) {
  console.log("🎉 Registration completed successfully for:", email);
res.status(200).send("✅ User saved successfully 🎉. Verification email sent!");
} else {
  console.log("❌ User saved but email failed to send for:", email);
res.status(200).send("✅ User saved successfully! But we couldn't send the verification email.");
}
} catch (err) {
  console.error("💥 Error occurred:", err.message);

if (err.code === 11000) {
  console.log("❌ Duplicate email error (MongoDB duplicate key)");
res.status(400).send("❌ Email already exists!");
} else {
  console.log("❌ Network error - connection failed");
res.status(500).send("❌ Network error - connection failed!");
}
} finally {
  console.log("🔚 Closing MongoDB connection...");
  await client.close();
  console.log("✅ MongoDB connection closed");
}
}

