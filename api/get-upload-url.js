import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// File size limits per type (bytes)
const FILE_LIMITS = {
  // Artworks
  "image/jpeg": 20 * 1024 * 1024, // 20MB
  "image/png": 20 * 1024 * 1024, // 20MB
  "application/pdf": 20 * 1024 * 1024, // 20MB
  "video/mp4": 50 * 1024 * 1024, // 50MB
  // CV-only types
  "application/msword": 20 * 1024 * 1024, // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    20 * 1024 * 1024, // .docx
};

const ALLOWED_ORIGINS = [
  "https://rendered-e6eab4.webflow.io",
  // add production domain when ready
];

function setCorsHeaders(res, origin) {
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sanitizeFilename(name) {
  // Remove path separators and weird characters, keep extension
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  setCorsHeaders(res, origin);

  // Browser sends a preflight OPTIONS request before the actual POST — respond OK
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, size, type } = req.body || {};

    // Validate request
    if (!filename || typeof size !== "number" || !type) {
      return res.status(400).json({ error: "Missing filename, size, or type" });
    }

    const limit = FILE_LIMITS[type];
    if (!limit) {
      return res.status(400).json({ error: `File type not allowed: ${type}` });
    }

    if (size > limit) {
      return res.status(400).json({
        error: `File too large. Max ${Math.round(limit / 1024 / 1024)}MB for ${type}`,
      });
    }

    // Build R2 path: temp/{uuid}/{sanitized-filename}
    const uuid = randomUUID();
    const safeName = sanitizeFilename(filename);
    const key = `temp/${uuid}/${safeName}`;

    // Initialize R2 client (R2 is S3-compatible)
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Generate presigned PUT URL valid for 30 minutes
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: type,
      ContentLength: size,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 1800 });

    return res.status(200).json({
      uploadUrl,
      path: key,
    });
  } catch (err) {
    console.error("get-upload-url error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
