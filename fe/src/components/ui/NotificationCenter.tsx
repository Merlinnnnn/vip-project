import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCircle2 } from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useAuth } from "../../context/AuthContext";
// import { useTranslation } from "react-i18next";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, markAsRead, markAllAsRead, isLoading } = useNotificationStore();
  const { token } = useAuth();
  // const { t } = useTranslation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead || !token) return;
    await markAsRead(id, token);
  };

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return;
    await markAllAsRead(token);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-danger)] text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-lg focus:outline-none z-50">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
            <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                    className={`flex cursor-pointer gap-3 p-4 transition-colors hover:bg-[var(--surface-hover)] ${
                      !notification.isRead ? "bg-[var(--surface-secondary)]" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notification.isRead ? (
                        <Check size={16} className="text-[var(--text-muted)]" />
                      ) : (
                        <CheckCircle2 size={16} className="text-[var(--accent-primary)]" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p
                        className={`text-sm ${
                          !notification.isRead
                            ? "font-medium text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
