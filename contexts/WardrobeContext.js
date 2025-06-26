import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { AuthContext } from "./../auth/AuthContext";
import { dataManager } from "../services/DataManager";

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

        const { items, pagination } = await dataManager.getWardrobeItems(
          page,
          forceRefresh
        );

        if (page === 1) {
          setWardrobeItems(items);
          hasLoadedRef.current = true;
        } else {
          setWardrobeItems((prev) => [...prev, ...items]);
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

  const addItemToWardrobe = useCallback(
    async (newItem, skipBackendCall = false) => {
      if (!newItem || !newItem.id) {
        console.error("❌ Cannot add item without ID:", newItem);
        return;
      }

      // Optimistically update UI
      setWardrobeItems((prev) => {
        const exists = prev.some((item) => item.id === newItem.id);
        if (exists) {
          return prev.map((item) => {
            if (item.id === newItem.id) {
              const updated = {
                ...item,
                ...newItem,
                image_url: newItem.image_url || item.image_url,
              };
              return updated;
            }
            return item;
          });
        } else {
          return [newItem, ...prev];
        }
      });

      // Invalidate cache to ensure fresh data on next load
      if (!skipBackendCall) {
        dataManager.invalidateWardrobeCache();
      }
    },
    []
  );

  const updateWardrobeItem = useCallback(
    async (updatedItem, skipBackendCall = false) => {
      if (!updatedItem || !updatedItem.id) {
        console.error("❌ Cannot update item without ID:", updatedItem);
        return;
      }

      // Optimistically update UI
      setWardrobeItems((prev) => {
        const itemIndex = prev.findIndex((item) => item.id === updatedItem.id);
        if (itemIndex === -1) {
          return [updatedItem, ...prev];
        }

        const updated = [...prev];
        updated[itemIndex] = {
          ...prev[itemIndex],
          ...updatedItem,
          image_url: updatedItem.image_url || prev[itemIndex].image_url,
        };
        return updated;
      });

      // Invalidate cache to ensure fresh data on next load
      if (!skipBackendCall) {
        dataManager.invalidateWardrobeCache();
      }
    },
    []
  );

  const removeWardrobeItem = useCallback(
    async (itemId, skipBackendCall = false) => {
      // Optimistically update UI
      setWardrobeItems((prev) => prev.filter((item) => item.id !== itemId));

      // Invalidate cache to ensure fresh data on next load
      if (!skipBackendCall) {
        dataManager.invalidateWardrobeCache();
      }
    },
    []
  );

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
    dataManager.invalidateWardrobeCache();
    await fetchWardrobeItems(1, true);
  }, [fetchWardrobeItems]);

  // New function to get all items for selection screens
  const getAllWardrobeItemsForSelection = useCallback(
    async (forceRefresh = false) => {
      try {
        return await dataManager.getAllWardrobeItemsForSelection(forceRefresh);
      } catch (error) {
        console.error("Failed to get all wardrobe items:", error);
        return [];
      }
    },
    []
  );

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
        getAllWardrobeItemsForSelection,
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
