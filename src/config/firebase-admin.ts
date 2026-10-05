import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "./credentials/firebase-service-account.json";

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount as any),
      });

export const firebaseAdminAuth = getAuth(firebaseAdminApp);