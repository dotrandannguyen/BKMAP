# 🗺️ BKMAP - Student Housing Map

<p align="center">
  <img width="1920" height="1004" alt="image" src="https://github.com/user-attachments/assets/97a1575e-27bb-4e38-ad3a-b2074d95b5b2" />

</p>

<p align="center">
An interactive housing platform that helps university students discover rental rooms through an interactive map, smart search, and location-based recommendations.
</p>

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazonaws)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?logo=githubactions)

</p>

---

## 🌐 Live Demo

**Website:** https://bksmap-tvsv-dut.id.vn

---

# ✨ Features

### 🧑 For Students

- Search rental rooms by location, price, and amenities
- Interactive map with nearby room markers
- Display distance from each room to Da Nang University of Science and Technology (DUT)
- View detailed room information and images
- Save favorite rooms
- Smart room filtering

### 🏠 For Landlords

- Register and manage rental listings
- Upload room images
- Edit or remove listings
- Manage room availability

### 🛡️ For Administrators

- Manage users
- Moderate room listings
- Review reported content
- System management dashboard

---

# 📸 Screenshots

## 🏠 Home Page

<p align="center">
<img width="1920" height="1004" alt="image" src="https://github.com/user-attachments/assets/28b615f4-198d-4e53-a14a-c2d323ad93ce" />


</p>

---

## 🗺️ Interactive Map

<p align="center">
<img width="1920" height="1029" alt="image" src="https://github.com/user-attachments/assets/9b514464-a674-4780-a79a-5958cacbbc70" />

</p>

---

## 🏘️ Room Listings

<p align="center">
<img width="1920" height="1028" alt="image" src="https://github.com/user-attachments/assets/8916d24e-9252-4313-b89f-a0d87eaa4c44" />

</p>

---

# 🏗️ System Architecture

```
                        GitHub Actions
                              │
                              ▼
                    Docker Compose Deployment
                              │
                              ▼
                        AWS EC2 Server
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
             Caddy Reverse Proxy     Express API
                                            │
                         ┌──────────────────┴─────────────┐
                         ▼                                ▼
                    PostgreSQL                       Redis Cache
```

---

# 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React, Vite, Tailwind CSS, Zustand, Leaflet |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Cache | Redis |
| Authentication | JWT |
| Deployment | AWS EC2, Docker Compose, Caddy |
| CI/CD | GitHub Actions |
| Version Control | Git & GitHub |

---

# 🚀 CI/CD Workflow

The project uses **GitHub Actions** to automate deployment.

Deployment flow:

```
Developer
      │
git push
      │
      ▼
GitHub Actions
      │
      ▼
Build Application
      │
      ▼
Deploy to AWS EC2
      │
      ▼
Restart Docker Containers
      │
      ▼
Production
```

### Infrastructure

- AWS EC2 (t3.small)
- Docker Compose
- Caddy Reverse Proxy
- Automatic HTTPS (SSL)
- Redis
- PostgreSQL

---

# 📂 Project Structure

```
BKMAP
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── backend/
│   ├── prisma/
│   ├── src/
│   └── ...
│
├── docs/
│   └── images/
│
├── docker-compose.yml
├── README.md
└── .github/
    └── workflows/
```

---

# 💻 Local Development

## Prerequisites

Before running the project locally, install:

- Node.js (>=18)
- PostgreSQL
- Redis (Optional)
- Git

---

## Backend

```bash
cd backend
npm install
```

Create **backend/.env**

```env
PORT=3000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/bkmap_db"

ACCESS_JWT_SECRET=your_access_secret

REFRESH_JWT_SECRET=your_refresh_secret

NODE_ENV=development

FRONTEND_URL=http://localhost:5173

REDIS_HOST=localhost
```

Initialize Prisma

```bash
npx prisma db push
```

Run backend

```bash
npm run dev
```

---

## Frontend

```bash
cd frontend
npm install
```

Create **frontend/.env**

```env
VITE_API_URL=http://localhost:3000/api

VITE_SUPABASE_URL=https://your-project.supabase.co

VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run

```bash
npm run dev
```

Visit

```
http://localhost:5173
```

---

# 🤝 Git Workflow

### Update Local Repository

```bash
git checkout master
git pull origin master
```

### Create a Feature Branch

```bash
git checkout -b feat/search-room
```

### Commit

```bash
git add .
git commit -m "feat: add room search by price"
```

Commit prefixes

| Prefix | Description |
|----------|-------------|
| feat | New feature |
| fix | Bug fix |
| refactor | Code improvement |
| docs | Documentation |
| chore | Maintenance |
| style | Code formatting |

### Push

```bash
git push origin feat/search-room
```

Create a Pull Request and request code review before merging.

---

# 👨‍💻 Contributors

| Name | Role |
|------|------|
| Your Name | Full Stack Developer |
| Team Members | Contributors |

---

# 📄 License

This project was developed for educational purposes at Da Nang University of Science and Technology.

---

## ⭐ If you find this project useful, don't forget to give it a star!
