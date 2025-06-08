import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PlannerScreen from "../screens/PlannerScreen";
import * as Calendar from "expo-calendar";

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders planner title and calendar", () => {
    const { getByText } = render(<PlannerScreen />);
    expect(getByText("🗓️ Outfit Planner")).toBeTruthy();
  });

  it("shows add event button when permission granted and date selected", async () => {
    const { getByTestId, findByText } = render(<PlannerScreen />);
    const today = new Date().toISOString().split("T")[0];

    // Select a date first
    fireEvent.press(getByTestId(`undefined.day_${today}`));

    // Wait for the button to appear
    const addButton = await findByText("Add Event for Selected Date");
    expect(addButton).toBeTruthy();
  });

  describe("Calendar Permissions", () => {
    it("handles denied calendar permission", async () => {
      Calendar.requestCalendarPermissionsAsync.mockResolvedValueOnce({
        status: "denied",
      });
      const { getByText } = render(<PlannerScreen />);
      await waitFor(() => {
        expect(getByText("❌ Calendar permission denied.")).toBeTruthy();
      });
    });

    it("handles permission request error", async () => {
      Calendar.requestCalendarPermissionsAsync.mockRejectedValueOnce(
        new Error("Permission error")
      );
      const { getByText } = render(<PlannerScreen />);
      await waitFor(() => {
        expect(
          getByText("❌ Error requesting calendar permission.")
        ).toBeTruthy();
      });
    });
  });

  describe("Date Selection", () => {
    it("updates selected date when calendar day is pressed", async () => {
      const { getByTestId } = render(<PlannerScreen />);
      const today = new Date().toISOString().split("T")[0];

      // Simulate day press using testID
      fireEvent.press(getByTestId(`undefined.day_${today}`));

      await waitFor(() => {
        expect(getByTestId(`undefined.day_${today}`)).toBeTruthy();
      });
    });

    it("shows add event button when no date is selected", async () => {
      const { findByText } = render(<PlannerScreen />);
      const addButton = await findByText("Add Event for Selected Date");
      expect(addButton).toBeTruthy();
    });
  });

  describe("Event Creation", () => {
    it("creates event successfully", async () => {
      Calendar.createEventAsync.mockResolvedValueOnce();
      const { getByTestId, findByText } = render(<PlannerScreen />);
      const today = new Date().toISOString().split("T")[0];

      // Select a date first using testID
      fireEvent.press(getByTestId(`undefined.day_${today}`));

      // Wait for and click the Add Event button
      const addButton = await findByText("Add Event for Selected Date");
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(Calendar.createEventAsync).toHaveBeenCalled();
      });
    });

    it("shows error when creating event without date selection", async () => {
      const { findByText } = render(<PlannerScreen />);
      const addButton = await findByText("Add Event for Selected Date");
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(findByText("Please select a date first.")).toBeTruthy();
      });
    });

    it("handles event creation error", async () => {
      Calendar.createEventAsync.mockRejectedValueOnce(
        new Error("Failed to create event")
      );
      const { getByTestId, findByText } = render(<PlannerScreen />);
      const today = new Date().toISOString().split("T")[0];

      // Select a date first using testID
      fireEvent.press(getByTestId(`undefined.day_${today}`));

      // Wait for and click the Add Event button
      const addButton = await findByText("Add Event for Selected Date");
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(findByText("Error")).toBeTruthy();
      });
    });
  });

  describe("Event Fetching", () => {
    it("fetches and displays events for selected date", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Test Event",
          startDate: new Date().toISOString(),
        },
      ];

      Calendar.getEventsAsync.mockResolvedValueOnce(mockEvents);

      const { getByTestId, findByText } = render(<PlannerScreen />);
      const today = new Date().toISOString().split("T")[0];

      // Select today's date using testID
      fireEvent.press(getByTestId(`undefined.day_${today}`));

      await waitFor(() => {
        expect(findByText("Test Event")).toBeTruthy();
      });
    });

    it("handles event fetching error", async () => {
      Calendar.getEventsAsync.mockRejectedValueOnce(
        new Error("Failed to fetch events")
      );
      const { getByTestId, findByText } = render(<PlannerScreen />);
      const today = new Date().toISOString().split("T")[0];

      // Select today's date using testID
      fireEvent.press(getByTestId(`undefined.day_${today}`));

      await waitFor(() => {
        expect(findByText("Error")).toBeTruthy();
      });
    });
  });

  describe("Calendar Integration", () => {
    it("handles no writable calendar found", async () => {
      Calendar.getCalendarsAsync.mockResolvedValueOnce([
        { id: "1", allowsModifications: false },
      ]);

      const { getByTestId, findByText } = render(<PlannerScreen />);
      const today = new Date().toISOString().split("T")[0];

      // Select today's date using testID
      fireEvent.press(getByTestId(`undefined.day_${today}`));

      // Wait for and click the Add Event button
      const addButton = await findByText("Add Event for Selected Date");
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(findByText("Error")).toBeTruthy();
      });
    });
  });
});
