// ✅ AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Will hold { firebase, backend }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase restored user:", firebaseUser?.email || null);

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { createOrFetchUser } = await import("../api/user");
        const backendUser = await createOrFetchUser(firebaseUser);

        setUser({
          firebase: firebaseUser,
          backend: backendUser,
        });

        console.log("✅ Backend user loaded:", backendUser.email);
      } catch (error) {
        console.error("❌ Failed to fetch backend user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
