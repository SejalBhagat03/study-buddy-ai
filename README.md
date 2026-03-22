# Study Buddy AI - Full-Stack Edition

A production-ready AI study assistant built with a modular full-stack architecture. Features secure user authentication, responsive workspaces, and smooth state transitions.

---

## 📂 Project Governance

The workspace enforces strict service separation keeping state bounds isolated:

*   **/client**: React 18 + Vite + Tailwind CSS.
    *   `src/api/`: Reusable Axios layer maintaining silent token headers & error intercepting broadcasts.
    *   `src/context/`: Context Providers maintaining hydrated cache sessions across view mounts.
*   **/server**: Node.js + Express + MongoDB.
    *   `services/`: Encapsulated database operations decoupling layout queries from controller views.
    *   `middleware/`: Endpoint chain triggers handling Request Validation (`express-validator`) and Guard rails (`JWT`).

---

## 🛠️ Tech Stack 

*   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios for HTTP pools.
*   **Backend**: Node.js, Express, `jsonwebtoken` security protocols.
*   **Database**: MongoDB Atlas wired with Mongoose Schema modelling.

---

## 🚀 Getting Started

### 1. Backend Installation (`/server`)

Create and fill your `.env` targeting target layout variables:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname?replicaSet=xxx
JWT_SECRET=super_secret_key
# Toggle production streams output
NODE_ENV=development
```

**Boot streams**:
```bash
cd server
npm install
npm run dev
```

### 2. Frontend Installation (`/client`)

Fill layout pointers locally:
```env
VITE_API_URL=https://study-buddy-ai-s5ns.onrender.com
```

**Boot viewports**:
```bash
cd client
npm install
npm run dev
```

---

## 🛡️ API Endpoints Index

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register new credentials, returns tokens. |
| `/api/auth/login` | `POST` | Public | User credential lookup, returns authorization bearer. |
| `/api/user/profile` | `GET` | Private | Retrieves logged identity profile structures. |

---

## 🔍 Validation State
Axios holds incoming standard interceptor listeners. If any backend payload returns `401 unauthorized` status bounds, headers will transparently perform automatic clearing caches pushes to generic `/auth` URL gates preventing visual crashes.
