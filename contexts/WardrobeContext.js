import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api";
import { AuthContext } from "./../auth/AuthContext";

const WardrobeContext = createContext();

export function WardrobeProvider({ children }) {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loadingWardrobe, setLoadingWardrobe] = useState(true);
  const { user, loading: authLoading } = useContext(AuthContext);

  const fetchWardrobeItems = useCallback(async (forceRefresh = false) => {
    if (!user?.firebase) return;
    if (wardrobeItems.length > 0 && !forceRefresh && !loadingWardrobe) {
        // Items are already loaded, and no force refresh is requested
        return;
    }
    try {
      setLoadingWardrobe(true);
      const res = await api.get("/wardrobe_items");
      setWardrobeItems(res.data);
    } catch (err) {
      console.error("⚠️ Failed to fetch wardrobe items:", err);
    } finally {
      setLoadingWardrobe(false);
    }
  }, [user, wardrobeItems.length, loadingWardrobe]);

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
  }, [user, authLoading, fetchWardrobeItems]);

  const addItemToWardrobe = (newItem) => {
    setWardrobeItems((prev) => [newItem, ...prev]);
  };

  return (
    <WardrobeContext.Provider
      value={{
        wardrobeItems,
        loadingWardrobe,
        fetchWardrobeItems,
        addItemToWardrobe,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  return useContext(WardrobeContext);
}
