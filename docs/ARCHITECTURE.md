# 📐 Sơ đồ Kiến trúc & Flow thực thi chính

> **Dự án**: IoT Device Management Platform  
> **Phiên bản**: 1.0  
> **Cập nhật**: 2026-08-24

---

## 1. Kiến trúc tổng thể hệ thống

### 1.1 Sơ đồ kiến trúc High-Level

```mermaid
graph TB
    subgraph Client["🖥️ CLIENT (React + Vite)"]
        Browser["Browser :3000"]
        subgraph Pages["Pages"]
            Dashboard["Dashboard"]
            DeviceList["Devices"]
            DeviceDetail["Device Detail"]
            Groups["Groups"]
            Schedules["Schedules"]
            Notifications["Notifications"]
            Login["Login"]
        end
        subgraph ClientServices["Services & Hooks"]
            API["api.ts (Axios)"]
            UseAuth["useAuth Hook"]
            UseSocket["useSocket Hook"]
        end
    end

    subgraph Server["⚙️ SERVER (Express.js :5000)"]
        subgraph Middleware["Middleware"]
            Auth["authenticate"]
            Authorize["authorize"]
            Helmet["Helmet"]
            CORS["CORS"]
        end
        subgraph Routes["Routes"]
            AuthRoutes["/api/auth"]
            DeviceRoutes["/api/devices"]
            GroupRoutes["/api/groups"]
            ScheduleRoutes["/api/schedules"]
            NotifRoutes["/api/notifications"]
        end
        subgraph Controllers["Controllers"]
            AuthCtrl["authController"]
            DeviceCtrl["deviceController"]
            CmdCtrl["commandController"]
            GroupCtrl["groupController"]
            ScheduleCtrl["scheduleController"]
            NotifCtrl["notificationController"]
        end
        SocketIO["Socket.io Server"]
        MQTTClient["MQTT Client"]
    end

    subgraph Infrastructure["🏗️ INFRASTRUCTURE (Docker)"]
        PostgreSQL[("PostgreSQL :5432")]
        Redis[("Redis :6379")]
        Mosquitto["Mosquitto MQTT :1883"]
    end

    subgraph IoTDevices["📡 IoT DEVICES"]
        Sensor["Sensors"]
        Actuator["Actuators"]
        Gateway["Gateways"]
    end

    Browser -->|"HTTP REST API"| Server
    Browser <-->|"WebSocket (Socket.io)"| SocketIO
    API -->|"HTTP /api/*"| Routes
    UseSocket <-->|"ws://"| SocketIO
    
    Routes --> Middleware --> Controllers
    Controllers --> PostgreSQL
    Controllers --> MQTTClient
    MQTTClient <-->|"MQTT Protocol"| Mosquitto
    Mosquitto <-->|"MQTT pub/sub"| IoTDevices
    SocketIO -->|"emit events"| Browser

    style Client fill:#1e293b,stroke:#3b82f6,color:#fff
    style Server fill:#1e293b,stroke:#10b981,color:#fff
    style Infrastructure fill:#1e293b,stroke:#f59e0b,color:#fff
    style IoTDevices fill:#1e293b,stroke:#ef4444,color:#fff
```

### 1.2 Sơ đồ triển khai (Deployment)

```mermaid
graph LR
    subgraph Docker["Docker Compose"]
        subgraph ClientContainer["iot-client :3000"]
            Nginx["Nginx"]
            ReactBuild["React Build"]
        end
        subgraph ServerContainer["iot-server :5000"]
            NodeApp["Node.js App"]
        end
        subgraph DBContainer["postgres :5432"]
            PG["PostgreSQL 15"]
        end
        subgraph CacheContainer["redis :6379"]
            RD["Redis 7"]
        end
        subgraph MQTTContainer["mosquitto :1883/:9001"]
            MQ["Eclipse Mosquitto 2"]
        end
    end

    User["👤 User"] -->|":3000"| Nginx
    Nginx -->|"proxy /api/*"| NodeApp
    NodeApp --> PG
    NodeApp --> RD
    NodeApp -->|"MQTT"| MQ
    MQ -->|"MQTT"| IoT["📡 IoT Devices"]
```

---

## 2. Kiến trúc Backend chi tiết

### 2.1 Layer Architecture

```mermaid
graph TD
    subgraph RequestLayer["🌐 Request Layer"]
        HTTP["HTTP Request"]
        WS["WebSocket Event"]
        MQTT["MQTT Message"]
    end

    subgraph MiddlewareLayer["🔒 Middleware Layer"]
        HelmetMW["Helmet (Security Headers)"]
        CORSMW["CORS"]
        JSONParser["JSON Parser"]
        AuthMW["authenticate (JWT Verify)"]
        AuthzMW["authorize (Role Check)"]
    end

    subgraph RoutingLayer["🗺️ Routing Layer"]
        R1["POST /api/auth/login"]
        R2["GET /api/devices"]
        R3["POST /api/devices/:id/command"]
        R4["GET /api/groups"]
        R5["GET /api/schedules"]
        R6["GET /api/notifications"]
    end

    subgraph ControllerLayer["🎮 Controller Layer"]
        C1["authController"]
        C2["deviceController"]
        C3["commandController"]
        C4["groupController"]
        C5["scheduleController"]
        C6["notificationController"]
    end

    subgraph DataLayer["💾 Data Layer (Sequelize ORM)"]
        M1["User Model"]
        M2["Device Model"]
        M3["DeviceData Model"]
        M4["Alert Model"]
        M5["CommandHistory Model"]
        M6["DeviceGroup Model"]
        M7["Notification Model"]
        M8["Schedule Model"]
    end

    subgraph ExternalLayer["📡 External Communication"]
        MQTTOut["MQTT Client → Mosquitto"]
        SocketOut["Socket.io → Browser"]
    end

    HTTP --> MiddlewareLayer --> RoutingLayer --> ControllerLayer
    ControllerLayer --> DataLayer
    ControllerLayer --> ExternalLayer
    MQTT --> MQTTOut
    WS --> SocketOut
```

### 2.2 Database Schema (ERD)

```mermaid
erDiagram
    USERS {
        int id PK
        varchar email UK
        varchar password
        varchar name
        varchar role "admin | user"
        timestamp createdAt
        timestamp updatedAt
    }

    DEVICES {
        int id PK
        varchar name
        varchar type "sensor | actuator | gateway"
        varchar location
        varchar status "online | offline | warning | error"
        timestamp lastSeen
        jsonb parameters
        timestamp createdAt
        timestamp updatedAt
    }

    DEVICE_DATA {
        int id PK
        int deviceId FK
        timestamp timestamp
        decimal temperature
        decimal humidity
        jsonb data
        timestamp createdAt
    }

    ALERTS {
        int id PK
        int deviceId FK
        varchar type
        text message
        varchar severity "info | warning | critical"
        boolean isResolved
        timestamp createdAt
    }

    COMMAND_HISTORY {
        int id PK
        int deviceId FK
        varchar command
        jsonb params
        varchar status
        int sentBy FK
        timestamp createdAt
    }

    DEVICE_GROUPS {
        int id PK
        varchar name
        text description
        timestamp createdAt
    }

    DEVICE_GROUP_MEMBERS {
        int id PK
        int groupId FK
        int deviceId FK
    }

    NOTIFICATIONS {
        int id PK
        int userId FK
        varchar type
        varchar title
        text message
        boolean isRead
        timestamp createdAt
    }

    SCHEDULES {
        int id PK
        varchar name
        int deviceId FK
        varchar command
        jsonb params
        varchar scheduleType "once | recurring"
        varchar cronExpression
        timestamp executeAt
        boolean isActive
        timestamp lastRun
        int createdBy FK
        timestamp createdAt
    }

    USERS ||--o{ COMMAND_HISTORY : "sentBy"
    USERS ||--o{ NOTIFICATIONS : "has"
    USERS ||--o{ SCHEDULES : "createdBy"
    DEVICES ||--o{ DEVICE_DATA : "has"
    DEVICES ||--o{ ALERTS : "has"
    DEVICES ||--o{ COMMAND_HISTORY : "has"
    DEVICES ||--o{ SCHEDULES : "has"
    DEVICES ||--o{ DEVICE_GROUP_MEMBERS : "belongs to"
    DEVICE_GROUPS ||--o{ DEVICE_GROUP_MEMBERS : "contains"
```

---

## 3. Kiến trúc Frontend chi tiết

### 3.1 Component Tree

```mermaid
graph TD
    App["App.tsx"]
    App --> AuthProvider["AuthProvider (Context)"]
    AuthProvider --> BrowserRouter["BrowserRouter"]
    BrowserRouter --> LoginRoute["/login → Login"]
    BrowserRouter --> ProtectedRoute["ProtectedRoute"]
    ProtectedRoute --> Layout["Layout (Navbar + Sidebar)"]
    Layout --> DashboardPage["/ → Dashboard"]
    Layout --> DevicesPage["/devices → Devices"]
    Layout --> DeviceDetailPage["/devices/:id → DeviceDetail"]
    Layout --> GroupsPage["/groups → Groups"]
    Layout --> NotificationsPage["/notifications → Notifications"]
    Layout --> SchedulesPage["/schedules → Schedules"]

    subgraph Hooks["Custom Hooks"]
        useAuth["useAuth()"]
        useSocket["useSocket()"]
    end

    subgraph Services["Services"]
        authAPI["authAPI"]
        deviceAPI["deviceAPI"]
    end

    AuthProvider -.-> useAuth
    DeviceDetailPage -.-> useSocket
    DashboardPage -.-> useSocket
    DevicesPage -.-> deviceAPI
    DeviceDetailPage -.-> deviceAPI
    LoginRoute -.-> authAPI
```

### 3.2 State Management Flow

```mermaid
graph LR
    subgraph AuthState["Auth State (Context)"]
        User["user: User | null"]
        Token["token: string | null"]
        IsAuth["isAuthenticated: boolean"]
    end

    subgraph LocalStorage["localStorage"]
        LSToken["token"]
    end

    Login["Login Page"] -->|"authAPI.login()"| Server["Server"]
    Server -->|"{ user, token }"| Login
    Login -->|"setToken()"| AuthState
    Login -->|"localStorage.setItem"| LocalStorage
    
    AuthState -->|"useAuth()"| Pages["All Pages"]
    LocalStorage -->|"axios interceptor"| API["API Requests"]
    API -->|"Authorization: Bearer token"| Server
```

---

## 4. Flow thực thi chính

### 4.1 Flow Đăng nhập (Authentication)

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant Browser as 🖥️ Browser (React)
    participant API as 📡 Axios (api.ts)
    participant Server as ⚙️ Express Server
    participant AuthMW as 🔒 Auth Middleware
    participant AuthCtrl as 🎮 authController
    participant DB as 💾 PostgreSQL
    participant JWT as 🔑 JWT

    User->>Browser: Nhập email + password
    Browser->>API: authAPI.login(email, password)
    API->>Server: POST /api/auth/login
    Server->>AuthCtrl: login(req, res)
    AuthCtrl->>DB: User.findOne({ email })
    DB-->>AuthCtrl: user record
    AuthCtrl->>AuthCtrl: user.comparePassword(password)
    
    alt Password đúng
        AuthCtrl->>JWT: jwt.sign({ id, email, role })
        JWT-->>AuthCtrl: token (7 ngày)
        AuthCtrl-->>Server: { user, token }
        Server-->>API: 200 OK
        API-->>Browser: response.data
        Browser->>Browser: localStorage.setItem("token", token)
        Browser->>Browser: setUser(user), setToken(token)
        Browser->>Browser: Navigate → Dashboard
    else Password sai
        AuthCtrl-->>Server: { message: "Invalid credentials" }
        Server-->>API: 401 Unauthorized
        API-->>Browser: Error
        Browser->>User: Hiển thị lỗi
    end
```

### 4.2 Flow Xem danh sách thiết bị

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant Browser as 🖥️ React (Devices.tsx)
    participant API as 📡 Axios
    participant Server as ⚙️ Express
    participant AuthMW as 🔒 authenticate
    participant DeviceCtrl as 🎮 deviceController
    participant DB as 💾 PostgreSQL
    participant Socket as 🔌 Socket.io

    User->>Browser: Navigate to /devices
    Browser->>Browser: useEffect → loadDevices()
    Browser->>API: deviceAPI.getAll({ page, limit, type, status })
    API->>API: Interceptor: thêm Authorization header
    API->>Server: GET /api/devices?page=1&limit=10
    Server->>AuthMW: authenticate(req, res, next)
    AuthMW->>AuthMW: jwt.verify(token)
    AuthMW->>DB: User.findByPk(decoded.id)
    AuthMW->>Server: req.user = user, next()
    Server->>DeviceCtrl: getDevices(req, res)
    DeviceCtrl->>DB: Device.findAndCountAll({ where, limit, offset })
    DB-->>DeviceCtrl: { count, rows }
    DeviceCtrl-->>Browser: { devices[], pagination }
    Browser->>Browser: setDevices(devices)
    Browser->>User: Render bảng danh sách

    Note over Browser,Socket: Song song: WebSocket lắng nghe cập nhật
    Socket-->>Browser: "devices:status" event
    Browser->>Browser: Cập nhật trạng thái real-time
```

### 4.3 Flow Điều khiển thiết bị (Turn On/Off) ⭐

```mermaid
sequenceDiagram
    actor Admin as 👤 Admin
    participant Browser as 🖥️ DeviceDetail.tsx
    participant API as 📡 Axios
    participant Server as ⚙️ Express
    participant AuthMW as 🔒 authenticate + authorize
    participant CmdCtrl as 🎮 commandController
    participant DB as 💾 PostgreSQL
    participant MQTT as 🦟 MQTT Client
    participant Mosquitto as 📡 Mosquitto Broker
    participant IoT as 📟 IoT Device
    participant Socket as 🔌 Socket.io
    participant WS as 🌐 WebSocket Client

    Admin->>Browser: Click nút "Turn On"
    Browser->>Browser: setSendingCommand(true)
    Browser->>API: deviceAPI.sendCommand(4, "turn_on", {})
    API->>Server: POST /api/devices/4/command
    
    Note over Server,AuthMW: Middleware chain
    Server->>AuthMW: authenticate → authorize("admin")
    AuthMW->>AuthMW: Verify JWT + Check role === "admin"
    
    Server->>CmdCtrl: sendCommand(req, res)
    CmdCtrl->>DB: Device.findByPk(4)
    DB-->>CmdCtrl: device { id: 4, status: "offline" }
    
    Note over CmdCtrl,DB: Cập nhật trạng thái trong DB
    CmdCtrl->>DB: device.update({ status: "online", lastSeen: now })
    
    Note over CmdCtrl,Socket: Emit WebSocket event
    CmdCtrl->>Socket: emitDeviceUpdate(4, { status: "online" })
    Socket-->>WS: "devices:status" event
    WS-->>Browser: onDeviceUpdate callback
    Browser->>Browser: setDevice({ ...prev, status: "online" })
    
    Note over CmdCtrl,Mosquitto: Gửi lệnh qua MQTT
    CmdCtrl->>MQTT: sendCommand("device_name", { command: "turn_on" })
    MQTT->>Mosquitto: PUBLISH iot/devices/device_name/command
    Mosquitto->>IoT: Forward MQTT message
    
    Note over CmdCtrl,DB: Lưu lịch sử lệnh
    CmdCtrl->>DB: CommandHistory.create({ command: "turn_on", status: "sent" })
    
    CmdCtrl-->>Browser: { message, device: { status: "online" } }
    Browser->>Browser: setSendingCommand(false)
    Browser->>Browser: Cập nhật UI: badge → "online" (xanh)
    Browser->>Admin: Hiện "✓ Sent" trên nút
```

### 4.4 Flow Nhận dữ liệu Real-time từ IoT Device

```mermaid
sequenceDiagram
    participant IoT as 📟 IoT Device (Sensor)
    participant Mosquitto as 📡 Mosquitto Broker
    participant MQTT as 🦟 MQTT Client (Server)
    participant Handler as 🎮 handleMessage()
    participant DB as 💾 PostgreSQL
    participant Socket as 🔌 Socket.io Server
    participant Browser as 🖥️ DeviceDetail.tsx

    IoT->>Mosquitto: PUBLISH iot/devices/sensor_01/data
    Note right of IoT: { status: "online",<br/>data: { temperature: 25.5,<br/>humidity: 60.2 } }
    
    Mosquitto->>MQTT: Forward message to subscriber
    MQTT->>Handler: handleMessage(topic, payload)
    
    Handler->>Handler: Parse topic: deviceId="sensor_01", type="data"
    Handler->>DB: Device.findOne({ name: "sensor_01" })
    DB-->>Handler: device { id: 1 }
    
    Note over Handler,DB: Cập nhật trạng thái device
    Handler->>DB: device.update({ status: "online", lastSeen: now })
    
    Note over Handler,DB: Lưu dữ liệu sensor
    Handler->>DB: DeviceData.create({ deviceId: 1, temperature: 25.5, humidity: 60.2 })
    
    Note over Handler,Socket: Phát sóng qua WebSocket
    Handler->>Socket: emitDeviceUpdate(1, { status, lastSeen, data })
    Socket->>Socket: io.to("device:1").emit("device:data")
    Socket->>Socket: io.emit("devices:status")
    
    Socket-->>Browser: "device:data" event
    Browser->>Browser: setDeviceData(prev => [newData, ...prev])
    Browser->>Browser: Cập nhật biểu đồ Recharts real-time
    
    Socket-->>Browser: "devices:status" event
    Browser->>Browser: setDevice({ status: "online" })
```

### 4.5 Flow Lên lịch tự động (Schedule)

```mermaid
sequenceDiagram
    actor Admin as 👤 Admin
    participant Browser as 🖥️ Schedules.tsx
    participant API as 📡 Axios
    participant Server as ⚙️ Express
    participant ScheduleCtrl as 🎮 scheduleController
    participant DB as 💾 PostgreSQL
    participant MQTT as 🦟 MQTT Client

    Note over Admin,Browser: Tạo lịch mới
    Admin->>Browser: Tạo schedule { name, deviceId, command, cronExpression }
    Browser->>API: POST /api/schedules
    API->>Server: Request
    Server->>ScheduleCtrl: createSchedule()
    ScheduleCtrl->>DB: Schedule.create({ ... })
    DB-->>ScheduleCtrl: schedule record
    ScheduleCtrl-->>Browser: { schedule }

    Note over Admin,Browser: Thực thi lịch thủ công
    Admin->>Browser: Click "Execute" trên schedule
    Browser->>API: POST /api/schedules/:id/execute
    API->>Server: Request
    Server->>ScheduleCtrl: executeSchedule()
    ScheduleCtrl->>DB: Schedule.findByPk(id)
    ScheduleCtrl->>DB: Device.findByPk(schedule.deviceId)
    ScheduleCtrl->>MQTT: sendCommand(device.name, { command, params })
    ScheduleCtrl->>DB: schedule.update({ lastRun: now })
    ScheduleCtrl-->>Browser: { message: "Schedule executed" }
```

---

## 5. Luồng dữ liệu tổng hợp

### 5.1 Data Flow Overview

```mermaid
flowchart LR
    subgraph Input["📥 Nguồn dữ liệu vào"]
        UserInput["👤 User Input<br/>(Browser)"]
        IoTData["📟 IoT Sensor Data<br/>(MQTT)"]
    end

    subgraph Processing["⚙️ Xử lý"]
        REST["REST API<br/>(Express Routes)"]
        MQTTHandler["MQTT Handler<br/>(handleMessage)"]
        Controllers["Controllers<br/>(Business Logic)"]
    end

    subgraph Storage["💾 Lưu trữ"]
        PG["PostgreSQL<br/>(Persistent)"]
        RD["Redis<br/>(Cache/Session)"]
    end

    subgraph Output["📤 Đầu ra"]
        HTTPResp["HTTP Response<br/>(JSON)"]
        WSEvent["WebSocket Event<br/>(Real-time)"]
        MQTTCmd["MQTT Command<br/>(To Device)"]
    end

    UserInput -->|"HTTP"| REST
    IoTData -->|"MQTT"| MQTTHandler
    REST --> Controllers
    MQTTHandler --> Controllers
    Controllers -->|"Sequelize ORM"| PG
    Controllers -.->|"Cache"| RD
    Controllers --> HTTPResp
    Controllers --> WSEvent
    Controllers --> MQTTCmd

    HTTPResp -->|"JSON"| UserInput
    WSEvent -->|"Socket.io"| UserInput
    MQTTCmd -->|"Mosquitto"| IoTData
```

### 5.2 Giao thức truyền thông

| Kênh | Giao thức | Hướng | Mục đích |
|------|-----------|-------|----------|
| Browser ↔ Server | HTTP REST | Request/Response | CRUD operations, Authentication |
| Browser ↔ Server | WebSocket (Socket.io) | Bidirectional | Real-time updates, Device status |
| Server ↔ Mosquitto | MQTT | Pub/Sub | Send commands, Receive sensor data |
| IoT Device ↔ Mosquitto | MQTT | Pub/Sub | Publish sensor data, Receive commands |

### 5.3 MQTT Topic Structure

```
iot/devices/
├── {device_name}/
│   ├── data        ← IoT device publishes sensor data here
│   └── command     ← Server publishes commands here
└── #               ← Server subscribes to all sub-topics
```

| Topic Pattern | Publisher | Subscriber | Payload |
|---------------|----------|------------|---------|
| `iot/devices/{name}/data` | IoT Device | Server | `{ status, data: { temperature, humidity } }` |
| `iot/devices/{name}/command` | Server | IoT Device | `{ command, params, timestamp }` |

---

## 6. Bảo mật & Middleware Pipeline

### 6.1 Request Processing Pipeline

```mermaid
graph LR
    Request["📨 HTTP Request"] 
    --> Helmet["🛡️ Helmet<br/>(Security Headers)"]
    --> CORS["🌐 CORS<br/>(Cross-Origin)"]
    --> JSONParser["📝 JSON Parser<br/>(body-parser)"]
    --> AuthMW["🔒 authenticate<br/>(JWT Verify)"]
    --> AuthzMW["👮 authorize<br/>(Role Check)"]
    --> Controller["🎮 Controller<br/>(Business Logic)"]
    --> Response["📤 HTTP Response"]

    AuthMW -->|"401"| Reject1["❌ No Token / Invalid"]
    AuthzMW -->|"403"| Reject2["❌ Insufficient Role"]
```

### 6.2 WebSocket Authentication

```mermaid
sequenceDiagram
    participant Client as 🖥️ useSocket Hook
    participant SocketIO as 🔌 Socket.io Server
    participant JWT as 🔑 JWT

    Client->>Client: token = localStorage.getItem("token")
    Client->>SocketIO: io.connect({ auth: { token } })
    SocketIO->>SocketIO: Middleware: socket.handshake.auth.token
    SocketIO->>JWT: jwt.verify(token, JWT_SECRET)
    
    alt Token hợp lệ
        JWT-->>SocketIO: { id, email, role }
        SocketIO->>SocketIO: socket.userId = decoded.id
        SocketIO-->>Client: "connect" event
        Client->>SocketIO: emit("join-device", deviceId)
        SocketIO->>SocketIO: socket.join("device:{deviceId}")
    else Token không hợp lệ
        JWT-->>SocketIO: Error
        SocketIO-->>Client: "connect_error" event
    end
```

---

## 7. Tổng kết API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | - | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | ❌ | - | Đăng nhập, nhận JWT token |
| GET | `/api/auth/me` | ✅ | - | Lấy thông tin user hiện tại |

### Devices (`/api/devices`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/devices` | ✅ | - | Danh sách thiết bị (filter, paginate) |
| GET | `/api/devices/stats` | ✅ | - | Thống kê thiết bị |
| GET | `/api/devices/:id` | ✅ | - | Chi tiết thiết bị |
| POST | `/api/devices` | ✅ | admin | Tạo thiết bị mới |
| PUT | `/api/devices/:id` | ✅ | admin | Cập nhật thiết bị |
| DELETE | `/api/devices/:id` | ✅ | admin | Xóa thiết bị |
| GET | `/api/devices/:id/data` | ✅ | - | Dữ liệu lịch sử sensor |
| POST | `/api/devices/:id/command` | ✅ | admin | Gửi lệnh điều khiển |

### Groups (`/api/groups`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/groups` | ✅ | - | Danh sách nhóm thiết bị |
| POST | `/api/groups` | ✅ | admin | Tạo nhóm mới |
| PUT | `/api/groups/:id` | ✅ | admin | Cập nhật nhóm |
| DELETE | `/api/groups/:id` | ✅ | admin | Xóa nhóm |
| POST | `/api/groups/:id/devices` | ✅ | admin | Thêm thiết bị vào nhóm |

### Schedules (`/api/schedules`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/schedules` | ✅ | - | Danh sách lịch |
| GET | `/api/schedules/:id` | ✅ | - | Chi tiết lịch |
| POST | `/api/schedules` | ✅ | admin | Tạo lịch mới |
| PUT | `/api/schedules/:id` | ✅ | admin | Cập nhật lịch |
| DELETE | `/api/schedules/:id` | ✅ | admin | Xóa lịch |
| POST | `/api/schedules/:id/execute` | ✅ | admin | Thực thi lịch |

### Notifications (`/api/notifications`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/notifications` | ✅ | - | Danh sách thông báo |
| PUT | `/api/notifications/:id/read` | ✅ | - | Đánh dấu đã đọc |
| PUT | `/api/notifications/read-all` | ✅ | - | Đánh dấu tất cả đã đọc |

### WebSocket Events
| Event | Direction | Room | Description |
|-------|-----------|------|-------------|
| `join-device` | Client → Server | - | Tham gia room theo dõi device |
| `leave-device` | Client → Server | - | Rời room theo dõi device |
| `device:data` | Server → Client | `device:{id}` | Dữ liệu sensor real-time |
| `device:update` | Server → Client | `device:{id}` | Cập nhật trạng thái device |
| `devices:status` | Server → All | broadcast | Cập nhật status toàn cục |
| `device:alert` | Server → All | broadcast | Cảnh báo thiết bị |
