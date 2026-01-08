// Send-Mail.js
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
if (req.method !== "POST") {
  return res.status(405).json({ error: "Method not allowed" });
}
try {
const transporter = nodemailer.createTransport({
  service: "gmail",
auth: {
  user: "globalnaijascholars@gmail.com",
  pass: "wqjt zptv drhm dhds"
},
});

// Get details from frontend
  const { subject, text } = req.body;

const mailOptions = {
  from: "me",
  to: "globalnaijascholars@gmail.com",
  subject,
  text
};

  const info = await transporter.sendMail(mailOptions);
  return res.status(200).json({ success: true, message: "Email sent ✅", info });
} catch (error) {
  return res.status(500).json({ success: false, message: error.message });
}
}
