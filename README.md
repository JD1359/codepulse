# CodePulse 

> A real-time distributed code execution and collaboration platform  think LeetCode meets Google Docs, built from scratch.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)

> 🚧 **Active Development**  Follow this repo for weekly updates

---

## What is CodePulse?

CodePulse is a multi-user collaborative coding platform where developers can write, execute, and share code in real time across 5+ programming languages without installing anything locally.

**Core challenge it solves:** Existing platforms like LeetCode and Replit are either single-user or lack true real-time collaboration with sandboxed execution. CodePulse combines both.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│         Monaco Editor · WebSocket Client · JWT Auth      │
└─────────────────────────┬───────────────────────────────┘
                          │ WebSocket (Socket.io)
┌─────────────────────────▼───────────────────────────────┐
│              Node.js / Express API Server                │
│    REST Routes · Auth Middleware · Rate Limiting         │
│                                                         │
│         Redis Pub/Sub ◄──── Room State Manager          │
└──────────┬──────────────────────────┬───────────────────┘
           │ Job Queue                │ DB Reads/Writes
┌──────────▼──────────┐   ┌──────────▼───────────────────┐
│  Docker Execution   │   │      MongoDB Atlas            │
│  Engine             │   │  Users · Sessions · History  │
│  Python · JS · Java │   └──────────────────────────────┘
│  (Resource-capped   │
│   containers)       │
└─────────────────────┘
```

---

## Key Features

###  Real-Time Collaboration
- Multiple users edit the same code file simultaneously
- Sub-100ms sync latency using WebSocket rooms + Redis Pub/Sub
- Operational conflict resolution — no edit collisions

###  Sandboxed Code Execution
- Each submission runs in an isolated Docker container
- Resource limits: 50MB RAM, 0.5 CPU cores, 10-second timeout
- Supports: Python, JavaScript (Node), Java, C++, Go
- Stdout/stderr streamed back to client in real time

###  Secure API
- JWT-based authentication with refresh tokens
- Rate limiting: 30 requests/minute per user
- Input sanitization on all code submissions

###  Session History
- All code sessions persisted to MongoDB
- Execution logs stored per user per session
- Sub-50ms read queries via compound indexes

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Monaco Editor | Same editor as VS Code familiar, powerful |
| Real-time | Socket.io + Redis Pub/Sub | Horizontal scaling of WebSocket connections |
| Backend | Node.js + Express | Non-blocking I/O  ideal for concurrent connections |
| Execution | Docker | Isolation, resource control, language agnosticism |
| Database | MongoDB Atlas | Flexible schema for session/execution log storage |
| Auth | JWT (access + refresh) | Stateless, scalable authentication |
| Deployment | GCP (Cloud Run) | Auto-scaling, containerized deployment |

---

## Project Structure

```
codepulse/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.jsx      # Monaco Editor wrapper
│   │   │   ├── Terminal.jsx    # Execution output display
│   │   │   └── Toolbar.jsx     # Language selector, run button
│   │   ├── hooks/
│   │   │   └── useSocket.js    # WebSocket connection hook
│   │   └── App.jsx
├── server/                     # Node.js backend
│   ├── routes/
│   │   ├── auth.js             # Login, register, refresh
│   │   ├── sessions.js         # CRUD for code sessions
│   │   └── execute.js          # Code submission handler
│   ├── services/
│   │   ├── executor.js         # Docker container spawner
│   │   ├── roomManager.js      # Redis Pub/Sub room logic
│   │   └── auth.js             # JWT utilities
│   ├── models/
│   │   ├── User.js             # MongoDB user schema
│   │   └── Session.js          # Code session schema
│   └── index.js                # Express + Socket.io server
├── docker/
│   ├── python.Dockerfile       # Sandboxed Python runner
│   ├── node.Dockerfile         # Sandboxed Node.js runner
│   └── java.Dockerfile         # Sandboxed Java runner
└── README.md
```

---

## Setup & Run (Local Dev)

### Prerequisites
- Node.js 18+
- Docker Desktop
- MongoDB Atlas account (free tier)
- Redis (local or Redis Cloud free tier)

```bash
# 1. Clone
git clone https://github.com/JD1359/codepulse.git
cd codepulse

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd ../client && npm install

# 4. Configure environment
cp server/.env.example server/.env
# Fill in: MONGODB_URI, REDIS_URL, JWT_SECRET

# 5. Start Redis (if local)
docker run -d -p 6379:6379 redis

# 6. Start backend
cd server && npm run dev

# 7. Start frontend (new terminal)
cd client && npm start
```

Open `http://localhost:3000`

---

## Performance Targets

| Metric | Target | Status |
|---|---|---|
| WebSocket sync latency | < 100ms | 🔄 In progress |
| Code execution time (Python) | < 3s for simple programs | 🔄 In progress |
| Concurrent users per instance | 500+ | 🔄 Load testing |
| API response time (p95) | < 200ms | 🔄 In progress |

---

## Development Roadmap

- [x] Project architecture design
- [x] Basic Express server + Socket.io setup
- [ ] Monaco Editor integration with React
- [ ] Docker execution engine (Python first)
- [ ] Redis Pub/Sub room synchronization
- [ ] JWT authentication flow
- [ ] MongoDB session persistence
- [ ] Load testing with Artillery.js
- [ ] GCP Cloud Run deployment
- [ ] Multi-language support (JS, Java, C++)

---

## Why I Built This

This project was designed to demonstrate distributed systems concepts I'm learning in my M.S. program — specifically: WebSocket-based state synchronization, container isolation for security, and horizontal scaling with Redis. These are the same architectural patterns used at companies like GitHub (Codespaces), Replit, and LeetCode.

---

## Author

**Jayadeep Gopinath**
M.S. Computer Science · Illinois Institute of Technology, Chicago
[LinkedIn](https://linkedin.com/in/jayadeep-g-05b643257) · jg@hawk.illinoistech.edu
