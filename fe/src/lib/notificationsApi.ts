import { BaseApi } from "./baseApi";

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

class NotificationsApi extends BaseApi {
  constructor() {
    super("api/notifications");
  }

  async getNotifications(token: string) {
    return this.get<AppNotification[]>("", { token });
  }

  async markAsRead(id: string, token: string) {
    return this.put<{ success: boolean }>(`${id}/read`, undefined, { token });
  }

  async markAllAsRead(token: string) {
    return this.put<{ success: boolean }>("read-all", undefined, { token });
  }
}

export const notificationsApi = new NotificationsApi();
