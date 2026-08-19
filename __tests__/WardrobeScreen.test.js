import React from "react";
import { render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
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
jest.mock("../contexts/OutfitContext", () => ({
  useOutfits: () => ({ outfits: [], allOutfits: [] }),
}));
// WardrobeScreen force-navigates to "WardrobeHome" on every focus (see
// diagnosis C3); stub useFocusEffect so rendering outside a navigator works.
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useFocusEffect: jest.fn() };
});

describe("WardrobeScreen", () => {
  it("renders wardrobe screen title", () => {
    const { getByText } = render(
      <NavigationContainer>
        <WardrobeScreen />
      </NavigationContainer>
    );
    expect(getByText(/wardrobe/i)).toBeTruthy();
  });
});
