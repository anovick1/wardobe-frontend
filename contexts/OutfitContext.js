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

const OutfitContext = createContext();

export function OutfitProvider({ children }) {
  const [outfits, setOutfits] = useState([]);
  const [loadingOutfits, setLoadingOutfits] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, loading: authLoading } = useContext(AuthContext);
  const hasLoadedRef = useRef(false);

  const fetchOutfits = useCallback(
    async (page = 1, forceRefresh = false) => {
      if (!user?.firebase) return;

      // Use ref to check if we've already loaded to avoid dependency on state
      if (hasLoadedRef.current && page === 1 && !forceRefresh) {
        console.log("🚫 Skipping outfit fetch - using cached data");
        return;
      }

      try {
        setLoadingOutfits(true);
        console.log(
          "🔄 Fetching outfits - page:",
          page,
          "forceRefresh:",
          forceRefresh
        );

        const response = await api.get(`/outfits/?page=${page}`);

        if (page === 1) {
          setOutfits(response.data.outfits);
          hasLoadedRef.current = true;
        } else {
          setOutfits((prevOutfits) => [
            ...prevOutfits,
            ...response.data.outfits,
          ]);
        }

        setTotalPages(response.data.pagination.pages);
        setCurrentPage(response.data.pagination.current_page);
        console.log(
          "✅ Fetched outfits successfully, count:",
          response.data.outfits.length
        );
      } catch (err) {
        console.error("⚠️ Failed to fetch outfits:", err);
      } finally {
        setLoadingOutfits(false);
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
        setLoadingOutfits(false);
        hasLoadedRef.current = false;
      }
    }
  }, [user, authLoading, fetchOutfits]);

  const addOutfit = (newOutfit) => {
    console.log("🔄 Adding outfit:", newOutfit?.id, newOutfit?.title);

    if (!newOutfit || !newOutfit.id) {
      console.error("❌ Cannot add outfit without ID:", newOutfit);
      return;
    }

    setOutfits((prev) => {
      const exists = prev.some((outfit) => outfit.id === newOutfit.id);
      console.log("📝 Outfit exists:", exists, "Current count:", prev.length);

      if (exists) {
        // If it exists, update it
        const updated = prev.map((outfit) =>
          outfit.id === newOutfit.id
            ? {
                ...outfit,
                ...newOutfit,
                // Preserve the original thumbnail_url if it hasn't changed
                thumbnail_url: newOutfit.thumbnail_url || outfit.thumbnail_url,
              }
            : outfit
        );
        console.log("✅ Updated existing outfit");
        return updated;
      } else {
        // If it's new, add it to the start
        const newList = [newOutfit, ...prev];
        console.log("✅ Added new outfit, new count:", newList.length);
        return newList;
      }
    });
  };

  const updateOutfit = (updatedOutfit) => {
    console.log("🔄 Updating outfit:", updatedOutfit?.id, updatedOutfit?.title);

    if (!updatedOutfit || !updatedOutfit.id) {
      console.error("❌ Cannot update outfit without ID:", updatedOutfit);
      return;
    }

    setOutfits((prev) => {
      const outfitIndex = prev.findIndex(
        (outfit) => outfit.id === updatedOutfit.id
      );
      console.log(
        "📝 Outfit found at index:",
        outfitIndex,
        "Current count:",
        prev.length
      );

      if (outfitIndex === -1) {
        console.log("⚠️ Outfit not found, adding as new outfit");
        return [updatedOutfit, ...prev];
      }

      // Force a new array reference to ensure React re-renders
      const updated = [...prev];
      updated[outfitIndex] = {
        ...prev[outfitIndex],
        ...updatedOutfit,
        // Preserve the original thumbnail_url if it hasn't changed
        thumbnail_url:
          updatedOutfit.thumbnail_url || prev[outfitIndex].thumbnail_url,
      };

      console.log("✅ Updated outfit at index:", outfitIndex);
      return updated;
    });
  };

  const removeOutfit = (outfitId) => {
    console.log("🗑️ Removing outfit:", outfitId);
    setOutfits((prev) => {
      const filtered = prev.filter((outfit) => outfit.id !== outfitId);
      console.log("✅ Removed outfit, new count:", filtered.length);
      return filtered;
    });
  };

  const loadMoreOutfits = useCallback(async () => {
    if (currentPage < totalPages && !loadingOutfits) {
      await fetchOutfits(currentPage + 1);
    }
  }, [currentPage, totalPages, loadingOutfits, fetchOutfits]);

  // Add a force refresh function as a fallback
  const refreshOutfits = useCallback(async () => {
    console.log("🔄 Force refreshing outfits...");
    hasLoadedRef.current = false; // Reset the loaded flag
    await fetchOutfits(1, true);
  }, [fetchOutfits]);

  return (
    <OutfitContext.Provider
      value={{
        outfits,
        loadingOutfits,
        currentPage,
        totalPages,
        fetchOutfits,
        addOutfit,
        updateOutfit,
        removeOutfit,
        loadMoreOutfits,
        refreshOutfits,
      }}
    >
      {children}
    </OutfitContext.Provider>
  );
}

export function useOutfits() {
  return useContext(OutfitContext);
}
