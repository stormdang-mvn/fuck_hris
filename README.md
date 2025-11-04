# HRIS Login Project

Dự án Vue.js + TypeScript với chức năng đăng nhập HRIS.

## Tính năng

- ✅ Form đăng nhập với validation
- ✅ Tích hợp API login HRIS
- ✅ Lưu token vào localStorage
- ✅ Route guard (bảo vệ route yêu cầu đăng nhập)
- ✅ Quản lý state với Pinia
- ✅ TypeScript support đầy đủ
- ✅ Responsive design

## Công nghệ sử dụng

- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Pinia (State Management)
- Axios (HTTP Client)

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
│   └── auth.ts             # Pinia store quản lý authentication
├── types/
│   └── auth.ts             # TypeScript interfaces
├── views/
│   ├── LoginView.vue       # Trang đăng nhập
│   └── HomeView.vue        # Trang chủ (sau khi login)
└── router/
    └── index.ts            # Cấu hình routing + navigation guard
```

## Chức năng chính

### Login
- URL: `/login`
- Form bao gồm: username, password, remember me
- Sau khi đăng nhập thành công, token được lưu vào localStorage
- Tự động redirect đến trang chủ

### Home (Protected)
- URL: `/`
- Hiển thị thông tin user đã đăng nhập
- Có nút Logout
- Chỉ truy cập được khi đã đăng nhập

### Navigation Guard
- Route yêu cầu authentication sẽ redirect đến `/login` nếu chưa đăng nhập
- Route login sẽ redirect đến `/` nếu đã đăng nhập

## API Endpoint

```
POST https://hris.humaxdigital.com:8080/v1/account/signin
```

**Lưu ý về CORS:** 
- Để tránh lỗi CORS khi develop, project đã được cấu hình Vite proxy
- Tất cả requests đến `/api/*` sẽ được proxy đến `https://hris.humaxdigital.com:8080/v1/*`
- Cấu hình proxy trong file `vite.config.ts`

**Request body:**
```json
{
  "username": "your-email@domain.com",
  "password": "your-password",
  "rememberMe": true
}
```

**Response:** User info + Token (được lưu tự động)

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

