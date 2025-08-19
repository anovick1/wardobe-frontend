import api from "./index";

export const getFollowRequests = async (page = 1, per_page = 20) => {
  const response = await api.get("/api/v1/follow-requests", {
    params: {
      page,
      per_page,
    },
  });
  return response.data;
};

export const approveFollowRequest = async (requestId) => {
  const response = await api.post(`/api/v1/follow-requests/${requestId}/approve`);
  return response.data;
};

export const denyFollowRequest = async (requestId) => {
  const response = await api.post(`/api/v1/follow-requests/${requestId}/deny`);
  return response.data;
};