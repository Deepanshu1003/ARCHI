# 🚀 ARCHI — Agentic Role-based Collaborative Hierarchical Infrastructure

An enterprise-grade AI organizational architecture management platform that empowers developers, team leads, and system architects to structure, edit, delegate, and collaborate with a hierarchical multi-agent system.

---

## 📌 Branch Overview

This repository contains two major versions of ARCHI:

### **Branch 1: `archi-v1-full-stack`**
**Legacy Full-Stack Architecture with Node/Express Gateway**

- **Tech Stack**: React + Express (Node.js) + Python Clean Architecture
- **Architecture**: Node/Express gateway in front of a Python daemon
- **Features**:
  - Interactive Visual Tree Editor
  - JSON-based team configuration
  - Clean Architecture domain core with Hexagonal pattern
  - FastAPI adapters and Event Bus Approval Engine
  - Sprint Planning workspace with deadline tracking
  - AI coding tools and refactor assistant
  - Central code repository with Git merge agent

**Quick Start**:
```bash
git checkout archi-v1-full-stack
npm run dev
# Opens http://localhost:3000
```

**Documentation**: See `archi-v1-full-stack` branch for full project documentation.

---

### **Branch 2: `archi-v2-optimized`**
**Modern Simplified Architecture with Pure FastAPI**

- **Tech Stack**: React + Vite + FastAPI (Python) — No Node.js in request path
- **Architecture**: Single long-running FastAPI process with in-memory state + disk mirror
- **Key Improvements**:
  - Removed Node/Express gateway overhead
  - No subprocess spawning per request
  - Unified state management without multiple interpreters
  - Pure Python + FastAPI stack
  - Honest degradation (Gemini first, offline templates second)
  - Durable state with atomic write-through to JSON

**Quick Start**:
```bash
git checkout archi-v2-optimized
cd archi-v2

# Backend (http://localhost:8000)
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.api.main:app --reload --app-dir .

# Frontend (http://localhost:5173) — second terminal
cd frontend
npm install && npm run dev
```

**Documentation**: See `archi-v2-optimized` branch for comprehensive technical docs.

---

## 🎯 Key Capabilities (Both Versions)

1. **Hierarchical AI Workforce Management**
   - Define org charts with roles and personas
   - Support for multiple configuration modes (UI, JSON file, raw paste)

2. **Direct-Report Delegation Engine**
   - Top-down delegation with Gemini AI
   - Automatic domain-tailored sub-plan generation

3. **Approval & Merge System**
   - Bottom-up diff submissions
   - Unified line-by-line textual diff review
   - Automated branch merging with conflict detection

4. **Deterministic State Machine**
   - Formal agent lifecycle: `IDLE` → `DRAFTING` → `DELEGATED` → `AWAITING_REVIEW` → `APPROVED`
   - Server-enforced governance boundaries

5. **Advanced Features**
   - Sprint planning with deadline tracking
   - AI-powered coding tools (boilerplate generation, unit tests, refactoring)
   - Central code repository with PR viewer
   - Document versioning (principles & plan)

---

## 🛠️ Requirements

- **Python**: 3.10+
- **Node.js**: 18+ (for frontend)
- **API Key** (Optional): Gemini API key for AI features (works offline without it)

---

## 🚀 Getting Started

**For New Projects**: Use `archi-v2-optimized` (recommended)
- Simpler architecture
- Better performance
- No Node.js overhead
- Easier deployment

**For Legacy Support**: Use `archi-v1-full-stack`
- Full-featured implementation
- Node/Express integration
- Comprehensive documentation

---

**Ready to start?** Choose your branch:
```bash
git checkout archi-v1-full-stack    # Full-stack with Node/Express
# OR
git checkout archi-v2-optimized     # Modern FastAPI-only
```

---

## 📝 License & Attribution

ARCHI is an enterprise multi-agent management platform for architectural collaboration and hierarchical delegation.
