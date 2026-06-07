import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9999";
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

/**
 * useNotifications — Kết nối SSE để nhận thông báo realtime từ server.
 *
 * Cải thiện so với phiên bản cũ:
 * - Có giới hạn retry (MAX_RETRIES) thay vì retry vô tận khi mất mạng
 * - Gắn userId vào URL để server biết đây là stream của user nào
 * - Dọn sạch console.log debug
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const retryCount = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const connect = () => {
      if (cancelled || retryCount.current >= MAX_RETRIES) return;

      // Truyền userId qua query param — workaround vì EventSource không hỗ trợ custom headers
      // TODO: Khi BE hỗ trợ HTTP-only cookie auth, bỏ query param này
      const url = `${API_URL}/api/notifications/stream?userId=${encodeURIComponent(user.id)}`;
      const eventSource = new EventSource(url);
      esRef.current = eventSource;

      eventSource.onopen = () => {
        retryCount.current = 0; // Reset retry khi kết nối thành công
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type: string; data: unknown };

          if (payload.type === "TASK_SCHEDULED") {
            const data = payload.data as { title?: string; dueDate?: string };
            console.info(
              `[Notification] Task "${data.title}" scheduled for ${
                data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "N/A"
              }`,
            );
            // TODO: Hiện toast notification thay vì console.info
          }
        } catch {
          // Bỏ qua event không parse được
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        esRef.current = null;

        if (cancelled) return;
        retryCount.current += 1;

        if (retryCount.current < MAX_RETRIES) {
          // Exponential back-off đơn giản
          const delay = RETRY_DELAY_MS * retryCount.current;
          timeoutRef.current = setTimeout(connect, delay);
        }
        // Sau MAX_RETRIES lần thất bại: dừng hẳn, không spam server
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [user?.id]);
};
