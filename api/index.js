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
    const response = await api.post('/worn_outfits/', {
      outfit_id: outfitId,
      worn_at: wornAt.toISOString(),
      is_public: true
    });
    return response.data;
  },

  // Get all worn outfits for user
  getWornOutfits: async () => {
    const response = await api.get('/worn_outfits/');
    return response.data;
  },

  // Delete worn outfit record
  removeWornRecord: async (wornOutfitId) => {
    const response = await api.delete(`/worn_outfits/${wornOutfitId}`);
    return response.data;
  }
};

// Events API functions
export const eventsAPI = {
  // Get all events
  getEvents: async (params = {}) => {
    const response = await api.get('/events/', { params });
    return response.data;
  },

  // Get single event
  getEvent: async (eventId) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Create new event
  createEvent: async (eventData) => {
    const response = await api.post('/events/', eventData);
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
      outfit_id: outfitId
    });
    return response.data;
  },

  // Unlink outfit from event
  unlinkOutfitFromEvent: async (eventId, outfitId) => {
    const response = await api.delete(`/events/${eventId}/outfits/${outfitId}`);
    return response.data;
  }
};

export default api;
