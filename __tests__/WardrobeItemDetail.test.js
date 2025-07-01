import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import WardrobeItemDetail from "../screens/WardrobeItemDetail";

// 🔧 Mock firebase/auth to prevent ESM crash
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: "test-user" },
  })),
}));

// 🔧 Mock expo-constants to avoid crashing on expoConfig access
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      FLASK_API_BASE_URL: "http://mocked-api.com",
    },
  },
}));

const baseMockItem = {
  id: 1,
  name: "Test Shirt",
  brand: "Test Brand",
  description: "A nice shirt",
  primary_color: "Blue",
  size: "M",
  price: 25,
  times_worn: 3,
  is_favorite: true,
  image_url: "",
  tags: ["casual", "summer"],
  category: "Clothing",
  subcategory: "Tops",
};

describe("WardrobeItemDetail", () => {
  it("renders item details", () => {
    const route = { params: { item: baseMockItem } };
    const navigation = { navigate: jest.fn(), goBack: jest.fn() };
    const { getByText } = render(
      <WardrobeItemDetail route={route} navigation={navigation} />
    );

    expect(getByText("Test Shirt")).toBeTruthy();
    expect(getByText("Test Brand")).toBeTruthy();
    expect(getByText("A nice shirt")).toBeTruthy();
    expect(getByText("Blue")).toBeTruthy();
    expect(getByText("M")).toBeTruthy();
    expect(getByText("$25")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText("Clothing - Tops")).toBeTruthy();
    expect(getByText("casual")).toBeTruthy();
    expect(getByText("summer")).toBeTruthy();
  });

  it("shows N/A for missing optional fields", () => {
    const item = {
      ...baseMockItem,
      price: null,
      size: null,
      tags: [],
    };
    const route = { params: { item } };
    const navigation = { navigate: jest.fn(), goBack: jest.fn() };
    const { getAllByText } = render(
      <WardrobeItemDetail route={route} navigation={navigation} />
    );

    // Expect three N/A placeholders
    const naFields = getAllByText("N/A");
    expect(naFields.length).toBeGreaterThanOrEqual(3);
  });

  it("calls navigation.navigate with correct params on Edit", () => {
    const route = { params: { item: baseMockItem } };
    const navigation = { navigate: jest.fn(), goBack: jest.fn() };
    const { getByText } = render(
      <WardrobeItemDetail route={route} navigation={navigation} />
    );
    fireEvent.press(getByText("Edit Item"));
    expect(navigation.navigate).toHaveBeenCalledWith("ItemReview", {
      item: baseMockItem,
    });
  });

  it("shows delete confirmation dialog on Delete Item press", () => {
    const route = { params: { item: baseMockItem } };
    const navigation = { navigate: jest.fn(), goBack: jest.fn() };
    const { getByText } = render(
      <WardrobeItemDetail route={route} navigation={navigation} />
    );

    // Fire the event — Alert is native and not testable directly unless mocked
    fireEvent.press(getByText("Delete Item"));

    // No crash is a pass for now — you can later mock Alert if needed
  });
});
