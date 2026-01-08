// /api/check-replies.js

import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = 'globalnaijascholars@gmail.com';
const ADMIN_PASSWORD = 'wqjt zptv drhm dhds';

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `${timestamp} [${level}]`;

  console.log(`${prefix} ${message}`);
if (data) {
//  console.log(`${prefix} Data:`, JSON.stringify(data, null, 2));
}
};

// Read replies from JSON file
function readRepliesFile() {
try {
  log('INFO', 'Reading replies.json file...');

// Path to replies.json
  const filePath = path.join(process.cwd(), 'replies.json');

// Check if file exists
if (!fs.existsSync(filePath)) {
  log('WARN', 'replies.json file not found, creating default structure');
  const defaultData = { replies: [] };
  fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  return defaultData;
}

// Read and parse the file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsedData = JSON.parse(fileContent);

  log('INFO', `Successfully read ${parsedData.replies?.length || 0} replies from file`);
  return parsedData;

} catch (error) {
  log('ERROR', `Failed to read replies.json: ${error.message}`);
  log('ERROR', 'Stack trace:', error.stack);

// Return empty structure on error
  return { replies: [] };
}
}

// Validate reply object structure
function validateReply(reply) {
  const requiredFields = ['replyId', 'ticketId', 'message'];

for (const field of requiredFields) {
if (!reply[field]) {
  log('WARN', `Reply validation failed: Missing ${field}`, reply);
  return false;
}
}

// Validate replyId format
if (!reply.replyId.startsWith('reply_')) {
  log('WARN', `Invalid replyId format: ${reply.replyId}`);
  return false;
}

// Validate ticketId format
if (!reply.ticketId.startsWith('TKT_')) {
  log('WARN', `Invalid ticketId format: ${reply.ticketId}`);
  return false;
}

  return true;
}

// Process timestamps for replies
function processReplyTimestamps(reply) {
// If timestamp is empty or invalid, use current time
if (!reply.timestamp || reply.timestamp.trim() === '') {
  reply.timestamp = new Date().toISOString();
  log('DEBUG', `Added timestamp to reply: ${reply.replyId}`, { timestamp: reply.timestamp });
}

// Validate timestamp format
try {
  const date = new Date(reply.timestamp);
if (isNaN(date.getTime())) {
  log('WARN', `Invalid timestamp format, using current time: ${reply.replyId}`);
  reply.timestamp = new Date().toISOString();
}
} catch (error) {
  log('WARN', `Timestamp parsing error, using current time: ${reply.replyId}`);
  reply.timestamp = new Date().toISOString();
}

  return reply;
}

// Main handler function
export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  log('INFO', `=== New API Request (${requestId}) ===`);
  log('INFO', `Method: ${req.method}`);
//  log('INFO', 'Headers:', req.headers);

  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

// Handle preflight request
if (req.method === 'OPTIONS') {
  log('INFO', 'Handling OPTIONS preflight request');
  return res.status(200).end();
}

// Only allow POST requests
if (req.method !== 'POST') {
  log('ERROR', `Method not allowed: ${req.method}`);
return res.status(405).json({
  success: false,
  message: 'Method not allowed. Use POST.',
  requestId: requestId,
  timestamp: new Date().toISOString()
});
}

try {
// Parse request body
  let body;
try {
  body = req.body;
  log('INFO', 'Request body received:', body);
} catch (parseError) {
  log('ERROR', 'Failed to parse request body:', parseError.message);
return res.status(400).json({
  success: false,
  message: 'Invalid JSON in request body',
  error: parseError.message,
  requestId: requestId
});
}

  const { ticketId, deliveredReplyIds = [], userEmail, deviceId } = body;

// Validate required parameters
if (!ticketId) {
  log('ERROR', 'Missing required parameter: ticketId');
return res.status(400).json({
  success: false,
  message: 'Missing required parameter: ticketId',
  requestId: requestId,
receivedParams: { ticketId, userEmail, deviceId }
});
}

if (!userEmail) {
  log('WARN', 'User email not provided, proceeding with ticket-only matching');
}

log('INFO', 'Processing request for:', {
  ticketId: ticketId,
  userEmail: userEmail || 'Not provided',
  deviceId: deviceId || 'Not provided',
  deliveredReplyCount: deliveredReplyIds.length
});

// Read replies data
  const repliesData = readRepliesFile();
  const allReplies = repliesData.replies || [];

  log('INFO', `Total replies in system: ${allReplies.length}`);

// Filter replies for this specific ticket
const ticketReplies = allReplies.filter(reply => {
  const matchesTicket = reply.ticketId === ticketId;

// Additional matching by email if provided (optional)
  const matchesEmail = !userEmail || reply.userEmail === userEmail || !reply.userEmail;

  return matchesTicket && matchesEmail;
});

  log('INFO', `Found ${ticketReplies.length} replies for ticket: ${ticketId}`);

// Filter out already delivered replies using replyId
const newReplies = ticketReplies.filter(reply => {
  const isNew = !deliveredReplyIds.includes(reply.replyId);
if (!isNew) {
  log('DEBUG', `Skipping already delivered reply: ${reply.replyId}`);
}
  return isNew;
});

  log('INFO', `Found ${newReplies.length} new replies for ticket: ${ticketId}`);

// Process each reply (add timestamps if missing)
const processedReplies = newReplies.map(reply => {
// Validate reply structure
if (!validateReply(reply)) {
  log('WARN', `Skipping invalid reply: ${reply.replyId}`);
  return null;
}

// Process timestamps
  const processedReply = processReplyTimestamps(reply);

// Ensure adminName has a default value
if (!processedReply.adminName) {
  processedReply.adminName = 'Global Scholars Support';
  log('DEBUG', `Added default adminName to reply: ${processedReply.replyId}`);
}

  log('INFO', `Processing reply: ${processedReply.replyId}`, {
  messagePreview: processedReply.message.substring(0, 50) + '...',
  timestamp: processedReply.timestamp
});

  return processedReply;
}).filter(reply => reply !== null); // Remove null entries

  const processingTime = Date.now() - startTime;

log('INFO', `Request processing complete in ${processingTime}ms`, {
  requestId: requestId,
  totalReplies: allReplies.length,
  ticketReplies: ticketReplies.length,
  newReplies: processedReplies.length,
  processingTime: `${processingTime}ms`
});

// Return response
return res.status(200).json({
  success: true,
  requestId: requestId,
  timestamp: new Date().toISOString(),
data: {
  replies: processedReplies,
  count: processedReplies.length,
  ticketId: ticketId,
stats: {
  totalReplies: allReplies.length,
  ticketReplies: ticketReplies.length,
  newReplies: processedReplies.length
}
},
  processingTime: `${processingTime}ms`,
  message: processedReplies.length > 0 
  ? `Found ${processedReplies.length} new replies` 
  : 'No new replies found'
});

} catch (error) {
  const errorTime = Date.now() - startTime;

  log('ERROR', `Unhandled error in API: ${error.message}`);
  log('ERROR', 'Stack trace:', error.stack);

return res.status(500).json({
  success: false,
  requestId: requestId,
  timestamp: new Date().toISOString(),
  message: 'Internal server error',
  error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  processingTime: `${errorTime}ms`
});
}
}

// For Vercel Edge Functions compatibility
export const config = {
api: {
bodyParser: {
  sizeLimit: '1mb',
},
},
};

// Utility function for development/testing
export function testConnection() {
  log('INFO', 'Testing Global Scholars API connection');
  log('INFO', `Admin email: ${ADMIN_EMAIL}`);
  log('INFO', 'API is ready to process requests');
  return { status: 'ready', timestamp: new Date().toISOString() };
}
