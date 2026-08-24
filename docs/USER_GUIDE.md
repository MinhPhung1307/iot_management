# 📖 Hướng dẫn sử dụng IoT Device Management Platform

> **Phiên bản**: 1.0  
> **Cập nhật**: 2026-08-24  
> **Đối tượng**: End-user (Admin & User)

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Yêu cầu & Cài đặt](#2-yêu-cầu--cài-đặt)
3. [Đăng nhập & Tài khoản](#3-đăng-nhập--tài-khoản)
4. [Dashboard — Tổng quan](#4-dashboard--tổng-quan)
5. [Quản lý thiết bị](#5-quản-lý-thiết-bị)
6. [Chi tiết & Điều khiển thiết bị](#6-chi-tiết--điều-khiển-thiết-bị)
7. [Nhóm thiết bị](#7-nhóm-thiết-bị)
8. [Lên lịch tự động](#8-lên-lịch-tự-động)
9. [Thông báo](#9-thông-báo)
10. [Phân quyền Admin vs User](#10-phân-quyền-admin-vs-user)
11. [Tích hợp MQTT (IoT Devices)](#11-tích-hợp-mqtt-iot-devices)
12. [Câu hỏi thường gặp (FAQ)](#12-câu-hỏi-thường-gặp-faq)
13. [Xử lý sự cố](#13-xử-lý-sự-cố)

---

## 1. Giới thiệu

IoT Device Management Platform là nền tảng quản lý thiết bị IoT toàn diện, cho phép bạn:

| Tính năng | Mô tả |
|-----------|-------|
| 📊 **Giám sát real-time** | Theo dõi trạng thái online/offline của tất cả thiết bị |
| 🎮 **Điều khiển từ xa** | Bật/tắt, khởi động lại, điều chỉnh thông số thiết bị |
| 📈 **Biểu đồ trực quan** | Xem dữ liệu nhiệt độ, độ ẩm theo thời gian thực |
| ⏰ **Lên lịch tự động** | Đặt lịch bật/tắt thiết bị theo cron expression |
| 📂 **Phân nhóm** | Tổ chức thiết bị theo khu vực, phòng, tầng |
| 🔔 **Thông báo** | Nhận cảnh báo khi thiết bị gặp sự cố |

### Các loại thiết bị hỗ trợ

| Loại | Ký hiệu | Mô tả | Ví dụ |
|------|---------|-------|-------|
| **Sensor** | `sensor` | Thiết bị đo lường | Cảm biến nhiệt độ, độ ẩm, ánh sáng |
| **Actuator** | `actuator` | Thiết bị điều khiển | Đèn LED, quạt, relay, motor |
| **Gateway** | `gateway` | Cổng kết nối | Router IoT, hub trung tâm |

### Trạng thái thiết bị

| Trạng thái | Màu | Ý nghĩa |
|------------|-----|---------|
| 🟢 **online** | Xanh lá | Đang hoạt động bình thường |
| ⚪ **offline** | Xám | Mất kết nối hoặc đã tắt |
| 🟡 **warning** | Vàng | Có cảnh báo (ví dụ: nhiệt độ cao) |
| 🔴 **error** | Đỏ | Đang gặp lỗi nghiêm trọng |

---

## 2. Yêu cầu & Cài đặt

### 2.1 Cách 1: Docker (Khuyến nghị)

```bash
# Clone dự án
git clone <repository-url>
cd ioT_device_management

# Khởi động tất cả services
docker-compose up -d

# Kiểm tra trạng thái
docker-compose ps
```

### 2.2 Cách 2: Chạy Local

```bash
# Khởi động infrastructure
docker-compose up -d postgres redis mosquitto

# Terminal 1: Backend
cd server
npm install
npm run dev          # → http://localhost:5000

# Terminal 2: Frontend
cd client
npm install
npm run dev          # → http://localhost:3000
```

### 2.3 Truy cập hệ thống

| Dịch vụ | URL |
|---------|-----|
| 🖥️ Giao diện web | http://localhost:3000 |
| ⚙️ API Backend | http://localhost:5000 |
| 🔄 Health Check | http://localhost:5000/health |

---

## 3. Đăng nhập & Tài khoản

### 3.1 Tài khoản mặc định

Hệ thống tự động tạo tài khoản admin khi khởi động:

| Thông tin | Giá trị |
|-----------|---------|
| **Email** | `admin@gmail.com` |
| **Mật khẩu** | `123456` |
| **Vai trò** | Admin (toàn quyền) |

### 3.2 Cách đăng nhập

1. Mở trình duyệt → truy cập **http://localhost:3000**
2. Hệ thống tự động chuyển đến trang **Login**
3. Nhập **Email** và **Password**
4. Nhấn nút **Sign In**
5. Nếu thành công → chuyển đến **Dashboard**

> ⚠️ **Lưu ý**: Nếu nhập sai email/password, trang sẽ hiển thị lỗi "Invalid credentials".

### 3.3 Đăng ký tài khoản mới

Hiện tại chỉ có thể đăng ký qua API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Tên người dùng"
  }'
```

> Tài khoản mới mặc định có vai trò **user** (không có quyền admin).

### 3.4 Đăng xuất

- Nhấn nút **Logout** ở góc phải trên cùng thanh navigation
- Hệ thống xóa token và chuyển về trang Login

### 3.5 Phiên đăng nhập

- Token JWT có hiệu lực **7 ngày**
- Sau 7 ngày, bạn cần đăng nhập lại
- Nếu bị chuyển về trang Login bất ngờ → token đã hết hạn

---

## 4. Dashboard — Tổng quan

Đây là trang mặc định sau khi đăng nhập. Truy cập bằng cách nhấn **Dashboard** trên thanh navigation hoặc logo **IoT Manager**.

### 4.1 Thành phần trên Dashboard

#### Trạng thái kết nối (góc phải)
- 🟢 **Connected** — WebSocket đang kết nối, dữ liệu cập nhật real-time
- 🔴 **Disconnected** — Mất kết nối WebSocket, cần reload trang

#### 5 thẻ thống kê (hàng đầu)
| Thẻ | Mô tả |
|-----|-------|
| **Total Devices** | Tổng số thiết bị trong hệ thống |
| **Online** (xanh) | Số thiết bị đang hoạt động |
| **Offline** (xám) | Số thiết bị mất kết nối |
| **Warning** (vàng) | Số thiết bị có cảnh báo |
| **Error** (đỏ) | Số thiết bị đang lỗi |

#### Biểu đồ (hàng giữa)

| Biểu đồ | Loại | Mô tả |
|---------|------|-------|
| **Device Status** | Pie Chart | Tỷ lệ phần trăm từng trạng thái |
| **Devices by Type** | Bar Chart | Số lượng thiết bị theo loại (sensor/actuator/gateway) |

#### Bảng Recent Devices (cuối trang)
- Hiển thị **10 thiết bị mới nhất**
- Cột: Name, Type, Location, Status, Last Seen
- Nhấn **tên thiết bị** → đến trang chi tiết
- Nhấn **View all** → đến trang danh sách đầy đủ

### 4.2 Cập nhật real-time

Dashboard tự động cập nhật khi:
- Thiết bị thay đổi trạng thái (online ↔ offline)
- Nhận được dữ liệu mới từ IoT device qua MQTT
- Admin gửi lệnh điều khiển (turn on/off)

> Bạn không cần refresh trang — dữ liệu cập nhật tức thì nhờ WebSocket.

---

## 5. Quản lý thiết bị

Truy cập: Nhấn **Devices** trên thanh navigation.

### 5.1 Xem danh sách thiết bị

Trang hiển thị bảng danh sách với các cột:
| Cột | Mô tả |
|-----|-------|
| **Name** | Tên thiết bị (nhấn để xem chi tiết) |
| **Type** | Loại: sensor / actuator / gateway |
| **Location** | Vị trí lắp đặt |
| **Status** | Trạng thái hiện tại (badge màu) |
| **Last Seen** | Thời điểm hoạt động gần nhất |
| **Actions** | Nút Edit ✏️ / Delete 🗑️ (chỉ Admin) |

### 5.2 Tìm kiếm và lọc

| Bộ lọc | Cách dùng |
|--------|-----------|
| **🔍 Search** | Gõ tên thiết bị → danh sách tự động lọc |
| **Type** | Chọn dropdown: All Types / Sensor / Actuator / Gateway |
| **Status** | Chọn dropdown: All Status / Online / Offline / Warning / Error |

> Các bộ lọc có thể kết hợp. Ví dụ: tìm "sensor" có status "online".

### 5.3 Phân trang

- Mỗi trang hiển thị **10 thiết bị**
- Dùng nút **Previous** / **Next** để chuyển trang
- Hiển thị thông tin: "Showing page X of Y"

### 5.4 Thêm thiết bị mới (Chỉ Admin)

1. Nhấn nút **+ Add Device** (góc phải trên)
2. Điền thông tin trong modal:

| Trường | Bắt buộc | Mô tả |
|--------|----------|-------|
| **Name** | ✅ | Tên thiết bị (duy nhất, dùng để nhận dạng MQTT) |
| **Type** | ✅ | Chọn: Sensor / Actuator / Gateway |
| **Location** | ❌ | Vị trí lắp đặt (ví dụ: "Tầng 2 - Phòng 201") |
| **Parameters** | ❌ | Thông số kỹ thuật dạng JSON |

3. Nhấn **Create** để lưu

**Ví dụ Parameters (JSON)**:
```json
{
  "unit": "°C",
  "min": 0,
  "max": 100,
  "threshold": 35
}
```

### 5.5 Sửa thiết bị (Chỉ Admin)

1. Nhấn nút **Edit** (✏️) trên hàng thiết bị cần sửa
2. Chỉnh sửa thông tin trong modal
3. Nhấn **Update** để lưu

### 5.6 Xóa thiết bị (Chỉ Admin)

1. Nhấn nút **Delete** (🗑️) trên hàng thiết bị
2. Modal xác nhận hiện lên: "Are you sure you want to delete this device?"
3. Nhấn **Delete** để xác nhận xóa

> ⚠️ **Cảnh báo**: Xóa thiết bị sẽ **xóa toàn bộ** dữ liệu sensor, lịch sử lệnh, và lịch trình liên quan (CASCADE delete).

---

## 6. Chi tiết & Điều khiển thiết bị

Truy cập: Nhấn vào **tên thiết bị** trong danh sách hoặc Dashboard.

### 6.1 Thông tin cơ bản (phía trên)

| Phần | Mô tả |
|------|-------|
| **Tên thiết bị** | Hiển thị lớn phía trên trái |
| **Status badge** | Badge màu ở phía trên phải (online/offline/warning/error) |
| **Type** | Loại thiết bị |
| **Location** | Vị trí lắp đặt |
| **Last Seen** | Thời điểm hoạt động cuối (hoặc "Never" nếu chưa bao giờ) |

### 6.2 Parameters

Hiển thị thông số kỹ thuật của thiết bị dưới dạng JSON. Ví dụ:
```json
{
  "max": 100,
  "min": 0,
  "unit": "°C"
}
```

### 6.3 Biểu đồ Real-time Data

- **Biểu đồ đường** hiển thị 2 chỉ số:
  - 🔴 **Temperature (°C)** — trục Y bên trái
  - 🔵 **Humidity (%)** — trục Y bên phải
- Hiển thị tối đa **50 điểm dữ liệu** gần nhất
- Trục X: thời gian
- **Hover** vào biểu đồ để xem giá trị chính xác (tooltip)
- Dữ liệu tự động cập nhật khi nhận data mới qua WebSocket

> Nếu hiện "No data available" → thiết bị chưa gửi dữ liệu nào.

### 6.4 Remote Control — Điều khiển từ xa (Chỉ Admin)

> Phần này **chỉ hiện khi đăng nhập bằng tài khoản Admin**.

#### Nút điều khiển nhanh

| Nút | Màu | Chức năng | Mô tả |
|-----|-----|-----------|-------|
| 💡 **Turn On** | 🟢 Xanh lá | `turn_on` | Bật thiết bị → status chuyển "online" |
| 🌙 **Turn Off** | ⬜ Xám | `turn_off` | Tắt thiết bị → status chuyển "offline" |
| 🔄 **Reboot** | 🟡 Vàng | `reboot` | Khởi động lại thiết bị |
| 🗑️ **Factory Reset** | 🔴 Đỏ | `factory_reset` | Reset thiết bị về mặc định |

**Cách sử dụng:**
1. Nhấn vào nút lệnh mong muốn
2. Nút sẽ bị disable trong lúc gửi (chống nhấn đúp)
3. Khi thành công → hiện **"✓ Sent"** dưới nút (tự ẩn sau 2 giây)
4. Status badge phía trên tự cập nhật
5. Nếu thất bại → hiện alert "Failed to send command"

#### Điều khiển Brightness (Chỉ thiết bị Actuator)

Xuất hiện thêm khi thiết bị có `type = "actuator"`:

1. Kéo **thanh trượt** để chọn độ sáng (0% - 100%)
2. Giá trị hiện bên phải thanh trượt
3. Nhấn **Apply Brightness** để gửi lệnh
4. Hoặc nhấn nút **Set Brightness** (tím) ở hàng nút nhanh

#### Điều khiển Temperature Threshold (Chỉ thiết bị Sensor)

Xuất hiện thêm khi thiết bị có `type = "sensor"`:

1. Kéo **thanh trượt** để chọn ngưỡng nhiệt độ (16°C - 30°C)
2. Nhấn **Apply Threshold** để gửi lệnh `set_threshold`

#### Gửi lệnh tùy chỉnh (Custom Command)

1. Nhấn **"+ Show Custom Command"** để mở form
2. Điền:
   - **Command**: Tên lệnh (ví dụ: `set_color`, `calibrate`)
   - **Params (JSON)**: Tham số dạng JSON (ví dụ: `{"color": "#FF5733"}`)
3. Nhấn **Send Custom**

### 6.5 Quay lại danh sách

Nhấn **"← Back to Devices"** ở phía trên trái.

---

## 7. Nhóm thiết bị

Truy cập: Nhấn **Groups** trên thanh navigation.

### 7.1 Mục đích

Nhóm thiết bị giúp bạn:
- Tổ chức thiết bị theo **khu vực** (Tầng 1, Tầng 2, Phòng Server...)
- Tổ chức theo **mục đích** (Sensors lầu 1, Đèn văn phòng...)
- Quản lý và điều khiển hàng loạt

### 7.2 Xem danh sách nhóm

Mỗi nhóm hiển thị:
| Thông tin | Mô tả |
|-----------|-------|
| **Tên nhóm** | Tên duy nhất |
| **Mô tả** | Ghi chú về nhóm |
| **Số thiết bị** | Số lượng thiết bị trong nhóm |
| **Danh sách thiết bị** | Tên từng thiết bị thuộc nhóm |

### 7.3 Tạo nhóm mới (Chỉ Admin)

1. Nhấn nút **+ Add Group**
2. Điền thông tin:
   - **Name**: Tên nhóm (bắt buộc, duy nhất)
   - **Description**: Mô tả (tùy chọn)
3. Nhấn **Create**

### 7.4 Thêm thiết bị vào nhóm (Chỉ Admin)

1. Nhấn nút **Add Devices** trên nhóm cần thêm
2. Chọn thiết bị từ danh sách
3. Xác nhận thêm

### 7.5 Sửa / Xóa nhóm (Chỉ Admin)

- **Edit**: Sửa tên, mô tả → nhấn **Update**
- **Delete**: Xóa nhóm (thiết bị không bị xóa, chỉ rời nhóm)

---

## 8. Lên lịch tự động

Truy cập: Nhấn **Schedules** trên thanh navigation.

### 8.1 Mục đích

Lên lịch cho phép bạn:
- Tự động **bật đèn lúc 7h sáng** mỗi ngày
- Tự động **tắt hệ thống lúc 22h** hàng đêm
- **Đọc sensor** mỗi 15 phút
- Thực hiện lệnh **một lần** vào thời điểm cụ thể

### 8.2 Xem danh sách lịch

Mỗi lịch hiển thị:
| Thông tin | Mô tả |
|-----------|-------|
| **Name** | Tên lịch trình |
| **Device** | Thiết bị áp dụng |
| **Command** | Lệnh sẽ thực thi |
| **Schedule** | Cron expression hoặc thời gian cụ thể |
| **Status** | Active ✅ / Inactive ❌ |
| **Last Run** | Lần chạy gần nhất |

### 8.3 Tạo lịch trình mới (Chỉ Admin)

1. Nhấn **+ Add Schedule**
2. Điền thông tin:

| Trường | Bắt buộc | Mô tả |
|--------|----------|-------|
| **Name** | ✅ | Tên mô tả (ví dụ: "Bật đèn sáng") |
| **Device** | ✅ | Chọn thiết bị từ dropdown |
| **Command** | ✅ | Lệnh gửi (turn_on, turn_off, set_brightness...) |
| **Params** | ❌ | Tham số JSON (ví dụ: `{"brightness": 80}`) |
| **Cron Expression** | ❌* | Biểu thức lặp lại |
| **Scheduled Time** | ❌* | Thời gian chạy 1 lần |

> (*) Cần điền ít nhất 1 trong 2: Cron Expression HOẶC Scheduled Time.

3. Nhấn **Create**

### 8.4 Cú pháp Cron Expression

Format: `phút giờ ngày tháng thứ`

```
┌──────── phút (0-59)
│ ┌────── giờ (0-23)
│ │ ┌──── ngày trong tháng (1-31)
│ │ │ ┌── tháng (1-12)
│ │ │ │ ┌ thứ trong tuần (0-7, 0 và 7 = Chủ nhật)
│ │ │ │ │
* * * * *
```

**Ví dụ thường dùng:**

| Cron Expression | Mô tả | Ví dụ sử dụng |
|----------------|-------|---------------|
| `0 7 * * *` | Mỗi ngày lúc 7:00 sáng | Bật đèn buổi sáng |
| `0 22 * * *` | Mỗi ngày lúc 22:00 | Tắt hệ thống ban đêm |
| `0 7,19 * * *` | 7:00 sáng và 19:00 chiều | Bật/tắt đèn theo ca |
| `*/15 * * * *` | Mỗi 15 phút | Đọc dữ liệu sensor |
| `*/5 * * * *` | Mỗi 5 phút | Kiểm tra trạng thái |
| `0 0 * * 0` | Mỗi Chủ nhật lúc 0:00 | Bảo trì hàng tuần |
| `0 8 * * 1-5` | 8h sáng, Thứ 2 → Thứ 6 | Giờ làm việc |
| `30 6 1 * *` | 6:30 sáng ngày 1 mỗi tháng | Báo cáo hàng tháng |

### 8.5 Chạy lịch ngay lập tức (Chỉ Admin)

Nhấn nút **Execute** trên lịch trình → lệnh được gửi ngay đến thiết bị mà không cần chờ đến thời gian đã lên lịch.

### 8.6 Bật / Tắt lịch trình

- **Active** ✅: Lịch đang hoạt động, sẽ tự chạy theo cron
- **Inactive** ❌: Lịch tạm dừng, không tự chạy

Sửa trạng thái bằng cách **Edit** → thay đổi `isActive`.

---

## 9. Thông báo

Truy cập: Nhấn **Notifications** trên thanh navigation.

### 9.1 Xem thông báo

Danh sách thông báo hiển thị theo thứ tự **mới nhất trước**, bao gồm:
| Thông tin | Mô tả |
|-----------|-------|
| **Tiêu đề** | Tên thông báo |
| **Nội dung** | Chi tiết thông báo |
| **Loại** | Phân loại (info, warning, alert...) |
| **Thời gian** | Khi nào thông báo được tạo |
| **Trạng thái** | Đã đọc ✅ / Chưa đọc ⬜ |

### 9.2 Đánh dấu đã đọc

- **Đọc 1 thông báo**: Nhấn nút **Mark as read** trên thông báo cụ thể
- **Đọc tất cả**: Nhấn nút **Mark All Read** ở đầu trang

### 9.3 Xóa thông báo

Nhấn nút **Delete** (🗑️) trên thông báo cần xóa.

---

## 10. Phân quyền Admin vs User

### 10.1 Bảng so sánh quyền

| Chức năng | Admin | User |
|-----------|-------|------|
| Xem Dashboard | ✅ | ✅ |
| Xem danh sách thiết bị | ✅ | ✅ |
| Xem chi tiết thiết bị | ✅ | ✅ |
| Xem biểu đồ real-time | ✅ | ✅ |
| **Thêm** thiết bị | ✅ | ❌ |
| **Sửa** thiết bị | ✅ | ❌ |
| **Xóa** thiết bị | ✅ | ❌ |
| **Điều khiển từ xa** (Turn On/Off) | ✅ | ❌ |
| **Gửi lệnh** tùy chỉnh | ✅ | ❌ |
| Xem nhóm thiết bị | ✅ | ✅ |
| **Tạo/Sửa/Xóa** nhóm | ✅ | ❌ |
| Xem lịch trình | ✅ | ✅ |
| **Tạo/Sửa/Xóa** lịch trình | ✅ | ❌ |
| **Thực thi** lịch trình | ✅ | ❌ |
| Xem thông báo | ✅ | ✅ |
| Đánh dấu đã đọc | ✅ | ✅ |

### 10.2 Cách nhận biết vai trò

- Tên user hiển thị ở **góc phải thanh navigation**
- Nếu là Admin → trang Device Detail hiển thị phần **Remote Control**
- Nếu là User → phần Remote Control bị ẩn
- Nếu là Admin → trang Devices hiển thị nút **+ Add Device**, **Edit**, **Delete**
- Nếu là User → các nút này bị ẩn

---

## 11. Tích hợp MQTT (IoT Devices)

> Phần này dành cho developer/kỹ thuật viên cần kết nối thiết bị IoT vào hệ thống.

### 11.1 Cấu hình MQTT

| Thông số | Giá trị mặc định |
|----------|------------------|
| **Broker** | `mqtt://localhost:1883` |
| **Topic gốc** | `iot/devices` |
| **QoS** | 0 |
| **Auth** | Không bắt buộc (configurable) |

### 11.2 Gửi dữ liệu sensor từ thiết bị

**Topic**: `iot/devices/{tên_thiết_bị}/data`

**Payload** (JSON):
```json
{
  "status": "online",
  "data": {
    "temperature": 25.5,
    "humidity": 60.2
  }
}
```

**Test bằng mosquitto CLI:**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "iot/devices/Temperature Sensor A1/data" \
  -m '{"status":"online","data":{"temperature":25.5,"humidity":60.2}}'
```

> **Quan trọng**: `{tên_thiết_bị}` phải khớp chính xác với trường **Name** của device trong hệ thống.

### 11.3 Nhận lệnh điều khiển trên thiết bị

**Topic**: `iot/devices/{tên_thiết_bị}/command`

**Subscribe để nhận lệnh:**
```bash
mosquitto_sub -h localhost -p 1883 \
  -t "iot/devices/Temperature Sensor A1/command"
```

**Payload lệnh nhận được** (JSON):
```json
{
  "command": "turn_on",
  "params": {},
  "timestamp": "2026-08-24T09:30:00.000Z"
}
```

### 11.4 Danh sách lệnh hệ thống gửi

| Command | Params | Khi nào gửi |
|---------|--------|-------------|
| `turn_on` | `{}` | Admin nhấn Turn On |
| `turn_off` | `{}` | Admin nhấn Turn Off |
| `reboot` | `{}` | Admin nhấn Reboot |
| `factory_reset` | `{}` | Admin nhấn Factory Reset |
| `set_brightness` | `{ "brightness": 0-100 }` | Admin điều chỉnh độ sáng |
| `set_threshold` | `{ "temperature": 16-30 }` | Admin đặt ngưỡng nhiệt độ |
| *Custom* | `{ ... }` | Admin gửi lệnh tùy chỉnh |

### 11.5 Tích hợp bằng Python

```python
import paho.mqtt.client as mqtt
import json
import time
import random

DEVICE_NAME = "Temperature Sensor A1"
BROKER = "localhost"
PORT = 1883

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT broker (rc={rc})")
    # Subscribe nhận lệnh
    client.subscribe(f"iot/devices/{DEVICE_NAME}/command")

def on_message(client, userdata, msg):
    """Xử lý lệnh nhận từ server"""
    command = json.loads(msg.payload)
    print(f"Received command: {command}")
    
    if command["command"] == "turn_on":
        print("→ Turning device ON")
    elif command["command"] == "turn_off":
        print("→ Turning device OFF")
    elif command["command"] == "reboot":
        print("→ Rebooting device...")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER, PORT, 60)

# Chạy trong thread riêng để nhận lệnh
client.loop_start()

# Gửi dữ liệu sensor mỗi 10 giây
while True:
    payload = {
        "status": "online",
        "data": {
            "temperature": round(random.uniform(20, 35), 1),
            "humidity": round(random.uniform(40, 80), 1)
        }
    }
    client.publish(
        f"iot/devices/{DEVICE_NAME}/data",
        json.dumps(payload)
    )
    print(f"Sent: {payload['data']}")
    time.sleep(10)
```

### 11.6 Tích hợp bằng Node.js

```javascript
const mqtt = require('mqtt');

const DEVICE_NAME = 'Temperature Sensor A1';
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(`iot/devices/${DEVICE_NAME}/command`);
  
  // Gửi dữ liệu sensor mỗi 10 giây
  setInterval(() => {
    const payload = {
      status: 'online',
      data: {
        temperature: (Math.random() * 15 + 20).toFixed(1),
        humidity: (Math.random() * 40 + 40).toFixed(1),
      },
    };
    client.publish(
      `iot/devices/${DEVICE_NAME}/data`,
      JSON.stringify(payload)
    );
    console.log('Sent:', payload.data);
  }, 10000);
});

client.on('message', (topic, message) => {
  const command = JSON.parse(message.toString());
  console.log('Received command:', command);
  
  switch (command.command) {
    case 'turn_on':  console.log('→ Device ON');  break;
    case 'turn_off': console.log('→ Device OFF'); break;
    case 'reboot':   console.log('→ Rebooting'); break;
  }
});
```

---

## 12. Câu hỏi thường gặp (FAQ)

### Q: Tôi không thấy nút "Turn On/Off" trong trang chi tiết thiết bị?
**A**: Phần Remote Control chỉ hiện khi đăng nhập bằng tài khoản **Admin**. Tài khoản role `user` không có quyền điều khiển.

### Q: Biểu đồ hiện "No data available"?
**A**: Thiết bị chưa gửi dữ liệu nào. Bạn cần:
1. Có thiết bị IoT thực gửi data qua MQTT, hoặc
2. Dùng script Python/Node.js ở phần 11 để giả lập

### Q: Sau khi nhấn Turn On, trạng thái không đổi?
**A**: Kiểm tra:
1. Server backend có đang chạy không
2. Mở DevTools → Console để xem lỗi
3. Kiểm tra server log có thông báo lỗi

### Q: Làm sao đổi mật khẩu?
**A**: Hiện tại chưa có giao diện đổi mật khẩu. Bạn có thể đổi trực tiếp trong database.

### Q: Thiết bị hiện "offline" nhưng thực tế đang hoạt động?
**A**: Thiết bị cần gửi dữ liệu qua MQTT để server cập nhật status. Kiểm tra:
1. MQTT broker (Mosquitto) có đang chạy không
2. Thiết bị có đang publish đúng topic không
3. Tên thiết bị trong MQTT topic có khớp với Name trong hệ thống không

### Q: Làm sao tạo tài khoản admin mới?
**A**: Tạo user qua API register (mặc định role `user`), sau đó cập nhật role trong database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'new_admin@example.com';
```

### Q: Tôi có thể dùng database trên cloud không?
**A**: Có. Thay đổi `DATABASE_URL` trong file `server/.env` thành connection string của cloud database (Neon, Supabase, AWS RDS...).

### Q: Dữ liệu sensor lưu bao lâu?
**A**: Hiện tại lưu vĩnh viễn. Biểu đồ chi tiết chỉ hiển thị 50 điểm gần nhất, nhưng tất cả dữ liệu vẫn lưu trong database.

---

## 13. Xử lý sự cố

### 13.1 Không thể đăng nhập

| Triệu chứng | Nguyên nhân | Giải pháp |
|-------------|-------------|-----------|
| "Invalid credentials" | Sai email/password | Kiểm tra lại thông tin đăng nhập |
| Trang trắng | Backend chưa chạy | Khởi động server: `cd server && npm run dev` |
| "Network Error" | Không kết nối được backend | Kiểm tra server đang chạy ở port 5000 |
| Redirect loop về /login | Token hết hạn | Xóa localStorage → đăng nhập lại |

**Xóa localStorage:**
1. Mở DevTools (F12) → tab **Application**
2. Sidebar trái → **Local Storage** → `http://localhost:3000`
3. Xóa key `token`
4. Refresh trang

### 13.2 Thiết bị không cập nhật real-time

| Kiểm tra | Cách kiểm tra | Giải pháp |
|----------|---------------|-----------|
| WebSocket connected? | Dashboard → góc phải: "Connected" hay "Disconnected" | Refresh trang, kiểm tra server |
| MQTT broker chạy chưa? | `docker-compose ps` → mosquitto | `docker-compose up -d mosquitto` |
| Thiết bị publish đúng topic? | `mosquitto_sub -t "iot/devices/#" -v` | Sửa topic theo format `iot/devices/{name}/data` |
| Tên thiết bị khớp? | So sánh tên trong MQTT topic vs Name trong app | Phải khớp chính xác (case-sensitive) |

### 13.3 Docker services không chạy

```bash
# Kiểm tra trạng thái
docker-compose ps

# Xem logs nếu có lỗi
docker-compose logs postgres
docker-compose logs mosquitto
docker-compose logs server

# Restart tất cả
docker-compose restart

# Nếu vẫn lỗi, xóa và tạo lại
docker-compose down
docker-compose up -d
```

### 13.4 Lỗi TypeScript khi build

```bash
# Kiểm tra lỗi TypeScript
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit

# Build lại
npm run build
```

---

## Tài liệu liên quan

| Tài liệu | Đường dẫn | Đối tượng |
|-----------|-----------|-----------|
| Kiến trúc hệ thống | [ARCHITECTURE.md](ARCHITECTURE.md) | Developer / Architect |
| Tài liệu phát triển | [DEVELOPMENT.md](DEVELOPMENT.md) | Developer |
| Kế hoạch dự án | [../plan.md](../plan.md) | PM / Developer |
| README | [../README.md](../README.md) | Tất cả |
