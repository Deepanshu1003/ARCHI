import express from "express";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let pythonServerProcess: ChildProcess | null = null;
const PYTHON_PORT = 3002;

function startPythonServer() {
  const serverPy = path.join(process.cwd(), "backend", "server.py");
  console.log("Starting Python persistent core HTTP server daemon...");
  
  pythonServerProcess = spawn("python3", [serverPy], {
    env: { ...process.env, PYTHONPATH: process.cwd() },
    stdio: ["ignore", "inherit", "inherit"]
  });

  pythonServerProcess.on("error", (err) => {
    console.error("Failed to start Python persistent server:", err);
  });

  pythonServerProcess.on("exit", (code) => {
    console.log(`Python persistent server exited with code ${code}`);
  });

  process.on("exit", () => {
    if (pythonServerProcess) {
      pythonServerProcess.kill();
    }
  });
}

async function callPythonHttp(endpoint: string, payload?: any, method: string = "POST"): Promise<any> {
  const url = `http://127.0.0.1:${PYTHON_PORT}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload !== undefined ? JSON.stringify(payload) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Python server error: ${res.statusText}`);
    }
    return data;
  } catch (err: any) {
    console.error(`Error calling Python HTTP (${endpoint}):`, err.message);
    throw err;
  }
}

async function startServer() {
  // Start the persistent Python backend server daemon
  startPythonServer();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Python Health Endpoint
  app.get("/api/python/health", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/python/health", undefined, "GET");
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Python core backend daemon is unavailable", details: err.message });
    }
  });

  // Python Diff Engine Endpoint
  app.post("/api/python/diff", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/python/diff", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to calculate diff in Python engine", details: err.message });
    }
  });

  // Python State Machine Transition Endpoint
  app.post("/api/python/transition", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/python/transition", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed state transition in Python state machine", details: err.message });
    }
  });

  // Projects CRUD Endpoints (Backed by Persistent Python Memory Repository & Disk)
  app.get("/api/projects", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/python/projects", undefined, "GET");
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load projects from Python backend", details: err.message });
    }
  });

  app.get("/api/project/:id", async (req, res) => {
    try {
      const projects: any[] = await callPythonHttp("/api/python/projects", undefined, "GET");
      const project = projects.find((p: any) => p.id === req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch project from Python backend", details: err.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/python/projects", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save project in Python memory repository", details: err.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/python/delete_project", { id: req.params.id });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete project in Python repository", details: err.message });
    }
  });

  app.delete("/api/projects", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/python/delete_all_projects", {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete all projects in Python repository", details: err.message });
    }
  });

  // Core Multi-Agent Architecture API Endpoints (Pure Python Domain Core)
  app.post("/api/project/create", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/project/create", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create project in Python domain core", details: err.message });
    }
  });

  app.post("/api/architecture/create", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/architecture/create", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate architecture in Python agent adapter", details: err.message });
    }
  });

  app.post("/api/architecture/finalize", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/architecture/finalize", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to finalize and delegate architecture in Python delegation adapter", details: err.message });
    }
  });

  app.post("/api/architecture/publish", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/architecture/publish", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to publish slice in Python event bus", details: err.message });
    }
  });

  app.post("/api/architecture/approve", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/architecture/approve", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to approve slice in Python domain state machine", details: err.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/chat", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to process chat in Python Gemini agent adapter", details: err.message });
    }
  });

  app.post("/api/delegate", async (req, res) => {
    try {
      const data = await callPythonHttp("/api/delegate", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to process delegation breakdown in Python delegation adapter", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`🚀 Python Clean Architecture Core Engine connected via persistent HTTP daemon on port ${PYTHON_PORT}`);
  });
}

startServer();
