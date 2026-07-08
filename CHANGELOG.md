# 📋 VIP Project — Changelog

> Ghi chép lại các thay đổi quan trọng trong dự án: nội dung sửa, lý do, công dụng, và phương hướng tương lai.

---

## 2026-07-08

### 🔴 fix (notification): use Redis Pub/Sub for SSE broadcast across replicas
**Commit**: `a8ff91e`

**Vấn đề:**
- `NotificationController` giữ danh sách SSE clients trong một **in-memory array** (`private clients: []`).
- Với `replicas: 3` trong docker-compose, mỗi instance có array riêng biệt.
- Khi event xảy ra ở instance A nhưng client kết nối SSE tới instance B → client **không nhận được** notification realtime.

**Giải pháp:**
- Tạo `SSEBroadcaster` (`infrastructure/cache/sse-broadcaster.ts`) sử dụng **Redis Pub/Sub** làm message bus giữa các instances.
- Khi có event mới: publish lên Redis channel `sse:notifications`.
- Tất cả instances subscribe channel → nhận message → broadcast tới **local** SSE clients.
- Dùng 2 Redis connections riêng (subscriber + publisher) theo yêu cầu Redis protocol.

**Công dụng:**
- SSE notification hoạt động chính xác với bất kỳ số lượng replicas nào.
- Client luôn nhận được event realtime bất kể kết nối tới instance nào.

**Files thay đổi:**
- `be/services/task-service/src/infrastructure/cache/sse-broadcaster.ts` — **[NEW]**
- `be/services/task-service/src/interfaces/rest/notification.controller.ts` — Refactored broadcast flow

---

### 🔴 fix (nginx): add /notifications/ and /notifications/stream routes with SSE config
**Commit**: `c52b22f`

**Vấn đề:**
- Nginx gateway chỉ proxy 3 routes: `/auth/`, `/tasks/`, `/skills/`.
- **Thiếu** `/notifications/` → frontend gọi notification API bị **404**.
- SSE stream endpoint cũng không accessible qua gateway.

**Giải pháp:**
- Thêm `location /notifications/` cho REST API (GET, PUT read/read-all).
- Thêm `location /notifications/stream` riêng cho SSE với cấu hình đặc biệt:
  - `proxy_buffering off` — không buffer response, stream real-time.
  - `proxy_cache off` — không cache streaming response.
  - `proxy_read_timeout 3600s` — giữ connection 1 giờ (SSE là persistent).
  - `chunked_transfer_encoding on` — hỗ trợ streaming.
- Áp dụng cho cả `nginx.conf` (production) và `nginx.dev.conf` (development).

**Công dụng:**
- Notification REST API và SSE stream hoạt động qua Nginx gateway.
- SSE connections không bị timeout sớm hoặc bị buffered.

**Files thay đổi:**
- `be/nginx.conf` — Thêm 2 location blocks
- `be/nginx.dev.conf` — Thêm 2 location blocks

---

### 🔴 fix (outbox): use FOR UPDATE SKIP LOCKED to prevent duplicate publish across replicas
**Commit**: `b53a722`

**Vấn đề:**
- Outbox Worker chạy trên **mỗi replica** (3 workers cùng poll bảng `OutboxEvent`).
- Dùng `findMany({ where: { status: 'pending' } })` → nhiều workers có thể pick **cùng 1 event**.
- Kết quả: **duplicate publish** lên RabbitMQ → duplicate email gửi tới user.

**Giải pháp:**
- Thay `findMany` bằng raw SQL trong transaction:
  ```sql
  SELECT ... FROM "OutboxEvent"
  WHERE status = 'pending'
  ORDER BY "createdAt" ASC
  LIMIT 10
  FOR UPDATE SKIP LOCKED
  ```
- `FOR UPDATE` — lock các rows được select.
- `SKIP LOCKED` — nếu row đã bị lock bởi worker khác, **bỏ qua** thay vì chờ.
- Áp dụng cho cả **auth-service** và **task-service** outbox workers.

**Công dụng:**
- Mỗi outbox event chỉ được xử lý bởi **đúng 1 worker**, bất kể có bao nhiêu replicas.
- Không duplicate email, không duplicate RabbitMQ messages.
- Vẫn tận dụng được multiple workers để tăng throughput (mỗi worker pick các events khác nhau).

**Files thay đổi:**
- `be/services/auth-service/src/infrastructure/messaging/outbox.worker.ts`
- `be/services/task-service/src/infrastructure/messaging/outbox.worker.ts`

---

## 📌 Phương hướng tương lai

### Ưu tiên cao
| # | Hạng mục | Mô tả |
|---|----------|-------|
| 1 | **Security: loại bỏ `x-user-id` header trust** | Task-service hiện tin tưởng header `x-user-id` từ client. Cần chỉ trust từ internal network hoặc bỏ hoàn toàn, dùng Bearer token verify qua Redis TokenStore. |
| 2 | **Transaction cho delete task** | `DeleteTaskHandler` xóa task → trừ skill minutes mà không wrap transaction. Nếu bước trừ minutes fail → data inconsistency. |
| 3 | **Validation email/password khi register** | Không validate format email, password strength, name length. Cần thêm validation layer ở DTO hoặc domain service. |

### Ưu tiên trung bình
| # | Hạng mục | Mô tả |
|---|----------|-------|
| 4 | **Schema: `priority` dùng `autoincrement()`** | Xung đột với logic `getNextPriority()` trong code. Nên đổi thành `@default(0)`. |
| 5 | **`enforceStatusForDueDate` duplicate** | Logic chạy ở 2 nơi (domain service + repository mapper) nhưng không persist. Cần thống nhất: hoặc persist vào DB, hoặc coi `overdue` là derived status chỉ tính runtime. |
| 6 | **`req.body` pass trực tiếp vào UpdateTask** | Potential mass assignment. Nên whitelist fields ở controller layer. |
| 7 | **RefreshToken thiếu `name` trong response** | Frontend sẽ mất user name khi refresh token. Cần thêm `name: user.name` vào `AuthResponseDto`. |
| 8 | **Shared Postgres chưa rõ DB isolation** | Auth-service và task-service dùng chung Postgres container. Cần đảm bảo dùng database riêng. |

### Ưu tiên thấp
| # | Hạng mục | Mô tả |
|---|----------|-------|
| 9 | **`as any` cast trong GetUserStats** | Vi phạm abstraction. `getRawStatsData()` nên được thêm vào abstract `SkillRepository`. |
| 10 | **CORS `Access-Control-Allow-Origin *`** | Production nên restrict tới domain frontend cụ thể. |
| 11 | **Schema: `dueDate @default(now())`** | Vô nghĩa vì handler bắt buộc dueDate. Nên bỏ default. |
