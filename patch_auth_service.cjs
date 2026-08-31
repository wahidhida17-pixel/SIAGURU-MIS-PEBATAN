const fs = require('fs');

const path = 'src/services/authService.ts';
let content = fs.readFileSync(path, 'utf8');

const importTarget = `import { auth } from '../firebase/auth';`;
const importReplacement = `import { auth } from '../firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Secondary app trick to create users without logging out
// We can just rely on the existing VITE_FIREBASE config from import.meta.env
`;
content = content.replace(importTarget, importReplacement);

const newMethods = `
  async createSecondaryUser(email: string, password: string): Promise<User> {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    };
    const secondaryApp = initializeApp(config, 'SecondaryApp');
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = userCredential.user;
      await signOut(secondaryAuth);
      return user;
    } catch (error) {
      throw error;
    }
  },`;

content = content.replace(/async register\(/, newMethods + '\n  async register(');
fs.writeFileSync(path, content, 'utf8');
