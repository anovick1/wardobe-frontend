import React from "react";
import { render } from "@testing-library/react-native";
import WardrobeScreen from "../screens/WardrobeScreen";

// 🔧 Mock expo-constants to avoid crashing on expoConfig access
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      FLASK_API_BASE_URL: "http://mocked-api.com",
    },
  },
}));
jest.mock("../components/wardrobe/WardrobeItems", () => () => null);
jest.mock("../contexts/WardrobeContext", () => ({
  useWardrobe: () => ({ wardrobeItems: [], loadingWardrobe: false }),
}));

describe("WardrobeScreen", () => {
  it("renders wardrobe screen title", () => {
    const { getByText } = render(<WardrobeScreen />);
    expect(getByText(/wardrobe/i)).toBeTruthy();
  });
});
