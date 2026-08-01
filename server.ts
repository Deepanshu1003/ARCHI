import express from "express";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Executes the Python clean architecture bridge executor.
 * Passes payload to Python stdin and returns parsed JSON response from Python stdout.
 */
function runPythonBridge(action: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const bridgeScript = path.join(process.cwd(), "backend", "bridge.py");
    const pyProcess = execFile(
      "python3",
      [bridgeScript, action],
      {
        env: { ...process.env, PYTHONPATH: process.cwd() },
        maxBuffer: 10 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error && !stdout) {
          console.error(`Python bridge error (${action}):`, stderr || error.message);
          return reject(error);
        }
        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (err) {
          console.error(`Failed to parse Python bridge JSON output (${action}):`, stdout);
          reject(err);
        }
      }
    );

    if (payload !== undefined && pyProcess.stdin) {
      pyProcess.stdin.write(JSON.stringify(payload));
      pyProcess.stdin.end();
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Python Health Endpoint
  app.get("/api/python/health", async (req, res) => {
    try {
      const data = await runPythonBridge("health", {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Python core backend is unavailable", details: err.message });
    }
  });

  // Python Diff Engine Endpoint
  app.post("/api/python/diff", async (req, res) => {
    try {
      const data = await runPythonBridge("diff", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to calculate diff in Python engine", details: err.message });
    }
  });

  // Python State Machine Transition Endpoint
  app.post("/api/python/transition", async (req, res) => {
    try {
      const data = await runPythonBridge("transition", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed state transition in Python state machine", details: err.message });
    }
  });

  // Projects CRUD Endpoints (Backed by Python Memory Repository & Disk)
  app.get("/api/projects", async (req, res) => {
    try {
      const data = await runPythonBridge("get_projects", {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load projects from Python backend", details: err.message });
    }
  });

  app.get("/api/project/:id", async (req, res) => {
    try {
      const projects: any[] = await runPythonBridge("get_projects", {});
      const project = projects.find((p: any) => p.id === req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch project from Python backend", details: err.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const data = await runPythonBridge("save_project", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save project in Python memory repository", details: err.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const data = await runPythonBridge("delete_project", { id: req.params.id });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete project in Python repository", details: err.message });
    }
  });

  app.delete("/api/projects", async (req, res) => {
    try {
      const data = await runPythonBridge("delete_all_projects", {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete all projects in Python repository", details: err.message });
    }
  });

  // Core Multi-Agent Architecture API Endpoints (Pure Python Domain Core)
  app.post("/api/project/create", async (req, res) => {
    try {
      const data = await runPythonBridge("create_project", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create project in Python domain core", details: err.message });
    }
  });

  app.post("/api/architecture/create", async (req, res) => {
    try {
      const data = await runPythonBridge("create_architecture", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate architecture in Python agent adapter", details: err.message });
    }
  });

  app.post("/api/architecture/finalize", async (req, res) => {
    try {
      const data = await runPythonBridge("finalize_architecture", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to finalize and delegate architecture in Python delegation adapter", details: err.message });
    }
  });

  app.post("/api/architecture/publish", async (req, res) => {
    try {
      const data = await runPythonBridge("publish_slice", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to publish slice in Python event bus", details: err.message });
    }
  });

  app.post("/api/architecture/approve", async (req, res) => {
    try {
      const data = await runPythonBridge("approve_slice", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to approve slice in Python domain state machine", details: err.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const data = await runPythonBridge("chat", req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to process chat in Python Gemini agent adapter", details: err.message });
    }
  });

  app.post("/api/delegate", async (req, res) => {
    try {
      const data = await runPythonBridge("delegate", req.body);
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
    console.log(`🚀 Python Clean Architecture Core Engine connected via Python Bridge`);
  });
}

startServer();

