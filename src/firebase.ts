
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2ldpFdUeFfRw5AKWizmdDgTp7hluAG0M",
  authDomain: "formulaic-nunac.firebaseapp.com",
  projectId: "formulaic-nunac",
  storageBucket: "formulaic-nunac.firebasestorage.app",
  messagingSenderId: "471554487221",
  appId: "1:471554487221:web:b27c932ba071a6a0489ffc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
