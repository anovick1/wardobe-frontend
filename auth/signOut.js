// auth/signOut.js
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase";

export const signOut = async () => {
  await firebaseSignOut(auth);
};
