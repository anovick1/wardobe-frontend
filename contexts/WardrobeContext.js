import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import api from "../api";
import { AuthContext } from "./../auth/AuthContext";

const WardrobeContext = createContext();

export function WardrobeProvider({ children }) {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loadingWardrobe, setLoadingWardrobe] = useState(true);
  const { user, loading: authLoading } = useContext(AuthContext);
  const hasLoadedRef = useRef(false);

  const fetchWardrobeItems = useCallback(
    async (forceRefresh = false) => {
      if (!user?.firebase) return;

      // Use ref to check if we've already loaded to avoid dependency on state
      if (hasLoadedRef.current && !forceRefresh) {
        return;
      }

      try {
        setLoadingWardrobe(true);
        const res = await api.get("/wardrobe_items");
        setWardrobeItems(res.data);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error("⚠️ Failed to fetch wardrobe items:", err);
      } finally {
        setLoadingWardrobe(false);
      }
    },
    [user?.firebase] // Only depend on user.firebase
  );

  useEffect(() => {
    if (!authLoading) {
      if (user?.firebase) {
        fetchWardrobeItems();
      } else {
        setWardrobeItems([]);
        setLoadingWardrobe(false);
        hasLoadedRef.current = false;
      }
    }
  }, [user, authLoading, fetchWardrobeItems]);

  const addItemToWardrobe = (newItem) => {
    setWardrobeItems((prev) => [newItem, ...prev]);
  };

  const updateWardrobeItem = async (updatedItem) => {
    // First update the item in the state
    setWardrobeItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );

    // Then force a refresh to ensure we have the latest data
    hasLoadedRef.current = false;
    await fetchWardrobeItems(true);
  };

  const removeWardrobeItem = (itemId) => {
    setWardrobeItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <WardrobeContext.Provider
      value={{
        wardrobeItems,
        loadingWardrobe,
        fetchWardrobeItems,
        addItemToWardrobe,
        updateWardrobeItem,
        removeWardrobeItem,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  return useContext(WardrobeContext);
}
