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

const OutfitContext = createContext();

export function OutfitProvider({ children }) {
  const [outfits, setOutfits] = useState([]);
  const [allOutfits, setAllOutfits] = useState([]); // For filtering
  const [loadingOutfits, setLoadingOutfits] = useState(true);
  const [loadingMoreOutfits, setLoadingMoreOutfits] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, loading: authLoading } = useContext(AuthContext);
  const hasLoadedRef = useRef(false);

  const fetchAllOutfits = useCallback(
    async (forceRefresh = false) => {
      if (!user?.firebase) return;

      try {
        setLoadingOutfits(true);
        const allOutfitsData = await dataManager.getAllOutfits(forceRefresh);
        setAllOutfits(allOutfitsData);
      } catch (err) {
        console.error("Failed to fetch all outfits:", err);
      } finally {
        setLoadingOutfits(false);
      }
    },
    [user]
  );

  const fetchOutfits = useCallback(
    async (page = 1, forceRefresh = false) => {
      if (!user?.firebase) return;

      // Skip the hasLoadedRef check to ensure outfits load immediately on app start
      // The original check was causing a delay where only daily outfit would show
      // if (hasLoadedRef.current && page === 1 && !forceRefresh) {
      //   return;
      // }

      try {
        if (page === 1) setLoadingOutfits(true);
        else setLoadingMoreOutfits(true);

        const { items, pagination } = await dataManager.getOutfits(
          page,
          forceRefresh
        );

        if (page === 1) {
          setOutfits(items);
          hasLoadedRef.current = true;
        } else {
          setOutfits((prevOutfits) => [...prevOutfits, ...items]);
        }

        setTotalPages(pagination.pages);
        setCurrentPage(pagination.current_page);
      } catch (err) {
        console.error("⚠️ Failed to fetch outfits:", err);
      } finally {
        if (page === 1) setLoadingOutfits(false);
        else setLoadingMoreOutfits(false);
      }
    },
    [user?.firebase] // Only depend on user.firebase
  );

  useEffect(() => {
    if (!authLoading) {
      if (user?.firebase) {
        fetchOutfits(1);
      } else {
        setOutfits([]);
        setAllOutfits([]);
        setLoadingOutfits(false);
        hasLoadedRef.current = false;
      }
    }
  }, [user, authLoading, fetchOutfits]);

  const addOutfit = useCallback(async (newOutfit, skipBackendCall = false) => {
    if (!newOutfit || !newOutfit.id) {
      console.error("❌ Cannot add outfit without ID:", newOutfit);
      return;
    }

    // Optimistically update UI
    setOutfits((prev) => {
      const exists = prev.some((outfit) => outfit.id === newOutfit.id);
      if (exists) {
        return prev.map((outfit) =>
          outfit.id === newOutfit.id
            ? {
                ...outfit,
                ...newOutfit,
                composite_image_url:
                  newOutfit.composite_image_url || outfit.composite_image_url,
              }
            : outfit
        );
      } else {
        return [newOutfit, ...prev];
      }
    });

    // Update allOutfits too
    setAllOutfits((prev) => {
      const exists = prev.some((outfit) => outfit.id === newOutfit.id);
      if (exists) {
        return prev.map((outfit) =>
          outfit.id === newOutfit.id
            ? {
                ...outfit,
                ...newOutfit,
                composite_image_url:
                  newOutfit.composite_image_url || outfit.composite_image_url,
              }
            : outfit
        );
      } else {
        return [newOutfit, ...prev];
      }
    });

    // Invalidate cache to ensure fresh data on next load
    if (!skipBackendCall) {
      dataManager.invalidateOutfitCache();
    }
  }, []);

  const updateOutfit = useCallback(
    async (updatedOutfit, skipBackendCall = false) => {
      if (!updatedOutfit || !updatedOutfit.id) {
        console.error("❌ Cannot update outfit without ID:", updatedOutfit);
        return;
      }

      // Optimistically update UI
      setOutfits((prev) => {
        const outfitIndex = prev.findIndex(
          (outfit) => outfit.id === updatedOutfit.id
        );
        if (outfitIndex === -1) {
          return [updatedOutfit, ...prev];
        }

        const updated = [...prev];
        updated[outfitIndex] = {
          ...prev[outfitIndex],
          ...updatedOutfit,
          composite_image_url:
            updatedOutfit.composite_image_url ||
            prev[outfitIndex].composite_image_url,
        };
        return updated;
      });

      // Invalidate cache to ensure fresh data on next load
      if (!skipBackendCall) {
        dataManager.invalidateOutfitCache();
      }
    },
    []
  );

  const removeOutfit = useCallback(
    async (outfitId, skipBackendCall = false) => {
      // Optimistically update UI
      setOutfits((prev) => prev.filter((outfit) => outfit.id !== outfitId));

      // Invalidate cache to ensure fresh data on next load
      if (!skipBackendCall) {
        dataManager.invalidateOutfitCache();
      }
    },
    []
  );

  const loadMoreOutfits = useCallback(async () => {
    if (currentPage < totalPages && !loadingMoreOutfits && !loadingOutfits) {
      await fetchOutfits(currentPage + 1);
    }
  }, [
    currentPage,
    totalPages,
    loadingOutfits,
    loadingMoreOutfits,
    fetchOutfits,
  ]);

  // Add a force refresh function as a fallback
  const refreshOutfits = useCallback(async () => {
    dataManager.invalidateOutfitCache();
    hasLoadedRef.current = false;
    await fetchOutfits(1, true);
    await fetchAllOutfits(true); // Also refresh all outfits
  }, [fetchOutfits, fetchAllOutfits]);

  // Function to get a specific outfit by ID
  const getOutfitById = useCallback(async (outfitId, forceRefresh = false) => {
    try {
      return await dataManager.getOutfitById(outfitId, forceRefresh);
    } catch (error) {
      console.error("Failed to get outfit by ID:", error);
      return null;
    }
  }, []);

  // Function to update worn status of an outfit
  const updateOutfitWornStatus = useCallback(
    (outfitId, isWorn, timesWorn = 1) => {
      setOutfits((prev) =>
        prev.map((outfit) =>
          outfit.id === outfitId
            ? {
                ...outfit,
                is_worn: isWorn,
                times_worn: isWorn
                  ? (outfit.times_worn || 0) + timesWorn
                  : outfit.times_worn,
                last_worn_at: isWorn
                  ? new Date().toISOString()
                  : outfit.last_worn_at,
              }
            : outfit
        )
      );
    },
    []
  );

  return (
    <OutfitContext.Provider
      value={{
        outfits,
        allOutfits, // For filtering
        loadingOutfits,
        loadingMoreOutfits,
        currentPage,
        totalPages,
        fetchOutfits,
        fetchAllOutfits,
        addOutfit,
        updateOutfit,
        removeOutfit,
        loadMoreOutfits,
        refreshOutfits,
        getOutfitById,
        updateOutfitWornStatus,
        hasMoreOutfits: currentPage < totalPages,
      }}
    >
      {children}
    </OutfitContext.Provider>
  );
}

export function useOutfits() {
  return useContext(OutfitContext);
}
