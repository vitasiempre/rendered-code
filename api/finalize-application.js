import { google } from "googleapis";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ─── Clients ────────────────────────────────────────────────────────────────

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

function getDriveClient() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, "base64").toString(
      "utf8",
    ),
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createDriveFolder(drive, name, parentId) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  return res.data;
}

async function streamR2FileToDrive(
  s3,
  drive,
  r2Path,
  filename,
  mimeType,
  folderId,
) {
  const getCmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Path,
  });
  const { Body } = await s3.send(getCmd);

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: Body,
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  return res.data.webViewLink;
}

async function deleteR2File(s3, key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}

// ─── CORS ────────────────────────────────────────────────────────────────────

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

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  setCorsHeaders(res, origin);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.headers["x-secret"] !== process.env.FINALIZE_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    let { fullName, artworkPaths, cvPath } = req.body || {};

    if (typeof artworkPaths === "string") {
      try {
        artworkPaths = JSON.parse(artworkPaths);
      } catch {
        artworkPaths = [];
      }
    }
    if (typeof cvPath === "string") {
      try {
        cvPath = JSON.parse(cvPath);
      } catch {
        cvPath = null;
      }
    }

    // Frontend sends cv as array, but endpoint expects single object
    if (Array.isArray(cvPath) && cvPath.length > 0) {
      cvPath = cvPath[0];
    } else if (Array.isArray(cvPath)) {
      cvPath = null;
    }

    if (!fullName) {
      return res.status(400).json({ error: "Missing fullName" });
    }

    const s3 = getS3();
    const drive = getDriveClient();

    // 1. Create artist folder in Drive
    const folderName = `${new Date().toISOString().slice(0, 10)} — ${fullName}`;
    const folder = await createDriveFolder(
      drive,
      folderName,
      process.env.GOOGLE_DRIVE_FOLDER_ID,
    );

    const [artworksFolder, cvFolder] = await Promise.all([
      createDriveFolder(drive, "Artworks", folder.id),
      createDriveFolder(drive, "CV", folder.id),
    ]);

    // 2. Move files from R2 to Drive in parallel
    const uploadTasks = [];
    const artworkLinks = [];
    let cvLink = null;

    if (artworkPaths?.length) {
      for (const artwork of artworkPaths) {
        uploadTasks.push(
          streamR2FileToDrive(
            s3,
            drive,
            artwork.path,
            artwork.filename,
            artwork.mimeType,
            artworksFolder.id,
          ).then((link) => artworkLinks.push(link)),
        );
      }
    }

    if (cvPath) {
      uploadTasks.push(
        streamR2FileToDrive(
          s3,
          drive,
          cvPath.path,
          cvPath.filename,
          cvPath.mimeType,
          cvFolder.id,
        ).then((link) => {
          cvLink = link;
        }),
      );
    }

    await Promise.all(uploadTasks);

    // 3. Delete R2 temp files in parallel
    const deleteTasks = [];
    if (artworkPaths?.length) {
      artworkPaths.forEach((a) => deleteTasks.push(deleteR2File(s3, a.path)));
    }
    if (cvPath) {
      deleteTasks.push(deleteR2File(s3, cvPath.path));
    }
    await Promise.all(deleteTasks);

    // 4. Return Drive links to Make — Make will create Airtable record
    return res.status(200).json({
      success: true,
      driveFolder: folder.webViewLink,
      artworkLinks,
      cvLink,
    });
  } catch (err) {
    console.error("finalize-application error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", detail: err.message });
  }
}
