const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

async function uploadToImageKit(buffer, originalName, folder = "erp/payment-proofs") {
  const path   = require("path");
  const ext      = path.extname(originalName).toLowerCase();
  const fileName = `proof-${Date.now()}${ext}`;

  const formData = new FormData();
  formData.append("file", new Blob([buffer]));
  formData.append("fileName", fileName);
  formData.append("folder", folder);
  formData.append("useUniqueFileName", "true");

  const credentials = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64");

  const res = await fetch(UPLOAD_URL, {
    method:  "POST",
    headers: { Authorization: `Basic ${credentials}` },
    body:    formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ImageKit upload failed: ${err}`);
  }

  const data = await res.json();
  return data.url; // full CDN URL
}

module.exports = { uploadToImageKit };
