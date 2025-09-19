import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  type: "service_account",
  project_id: import.meta.env.FIREBASE_PROJECT_ID,
  private_key_id: import.meta.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: import.meta.env.FIREBASE_CLIENT_EMAIL,
  client_id: import.meta.env.FIREBASE_CLIENT_ID,
  auth_uri: import.meta.env.FIREBASE_AUTH_URI,
  token_uri: import.meta.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: import.meta.env.FIREBASE_AUTH_CERT_URL,
  client_x509_cert_url: import.meta.env.FIREBASE_CLIENT_CERT_URL,
};

function getFirebaseServerApp() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  if (import.meta.env.PROD) {
    console.info('PROD env detected. Using default service account.');
    return initializeApp();
  }

  console.info('Development env. Loading service account from env variables.');
  return initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    projectId: import.meta.env.FIREBASE_PROJECT_ID,
  });
}

export const serverApp = getFirebaseServerApp();
export const serverAuth = getAuth(serverApp);
export const serverDb = getFirestore(serverApp);

if (import.meta.env.DEV) {
  console.log('[Firebase Server] Configuration:', {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    hasPrivateKey: !!serviceAccount.private_key,
    hasAllRequiredFields: !!(
      serviceAccount.project_id && 
      serviceAccount.client_email && 
      serviceAccount.private_key
    )
  });

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    console.warn('[Firebase Server] Missing required environment variables. Server-side Firebase may not work properly.');
    console.warn('Required variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }
}
