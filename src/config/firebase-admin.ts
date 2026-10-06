import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log("🔥 Firebase environment check:", {
  projectId: projectId ? "SET" : "MISSING",
  clientEmail: clientEmail ? "SET" : "MISSING",
  privateKey: privateKey ? "SET" : "MISSING",
  privateKeyLength: privateKey?.length ?? 0,
  hasBeginMarker: privateKey?.includes("-----BEGIN PRIVATE KEY-----") ?? false,
  hasEndMarker: privateKey?.includes("-----END PRIVATE KEY-----") ?? false,
  hasEscapedNewlines: privateKey?.includes("\\n") ?? false,
});

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is not configured.");
}

if (!clientEmail) {
  throw new Error("FIREBASE_CLIENT_EMAIL is not configured.");
}

if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is not configured.");
}

const formattedPrivateKey = privateKey
  .replace(/\\n/g, "\n")
  .replace(/\r\n/g, "\n")
  .trim();

console.log("🔥 Firebase private key format:", {
  formattedLength: formattedPrivateKey.length,
  startsCorrectly: formattedPrivateKey.startsWith(
    "-----BEGIN PRIVATE KEY-----",
  ),
  endsCorrectly: formattedPrivateKey.endsWith(
    "-----END PRIVATE KEY-----",
  ),
});

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });

export const firebaseAdminAuth = getAuth(firebaseAdminApp);