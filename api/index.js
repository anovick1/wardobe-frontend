import axios from "axios";
import Constants from "expo-constants";
import { getAuth } from "firebase/auth";

const { FLASK_API_BASE_URL } = Constants.expoConfig.extra;

const api = axios.create({
  baseURL: FLASK_API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
