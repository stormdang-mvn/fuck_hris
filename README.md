# HRIS Organization Chart

Ứng dụng Vue.js + TypeScript hiển thị sơ đồ tổ chức (Organization Chart) từ hệ thống HRIS.

## Tính năng

- ✅ **Auto Login** - Form đăng nhập với validation
- ✅ **Background Data Loading** - Tự động tải initialData ngầm sau khi login
- ✅ **Organization Chart** - Hiển thị org chart ngay tại home page
- ✅ **Smart Caching** - Hệ thống cache thông minh với hash validation
- ✅ **Data Compression** - Giải nén dữ liệu compressed từ server (pako/zlib)
- ✅ **Avatar Display** - Hiển thị ảnh đại diện từ pictureUrl
- ✅ **Visual Tree Chart** - Sơ đồ cây đẹp mắt với Team Leader → Parts → Members
- ✅ **Grade Grouping** - Nhóm members theo SENIOR/INTERMEDIATE/JUNIOR GRADE
- ✅ **Export Functions** - Export dữ liệu ra JSON/Text file hoặc clipboard

## Công nghệ sử dụng

- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Pinia (State Management)
- Axios (HTTP Client)
- Pako (Data Compression/Decompression)

## Cài đặt

```bash
npm install
```

## Chạy development

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Cấu trúc project

```
src/
├── services/
│   └── api.ts              # Cấu hình axios và API endpoints
├── stores/
│   ├── auth.ts             # Pinia store quản lý authentication
│   └── initialData.ts      # Pinia store quản lý initial data caching
├── types/
│   ├── auth.ts             # TypeScript interfaces cho auth
│   └── initial-data.ts     # TypeScript interfaces cho initial data
├── utils/
│   ├── compression.ts           # Utilities cho compress/decompress data
│   ├── organizationChart.ts     # Utilities cho TEAM/PART organization chart
│   └── fileExport.ts            # Utilities cho export JSON/Text
├── views/
│   ├── LoginView.vue            # Trang đăng nhập
│   └── HomeView.vue             # Trang chủ - hiển thị org chart
├── components/
│   └── TreeChart.vue            # Component hiển thị tree chart với avatars
└── router/
    └── index.ts                 # Cấu hình routing + navigation guard
```

## Chức năng chính

### Login
- URL: `/login`
- Form bao gồm: username, password, remember me
- Sau khi đăng nhập thành công → tự động chuyển về home page

### Home Page (Organization Chart)
- URL: `/`
- **Tự động load initialData ngầm** sau khi login
- Hiển thị organization chart với:
  - Team Leader card (với avatar)
  - Statistics cards (Parts, Direct Reports, Indirect Reports, Total Members)
  - Visual Tree Chart với layout đẹp mắt
  - Part cards với Part Leader và members theo grade
- Export functions: JSON, Text, Copy to Clipboard
- Logout button

### Navigation Guard
- Route yêu cầu authentication sẽ redirect đến `/login` nếu chưa đăng nhập
- Route login sẽ redirect đến `/` nếu đã đăng nhập

- **Export Features:**
  - 💾 Export Full Data (JSON) - Export toàn bộ initialData
  - 👥 Export Employees Only - Chỉ export employee list
  - 📋 Copy to Clipboard - Copy data vào clipboard

### Organization Chart (Protected)
- URL: `/org-chart`
- Hiển thị biểu đồ tổ chức theo cấu trúc TEAM/PART dạng Tree Chart
- **Cấu trúc phân cấp:**

## Organization Chart Structure

### Data Hierarchy
- **TEAM** - Team do user quản lý
  - `TEAM.employees` - Tất cả members trực tiếp (Direct Reports)
  - Bao gồm Part Leaders và regular team members
- **PART** - Các phần trong team
  - `PART.leaderID` - Part Leader/Manager
  - `PART.employees` - Members thuộc Part (Indirect Reports)

### Display Features
- **Team Leader Card** - Gradient purple card với avatar và team info
- **Statistics Cards** - 4 cards hiển thị: Parts count, Direct Reports, Indirect Reports, Total Members
- **Visual Tree Chart:**
  - Team Leader ở trên cùng
  - Part cards xếp ngang bên dưới
  - Mỗi Part card có:
    - Part Leader/Manager với avatar
    - Members grouped by grade (SENIOR/INTERMEDIATE/JUNIOR)
    - Avatar cho mỗi member (tải từ pictureUrl)
- **Export Functions:**
  - Export as JSON
  - Export as Text
  - Copy to Clipboard

### Technical Details
- Avatar loading với error handling (fallback to initials)
- Responsive layout
- Smooth hover effects
- Background gradient và shadows đẹp mắt

## 🔥 Smart Caching System

API `GetInitialData` sử dụng **hash-based caching** để tối ưu hiệu năng:

### Workflow:
1. **Client gửi hash** hiện tại lên server
2. **Server kiểm tra**:
   - Nếu `hashMatched = true`: Dữ liệu không đổi → Không trả về data
   - Nếu `hashMatched = false`: Dữ liệu đã thay đổi → Trả về `initialCompressedData`
3. **Client xử lý**:
   - Decompress data bằng pako (zlib)
   - Parse JSON
   - Lưu vào localStorage với hash mới
4. **Lần sau**: Sử dụng hash mới để kiểm tra

### Dữ liệu được cache:
- Employee List
- Company Groups (TEAM/PART structure)
- Field Configs
- Work Weeks
- Org Configs

## API Endpoints

### Login
```
POST https://hris.marusysvina.com:8080/v1/account/signin
```

**Request:**
```json
{
  "username": "email@domain.com",
  "password": "password",
  "rememberMe": true
}
```

### Initial Data
```
POST https://hris.marusysvina.com:8080/v1/Home/GetInitialData
```

**Lưu ý về CORS:** 
- Project sử dụng Vite proxy để tránh CORS errors
- Requests đến `/api/*` được proxy đến `https://hris.marusysvina.com:8080/v1/*`

## 📖 Code Examples

### Load Data & Build Org Chart

```typescript
import { useInitialDataStore } from '@/stores/initialData'
import { buildTeamOrgChart } from '@/utils/organizationChart'

const initialDataStore = useInitialDataStore()

// Load data
await initialDataStore.fetchData()

// Build org chart
const employeeID = 'your-employee-id'
const orgChart = buildTeamOrgChart(initialDataStore.data, employeeID)

console.log('Team:', orgChart.team.groupName)
console.log('Direct Reports:', orgChart.directReports.length)
console.log('Indirect Reports:', orgChart.indirectReports.length)
```

### Export Data

```typescript
import { exportToJson, exportToText, copyToClipboard } from '@/utils/fileExport'

// Export as JSON file
exportToJson(data, 'org-chart')

// Export as text file
exportToText(textData, 'org-chart')

// Copy to clipboard
copyToClipboard('Text to copy')
```

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

