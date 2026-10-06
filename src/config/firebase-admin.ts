import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is not configured.");
}

if (!clientEmail) {
  throw new Error("FIREBASE_CLIENT_EMAIL is not configured.");
}

if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is not configured.");
}

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });

export const firebaseAdminAuth = getAuth(firebaseAdminApp);