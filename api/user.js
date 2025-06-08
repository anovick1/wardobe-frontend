// api/user.js
import { getIdToken } from "firebase/auth";
import Constants from "expo-constants";

const FLASK_API_BASE_URL = Constants.expoConfig.extra.FLASK_API_BASE_URL; // Make sure this is set

export const createOrFetchUser = async (firebaseUser) => {
  const idToken = await getIdToken(firebaseUser);

  const res = await fetch(`${FLASK_API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}), // optional: send more fields here
  });

  if (!res.ok) {
    throw new Error(`❌ Backend user fetch failed: ${res.status}`);
  }

  return await res.json(); // returns the user object from your DB
};
