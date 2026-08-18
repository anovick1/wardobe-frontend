import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import MultiUploadScreen from "../screens/MultiUploadScreen";

jest.mock("firebase/auth", () => ({
  getAuth: () => ({ currentUser: { uid: "u1" } }),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));

jest.mock("expo-file-system", () => ({ cacheDirectory: "file:///cache/" }));

jest.mock("../api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock("../contexts/WardrobeContext", () => ({
  useWardrobe: () => ({ addItemToWardrobe: jest.fn() }),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

const buildRoute = () => ({
  params: {
    images: [{ uri: "file:///tmp/a.jpg" }],
    clientUploadIds: ["upload-1"],
    processedItems: [{ id: 7, name: "Blue shirt", image_url: "https://cdn/a.png" }],
    skipUpload: true,
  },
});

const buildNavigation = () => {
  const captured = {};
  return {
    navigation: {
      navigate: jest.fn((_, params) => {
        captured.onSave = params.onSave;
      }),
      setOptions: jest.fn(),
      getParent: () => null,
      goBack: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    },
    captured,
  };
};

// Records every setTimeout still pending, so an unmount that forgets to clear
// one is observable rather than silent.
const trackPendingTimeouts = () => {
  const pending = new Set();
  const realSetTimeout = global.setTimeout;
  const realClearTimeout = global.clearTimeout;
  global.setTimeout = (...args) => {
    const id = realSetTimeout(...args);
    pending.add(id);
    return id;
  };
  global.clearTimeout = (id) => {
    pending.delete(id);
    return realClearTimeout(id);
  };
  return {
    pending,
    restore: () => {
      global.setTimeout = realSetTimeout;
      global.clearTimeout = realClearTimeout;
    },
  };
};

describe("MultiUploadScreen deferred timeouts", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("clears the deferred post-save timeout when the screen unmounts", async () => {
    const tracker = trackPendingTimeouts();
    try {
      const { navigation, captured } = buildNavigation();
      const view = render(
        <MultiUploadScreen route={buildRoute()} navigation={navigation} />,
      );

      await act(async () => {
        fireEvent.press(screen.getByText("Review Item"));
      });
      expect(navigation.navigate).toHaveBeenCalledWith(
        "ItemReview",
        expect.objectContaining({ fromBulkUpload: true }),
      );

      await act(async () => {
        captured.onSave({ id: 7, name: "Blue shirt" });
      });
      expect(tracker.pending.size).toBeGreaterThan(0);

      view.unmount();

      expect(tracker.pending.size).toEqual(0);
    } finally {
      tracker.restore();
    }
  });
});
