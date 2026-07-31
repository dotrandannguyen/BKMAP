# BKMAP - Student Housing Map 🗺️

Welcome to **BKMAP** – an interactive housing map platform that helps students at Da Nang University of Science and Technology (DUT) and nearby universities search, discover, review, and publish rental room information.

---

## 🏗️ Tech Stack

This project follows a modern **Monorepo** architecture.

- **Frontend:** React, Vite, Tailwind CSS, Zustand, Leaflet (Maps)
- **Backend:** Node.js, Express, Prisma ORM
- **Database & Storage:** PostgreSQL (Supabase), Redis (Caching)
- **Production Deployment:** AWS EC2, Docker Compose, Caddy (Automatic HTTPS), GitHub Actions (CI/CD)

---

## 🛠️ Prerequisites

Before running the project locally, make sure you have installed:

1. **Node.js** >= 18.x (Recommended: v20 LTS)
2. **PostgreSQL** (Local database or a cloud service such as Supabase)
3. **Redis** (Optional for local development; used for caching and rate limiting)
4. **Git**

---

## 💻 Local Development

### 1. Start the Backend

```bash
cd backend
npm install
```

### Configure Environment Variables (`backend/.env`)

Create a `.env` file and configure the following variables:

```env
PORT=3000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/bkmap_db"
ACCESS_JWT_SECRET="your_access_jwt_secret"
REFRESH_JWT_SECRET="your_refresh_jwt_secret"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
REDIS_HOST="localhost"
```

### Initialize the Database & Start the Server

```bash
# Synchronize the Prisma schema with the database
npx prisma db push

# Start the backend server (Port 3000)
npm run dev
```

---

### 2. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

### Configure Environment Variables (`frontend/.env`)

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Run the Application

```bash
# Start the frontend development server (Port 5173)
npm run dev
```

Open your browser and visit:

```
http://localhost:5173
```

---

## 🚀 Production Deployment (CI/CD)

BKMAP uses **GitHub Actions** to automate its deployment process.

### Infrastructure

- Both the **Frontend** and **Backend** are hosted on an **AWS EC2 (`t3.small`)** instance.
- **Caddy** serves as the reverse proxy, delivering static frontend assets and forwarding API requests to the backend.
- Caddy automatically provisions and renews HTTPS certificates for the domain:

```
bksmap-tvsv-dut.id.vn
```

### Deployment Workflow

- Push code to the `main` or `master` branch.
- The **deploy-frontend** workflow builds the frontend and uploads the generated files directly to the EC2 instance via SCP.
- The **deploy-backend** workflow pulls the latest source code and restarts the services using Docker Compose (`backend`, `caddy`, and `redis`).

> For the complete server setup guide, please refer to the internal infrastructure documentation.

---

## 🤝 Git Workflow

### 1. Update Your Local Repository

```bash
git checkout master
git pull origin master
```

### 2. Create a New Branch

Create a separate branch for each feature or bug fix.

```bash
git checkout -b feat/search-rooms
```

### 3. Commit Your Changes

Write clear and meaningful commit messages.

```bash
git add .
git commit -m "feat: Add room search API by price"
```

**Commit Prefix Convention**

| Prefix | Description |
|---------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code refactoring |
| `docs:` | Documentation changes |

### 4. Push and Create a Pull Request

```bash
git push origin feat/search-rooms
```

Then, create a Pull Request on GitHub and request a code review from your teammates before merging.

---

## ☕ Happy Coding!
