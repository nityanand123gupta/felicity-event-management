# Felicity Event Management System

Design & Analysis of Software Systems
Assignment 1 – MERN Stack Implementation

---

## 🌐 Live Deployment

Frontend URL:
https://felicity-event-management-red.vercel.app

Backend Base API URL:
https://felicity-event-management-y5l6.onrender.com/api

GitHub Repository:
https://github.com/nityanand123gupta/felicity-event-management

---

## 1. Project Overview

The Felicity Event Management System is a centralized web platform built to eliminate the chaos of managing college events through Google Forms, spreadsheets, and messaging groups.

The system provides structured event lifecycle management, secure authentication, QR-based ticket validation, real-time communication, analytics dashboards, and admin-controlled organizer provisioning.

Each user has exactly one role:

- Participant
- Organizer
- Admin

Role switching is strictly prohibited.

---

## 2. Technology Stack & Justification

### Backend

- Node.js – Runtime environment for scalable backend execution
- Express.js – REST API framework
- MongoDB Atlas – Cloud-hosted NoSQL database
- Mongoose – Schema validation & data modeling
- bcrypt – Secure password hashing
- JSON Web Tokens (JWT) – Stateless authentication
- Socket.IO – Real-time discussion forum
- Nodemailer – Email notifications & ticket confirmations
- QRCode – QR-based ticket generation
- ics – Calendar file generation

### Frontend

- React (Vite) – Component-based frontend framework
- React Router v6 – Role-based protected routing
- Axios – HTTP client with JWT interceptor
- Tailwind CSS – Utility-first UI framework
- Context API – Global authentication state management

---

## 3. Authentication & Security

- Passwords are hashed using bcrypt
- JWT-based authentication for all protected routes
- Role-based access control enforced in backend middleware and frontend routes
- Admin account auto-provisioned by backend
- Organizer accounts created only by Admin
- Session persistence across browser restarts
- Secure logout clears authentication token
- IIIT email domain validation enforced for IIIT participants

---

## 4. Core Features (Part 1 – 70 Marks)

### Participant Features

- Onboarding with interest selection
- Follow / Unfollow organizers
- Personalized event recommendations
- Dashboard with Upcoming & Participation History
- Search (partial & fuzzy)
- Trending events (Top 5 in 24 hours)
- Filters (Type, Eligibility, Date Range, Followed Clubs)
- QR-based ticket generation
- Email confirmation
- Calendar (.ics) export
- Profile editing
- Password change functionality

---

### Organizer Features

- Event lifecycle: Draft → Publish → Ongoing → Completed
- Dynamic form builder for normal events
- Form locking after first registration
- Merchandise inventory & variant management
- Payment approval workflow
- QR attendance scanning
- Manual attendance override with audit logging
- Revenue & analytics dashboard
- Export participants as CSV
- Discord webhook integration
- Organizer profile management

---

### Admin Features

- Create organizer accounts (auto-generate credentials)
- Enable / Disable organizers
- Archive / Delete accounts
- Handle organizer password reset requests
- Platform-wide analytics dashboard

---

## 5. Event Types

### Normal Event

- Individual registration
- Dynamic custom registration form

### Merchandise Event

- Variant-based stock management (size, color)
- Purchase limit per participant
- Payment proof upload
- QR ticket generated only after payment approval

---

## 6. Advanced Features (Part 2 – 30 Marks)

### Tier A (Selected 2)

1. Merchandise Payment Approval Workflow
2. QR Scanner & Attendance Tracking

### Tier B (Selected 2)

1. Real-Time Discussion Forum (Socket.IO)
2. Organizer Password Reset Workflow

### Tier C (Selected 1)

1. Add to Calendar Integration (.ics export)

---

## 7. Setup Instructions

### Backend

cd backend
npm install
npm run dev

### Frontend

cd frontend
npm install
npm run dev

---

## 8. Environment Variables (Backend)

Create a `.env` file inside backend directory:


MONGO_URI=mongodb+srv://nityanandgupta_db_user:JPRqeftg1HsLIRZv@felicity-cluster.b1sax1b.mongodb.net/felicity_db?retryWrites=true&w=majority

PORT=8000

JWT_SECRET=supersecretkey123

ADMIN_PASSWORD=Admin@123

MAIL_HOST=smtp.gmail.com

MAIL_PORT=587

MAIL_USER=nitya23k23@gmail.com

MAIL_PASS=tugnavsnvspwijiy

IMPORTANT:
Do NOT commit your .env file to GitHub.

---

## 9. Deployment

Frontend deployed on Vercel
Backend deployed on Render
Database hosted on MongoDB Atlas

See deployment.txt for production links.

---

## 10. Conclusion

The Felicity Event Management System provides a secure, scalable, and production-ready solution for managing college events using structured workflows, real-time communication, QR validation, and analytics-driven insights.
