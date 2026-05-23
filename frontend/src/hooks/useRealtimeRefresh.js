import { useEffect, useRef } from "react";
import { API_BASE_URL } from "../api/axios";

const hasOverlap = (sourceResources = [], targetResources = []) => {
  if (!Array.isArray(sourceResources)) return false;

  return (
    sourceResources.includes("global") ||
    targetResources.some((item) => sourceResources.includes(item))
  );
};

export const useRealtimeRefresh = (
  refreshFn,
  resources = ["global"],
  options = {}
) => {
  const refreshRef = useRef(refreshFn);
  const resourcesRef = useRef(resources);
  const resourcesKey = resources.join("|");
  const intervalMs = options.intervalMs ?? 15000;

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    resourcesRef.current = resources;
  }, [resourcesKey, resources]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    let eventSource;

    const runRefresh = () => {
      if (typeof refreshRef.current === "function") {
        refreshRef.current();
      }
    };

    try {
      eventSource = new EventSource(
        `${API_BASE_URL}/realtime/events?token=${encodeURIComponent(token)}`
      );

      eventSource.addEventListener("data-changed", (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (hasOverlap(payload.resources, resourcesRef.current)) {
            runRefresh();
          }
        } catch (err) {
          console.error("Realtime parse error:", err);
        }
      });

      eventSource.onerror = () => {
        // EventSource sẽ tự reconnect.
        // Polling bên dưới vẫn đảm bảo dữ liệu được cập nhật.
      };
    } catch (err) {
      console.error("Không thể mở kết nối realtime:", err);
    }

    const intervalId =
      intervalMs > 0 ? window.setInterval(runRefresh, intervalMs) : null;

    const onFocus = () => runRefresh();
    window.addEventListener("focus", onFocus);

    return () => {
      if (eventSource) eventSource.close();
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [resourcesKey, intervalMs]);
};
