import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ProfileScreen from "../screens/ProfileScreen";
import { signOut } from "firebase/auth";

// Mocks
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      FLASK_API_BASE_URL: "http://mocked-api.com",
    },
  },
}));

const mockSetUser = jest.fn();

jest.mock("firebase/app", () => ({ initializeApp: jest.fn() }));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
  initializeAuth: jest.fn(() => ({
    currentUser: null,
  })),
  getReactNativePersistence: jest.fn(),
}));

jest.mock("react", () => {
  const actualReact = jest.requireActual("react");
  return {
    ...actualReact,
    useContext: () => ({ setUser: mockSetUser }),
  };
});

// TODO: These tests are stale against the rewritten ProfileScreen (it no
// longer renders a "Profile Screen" placeholder text, gates "Log Out" behind
// a profile fetch, and uses useNavigation/useFocusEffect which the global
// React.useContext mock here breaks). They need a rewrite against the current
// UI with proper navigation and API mocks.
describe.skip("ProfileScreen", () => {
  it("renders profile text and logout button", () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText("Profile Screen")).toBeTruthy();
    expect(getByText("Log Out")).toBeTruthy();
  });

  it("calls setUser(null) on logout", async () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText("Log Out"));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });
  });
});
