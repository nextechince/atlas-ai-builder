
import admin from "firebase-admin";

let firebaseApp;

function getFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing.");
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountJSON);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must contain valid JSON.");
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return firebaseApp;
}

export async function verifyFirebaseToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    const error = new Error("Firebase ID token is missing.");
    error.status = 401;
    throw error;
  }

  try {
    const app = getFirebaseAdmin();
    const decodedToken = await app.auth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      emailVerified: decodedToken.email_verified || false
    };
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);

    const authError = new Error("Invalid or expired login session.");
    authError.status = 401;
    throw authError;
  }
}

export function getAdminAuth() {
  return getFirebaseAdmin().auth();
}

export function getAdminFirestore() {
  return getFirebaseAdmin().firestore();
}
