import axios from "axios";
import Constants from "expo-constants";
import { getAuth, getIdToken } from "firebase/auth";

const { FLASK_API_BASE_URL } = Constants.expoConfig.extra;

const api = axios.create({
  baseURL: FLASK_API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Worn Outfit API functions
export const wornOutfitAPI = {
  // Mark outfit as worn
  markAsWorn: async (outfitId, wornAt = new Date()) => {
    const response = await api.post("/worn_outfits/", {
      outfit_id: outfitId,
      worn_at: wornAt.toISOString(),
      is_public: true,
    });
    return response.data;
  },

  // Get all worn outfits for user
  getWornOutfits: async () => {
    const response = await api.get("/worn_outfits/");
    return response.data;
  },

  // Delete worn outfit record
  removeWornRecord: async (wornOutfitId) => {
    const response = await api.delete(`/worn_outfits/${wornOutfitId}`);
    return response.data;
  },
};

// Events API functions
export const eventsAPI = {
  // Get all events
  getEvents: async (params = {}) => {
    const response = await api.get("/events/", { params });
    return response.data;
  },

  // Get single event
  getEvent: async (eventId) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Create new event
  createEvent: async (eventData) => {
    const response = await api.post("/events/", eventData);
    return response.data;
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  // Delete event
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  // Link outfit to event
  linkOutfitToEvent: async (eventId, outfitId) => {
    const response = await api.post(`/events/${eventId}/outfits`, {
      outfit_id: outfitId,
    });
    return response.data;
  },

  // Unlink outfit from event
  unlinkOutfitFromEvent: async (eventId, outfitId) => {
    const response = await api.delete(`/events/${eventId}/outfits/${outfitId}`);
    return response.data;
  },
};

// Trips API functions
export const tripsAPI = {
  // Get all trips
  getTrips: async (params = {}) => {
    const response = await api.get("/trips/", { params });
    return response.data;
  },

  // Get single trip
  getTrip: async (tripId) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  // Create new trip
  createTrip: async (tripData) => {
    const response = await api.post("/trips/", tripData);
    return response.data;
  },

  // Update trip
  updateTrip: async (tripId, tripData) => {
    const response = await api.put(`/trips/${tripId}`, tripData);
    return response.data;
  },

  // Delete trip
  deleteTrip: async (tripId) => {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },

  // Link outfit to trip
  linkOutfitToTrip: async (tripId, outfitId, tripDay = null) => {
    const response = await api.post(`/trips/${tripId}/outfits`, {
      outfit_id: outfitId,
      trip_day: tripDay,
    });
    return response.data;
  },

  // Unlink outfit from trip
  unlinkOutfitFromTrip: async (tripId, outfitId) => {
    const response = await api.delete(`/trips/${tripId}/outfits/${outfitId}`);
    return response.data;
  },
};

// Packing Lists API functions
export const packingListsAPI = {
  // Get all packing lists
  getPackingLists: async (params = {}) => {
    const response = await api.get("/packing_lists/", { params });
    return response.data;
  },

  // Get single packing list
  getPackingList: async (packingListId) => {
    const response = await api.get(`/packing_lists/${packingListId}`);
    return response.data;
  },

  // Create new packing list
  createPackingList: async (packingListData) => {
    const response = await api.post("/packing_lists/", packingListData);
    return response.data;
  },

  // Create manual packing list
  createManualPackingList: async (packingListData) => {
    const response = await api.post("/packing_lists/manual", packingListData);
    return response.data;
  },

  // Generate AI packing list
  generateAIPackingList: async (tripId) => {
    const response = await api.post("/packing_lists/generate", {
      trip_id: tripId,
    });
    return response.data;
  },

  // Toggle item packed status
  toggleItemPacked: async (packingListId, itemId) => {
    const response = await api.put(
      `/packing_lists/${packingListId}/items/${itemId}/toggle_packed`,
    );
    return response.data;
  },

  // Update packing list item
  updatePackingListItem: async (packingListId, itemId, itemData) => {
    const response = await api.put(
      `/packing_lists/${packingListId}/items/${itemId}`,
      itemData,
    );
    return response.data;
  },

  // Add packing list item
  addPackingListItem: async (packingListId, itemData) => {
    const response = await api.post(
      `/packing_lists/${packingListId}/items`,
      itemData,
    );
    return response.data;
  },

  // Delete packing list item
  deletePackingListItem: async (packingListId, itemId) => {
    const response = await api.delete(
      `/packing_lists/${packingListId}/items/${itemId}`,
    );
    return response.data;
  },
};

// Locations API functions
export const locationsAPI = {
  // Search locations
  searchLocations: async (query) => {
    const response = await api.get("/locations/search", {
      params: { q: query },
    });
    return response.data;
  },

  // Get popular locations
  getPopularLocations: async () => {
    const response = await api.get("/locations/");
    return response.data;
  },
};

export default api;
