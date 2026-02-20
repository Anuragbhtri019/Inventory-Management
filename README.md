# Inventory Manager (MERN)

Full‑stack inventory management app with authentication, product management (CRUD), and Khalti (sandbox) payment initiation/verification.

This repository is a **monorepo** with two apps:

- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React (Vite) + Tailwind CSS

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API & Postman](#api--postman)
- [What You Can Learn](#what-you-can-learn)
- [How This Project Was Created (High Level)](#how-this-project-was-created-high-level)

## Features

- Auth with JWT + session handling
- Email OTP flows (verify email / password reset)
- Role-aware endpoints (admin/user)
- Product CRUD
- Payment endpoints (Khalti sandbox)
- Centralized error handling
- Postman collection included for API testing

## Tech Stack

### Backend

- Node.js, Express
- MongoDB, Mongoose
- Auth: JWT (`jsonwebtoken`), password hashing (`bcryptjs`)
- Validation: Joi
- Email: Nodemailer
- HTTP client: Axios
- PDF generation: PDFKit

### Frontend

- React (Vite)
- React Router
- Styling: Tailwind CSS
- HTTP: Axios
- Notifications: React Toastify

### Tooling

- ESLint (flat config)

## Repository Layout

```text
Inventory-Management/
  backend/                         # Express API
    package.json
    server.js                      # App entry
    .env.example                   # Example environment variables
    config/
      db.js                        # MongoDB connection
      roles.js                     # Role constants/logic
    controllers/
      authController.js
      paymentController.js
      productController.js
      userController.js
    middlewares/
      authMiddleware.js            # JWT/role checks
      errorMiddleware.js           # Central error handler
      loggerMiddleware.js          # Request logging
    models/
      Payment.js
      Product.js
      User.js
      UserSession.js               # OTP/session persistence
    routes/
      authRoutes.js
      paymentRoutes.js
      productRoutes.js
      userRoutes.js
    utils/
      CustomError.js
      mailer.js                    # Nodemailer wrapper
      otp.js                       # OTP helpers

  frontend/                        # React (Vite) app
    package.json
    package-lock.json
    index.html
    vite.config.js
    tailwind.config.js
    eslint.config.js
    src/
      main.jsx                     # React bootstrap
      App.jsx                      # Top-level routes/layout
      index.css
      assets/
      components/
        Button.jsx
        Footer.jsx
        Input.jsx
        Navbar.jsx
        NotificationsBell.jsx
        PayWithKhalti.jsx
        ProductForm.jsx
        ProtectedRoute.jsx
        ThemeToggle.jsx
      contexts/
        AuthContext.jsx
        CartContext.jsx
        NotificationContext.jsx
        ThemeContext.jsx
        ToastContext.jsx
      layouts/
        AppLayout.jsx
      pages/
        AdminTransactions.jsx
        AdminUsers.jsx
        Cart.jsx
        Dashboard.jsx
        Favourites.jsx
        ForgotPassword.jsx
        History.jsx
        Login.jsx
        PaymentSuccess.jsx
        ProductDetails.jsx
        Products.jsx
        Profile.jsx
        Register.jsx
        ResetPassword.jsx
        Settings.jsx
        VerifyEmail.jsx
        dashboard/
          AdminDashboard.jsx
          UserHome.jsx
      services/
        api.js                     # Axios client / API helpers
  README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- MongoDB (local or MongoDB Atlas)
- (Optional) Postman

### Clone

```bash
git clone <your-repo-url>
cd Inventory-Management
```

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` and fill values (template):

```dotenv
# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_secret

# Khalti (Sandbox)
KHALTI_SECRET_KEY=your_test_secret_key
KHALTI_BASE_URL=https://a.khalti.com/api/v2

# Khalti (Live) - optional alternative variable names supported by the backend
# Live_secret_key=your_live_secret_key
# Live_public_key=your_live_public_key

# Email (OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=gmail_account_for_otp
SMTP_PASS=your_app_password
SMTP_FROM=INVENTORY MANAGER <gmail_account_for_otp>
```

Run the API:

```bash
npm run dev
```

Backend defaults to `http://localhost:5000` (unless you change `PORT`).

### Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173`.

## Environment Variables

Backend reads environment variables from `backend/.env`.

Minimum required:

- `PORT` (default: 5000)
- `FRONTEND_URL` (default: http://localhost:5173)
- `MONGO_URI`
- `JWT_SECRET`

Payments (Khalti sandbox):

- `KHALTI_SECRET_KEY`
- `KHALTI_BASE_URL` (default: https://a.khalti.com/api/v2)

Email (OTP):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Notes:

- The backend also supports alternative Khalti live key variable names (see `backend/.env.example`).
- Gmail SMTP: you typically need a Google **App Password** (not your normal password).

## Scripts

### Backend (`backend/package.json`)

- `npm run dev` — start with nodemon
- `npm start` — start with node

### Frontend (`frontend/package.json`)

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm run lint` — run ESLint

## API

Base URL (local): `http://localhost:5000`

Protected routes require a Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Key routes (high level):

- Auth: `/api/auth/*` (register, verify-otp, resend-otp, login, logout, password reset)
- Users: `/api/users/*` (me/profile/password + admin user management)
- Products: `/api/products/*` (list/details + admin CRUD + favourite toggle)
- Payments: `/api/payment/*` (initiate/verify + user payment history)

## What You Can Learn

- Structuring a MERN monorepo (frontend + backend in one repository)
- Designing REST APIs with Express routes/controllers/middlewares
- MongoDB modeling with Mongoose schemas and relationships
- Authentication patterns: JWT, sessions, password hashing
- OTP flows using email (Nodemailer) and user-session persistence
- Request validation with Joi
- Integrating a payment gateway (Khalti sandbox) end-to-end
- React app architecture: routing, contexts (auth/cart/theme/notifications)
- Tailwind CSS workflow in a Vite + React project
- API testing using Postman collections

## How This Project Was Created (High Level)

If you want to build a similar project (not detailed), the typical steps are:

1. Scaffold backend (Express) and connect MongoDB (Mongoose)
2. Create models + controllers + routes (auth, users, products, payments)
3. Add middleware for auth (JWT), error handling, and logging
4. Add OTP email utilities (Nodemailer) for verification/reset flows
5. Scaffold frontend with Vite + React, add React Router and Tailwind
6. Build UI pages, centralize API calls (Axios), store state with React Context
7. Add payment UI + integrate payment endpoints
8. Document the API and ship a Postman collection for verification
