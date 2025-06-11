import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";
import { AuthContext } from "./../auth/AuthContext";

const WardrobeContext = createContext();

export function WardrobeProvider({ children }) {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loadingWardrobe, setLoadingWardrobe] = useState(true);
  const { user, loading: authLoading } = useContext(AuthContext);

  const fetchWardrobeItems = async () => {
    if (!user?.firebase) return;
    try {
      setLoadingWardrobe(true);
      const res = await api.get("/wardrobe_items");
      setWardrobeItems(res.data);
    } catch (err) {
      console.error("⚠️ Failed to fetch wardrobe items:", err);
    } finally {
      setLoadingWardrobe(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user?.firebase) {
        fetchWardrobeItems();
      } else {
        setWardrobeItems([]);
        setLoadingWardrobe(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const addItemToWardrobe = (newItem) => {
    setWardrobeItems((prev) => [newItem, ...prev]);
  };

  return (
    <WardrobeContext.Provider
      value={{
        wardrobeItems,
        loadingWardrobe,
        fetchWardrobeItems, // ✅ ADD THIS
        addItemToWardrobe,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}
export const useWardrobe = () => useContext(WardrobeContext);
