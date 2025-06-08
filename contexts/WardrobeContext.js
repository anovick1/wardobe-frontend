import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const WardrobeContext = createContext();

export function WardrobeProvider({ children }) {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loadingWardrobe, setLoadingWardrobe] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (!user) {
        setLoadingWardrobe(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await api.get("/wardrobe_items", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWardrobeItems(res.data);
      } catch (err) {
        console.error("⚠️ Failed to fetch wardrobe items:", err);
      } finally {
        setLoadingWardrobe(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const addItemToWardrobe = (newItem) => {
    setWardrobeItems((prev) => [newItem, ...prev]);
  };

  return (
    <WardrobeContext.Provider
      value={{ wardrobeItems, loadingWardrobe, addItemToWardrobe }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export const useWardrobe = () => useContext(WardrobeContext);
