import React from "react";
import { render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import WardrobeItems from "../components/wardrobe/WardrobeItems";
import * as WardrobeContext from "../contexts/WardrobeContext";

// Mock Expo config
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      FLASK_API_BASE_URL: "http://mocked-api.com",
    },
  },
}));

const mockItems = [
  {
    id: 1,
    name: "Shirt",
    brand: "BrandA",
    description: "A nice shirt",
    primary_color: "Blue",
    size: "M",
    times_worn: 2,
    is_favorite: false,
    image_url: "",
  },
  {
    id: 2,
    name: "Pants",
    brand: "BrandB",
    description: "Comfy pants",
    primary_color: "Black",
    size: "L",
    times_worn: 5,
    is_favorite: true,
    image_url: "",
  },
];

describe("WardrobeItems", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders wardrobe items", () => {
    jest
      .spyOn(WardrobeContext, "useWardrobe")
      .mockReturnValue({ wardrobeItems: mockItems, loadingWardrobe: false });

    const { getByText } = render(
      <NavigationContainer>
        <WardrobeItems />
      </NavigationContainer>
    );

    expect(getByText("Shirt")).toBeTruthy();
    expect(getByText("Pants")).toBeTruthy();
  });

  it("shows loading indicator when loading", () => {
    jest
      .spyOn(WardrobeContext, "useWardrobe")
      .mockReturnValue({ wardrobeItems: [], loadingWardrobe: true });

    const { getByTestId } = render(
      <NavigationContainer>
        <WardrobeItems />
      </NavigationContainer>
    );

    expect(getByTestId("wardrobe-loading")).toBeTruthy();
  });

  it("shows empty message when no items", () => {
    jest
      .spyOn(WardrobeContext, "useWardrobe")
      .mockReturnValue({ wardrobeItems: [], loadingWardrobe: false });

    const { getByText } = render(
      <NavigationContainer>
        <WardrobeItems />
      </NavigationContainer>
    );

    expect(getByText("No wardrobe items yet.")).toBeTruthy();
  });
});
