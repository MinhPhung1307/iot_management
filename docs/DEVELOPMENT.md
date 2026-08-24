# 🛠️ Tài liệu Phát triển (Developer Guide)

> **Dự án**: IoT Device Management Platform  
> **Phiên bản**: 1.0  
> **Cập nhật**: 2026-08-24

Tài liệu này dành cho developer tham gia phát triển dự án. Bao gồm hướng dẫn cài đặt môi trường, quy ước code, cách thêm tính năng mới, và xử lý lỗi thường gặp.

---

## Mục lục

1. [Cài đặt môi trường phát triển](#1-cài-đặt-môi-trường-phát-triển)
2. [Cấu trúc dự án chi tiết](#2-cấu-trúc-dự-án-chi-tiết)
3. [Quy ước code (Coding Conventions)](#3-quy-ước-code-coding-conventions)
4. [Hướng dẫn phát triển Backend](#4-hướng-dẫn-phát-triển-backend)
5. [Hướng dẫn phát triển Frontend](#5-hướng-dẫn-phát-triển-frontend)
6. [Làm việc với MQTT](#6-làm-việc-với-mqtt)
7. [Làm việc với WebSocket](#7-làm-việc-với-websocket)
8. [Database & Migration](#8-database--migration)
9. [Docker & Deployment](#9-docker--deployment)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)
11. [Hướng dẫn thêm tính năng mới](#11-hướng-dẫn-thêm-tính-năng-mới)

---

## 1. Cài đặt môi trường phát triển

### 1.1 Yêu cầu phần mềm

| Phần mềm | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | 18+ | Runtime cho cả server và client |
| npm | 9+ | Package manager |
| PostgreSQL | 15+ | Database chính |
| Redis | 7+ | Cache (optional khi dev) |
| Docker | 20+ | Chạy infrastructure services |
| Docker Compose | 2.0+ | Orchestrate Docker containers |
| Git | 2.0+ | Version control |

### 1.2 Setup từ đầu

```bash
# 1. Clone repository
git clone <repo-url>
cd ioT_device_management

# 2. Khởi động infrastructure (PostgreSQL, Redis, Mosquitto)
docker-compose up -d postgres redis mosquitto

# 3. Setup Backend
cd server
cp .env.example .env      # Hoặc tạo file .env từ template bên dưới
npm install
npm run dev                # Chạy tại http://localhost:5000

# 4. Setup Frontend (terminal mới)
cd client
npm install
npm run dev                # Chạy tại http://localhost:3000
```

### 1.3 File `.env` mẫu cho Server

```env
# Database - Thay đổi theo môi trường của bạn
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iot_management

# Redis
REDIS_URL=redis://localhost:6379

# JWT - ĐỔI secret trong production!
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

# Admin account (tự động seed khi server khởi động)
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=123456
ADMIN_NAME=admin
```

### 1.4 Xác nhận cài đặt thành công

| Check | Cách kiểm tra | Kết quả mong đợi |
|-------|---------------|-------------------|
| Server | `curl http://localhost:5000/health` | `{ "status": "OK" }` |
| Client | Mở `http://localhost:3000` | Hiện trang Login |
| DB | Server log | `PostgreSQL connected successfully` |
| MQTT | Server log | `MQTT connected to broker` |
| WebSocket | Đăng nhập vào app | Browser console: `Socket connected` |

---

## 2. Cấu trúc dự án chi tiết

### 2.1 Backend (server/)

```
server/src/
├── index.ts                    # Entry point: khởi tạo Express, kết nối DB, Socket, MQTT
│
├── config/
│   └── database.ts             # Sequelize instance + PostgreSQL connection
│
├── middleware/
│   └── auth.ts                 # authenticate (JWT verify) + authorize (role check)
│
├── models/                     # Sequelize ORM models
│   ├── User.ts                 # User + bcrypt password hashing
│   ├── Device.ts               # Thiết bị IoT
│   ├── DeviceData.ts           # Dữ liệu sensor (time-series)
│   ├── Alert.ts                # Cảnh báo
│   ├── CommandHistory.ts       # Lịch sử lệnh điều khiển
│   ├── DeviceGroup.ts          # Nhóm thiết bị (many-to-many)
│   ├── Notification.ts         # Thông báo người dùng
│   ├── Schedule.ts             # Lịch tự động
│   └── index.ts                # Re-export tất cả models
│
├── controllers/                # Xử lý business logic
│   ├── authController.ts       # register, login, getMe
│   ├── deviceController.ts     # CRUD devices, getStats, getData
│   ├── commandController.ts    # sendCommand (update DB + MQTT + WebSocket)
│   ├── groupController.ts      # CRUD groups, add/remove devices
│   ├── scheduleController.ts   # CRUD schedules, execute
│   └── notificationController.ts # CRUD notifications, mark read
│
├── routes/                     # Express route definitions
│   ├── authRoutes.ts           # /api/auth/*
│   ├── deviceRoutes.ts         # /api/devices/*
│   ├── groupRoutes.ts          # /api/groups/*
│   ├── scheduleRoutes.ts       # /api/schedules/*
│   └── notificationRoutes.ts   # /api/notifications/*
│
├── mqtt/
│   └── mqttClient.ts           # MQTT connect, subscribe, handleMessage, sendCommand
│
├── websocket/
│   └── socket.ts               # Socket.io server: emit events, room management
│
├── types/
│   └── index.ts                # AuthRequest, JwtPayload, DeviceType, etc.
│
├── services/                   # (chưa sử dụng - dành cho business logic phức tạp)
└── utils/                      # (chưa sử dụng - dành cho helper functions)
```

### 2.2 Frontend (client/)

```
client/src/
├── main.tsx                    # React DOM render entry
├── App.tsx                     # Router + AuthProvider + ProtectedRoute
├── index.css                   # Global styles + Tailwind imports
│
├── components/
│   └── Layout.tsx              # Navbar (logo, nav links, user, logout) + <Outlet/>
│
├── hooks/
│   ├── useAuth.tsx             # AuthContext: user, token, login(), logout(), isAuthenticated
│   └── useSocket.ts            # Socket.io: joinDevice, leaveDevice, onDeviceUpdate, onDeviceData
│
├── pages/
│   ├── Login.tsx               # Form đăng nhập
│   ├── Dashboard.tsx           # Stats cards + biểu đồ tổng quan
│   ├── Devices.tsx             # Bảng danh sách + CRUD modal + filter/search/paginate
│   ├── DeviceDetail.tsx        # Chi tiết + biểu đồ real-time + Remote Control
│   ├── Groups.tsx              # Quản lý nhóm + thêm/xóa thiết bị
│   ├── Schedules.tsx           # Quản lý lịch + cron expression
│   └── Notifications.tsx       # Danh sách thông báo + mark read
│
├── services/
│   └── api.ts                  # Axios instance + interceptors + authAPI + deviceAPI
│
├── types/
│   └── index.ts                # User, Device, DeviceData, DeviceStats, Pagination interfaces
│
└── utils/                      # (chưa sử dụng)
```

---

## 3. Quy ước code (Coding Conventions)

### 3.1 TypeScript

| Quy ước | Ví dụ |
|---------|-------|
| Files: camelCase | `deviceController.ts`, `useAuth.tsx` |
| Components: PascalCase | `DeviceDetail.tsx`, `Layout.tsx` |
| Interfaces: PascalCase | `AuthRequest`, `JwtPayload` |
| Variables/Functions: camelCase | `getDevices`, `sendCommand` |
| Constants: UPPER_SNAKE | `MQTT_TOPIC`, `JWT_SECRET` |
| Type unions: string literals | `'sensor' \| 'actuator' \| 'gateway'` |

### 3.2 Cấu trúc Controller

Mỗi controller function tuân theo pattern:

```typescript
export const functionName = async (
  req: AuthRequest,    // hoặc Request nếu không cần auth
  res: Response
): Promise<void> => {
  try {
    // 1. Validate input
    const { field1, field2 } = req.body;

    // 2. Business logic
    const result = await Model.findAll({ ... });

    // 3. Response
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: 'Error description', error });
  }
};
```

### 3.3 Cấu trúc Model (Sequelize)

```typescript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class ModelName extends Model {
  // Khai báo properties với ! (definite assignment)
  public id!: number;
  public field!: string;
  public readonly createdAt!: Date;
}

ModelName.init(
  {
    // Column definitions
  },
  {
    sequelize,
    tableName: 'table_name',
    timestamps: true,
  }
);

// Associations (nếu có)
ModelName.belongsTo(OtherModel, { foreignKey: 'otherModelId', as: 'alias' });

export default ModelName;
```

### 3.4 Cấu trúc React Page

```tsx
const PageName = () => {
  // 1. Hooks (useAuth, useSocket, useState, useEffect)
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Data fetching (useEffect)
  useEffect(() => {
    loadData();
  }, []);

  // 3. Handler functions
  const loadData = async () => { ... };
  const handleSubmit = async () => { ... };

  // 4. Conditional renders
  if (loading) return <div>Loading...</div>;

  // 5. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### 3.5 API Response Format

Mọi API response tuân theo format nhất quán:

```typescript
// Thành công - Single item
{ "device": { ... } }
{ "user": { ... } }
{ "message": "Action successful", "device": { ... } }

// Thành công - List với pagination
{ "devices": [...], "pagination": { total, page, limit, totalPages } }

// Lỗi
{ "message": "Error description" }           // 400, 401, 403, 404
{ "message": "Error description", "error": { ... } }  // 500
```

---

## 4. Hướng dẫn phát triển Backend

### 4.1 NPM Scripts

```bash
cd server

npm run dev     # Chạy dev server (ts-node-dev --respawn --transpile-only)
                # Auto-restart khi file thay đổi

npm run build   # Compile TypeScript → dist/

npm run start   # Chạy production (node dist/index.js)
```

### 4.2 Thêm API Endpoint mới

**Ví dụ**: Thêm endpoint `GET /api/devices/:id/history`

**Bước 1**: Tạo function trong controller

```typescript
// server/src/controllers/deviceController.ts

export const getDeviceHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const commands = await CommandHistory.findAll({
      where: { deviceId: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json({ history: commands });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error });
  }
};
```

**Bước 2**: Thêm route

```typescript
// server/src/routes/deviceRoutes.ts

import { getDeviceHistory } from '../controllers/deviceController';

router.get('/:id/history', getDeviceHistory);
// Thêm authorize('admin') nếu cần phân quyền
```

### 4.3 Thêm Model mới

**Bước 1**: Tạo file model

```typescript
// server/src/models/NewModel.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class NewModel extends Model {
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
}

NewModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    sequelize,
    tableName: 'new_models',
    timestamps: true,
  }
);

export default NewModel;
```

**Bước 2**: Export trong `models/index.ts`

```typescript
import NewModel from './NewModel';
export { NewModel };
```

**Bước 3**: Sequelize sẽ tự động tạo table khi server khởi động (nhờ `sequelize.sync({ alter: true })` trong `index.ts`)

### 4.4 Middleware Pipeline

Request đi qua các middleware theo thứ tự:

```
Request → Helmet → CORS → JSON Parser → authenticate → authorize → Controller
```

**`authenticate`** — Kiểm tra JWT token:
- Lấy token từ header `Authorization: Bearer <token>`
- `jwt.verify()` → decode ra `{ id, email, role }`
- Tìm user trong DB → gán vào `req.user`
- Nếu thất bại → `401 Unauthorized`

**`authorize(...roles)`** — Kiểm tra quyền:
- Kiểm tra `req.user.role` có nằm trong `roles` không
- Nếu không → `403 Insufficient permissions`

### 4.5 Xử lý lỗi trong Controller

```typescript
// ❌ KHÔNG NÊN - throw error không có try/catch
export const getDevice = async (req, res) => {
  const device = await Device.findByPk(req.params.id); // có thể throw
  res.json({ device });
};

// ✅ NÊN - bọc trong try/catch
export const getDevice = async (req, res): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }
    res.json({ device });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching device', error });
  }
};
```

---

## 5. Hướng dẫn phát triển Frontend

### 5.1 NPM Scripts

```bash
cd client

npm run dev       # Vite dev server tại http://localhost:3000
                  # Hot Module Replacement (HMR) - tự reload khi code thay đổi

npm run build     # Build production: tsc → vite build → dist/

npm run preview   # Preview production build
```

### 5.2 Vite Proxy Configuration

File `vite.config.ts` cấu hình proxy để forward API requests:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // Forward tới backend
      changeOrigin: true,
    },
    '/socket.io': {
      target: 'http://localhost:5000',  // Forward WebSocket
      ws: true,
    },
  },
},
```

→ Khi gọi `axios.get('/api/devices')` từ browser `:3000`, Vite tự forward sang `:5000`.

### 5.3 Auth Flow

```
1. User nhập email/password → authAPI.login()
2. Server trả { user, token }
3. localStorage.setItem('token', token)
4. AuthContext: setUser(user), setToken(token)
5. Axios interceptor tự gắn Authorization header cho mọi request sau
6. Nếu nhận 401 → tự xóa token + redirect về /login
```

### 5.4 Thêm trang mới

**Bước 1**: Tạo page component

```tsx
// client/src/pages/NewPage.tsx

const NewPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Page</h1>
      {/* Content */}
    </div>
  );
};

export default NewPage;
```

**Bước 2**: Thêm route trong `App.tsx`

```tsx
import NewPage from './pages/NewPage';

// Trong <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
<Route path="new-page" element={<NewPage />} />
```

**Bước 3**: Thêm navigation link trong `Layout.tsx`

```tsx
<Link to="/new-page" className="...">New Page</Link>
```

### 5.5 Gọi API

```tsx
import { deviceAPI } from '../services/api';

// GET - Lấy danh sách
const response = await deviceAPI.getAll({ page: 1, limit: 10, type: 'sensor' });
const devices = response.data.devices;

// POST - Tạo mới
await deviceAPI.create({ name: 'Sensor A', type: 'sensor', location: 'Room 1' });

// PUT - Cập nhật
await deviceAPI.update(deviceId, { name: 'New Name' });

// DELETE - Xóa
await deviceAPI.delete(deviceId);

// POST - Gửi lệnh
await deviceAPI.sendCommand(deviceId, 'turn_on', {});
```

### 5.6 Thêm API mới

```typescript
// client/src/services/api.ts

export const newFeatureAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ items: Item[] }>('/new-feature', { params }),
  create: (data: Partial<Item>) =>
    api.post<{ item: Item }>('/new-feature', data),
};
```

---

## 6. Làm việc với MQTT

### 6.1 Kiến trúc MQTT

```
IoT Device ──PUBLISH──► Mosquitto Broker ──FORWARD──► Server (mqttClient.ts)
                              ▲                              │
                              │                     handleMessage()
                         SUBSCRIBE                          │
                              │                    ┌────────┴────────┐
                        Server startup             Update DB    Emit WebSocket
```

### 6.2 Topic Structure

```
iot/devices/
├── {device_name}/
│   ├── data        ← IoT device gửi dữ liệu sensor
│   └── command     ← Server gửi lệnh điều khiển
```

### 6.3 Gửi lệnh MQTT đến thiết bị

```typescript
// Trong controller hoặc service
import { mqttClient } from '../mqtt/mqttClient';

// Gửi lệnh
mqttClient.sendCommand('sensor_01', {
  command: 'turn_on',
  params: {},
  timestamp: new Date().toISOString(),
});
// → Publish tới topic: iot/devices/sensor_01/command
```

### 6.4 Xử lý dữ liệu MQTT nhận về

File `mqttClient.ts` tự động xử lý trong `handleMessage()`:

```typescript
// Topic: iot/devices/{deviceName}/data
// Payload: { status: "online", data: { temperature: 25.5, humidity: 60 } }

// Flow xử lý:
// 1. Parse topic → lấy deviceName
// 2. Tìm device trong DB
// 3. Update device.status + device.lastSeen
// 4. Lưu DeviceData (temperature, humidity)
// 5. Emit WebSocket → cập nhật UI real-time
```

### 6.5 Test MQTT bằng command line

```bash
# Giả lập IoT device gửi dữ liệu
mosquitto_pub -h localhost -p 1883 \
  -t "iot/devices/sensor_01/data" \
  -m '{"status":"online","data":{"temperature":25.5,"humidity":60}}'

# Lắng nghe tất cả MQTT messages
mosquitto_sub -h localhost -p 1883 -t "iot/devices/#" -v
```

---

## 7. Làm việc với WebSocket

### 7.1 Server-side (Socket.io)

```typescript
// server/src/websocket/socket.ts

// Emit cập nhật trạng thái device (đến room cụ thể + broadcast)
serverSocket.emitDeviceUpdate(deviceId, {
  id: device.id,
  name: device.name,
  status: 'online',
  lastSeen: new Date(),
});

// Emit dữ liệu sensor mới (đến room cụ thể)
serverSocket.emitDeviceData(deviceId, {
  temperature: 25.5,
  humidity: 60,
});

// Emit cảnh báo (broadcast tất cả)
serverSocket.emitAlert(deviceId, {
  type: 'temperature_high',
  message: 'Temperature exceeded threshold',
});
```

### 7.2 Client-side (useSocket hook)

```tsx
// Trong React component
const { joinDevice, leaveDevice, onDeviceUpdate, onDeviceData, onAlert } = useSocket();

// Tham gia room theo dõi device
useEffect(() => {
  joinDevice(deviceId);
  return () => leaveDevice(deviceId);
}, [deviceId]);

// Lắng nghe cập nhật trạng thái
useEffect(() => {
  const cleanup = onDeviceUpdate((data) => {
    if (data.deviceId === deviceId) {
      setDevice(prev => ({ ...prev, status: data.status }));
    }
  });
  return cleanup;
}, [deviceId]);

// Lắng nghe dữ liệu sensor mới
useEffect(() => {
  const cleanup = onDeviceData((data) => {
    if (data.deviceId === deviceId) {
      setDeviceData(prev => [data, ...prev].slice(0, 100));
    }
  });
  return cleanup;
}, [deviceId]);
```

### 7.3 WebSocket Authentication

Socket.io sử dụng cùng JWT token với REST API:

```typescript
// Client: gửi token khi kết nối
const socket = io(SOCKET_URL, { auth: { token } });

// Server: verify trong middleware
this.io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, JWT_SECRET);
  socket.userId = decoded.id;
  next();
});
```

---

## 8. Database & Migration

### 8.1 Database Connection

Sequelize kết nối qua `DATABASE_URL` trong `.env`:

```
postgresql://user:password@host:5432/database_name
```

### 8.2 Auto-Sync

Server sử dụng `sequelize.sync({ alter: true })` trong `index.ts`:
- Tự động tạo table nếu chưa tồn tại
- Tự động thêm column mới nếu model thay đổi
- **KHÔNG** xóa column hoặc data hiện có

> ⚠️ **Cảnh báo**: Trong production, nên dùng migration thay vì `alter: true`.

### 8.3 Model Associations (Quan hệ)

| Quan hệ | Model A | Model B | Loại |
|---------|---------|---------|------|
| User → CommandHistory | User | CommandHistory | 1:N (sentBy) |
| User → Notification | User | Notification | 1:N (userId) |
| User → Schedule | User | Schedule | 1:N (createdBy) |
| Device → DeviceData | Device | DeviceData | 1:N (deviceId) |
| Device → Alert | Device | Alert | 1:N (deviceId) |
| Device → CommandHistory | Device | CommandHistory | 1:N (deviceId) |
| Device → Schedule | Device | Schedule | 1:N (deviceId) |
| Device ↔ DeviceGroup | Device | DeviceGroup | M:N (DeviceGroupMember) |

### 8.4 Kết nối Database bên ngoài

Dự án hỗ trợ kết nối PostgreSQL ở mọi nơi (local, Docker, cloud):

```env
# Local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iot_management

# Docker
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/iot_management

# Cloud (Neon, Supabase, etc.)
DATABASE_URL=postgresql://user:password@host.cloud.provider/dbname?sslmode=require
```

Sequelize tự động bật SSL khi:
- `NODE_ENV=production` VÀ
- URL không chứa `localhost` hoặc `127.0.0.1`

---

## 9. Docker & Deployment

### 9.1 Docker Compose Services

| Service | Image | Port | Vai trò |
|---------|-------|------|---------|
| `postgres` | postgres:15-alpine | 5432 | Database chính |
| `redis` | redis:7-alpine | 6379 | Cache |
| `mosquitto` | eclipse-mosquitto:2 | 1883, 9001 | MQTT broker |
| `server` | Custom (Dockerfile) | 5000 | Backend API |
| `client` | Custom (Dockerfile) | 3000 (→80) | Frontend + Nginx |

### 9.2 Docker Commands

```bash
# Khởi động tất cả
docker-compose up -d

# Chỉ khởi động infrastructure (dev mode)
docker-compose up -d postgres redis mosquitto

# Xem logs
docker-compose logs -f server
docker-compose logs -f mosquitto

# Restart một service
docker-compose restart server

# Dừng tất cả
docker-compose down

# Dừng + xóa volumes (XÓA DATA!)
docker-compose down -v
```

### 9.3 Build Production

```bash
# Backend
cd server
npm run build          # Output: server/dist/

# Frontend
cd client
npm run build          # Output: client/dist/
```

### 9.4 Nginx Configuration (Production)

File `client/nginx.conf` cấu hình:
- Serve static files từ React build
- Proxy `/api/*` và `/socket.io/*` sang backend `:5000`
- Fallback về `index.html` cho SPA routing

---

## 10. Xử lý lỗi thường gặp

### 10.1 Backend

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `DATABASE_URL is not set` | Thiếu `.env` | Tạo file `server/.env` với `DATABASE_URL` |
| `MQTT connection error` | Mosquitto chưa chạy | `docker-compose up -d mosquitto` |
| `SequelizeConnectionError` | PostgreSQL không kết nối | Kiểm tra `DATABASE_URL`, đảm bảo PostgreSQL đang chạy |
| `Invalid token` (401) | JWT hết hạn hoặc sai secret | Đăng nhập lại, kiểm tra `JWT_SECRET` |
| `Insufficient permissions` (403) | User không phải admin | Đăng nhập bằng tài khoản admin |
| `sendCommand không update status` | Route dùng sai controller | Đảm bảo `deviceRoutes.ts` import `sendCommand` từ `commandController` |

### 10.2 Frontend

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `Network Error` khi gọi API | Backend chưa chạy | `cd server && npm run dev` |
| Redirect liên tục về `/login` | Token hết hạn | Xóa localStorage, đăng nhập lại |
| WebSocket không kết nối | Vite proxy chưa config `/socket.io` | Kiểm tra `vite.config.ts` proxy |
| Biểu đồ không hiện dữ liệu | Không có DeviceData | Gửi dữ liệu MQTT hoặc tạo seed data |
| Remote Control không hiện | User không phải admin | Đăng nhập admin (`isAdmin` check trong DeviceDetail) |

### 10.3 Docker

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| Port đã bị chiếm | Service khác dùng port | `lsof -i :5432` → kill process hoặc đổi port |
| Volume permission denied | Docker volume permissions | `docker-compose down -v` + `docker-compose up -d` |
| Mosquitto config error | File config thiếu | Kiểm tra `mosquitto/config/` có file config |

---

## 11. Hướng dẫn thêm tính năng mới

### 11.1 Checklist thêm feature End-to-End

Khi thêm một tính năng hoàn toàn mới (ví dụ: "Firmware Update"), follow checklist sau:

```
Backend:
  □ 1. Tạo Model       → server/src/models/FirmwareUpdate.ts
  □ 2. Export Model     → server/src/models/index.ts
  □ 3. Tạo Controller   → server/src/controllers/firmwareController.ts
  □ 4. Tạo Routes      → server/src/routes/firmwareRoutes.ts
  □ 5. Register Routes  → server/src/index.ts (app.use('/api/firmware', ...))

Frontend:
  □ 6. Thêm API service → client/src/services/api.ts (firmwareAPI)
  □ 7. Thêm Types       → client/src/types/index.ts (FirmwareUpdate interface)
  □ 8. Tạo Page         → client/src/pages/FirmwareUpdates.tsx
  □ 9. Thêm Route       → client/src/App.tsx
  □ 10. Thêm Nav Link   → client/src/components/Layout.tsx

Test:
  □ 11. Test API bằng curl hoặc Postman
  □ 12. Test UI trên browser
  □ 13. Test phân quyền (admin vs user)
```

### 11.2 Ví dụ: Thêm tính năng "Device Logs"

**Step 1-2: Model**
```typescript
// server/src/models/DeviceLog.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Device from './Device';

export class DeviceLog extends Model {
  public id!: number;
  public deviceId!: number;
  public level!: string;
  public message!: string;
  public readonly createdAt!: Date;
}

DeviceLog.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  deviceId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Device, key: 'id' } },
  level: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [['info', 'warn', 'error']] } },
  message: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, tableName: 'device_logs', timestamps: true, updatedAt: false });

DeviceLog.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
export default DeviceLog;
```

**Step 3: Controller**
```typescript
// server/src/controllers/logController.ts
export const getDeviceLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await DeviceLog.findAll({
      where: { deviceId: req.params.deviceId },
      order: [['createdAt', 'DESC']],
      limit: Number(req.query.limit) || 100,
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error });
  }
};
```

**Step 4-5: Routes + Register**
```typescript
// Thêm trong deviceRoutes.ts
router.get('/:id/logs', getDeviceLogs);
```

**Step 6: API Service**
```typescript
// Thêm trong api.ts → deviceAPI
getLogs: (id: number, params?: Record<string, any>) =>
  api.get(`/devices/${id}/logs`, { params }),
```

---

## Tài liệu liên quan

| Tài liệu | Đường dẫn | Nội dung |
|-----------|-----------|----------|
| Kiến trúc & Flow | [ARCHITECTURE.md](ARCHITECTURE.md) | Sơ đồ Mermaid, ERD, sequence diagrams |
| Hướng dẫn sử dụng | [USER_GUIDE.md](USER_GUIDE.md) | Hướng dẫn cho end-user |
| Kế hoạch phát triển | [../plan.md](../plan.md) | Timeline, tiến độ, known issues |
| README | [../README.md](../README.md) | Tổng quan, Quick Start, API Reference |
