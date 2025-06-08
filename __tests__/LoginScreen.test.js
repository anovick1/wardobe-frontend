import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import LoginScreen from "../screens/LoginScreen";

jest.mock("react", () => {
  const actualReact = jest.requireActual("react");
  return {
    ...actualReact,
    useContext: () => ({ setUser: jest.fn() }),
  };
});
jest.mock("../auth/useGoogleAuth", () => ({
  useGoogleAuth: () => ({ login: jest.fn() }),
}));
jest.mock("../auth/useFacebookAuth", () => ({
  useFacebookAuth: () => ({ login: jest.fn() }),
}));
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: "test-user" },
  })),
}));
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      FLASK_API_BASE_URL: "http://mocked-api.com",
    },
  },
}));
jest.mock("../auth/AuthContext", () => ({
  AuthContext: { Provider: ({ children }) => children },
}));

describe("LoginScreen", () => {
  it("renders Google and Facebook login buttons", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("Sign in with Google")).toBeTruthy();
    expect(getByText("Sign in with Facebook")).toBeTruthy();
  });
});
