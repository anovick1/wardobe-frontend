// firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "./firebase.config";

// Init Firebase
const app = initializeApp(firebaseConfig);

// ✅ Add persistent storage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
