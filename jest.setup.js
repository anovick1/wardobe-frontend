import "@testing-library/jest-native/extend-expect";

// Optional: silence annoying native warnings
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));
