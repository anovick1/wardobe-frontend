import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import api from "../api";
import WebViewScreen from "../screens/WebViewScreen";

const ITEM_ID = 42;
const CAPTURED_URI = "file:///tmp/product-shot.jpg";

jest.mock("react-native-vector-icons/MaterialIcons", () => "Icon", {
  virtual: true,
});

jest.mock("../api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock("../firebase", () => ({
  auth: { currentUser: { getIdToken: jest.fn(async () => "test-token") } },
}));

jest.mock("expo-file-system", () => ({
  cacheDirectory: "file:///cache/",
  downloadAsync: jest.fn(async () => ({ uri: "file:///cache/item.jpg" })),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    getParent: () => null,
    setOptions: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
}));

jest.mock("../hooks/useUnsavedChangesWarning", () => ({
  useUnsavedChangesWarning: () => ({ showExitWarning: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock("react-native-shadow-2", () => {
  const { View } = require("react-native");
  return { Shadow: View };
});

// Stands in for the real ViewShot-wrapped WebView: reports the view as ready
// and hands back a capture() the screen can await.
jest.mock("../components/webview/WebViewSection", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function MockWebViewSection({ viewShotRef, setViewReady }) {
    React.useEffect(() => {
      viewShotRef.current = {
        capture: jest.fn(async () => "file:///tmp/product-shot.jpg"),
      };
      setViewReady(true);
    }, []);
    return <View testID="webview-section" />;
  };
});

jest.mock("../components/common/EnhancedCropModal", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");
  return function MockCropModal({ visible, onCropComplete }) {
    if (!visible) return null;
    return (
      <TouchableOpacity
        testID="confirm-crop"
        onPress={() => onCropComplete("file:///tmp/product-shot.jpg")}
      >
        <Text>Confirm crop</Text>
      </TouchableOpacity>
    );
  };
});

const flush = async (ms) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

const captureAndUpload = async () => {
  await act(async () => {
    fireEvent.press(screen.getByText("Capture"));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId("confirm-crop"));
  });
};

describe("WebViewScreen upload status polling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    api.get.mockReset();
    api.post.mockReset();
    api.delete.mockReset();
    api.post.mockImplementation(async (url) => {
      if (url.includes("extract_product_metadata")) {
        return { data: { item_id: ITEM_ID, status: "processing" } };
      }
      return { data: { image_url: "https://cdn.test/cleaned.png" } };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the upload as failed and stops requesting once the polling budget runs out", async () => {
    api.get.mockResolvedValue({ data: { status: "processing" } });
    render(<WebViewScreen />);

    await captureAndUpload();

    // Drawer opens with the upload still spinning, no failure copy yet.
    expect(screen.queryByText("Still processing — check back later")).toBeNull();

    // Step the clock so each poll's response settles before the next is scheduled.
    for (let elapsed = 0; elapsed <= 130000; elapsed += 500) {
      await flush(500);
    }

    expect(
      screen.getByText("Still processing — check back later"),
    ).toBeTruthy();

    const statusCalls = api.get.mock.calls.filter(([url]) =>
      url.includes(`/wardrobe_items/${ITEM_ID}/status`),
    );
    expect(statusCalls.length).toBeLessThan(40);

    const callsAfterGiveUp = api.get.mock.calls.length;
    await flush(300000);
    expect(api.get.mock.calls.length).toEqual(callsAfterGiveUp);
  });

  it("marks the upload complete and stops requesting once the backend finishes", async () => {
    api.get
      .mockResolvedValueOnce({ data: { status: "processing" } })
      .mockResolvedValueOnce({ data: { status: "processing" } })
      .mockResolvedValue({
        data: { status: "completed", id: ITEM_ID, image_url: "https://cdn.test/a.png" },
      });
    render(<WebViewScreen />);

    await captureAndUpload();
    await flush(0);
    await flush(1000);
    await flush(1500);

    expect(api.get).toHaveBeenCalledTimes(3);
    expect(screen.getByText("✓")).toBeTruthy();
    expect(screen.queryByText("Still processing — check back later")).toBeNull();

    const callsAtCompletion = api.get.mock.calls.length;
    await flush(300000);
    expect(api.get.mock.calls.length).toEqual(callsAtCompletion);
  });

  it("stops polling when the screen unmounts mid-upload", async () => {
    api.get.mockResolvedValue({ data: { status: "processing" } });
    const view = render(<WebViewScreen />);

    await captureAndUpload();
    await flush(0);
    await flush(1000);

    const callsAtUnmount = api.get.mock.calls.length;
    expect(callsAtUnmount).toBeGreaterThan(0);

    view.unmount();
    await flush(300000);

    expect(api.get.mock.calls.length).toEqual(callsAtUnmount);
  });
});
