import api from "./index";

export const searchUsers = async (query, page = 1, perPage = 20) => {
  const response = await api.get("/api/v1/users/search", {
    params: {
      q: query,
      page,
      per_page: perPage,
    },
  });
  return response.data;
};

export const followUser = async (userId) => {
  const response = await api.post(`/api/v1/users/${userId}/follow`);
  return response.data;
};

export const unfollowUser = async (userId) => {
  const response = await api.delete(`/api/v1/users/${userId}/unfollow`);
  return response.data;
};

export const getUserProfile = async (userId) => {
  const response = await api.get(`/api/v1/users/${userId}/profile`);
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put("/api/v1/users/profile", profileData);
  return response.data;
};

export const getUserFollowers = async (userId, page = 1, perPage = 20) => {
  const response = await api.get(`/api/v1/users/${userId}/followers`, {
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
};

export const getUserFollowing = async (userId, page = 1, perPage = 20) => {
  const response = await api.get(`/api/v1/users/${userId}/following`, {
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
};

export const getUserWardrobe = async (userId, page = 1, perPage = 20) => {
  const response = await api.get(`/api/v1/users/${userId}/wardrobe`, {
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
};

export const getUserOutfits = async (userId, page = 1, perPage = 20) => {
  const response = await api.get(`/api/v1/users/${userId}/outfits`, {
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
};

export const getUserOutfitDetail = async (userId, outfitId) => {
  const response = await api.get(`/api/v1/users/${userId}/outfits/${outfitId}`);
  return response.data;
};
