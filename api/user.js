// api/user.js
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase";
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

export const getCurrentUser = async () => {
  const idToken = await getIdToken(auth.currentUser);

  const res = await fetch(`${FLASK_API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch current user: ${res.status}`);
  }

  return await res.json();
};

export const uploadProfilePhoto = async (imageUri) => {
  const idToken = await getIdToken(auth.currentUser);
  
  const formData = new FormData();
  formData.append("photo", {
    uri: imageUri,
    type: "image/jpeg",
    name: "profile.jpg",
  });

  const res = await fetch(`${FLASK_API_BASE_URL}/users/profile-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload profile photo: ${res.status}`);
  }

  const data = await res.json();
  return data.profile_photo_url;
};
