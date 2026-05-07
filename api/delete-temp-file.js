import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_ORIGINS = [
  "https://rendered-e6eab4.webflow.io",
  "https://rendered.work",
];

function setCorsHeaders(res, origin) {
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getS3() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  setCorsHeaders(res, origin);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { path } = req.body || {};

    if (!path) {
      return res.status(400).json({ error: "Missing path" });
    }

    // Security check: only allow deleting from temp/ folder
    // This prevents malicious requests from deleting arbitrary files
    if (!path.startsWith("temp/")) {
      return res.status(403).json({ error: "Can only delete temp files" });
    }

    const s3 = getS3();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: path,
      }),
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("delete-temp-file error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
