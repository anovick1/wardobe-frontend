// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // ✅ only use getAuth with Expo
import { firebaseConfig } from "./firebase.config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // ✅ memory persistence is fine for Expo

export { app, auth };
