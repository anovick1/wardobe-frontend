import { renderHook, act } from "@testing-library/react-native";
import api from "../api";
import {
  POLLING_DEFAULTS,
  useUploadStatusPolling,
} from "../hooks/useUploadStatusPolling";

jest.mock("../api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const ITEM_ID = 42;
const STATUS_URL = `/wardrobe_items/${ITEM_ID}/status`;

const processingResponse = { data: { status: "processing" } };
const completedResponse = {
  data: { status: "completed", id: ITEM_ID, image_url: "http://img" },
};
const failedResponse = {
  data: { status: "failed", id: ITEM_ID, gpt_processing_status: "failed" },
};

const advance = async (ms) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

const renderPollingHook = () => {
  const onCompleted = jest.fn();
  const onFailed = jest.fn();
  const rendered = renderHook(() =>
    useUploadStatusPolling({ onCompleted, onFailed }),
  );
  return { ...rendered, onCompleted, onFailed };
};

describe("useUploadStatusPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    api.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("polls until the status is completed, then reports and stops", async () => {
    api.get
      .mockResolvedValueOnce(processingResponse)
      .mockResolvedValueOnce(processingResponse)
      .mockResolvedValueOnce(completedResponse);
    const { result, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    await advance(1000);
    await advance(1500);

    expect(api.get).toHaveBeenCalledTimes(3);
    expect(api.get).toHaveBeenCalledWith(STATUS_URL, {
      timeout: POLLING_DEFAULTS.requestTimeoutMs,
    });
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith(ITEM_ID, completedResponse.data);
    expect(onFailed).not.toHaveBeenCalled();

    await advance(60000);
    expect(api.get).toHaveBeenCalledTimes(3);
  });

  it("stops polling and fires no callbacks after unmount", async () => {
    api.get.mockResolvedValue(processingResponse);
    const { result, unmount, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    expect(api.get).toHaveBeenCalledTimes(1);

    unmount();
    await advance(300000);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(onCompleted).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("grows the interval between polls exponentially", async () => {
    api.get.mockResolvedValue(processingResponse);
    const { result } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    expect(api.get).toHaveBeenCalledTimes(1);

    await advance(999);
    expect(api.get).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(api.get).toHaveBeenCalledTimes(2);

    await advance(1499);
    expect(api.get).toHaveBeenCalledTimes(2);
    await advance(1);
    expect(api.get).toHaveBeenCalledTimes(3);

    await advance(2249);
    expect(api.get).toHaveBeenCalledTimes(3);
    await advance(1);
    expect(api.get).toHaveBeenCalledTimes(4);
  });

  it("gives up after the total time budget and reports a timeout failure", async () => {
    api.get.mockResolvedValue(processingResponse);
    const { result, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    for (let i = 0; i < 140; i += 1) {
      await advance(1000);
    }

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledWith(ITEM_ID, { reason: "timeout" });
    expect(onCompleted).not.toHaveBeenCalled();

    const callsAtGiveUp = api.get.mock.calls.length;
    await advance(60000);
    expect(api.get.mock.calls.length).toEqual(callsAtGiveUp);
  });

  it("treats a failed status as terminal", async () => {
    api.get
      .mockResolvedValueOnce(processingResponse)
      .mockResolvedValueOnce(failedResponse);
    const { result, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    await advance(1000);

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledWith(ITEM_ID, {
      reason: "failed",
      status: failedResponse.data,
    });
    expect(onCompleted).not.toHaveBeenCalled();

    await advance(60000);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("treats a 404 response as terminal", async () => {
    api.get.mockRejectedValue({ response: { status: 404 } });
    const { result, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledWith(ITEM_ID, { reason: "not_found" });
    expect(onCompleted).not.toHaveBeenCalled();

    await advance(60000);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("keeps polling through transient request errors", async () => {
    api.get
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(completedResponse);
    const { result, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    await advance(1000);

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith(ITEM_ID, completedResponse.data);
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("stopPolling cancels a single item's loop without firing callbacks", async () => {
    api.get.mockResolvedValue(processingResponse);
    const { result, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    expect(api.get).toHaveBeenCalledTimes(1);

    act(() => result.current.stopPolling(ITEM_ID));
    await advance(300000);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(onCompleted).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("counts time spent waiting on slow requests against the total budget", async () => {
    const requestLatencyMs = 45000;
    api.get.mockImplementation(async () => {
      jest.setSystemTime(Date.now() + requestLatencyMs);
      return processingResponse;
    });
    const { result, onCompleted, onFailed } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    await advance(1000);
    await advance(1500);
    await advance(2250);

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledWith(ITEM_ID, { reason: "timeout" });
    expect(onCompleted).not.toHaveBeenCalled();

    const callsAtGiveUp = api.get.mock.calls.length;
    await advance(60000);
    expect(api.get.mock.calls.length).toEqual(callsAtGiveUp);
  });

  it("does not leave a second loop running when an item is restarted mid-request", async () => {
    const pendingResolvers = [];
    api.get.mockImplementation(
      () => new Promise((resolve) => pendingResolvers.push(resolve)),
    );
    const { result } = renderPollingHook();

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    expect(pendingResolvers).toHaveLength(1);

    act(() => result.current.startPolling(ITEM_ID));
    await advance(0);
    expect(pendingResolvers).toHaveLength(2);

    await act(async () => pendingResolvers[0](processingResponse));
    await act(async () => pendingResolvers[1](processingResponse));

    await advance(1000);
    expect(api.get).toHaveBeenCalledTimes(3);
  });
});
