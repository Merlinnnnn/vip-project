# Auth Service Scaffold (Node.js + Express)

Khung sườn Express áp dụng Clean Architecture/DDD (layered & hexagonal): domain thuần, application orchestration (use-cases), infrastructure adapters, interfaces (REST) và shared thành phần dùng chung.

## Cấu trúc thư mục
- `src/main.ts`, `src/app.module.ts`: khởi động Express app, manual DI wiring, gắn router.
- `src/config/`: config rời cho env/database.
- `src/domain/`: entity, repository interface, domain service (logic thuần, không phụ thuộc Nest/IO).
- `src/infrastructure/`: adapter kỹ thuật.
  - `persistence/`: tạm có in-memory repo, chỗ này sẽ đổi sang Prisma/TypeORM + migrations.
  - `security/`: adapter hash mật khẩu, JWT provider (placeholder).
  - `http/`: để dành nếu cần call service khác.
- `src/application/`: DTO, mapper, use-case điều phối domain + infrastructure.
- `src/interfaces/rest/`: adapter REST (Express router) nhận request/response.
- `src/shared/`: kiểu chung (vd: JwtPayload).

## Design pattern
- DDD + Clean Architecture/Hexagonal: domain không phụ thuộc framework; dependency flow từ ngoài vào domain qua interface.
- Sử dụng repository pattern (interface ở domain, implementation ở infrastructure).
- Use-case pattern: mỗi hành động chính (register/login/get-me) đóng gói thành class.
- Controller chỉ gọi use-case, không chứa business logic; wiring DI thủ công trong `createApp`.

## Ghi chú triển khai tiếp
- Thay `InMemoryUserRepository` bằng adapter thực (Prisma/TypeORM) và cấu hình migrations.
- Thay `PasswordHasher`/`JwtProvider` bằng thư viện thực tế (bcrypt/jsonwebtoken) + cấu hình secret/expiry.
- Bổ sung DTO validation (`class-validator`), guard/strategy cho JWT, logging & exception filter.
