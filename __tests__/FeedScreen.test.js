import React from "react";
import { render } from "@testing-library/react-native";
import FeedScreen from "../screens/FeedScreen";

describe("FeedScreen", () => {
  it("renders feed screen title", () => {
    const { getByText } = render(<FeedScreen />);
    expect(getByText(/feed screen/i)).toBeTruthy();
  });
});
