import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const firebaseAdminApp = initializeApp({
    credential: applicationDefault(),
});
export const firebaseAdminAuth = getAuth(firebaseAdminApp);
//# sourceMappingURL=firebase-admin.js.map