# SecureOnboard 🛡️

> **Zero-Trust Identity Lifecycle Automation for SMBs**  
> Auto-revoke SaaS access the moment an employee leaves — in under 60 seconds, with a full audit trail.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🚀 What is SecureOnboard?

When an employee leaves your company, their access to Google Workspace, Slack, GitHub, and dozens of other SaaS tools needs to be revoked immediately. Most companies rely on manual checklists — someone always forgets something.

SecureOnboard automates the entire offboarding workflow:

```
Employee leaves HR system
        ↓
SecureOnboard detects the event via webhook
        ↓
n8n workflows fire in parallel:
  ✅ Google Workspace account suspended
  ✅ Slack user deactivated  
  ✅ GitHub org membership removed
        ↓
Full audit trail generated (SOC 2 / ISO 27001 ready)
```

**All of this happens in under 60 seconds.**

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Automation | n8n (self-hosted) |
| Auth | NextAuth.js |

---

## 📁 Project Structure

```
secureonboard/
├── frontend/          # Next.js 14 dashboard
├── backend/           # Express API server
├── n8n-workflows/     # Exportable n8n workflow JSON files
└── docker-compose.yml # Local dev environment
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- pnpm (recommended)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/rajdeeppal01/secureonboard.git
cd secureonboard

# 2. Start PostgreSQL + n8n via Docker
docker-compose up -d

# 3. Set up backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# 4. Set up frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:4000  
n8n Dashboard: http://localhost:5678

---

## 🔑 Integrations (MVP)

- [x] Google Workspace (suspend user, revoke sessions)
- [x] Slack (deactivate user)
- [x] GitHub (remove from org)
- [ ] Notion *(coming soon)*
- [ ] Figma *(coming soon)*
- [ ] AWS IAM *(coming soon)*
- [ ] Microsoft 365 *(coming soon)*

---

## 📄 License

MIT © 2026 SecureOnboard
