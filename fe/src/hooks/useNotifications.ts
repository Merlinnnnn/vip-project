import { useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9999";

export const useNotifications = () => {
  useEffect(() => {
    console.log("[NOTIFICATIONS] Connecting to stream...");
    const eventSource = new EventSource(`${API_URL}/api/notifications/stream`);

    eventSource.onopen = () => {
      console.log("[NOTIFICATIONS] Stream connected.");
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("[NOTIFICATION RECEIVED]", payload);
        
        // Example: alert the user or update state
        if (payload.type === 'TASK_SCHEDULED') {
           const { title, dueDate } = payload.data;
           console.log(`%c[SCHEDULED] Task "${title}" for ${new Date(dueDate).toLocaleDateString()}`, 'color: #6366f1; font-weight: bold;');
        }
      } catch (err) {
        console.error("[NOTIFICATIONS] Failed to parse event data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[NOTIFICATIONS] Stream error:", err);
    };

    return () => {
      console.log("[NOTIFICATIONS] Closing stream...");
      eventSource.close();
    };
  }, []);
};
