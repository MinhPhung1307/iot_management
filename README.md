# 🌐 IoT Device Management Platform

Nền tảng quản lý thiết bị IoT toàn diện với giao diện web theo dõi trạng thái thiết bị theo thời gian thực, điều khiển từ xa, lên lịch tự động và quản lý nhóm thiết bị.

---

## ✨ Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 📊 **Dashboard real-time** | Tổng quan trạng thái thiết bị online/offline/warning/error |
| 📱 **Quản lý thiết bị** | CRUD thiết bị (sensor, actuator, gateway) với phân loại và lọc |
| 🎮 **Điều khiển từ xa** | Turn On/Off, Reboot, Factory Reset, Set Brightness, Custom Command |
| 📈 **Biểu đồ trực quan** | Dữ liệu temperature/humidity real-time với Recharts |
| ⏰ **Lên lịch tự động** | Cron expression, one-time, recurring schedules |
| 📂 **Nhóm thiết bị** | Tổ chức thiết bị theo nhóm/khu vực |
| 🔔 **Thông báo** | Hệ thống notification với đánh dấu đã đọc |
| 🔐 **Phân quyền** | JWT Authentication, ABAC (Attribute-Based Access Control) |
| 🔄 **WebSocket** | Cập nhật trạng thái real-time qua Socket.io |
| 🦟 **MQTT Protocol** | Giao tiếp thiết bị IoT qua Mosquitto broker |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** (dev server + build)
- **Tailwind CSS** (styling)
- **Recharts** (biểu đồ)
- **Socket.io-client** (real-time)
- **React Router v6** (routing)
- **Axios** (HTTP client)

### Backend
- **Node.js** + **Express.js** + TypeScript
- **Sequelize ORM** (PostgreSQL)
- **Socket.io** (WebSocket server)
- **MQTT.js** (IoT protocol)
- **JWT** (authentication)
- **Helmet** + **CORS** (security)

### Infrastructure
- **PostgreSQL 15** — Database chính
- **Redis 7** — Cache & session
- **Eclipse Mosquitto 2** — MQTT broker
- **Docker Compose** — Orchestration
- **Nginx** — Reverse proxy (production)

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────┐     HTTP/WS      ┌──────────────┐     MQTT      ┌──────────────┐
│   Browser   │◄────────────────►│   Express    │◄────────────► │  Mosquitto   │
│  React App  │   REST + WS      │   Server     │   Pub/Sub     │  MQTT Broker │
│   :3000     │                  │   :5000      │   :1883       │              │
└─────────────┘                  └──────┬───────┘               └──────┬───────┘
                                        │                              │
                                   Sequelize                     MQTT Protocol
                                        │                              │
                                 ┌──────┴───────┐                ┌─────┴──────┐
                                 │  PostgreSQL  │                │ IoT Devices│
                                 │    :5432     │                │  Sensors   │
                                 └──────────────┘                │  Actuators │
                                                                 └────────────┘
```

> 📖 Chi tiết kiến trúc và flow thực thi: xem [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🚀 Quick Start

### Yêu cầu

- **Node.js** 18+
- **PostgreSQL** 15+ (hoặc dùng Docker)
- **Redis** 7+ (hoặc dùng Docker)
- **MQTT Broker** — Mosquitto (hoặc dùng Docker)

### Cách 1: Docker Compose (Khuyến nghị)

```bash
# Clone project
git clone <repo-url>
cd ioT_device_management

# Khởi động tất cả services
docker-compose up -d
```

Truy cập:
| Service | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:5000 |
| 🦟 MQTT Broker | localhost:1883 |
| 💾 PostgreSQL | localhost:5432 |
| 📦 Redis | localhost:6379 |

### Cách 2: Local Development

#### 1. Khởi động Infrastructure (Docker)

```bash
# Chỉ chạy PostgreSQL, Redis, Mosquitto
docker-compose up -d postgres redis mosquitto
```

#### 2. Khởi động Backend

```bash
cd server
cp .env.example .env    # Cấu hình environment variables
npm install
npm run dev             # Server chạy tại :5000
```

#### 3. Khởi động Frontend

```bash
cd client
npm install
npm run dev             # App chạy tại :3000
```

---

## 🔑 Tài khoản mặc định

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gmail.com` | `123456` |

> ⚠️ **Lưu ý**: Tài khoản admin được tạo tự động khi server khởi động (từ biến `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` trong `.env`).

---

## 📁 Cấu trúc dự án

```
ioT_device_management/
├── client/                      # 🖥️ Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx       # Navbar + Sidebar layout
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx      # JWT auth context provider
│   │   │   └── useSocket.ts     # Socket.io real-time hook
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Tổng quan thiết bị
│   │   │   ├── Devices.tsx      # Danh sách thiết bị (CRUD)
│   │   │   ├── DeviceDetail.tsx # Chi tiết + Điều khiển từ xa
│   │   │   ├── Groups.tsx       # Quản lý nhóm thiết bị
│   │   │   ├── Schedules.tsx    # Lên lịch tự động
│   │   │   ├── Notifications.tsx# Thông báo
│   │   │   └── Login.tsx        # Đăng nhập
│   │   ├── services/
│   │   │   └── api.ts           # Axios client (authAPI, deviceAPI)
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx              # Routes + ProtectedRoute
│   │   └── main.tsx             # Entry point
│   ├── vite.config.ts           # Vite config + proxy
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf               # Production reverse proxy
│
├── server/                      # ⚙️ Backend (Express.js)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts      # Sequelize + PostgreSQL
│   │   ├── controllers/
│   │   │   ├── authController.ts      # Login, Register, GetMe
│   │   │   ├── deviceController.ts    # CRUD Devices + Stats
│   │   │   ├── commandController.ts   # Send Command + History
│   │   │   ├── groupController.ts     # CRUD Groups
│   │   │   ├── scheduleController.ts  # CRUD Schedules + Execute
│   │   │   └── notificationController.ts  # Notifications
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT authenticate + authorize
│   │   ├── models/
│   │   │   ├── User.ts          # User model (bcrypt password)
│   │   │   ├── Device.ts        # Device model
│   │   │   ├── DeviceData.ts    # Time-series sensor data
│   │   │   ├── Alert.ts         # Alert model
│   │   │   ├── CommandHistory.ts# Command log
│   │   │   ├── DeviceGroup.ts   # Group + Members
│   │   │   ├── Notification.ts  # Notification model
│   │   │   ├── Schedule.ts      # Schedule model
│   │   │   └── index.ts         # Model exports
│   │   ├── mqtt/
│   │   │   └── mqttClient.ts    # MQTT connect, subscribe, publish
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── deviceRoutes.ts
│   │   │   ├── groupRoutes.ts
│   │   │   ├── scheduleRoutes.ts
│   │   │   └── notificationRoutes.ts
│   │   ├── websocket/
│   │   │   └── socket.ts        # Socket.io server
│   │   ├── types/               # TypeScript types
│   │   ├── utils/
│   │   └── index.ts             # Server entry point
│   ├── .env                     # Environment variables
│   ├── Dockerfile
│   └── tsconfig.json
│
├── mosquitto/                   # 🦟 MQTT Broker config
│   ├── config/
│   ├── data/
│   └── log/
│
├── docs/                        # 📖 Tài liệu
│   ├── ARCHITECTURE.md          # Sơ đồ kiến trúc & Flow thực thi
│   └── USER_GUIDE.md            # Hướng dẫn sử dụng
│
├── docker-compose.yml           # Docker orchestration
├── plan.md                      # Kế hoạch phát triển
└── README.md                    # (file này)
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | ❌ | Đăng nhập → JWT token |
| `GET` | `/api/auth/me` | ✅ | Thông tin user hiện tại |

### Devices (`/api/devices`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/devices` | ✅ | all | Danh sách (filter, paginate) |
| `GET` | `/api/devices/stats` | ✅ | all | Thống kê by status/type |
| `GET` | `/api/devices/:id` | ✅ | all | Chi tiết thiết bị |
| `POST` | `/api/devices` | ✅ | admin | Tạo thiết bị |
| `PUT` | `/api/devices/:id` | ✅ | admin | Cập nhật thiết bị |
| `DELETE` | `/api/devices/:id` | ✅ | admin | Xóa thiết bị |
| `GET` | `/api/devices/:id/data` | ✅ | all | Dữ liệu sensor lịch sử |
| `POST` | `/api/devices/:id/command` | ✅ | admin | Gửi lệnh điều khiển |

### Groups (`/api/groups`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/groups` | ✅ | all | Danh sách nhóm |
| `POST` | `/api/groups` | ✅ | admin | Tạo nhóm |
| `PUT` | `/api/groups/:id` | ✅ | admin | Cập nhật nhóm |
| `DELETE` | `/api/groups/:id` | ✅ | admin | Xóa nhóm |
| `POST` | `/api/groups/:id/devices` | ✅ | admin | Thêm thiết bị vào nhóm |

### Schedules (`/api/schedules`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/schedules` | ✅ | all | Danh sách lịch |
| `GET` | `/api/schedules/:id` | ✅ | all | Chi tiết lịch |
| `POST` | `/api/schedules` | ✅ | admin | Tạo lịch |
| `PUT` | `/api/schedules/:id` | ✅ | admin | Cập nhật lịch |
| `DELETE` | `/api/schedules/:id` | ✅ | admin | Xóa lịch |
| `POST` | `/api/schedules/:id/execute` | ✅ | admin | Thực thi lịch |

### Notifications (`/api/notifications`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/notifications` | ✅ | Danh sách thông báo |
| `PUT` | `/api/notifications/:id/read` | ✅ | Đánh dấu đã đọc |
| `PUT` | `/api/notifications/read-all` | ✅ | Đánh dấu tất cả đã đọc |
| `DELETE` | `/api/notifications/:id` | ✅ | Xóa thông báo |

---

## 🔌 WebSocket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-device` | `deviceId: number` | Tham gia room theo dõi device |
| `leave-device` | `deviceId: number` | Rời room theo dõi device |

### Server → Client
| Event | Room | Description |
|-------|------|-------------|
| `device:update` | `device:{id}` | Cập nhật trạng thái 1 thiết bị |
| `device:data` | `device:{id}` | Dữ liệu sensor mới |
| `devices:status` | broadcast | Cập nhật status toàn cục |
| `device:alert` | broadcast | Cảnh báo thiết bị |

---

## 🦟 MQTT Topics

| Topic | Publisher | Subscriber | Payload |
|-------|----------|------------|---------|
| `iot/devices/{name}/data` | IoT Device | Server | `{ status, data: { temperature, humidity } }` |
| `iot/devices/{name}/command` | Server | IoT Device | `{ command, params, timestamp }` |

### Các lệnh điều khiển hỗ trợ
| Command | Params | Mô tả |
|---------|--------|-------|
| `turn_on` | — | Bật thiết bị |
| `turn_off` | — | Tắt thiết bị |
| `reboot` | — | Khởi động lại |
| `factory_reset` | — | Reset về mặc định |
| `set_brightness` | `{ brightness: 0-100 }` | Điều chỉnh độ sáng (actuator) |
| `set_threshold` | `{ temperature: 16-30 }` | Đặt ngưỡng nhiệt độ (sensor) |
| *Custom* | `{ ... }` | Lệnh tùy chỉnh |

---

## ⚙️ Environment Variables

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iot_management

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRE=7d

# MQTT
MQTT_BROKER=mqtt://localhost:1883
MQTT_TOPIC=iot/devices
MQTT_USERNAME=
MQTT_PASSWORD=

# Server
PORT=5000
NODE_ENV=development

# Default Admin Account
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=123456
ADMIN_NAME=admin
```

---

## 📖 Tài liệu

| Tài liệu | Đường dẫn | Nội dung |
|-----------|-----------|----------|
| Kiến trúc & Flow | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Sơ đồ kiến trúc, ERD, sequence diagrams |
| Tài liệu phát triển | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, conventions, thêm feature, troubleshooting |
| Hướng dẫn sử dụng | [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Hướng dẫn cho end-user |
| ABAC Guide | [docs/ABAC_GUIDE.md](docs/ABAC_GUIDE.md) | Hướng dẫn ABAC Policy Engine |
| Kế hoạch phát triển | [plan.md](plan.md) | Timeline, trạng thái, known issues |

---

## 📊 Tiến độ phát triển

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| Phase 1 | Setup & Core (Auth, CRUD) | ✅ Hoàn thành |
| Phase 2 | Real-time (MQTT, WebSocket, Charts) | ✅ Hoàn thành |
| Phase 3 | Advanced (Remote Control, Schedule, Groups) | 🔧 ~85% |
| Phase 4 | Polish & Deploy (Docker, Tests, UI) | 🔧 ~30% |

> Chi tiết: xem [plan.md](plan.md)

---

## 📄 License

MIT License
