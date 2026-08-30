import { initializeFirestore, getFirestore } from 'firebase/firestore';
import app from './config';
import appletConfig from '../../firebase-applet-config.json';

const dbId = appletConfig.firestoreDatabaseId && appletConfig.firestoreDatabaseId !== '(default)'
  ? appletConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, dbId);
} catch (e) {
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreInstance;

