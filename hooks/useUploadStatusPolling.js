import { useCallback, useEffect, useRef } from "react";
import api from "../api";

export const POLLING_DEFAULTS = {
  initialDelayMs: 1000,
  backoffFactor: 1.5,
  maxDelayMs: 10000,
  maxTotalMs: 120000,
  requestTimeoutMs: 15000,
};

/**
 * Polls GET /wardrobe_items/<id>/status for one or more uploads with
 * exponential backoff, a total time budget, and full cleanup on unmount.
 *
 * Terminal outcomes:
 * - status "completed" -> onCompleted(itemId, status)
 * - status "failed"    -> onFailed(itemId, { reason: "failed", status })
 * - HTTP 404           -> onFailed(itemId, { reason: "not_found" })
 * - budget exhausted   -> onFailed(itemId, { reason: "timeout" })
 */
export function useUploadStatusPolling({ onCompleted, onFailed } = {}) {
  const timeoutsRef = useRef(new Map());
  const activeItemsRef = useRef(new Set());
  const generationsRef = useRef(new Map());
  const isMountedRef = useRef(true);
  const callbacksRef = useRef({ onCompleted, onFailed });
  callbacksRef.current = { onCompleted, onFailed };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
      activeItemsRef.current.clear();
      generationsRef.current.clear();
    };
  }, []);

  const stopPolling = useCallback((itemId) => {
    activeItemsRef.current.delete(itemId);
    const timeoutId = timeoutsRef.current.get(itemId);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(itemId);
    }
  }, []);

  const stopAllPolling = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current.clear();
    activeItemsRef.current.clear();
  }, []);

  const startPolling = useCallback(
    (itemId) => {
      const {
        initialDelayMs,
        backoffFactor,
        maxDelayMs,
        maxTotalMs,
        requestTimeoutMs,
      } = POLLING_DEFAULTS;
      stopPolling(itemId);
      activeItemsRef.current.add(itemId);

      const generation = (generationsRef.current.get(itemId) ?? 0) + 1;
      generationsRef.current.set(itemId, generation);

      let nextDelay = initialDelayMs;
      const deadline = Date.now() + maxTotalMs;

      const isActive = () =>
        isMountedRef.current &&
        activeItemsRef.current.has(itemId) &&
        generationsRef.current.get(itemId) === generation;

      const finish = (report) => {
        stopPolling(itemId);
        report();
      };

      const giveUp = () => {
        finish(() =>
          callbacksRef.current.onFailed?.(itemId, { reason: "timeout" }),
        );
      };

      const scheduleNext = (delayMs) => {
        if (!isActive()) return;
        if (Date.now() >= deadline) {
          giveUp();
          return;
        }
        const timeoutId = setTimeout(poll, delayMs);
        timeoutsRef.current.set(itemId, timeoutId);
      };

      const poll = async () => {
        if (!isActive()) return;
        timeoutsRef.current.delete(itemId);
        let status;
        try {
          const response = await api.get(`/wardrobe_items/${itemId}/status`, {
            timeout: requestTimeoutMs,
          });
          status = response.data;
        } catch (err) {
          if (!isActive()) return;
          if (err?.response?.status === 404) {
            finish(() =>
              callbacksRef.current.onFailed?.(itemId, { reason: "not_found" }),
            );
            return;
          }
          scheduleNextWithBackoff();
          return;
        }
        if (!isActive()) return;
        if (status?.status === "completed") {
          finish(() => callbacksRef.current.onCompleted?.(itemId, status));
        } else if (status?.status === "failed") {
          finish(() =>
            callbacksRef.current.onFailed?.(itemId, {
              reason: "failed",
              status,
            }),
          );
        } else {
          scheduleNextWithBackoff();
        }
      };

      const scheduleNextWithBackoff = () => {
        const delayMs = nextDelay;
        nextDelay = Math.min(Math.round(nextDelay * backoffFactor), maxDelayMs);
        scheduleNext(delayMs);
      };

      scheduleNext(0);
    },
    [stopPolling],
  );

  return { startPolling, stopPolling, stopAllPolling };
}
