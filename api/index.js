import axios from "axios";
import Constants from "expo-constants";

const { FLASK_API_BASE_URL } = Constants.expoConfig.extra;

const api = axios.create({
  baseURL: FLASK_API_BASE_URL,
});

export default api;
