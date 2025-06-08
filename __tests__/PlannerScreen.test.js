import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PlannerScreen from "../screens/PlannerScreen";

jest.mock("expo-calendar", () => ({
  requestCalendarPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  getCalendarsAsync: jest.fn(() =>
    Promise.resolve([{ id: "1", allowsModifications: true }])
  ),
  createEventAsync: jest.fn(() => Promise.resolve()),
  getEventsAsync: jest.fn(() => Promise.resolve([])),
  EntityTypes: { EVENT: "event" },
}));

describe("PlannerScreen", () => {
  it("renders planner title and calendar", () => {
    const { getByText } = render(<PlannerScreen />);
    expect(getByText("🗓️ Outfit Planner")).toBeTruthy();
  });

  it("shows add event button when permission granted and date selected", async () => {
    const { findByText } = render(<PlannerScreen />);
    expect(await findByText("Add Event for Selected Date")).toBeTruthy();
  });
});
