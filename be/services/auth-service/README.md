# Auth Service Scaffold (Node.js + Express)

Khung sườn Express áp dụng Clean Architecture/DDD (layered & hexagonal): domain thuần, application orchestration (use-cases), infrastructure adapters, interfaces (REST) và phần shared.

## Cấu trúc thư mục
- `src/main.ts`, `src/app.module.ts`: khởi động Express app, manual DI wiring, gắn router.
- `src/config/`: config rời cho env/database.
- `src/domain/`: entity, repository interface, domain service (logic thuần, không phụ thuộc framework/IO).
- `src/infrastructure/`: adapter kỹ thuật.
  - `persistence/`: Prisma repo (`user.prisma.repository.ts`), Prisma client, migrations.
  - `security/`: adapter hash mật khẩu, JWT provider (placeholder).
  - `http/`: để dành nếu cần call service khác.
- `src/application/`: DTO, mapper, use-case điều phối domain + infrastructure.
- `src/interfaces/rest/`: adapter REST (Express router) nhận request/response.
- `src/shared/`: kiểu chung (vd: JwtPayload).

## Thiết lập & chạy
1) Tạo `.env` tại `be/services/auth-service/.env`:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
   PORT=3000
   JWT_SECRET=change-me
   ```
2) Cài và migrate (local):  
   ```
   npm install
   npm run prisma:generate
   npm run prisma:migrate   # tạo bảng User
   npm run start:dev
   ```

## Docker
- Build image authservice:
  ```
  docker build -t authservice:latest .
  ```
- Chạy container (gắn env và map port):
  ```
  docker run -p 3000:3000 --env-file .env authservice:latest
  ```
  (cần Postgres đang chạy và DATABASE_URL trỏ đúng)

## API cho FE (điểm kết nối)
- Base URL: `http://localhost:3000/api/auth`
- `POST /register` `{ email, password, name? }` -> `{ accessToken, user }`
- `POST /login` `{ email, password }` -> `{ accessToken, user }`
- `GET /me` header `x-user-id: <userId>` -> `{ id, email }`
FE có thể cấu hình biến môi trường (vd: `VITE_API_URL=http://localhost:3000/api`) để gọi các endpoint trên.

## Design pattern
- DDD + Clean Architecture/Hexagonal: domain không phụ thuộc framework; dependency flow từ ngoài vào domain qua interface.
- Repository pattern: interface ở domain, implementation ở infrastructure (Prisma).
- Use-case pattern: mỗi hành động chính (register/login/get-me) đóng gói thành class.
- Controller chỉ gọi use-case, không chứa business logic; wiring DI thủ công trong `createApp`.

## Ghi chú triển khai tiếp
- Thay `PasswordHasher`/`JwtProvider` bằng thư viện thực tế (bcrypt/jsonwebtoken) + secret/expiry.
- Bổ sung DTO validation, auth middleware/guard với JWT, logging & exception handling.
