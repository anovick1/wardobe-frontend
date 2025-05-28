import "dotenv/config";

export default {
  expo: {
    name: "wardrobe-frontend",
    slug: "wardrobe-frontend",
    extra: {
      FLASK_API_BASE_URL: process.env.FLASK_API_BASE_URL,
    },
  },
};
