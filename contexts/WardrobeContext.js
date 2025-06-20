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
  const [loadingMoreWardrobe, setLoadingMoreWardrobe] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, loading: authLoading } = useContext(AuthContext);
  const hasLoadedRef = useRef(false);

  const fetchWardrobeItems = useCallback(
    async (page = 1, forceRefresh = false) => {
      if (!user?.firebase) return;

      // Use ref to check if we've already loaded to avoid dependency on state
      if (hasLoadedRef.current && page === 1 && !forceRefresh) {
        return;
      }

      try {
        if (page === 1) setLoadingWardrobe(true);
        else setLoadingMoreWardrobe(true);
        const res = await api.get(`/wardrobe_items?page=${page}`);

        const { wardrobe_items, pagination } = res.data;

        if (page === 1) {
          setWardrobeItems(wardrobe_items);
          hasLoadedRef.current = true;
        } else {
          setWardrobeItems((prev) => [...prev, ...wardrobe_items]);
        }

        setCurrentPage(pagination.current_page);
        setTotalPages(pagination.pages);
      } catch (err) {
        console.error("⚠️ Failed to fetch wardrobe items:", err);
      } finally {
        if (page === 1) setLoadingWardrobe(false);
        else setLoadingMoreWardrobe(false);
      }
    },
    [user?.firebase]
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
    console.log("🔄 Adding item to wardrobe:", newItem?.id, newItem?.name);

    if (!newItem || !newItem.id) {
      console.error("❌ Cannot add item without ID:", newItem);
      return;
    }

    setWardrobeItems((prev) => {
      const exists = prev.some((item) => item.id === newItem.id);
      console.log(
        "📝 Item exists in wardrobe:",
        exists,
        "Current count:",
        prev.length
      );

      if (exists) {
        // If it exists, update it
        const updated = prev.map((item) =>
          item.id === newItem.id
            ? {
                ...item,
                ...newItem,
                // Preserve the original image_url if it hasn't changed
                image_url: newItem.image_url || item.image_url,
              }
            : item
        );
        console.log("✅ Updated existing item in wardrobe");
        return updated;
      } else {
        // If it's new, add it to the start
        const newList = [newItem, ...prev];
        console.log(
          "✅ Added new item to wardrobe, new count:",
          newList.length
        );
        return newList;
      }
    });
  };

  const updateWardrobeItem = (updatedItem) => {
    console.log(
      "🔄 Updating wardrobe item:",
      updatedItem?.id,
      updatedItem?.name
    );

    if (!updatedItem || !updatedItem.id) {
      console.error("❌ Cannot update item without ID:", updatedItem);
      return;
    }

    setWardrobeItems((prev) => {
      const itemIndex = prev.findIndex((item) => item.id === updatedItem.id);
      console.log(
        "📝 Item found at index:",
        itemIndex,
        "Current count:",
        prev.length
      );

      if (itemIndex === -1) {
        console.log("⚠️ Item not found in wardrobe, adding as new item");
        return [updatedItem, ...prev];
      }

      // Force a new array reference to ensure React re-renders
      const updated = [...prev];
      updated[itemIndex] = {
        ...prev[itemIndex],
        ...updatedItem,
        // Preserve the original image_url if it hasn't changed
        image_url: updatedItem.image_url || prev[itemIndex].image_url,
      };

      console.log("✅ Updated item in wardrobe at index:", itemIndex);
      return updated;
    });
  };

  const removeWardrobeItem = (itemId) => {
    console.log("🗑️ Removing item from wardrobe:", itemId);
    setWardrobeItems((prev) => {
      const filtered = prev.filter((item) => item.id !== itemId);
      console.log("✅ Removed item, new count:", filtered.length);
      return filtered;
    });
  };

  // Add a force refresh function as a fallback
  const loadMoreWardrobeItems = useCallback(async () => {
    if (currentPage < totalPages && !loadingMoreWardrobe && !loadingWardrobe) {
      await fetchWardrobeItems(currentPage + 1);
    }
  }, [
    currentPage,
    totalPages,
    loadingWardrobe,
    loadingMoreWardrobe,
    fetchWardrobeItems,
  ]);

  const refreshWardrobeItems = useCallback(async () => {
    console.log("🔄 Force refreshing wardrobe items...");
    await fetchWardrobeItems(1, true);
  }, [fetchWardrobeItems]);

  return (
    <WardrobeContext.Provider
      value={{
        wardrobeItems,
        loadingWardrobe,
        loadingMoreWardrobe,
        fetchWardrobeItems,
        addItemToWardrobe,
        updateWardrobeItem,
        removeWardrobeItem,
        loadMoreWardrobeItems,
        hasMoreWardrobe: currentPage < totalPages,
        refreshWardrobeItems,
        currentPage,
        totalPages,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  return useContext(WardrobeContext);
}
