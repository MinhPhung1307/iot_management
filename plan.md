# Kế hoạch phát triển nền tảng quản lý thiết bị IoT

## 1. Tổng quan dự án
Phát triển nền tảng quản lý thiết bị IoT với giao diện web theo dõi trạng thái thiết bị theo thời gian thực.

## 2. Kiến trúc hệ thống

### 2.1 Kiến trúc tổng thể
- **Frontend**: React.js với giao diện dashboard thời gian thực
- **Backend**: Node.js/Express.js với WebSocket (Socket.io)
- **Database**: PostgreSQL (lưu trữ thông tin thiết bị) + Redis (cache trạng thái)
- **IoT Protocol**: MQTT (Mosquitto broker)

### 2.2 Cấu trúc thư mục
```
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Các component giao diện
│   │   ├── pages/       # Các trang
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── package.json
├── server/              # Backend Node.js
│   ├── src/
│   │   ├── controllers/ # Xử lý request
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── mqtt/        # MQTT client
│   │   └── websocket/   # Socket.io setup
│   └── package.json
├── docker/              # Docker configuration
└── docs/                # Tài liệu
```

## 3. Chức năng chính

### 3.1 Quản lý thiết bị
- CRUD thiết bị (thêm, sửa, xóa, xem danh sách)
- Phân loại thiết bị theo loại, vị trí, trạng thái
- Chi tiết từng thiết bị với lịch sử hoạt động

### 3.2 Theo dõi thời gian thực
- Dashboard hiển thị trạng thái tất cả thiết bị
- Biểu đồ trực quan hóa dữ liệu (Chart.js/Recharts)
- Cập nhật trạng thái qua WebSocket
- Thông báo khi thiết bị có vấn đề (cảnh báo)

### 3.3 Kiểm soát thiết bị
- Bật/tắt thiết bị từ xa
- Điều chỉnh thông số thiết bị
- Lên lịch hoạt động tự động

### 3.4 Quản lý người dùng
- Đăng ký/đăng nhập (JWT Authentication)
- Phân quyền (Admin, User)
- Quản lý profiles

## 4. Công nghệ sử dụng

### Frontend
- React.js 18+
- TypeScript
- Tailwind CSS
- Socket.io-client
- React Router
- React Query (tanstack-query)
- Chart.js hoặc Recharts

### Backend
- Node.js + Express.js
- TypeScript
- Socket.io (WebSocket)
- Sequelize (PostgreSQL ORM)
- JWT (JSON Web Token)
- MQTT.js (MQTT client)

### Database
- PostgreSQL 15+ (lưu trữ chính)
- Redis (caching, session)

### DevOps
- Docker + Docker Compose
- Nginx (reverse proxy)
- PM2 (process manager)

## 5. Database Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Devices Table
```sql
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sensor', 'actuator', 'gateway')),
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'warning', 'error')),
  last_seen TIMESTAMP,
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Device Data Table (Time-series)
```sql
CREATE TABLE device_data (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  temperature DECIMAL(10, 2),
  humidity DECIMAL(10, 2),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_data_timestamp ON device_data(device_id, timestamp DESC);
```

### Alerts Table
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Devices
- `GET /api/devices` - Lấy danh sách thiết bị
- `GET /api/devices/:id` - Chi tiết thiết bị
- `POST /api/devices` - Thêm thiết bị (admin)
- `PUT /api/devices/:id` - Cập nhật thiết bị (admin)
- `DELETE /api/devices/:id` - Xóa thiết bị (admin)

### Device Data
- `GET /api/devices/:id/data` - Lấy dữ liệu lịch sử
- `POST /api/devices/:id/command` - Gửi lệnh đến thiết bị

### WebSocket Events
- `device:status` - Cập nhật trạng thái thiết bị
- `device:data` - Dữ liệu thời gian thực
- `device:alert` - Cảnh báo thiết bị

## 7. Giao diện chính

### Dashboard
- Tổng quan số lượng thiết bị online/offline/error
- Biểu đồ trạng thái thiết bị theo thời gian
- Map hiển thị vị trí thiết bị (tùy chọn)

### Device List
- Bảng danh sách thiết bị với bộ lọc
- Tìm kiếm, phân trang
- Quick action (bật/tắt nhanh)

### Device Detail
- Thông tin chi tiết thiết bi
- Biểu đồ dữ liệu real-time
- Lịch sử hoạt động
- Form điều khiển thiết bị

### Settings
- Quản lý người dùng
- Cài đặt hệ thống
- Quản lý cảnh báo

## 8. Timeline phát triển

### Phase 1: Setup & Core ✅ HOÀN THÀNH
- [x] Setup project structure (client React + server Express + Docker Compose)
- [x] Config database (PostgreSQL via Sequelize ORM, Redis trong docker-compose)
- [x] Implement Authentication (JWT: login, register, getMe, middleware auth + authorize)
- [x] CRUD cơ bản cho Devices (getAll, getById, create, update, delete)
- [x] Sequelize Models: User, Device, DeviceData, Alert, CommandHistory, DeviceGroup, Notification, Schedule
- [x] Seed admin account tự động từ .env

### Phase 2: Real-time Features ✅ HOÀN THÀNH
- [x] Setup MQTT broker (Mosquitto qua Docker + mqttClient.ts)
- [x] Implement WebSocket (Socket.io: serverSocket, useSocket hook)
- [x] Dashboard real-time (tổng quan thiết bị online/offline/warning/error)
- [x] Biểu đồ trực quan hóa (Recharts: LineChart temperature/humidity)
- [x] Device data API (GET /devices/:id/data với filter startDate, endDate, limit)

### Phase 3: Advanced Features 🔧 ĐANG TIẾN HÀNH (~85%)
- [x] Device control từ xa (Turn On/Off, Reboot, Factory Reset, Set Brightness, Custom Command)
- [x] Notification system (CRUD notifications, mark as read)
- [x] Lên lịch tự động (CRUD schedules: recurring, one-time, cron expressions)
- [x] Device groups/tags (CRUD groups, add/remove devices)
- [/] **Bug fix**: `sendCommand` route đã sửa để dùng `commandController` (cần restart server để áp dụng)

### Phase 4: Polish & Deploy 🔧 ĐANG TIẾN HÀNH (~30%)
- [x] Docker setup (docker-compose.yml: PostgreSQL, Redis, Mosquitto, Server, Client)
- [x] Nginx config (client/nginx.conf reverse proxy)
- [x] Documentation (docs/USER_GUIDE.md)
- [ ] UI/UX improvements
- [ ] Testing & bug fixes (đang thực hiện - test Turn On/Off)
- [ ] Unit tests / Integration tests
- [ ] Deployment lên production

## 9. Trạng thái hiện tại của dự án

### Đã triển khai

#### Backend (server/)
| Module | Files | Trạng thái |
|--------|-------|------------|
| **Controllers** | authController, deviceController, commandController, groupController, notificationController, scheduleController | ✅ Hoàn thành |
| **Models** | User, Device, DeviceData, Alert, CommandHistory, DeviceGroup, Notification, Schedule | ✅ Hoàn thành |
| **Routes** | authRoutes, deviceRoutes, groupRoutes, notificationRoutes, scheduleRoutes | ✅ Hoàn thành |
| **Middleware** | auth (authenticate + authorize) | ✅ Hoàn thành |
| **MQTT** | mqttClient (connect, subscribe, publish, sendCommand) | ✅ Hoàn thành |
| **WebSocket** | serverSocket (emitDeviceUpdate, emitDeviceData, emitAlert) | ✅ Hoàn thành |

#### Frontend (client/)
| Module | Files | Trạng thái |
|--------|-------|------------|
| **Pages** | Dashboard, Devices, DeviceDetail, Groups, Notifications, Schedules, Login | ✅ Hoàn thành |
| **Components** | Layout (navbar + sidebar) | ✅ Hoàn thành |
| **Hooks** | useAuth (JWT auth context), useSocket (Socket.io real-time) | ✅ Hoàn thành |
| **Services** | api.ts (axios: authAPI, deviceAPI) | ✅ Hoàn thành |
| **Routing** | React Router with ProtectedRoute | ✅ Hoàn thành |

#### DevOps
| Module | Trạng thái |
|--------|------------|
| Docker Compose (PostgreSQL, Redis, Mosquitto, Server, Client) | ✅ Hoàn thành |
| Dockerfiles (server, client) | ✅ Hoàn thành |
| Nginx reverse proxy | ✅ Hoàn thành |
| Mosquitto config | ✅ Hoàn thành |

### Known Issues & Bug Fixes

| # | Issue | Nguyên nhân | Fix | Trạng thái |
|---|-------|-------------|-----|------------|
| 1 | Turn On/Off không cập nhật trạng thái trên UI | `deviceRoutes.ts` dùng `sendCommand` từ `deviceController` (chỉ gửi MQTT, không update DB/WebSocket) thay vì `commandController` (có update DB + emit WebSocket) | Đã sửa import trong `deviceRoutes.ts` để dùng `commandController.sendCommand` | 🔧 Đã sửa code, cần restart server |

### Chưa triển khai
- [ ] Unit tests (Jest + React Testing Library)
- [ ] Integration tests (Supertest)
- [ ] E2E tests (Cypress)
- [ ] Input validation (Joi/Zod)
- [ ] Rate limiting
- [ ] Map hiển thị vị trí thiết bị
- [ ] Quản lý profiles người dùng
- [ ] PM2 process manager
- [ ] HTTPS in production
- [ ] Settings page (UI)

## 10. Yêu cầu phát triển

### Environment Variables
```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iot_management
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/iot_management

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# MQTT
MQTT_BROKER=mqtt://localhost:1883
MQTT_TOPIC=iot/devices

# Server
PORT=5000
NODE_ENV=development
```

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- MQTT Broker (Mosquitto)

## 11. Testing Strategy
- Unit tests: Jest + React Testing Library
- Integration tests: Supertest (API)
- E2E tests: Cypress (tùy chọn)

## 12. Security Considerations
- Input validation (Joi/Zod)
- Rate limiting
- CORS configuration
- Helmet.js for security headers
- SQL injection prevention
- XSS protection
- HTTPS in production

