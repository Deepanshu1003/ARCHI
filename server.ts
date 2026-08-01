import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]), "utf-8");
}

function loadProjectsFromDisk(): any[] {
  try {
    const data = fs.readFileSync(PROJECTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading projects from disk:", err);
    return [];
  }
}

function saveProjectsToDisk(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving projects to disk:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Projects CRUD Endpoints
  app.get("/api/projects", (req, res) => {
    const projects = loadProjectsFromDisk();
    res.json(projects);
  });

  app.delete("/api/projects/:id", (req, res) => {
    const { id } = req.params;
    let projects = loadProjectsFromDisk();
    projects = projects.filter((p: any) => p.id !== id);
    saveProjectsToDisk(projects);
    res.json({ success: true, message: `Project ${id} deleted` });
  });

  app.delete("/api/projects", (req, res) => {
    saveProjectsToDisk([]);
    res.json({ success: true, message: "All projects deleted" });
  });

  app.post("/api/projects", (req, res) => {
    const newProject = req.body;
    if (!newProject || !newProject.id) {
      return res.status(400).json({ error: "Invalid project payload" });
    }
    const projects = loadProjectsFromDisk();
    const index = projects.findIndex((p: any) => p.id === newProject.id);
    if (index >= 0) {
      projects[index] = newProject;
    } else {
      projects.push(newProject);
    }
    saveProjectsToDisk(projects);
    res.json({ success: true, project: newProject });
  });

  app.post("/api/project/create", (req, res) => {
    const { project_id, name, root_agent_id, agents } = req.body;
    const projects = loadProjectsFromDisk();
    let proj = projects.find((p: any) => p.id === project_id);
    
    if (!proj) {
      const agentsMap: Record<string, any> = {};
      if (Array.isArray(agents)) {
        for (const a of agents) {
          agentsMap[a.id] = {
            id: a.id,
            personName: a.person_name || a.personName,
            roleName: a.role_name || a.roleName,
            responsibilities: a.responsibilities,
            parentId: a.parent_id !== undefined ? a.parent_id : a.parentId,
            childrenIds: a.children_ids || a.childrenIds || [],
            status: (a.status || 'idle').toLowerCase(),
            decisions: '',
            chatHistory: []
          };
        }
      }
      proj = {
        id: project_id || `proj-${Date.now()}`,
        name: name || "ARCHI Architecture Project",
        createdAt: Date.now(),
        rootAgentId: root_agent_id || (agents && agents[0] ? agents[0].id : "root-1"),
        agents: agentsMap,
        masterBlueprint: "",
        domainSlices: {},
        pendingApprovals: {}
      };
      projects.push(proj);
      saveProjectsToDisk(projects);
    }
    res.json({ success: true, project_id: proj.id, name: proj.name, total_agents: Object.keys(proj.agents || {}).length, root_agent_id: proj.rootAgentId });
  });

  app.post("/api/architecture/create", async (req, res) => {
    const { project_id, agent_id, context } = req.body;
    const projects = loadProjectsFromDisk();
    const proj = projects.find((p: any) => p.id === project_id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const targetAgent = proj.agents[agent_id || proj.rootAgentId];
    if (!targetAgent) return res.status(400).json({ error: "Target agent not found" });

    const isRoot = targetAgent.id === proj.rootAgentId;
    const parentAgent = targetAgent.parentId ? proj.agents[targetAgent.parentId] : null;

    let generatedBlueprint = "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "dummy") {
      try {
        const ai = new GoogleGenAI({ 
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        
        const prompt = `You are ${targetAgent.personName}, the ${targetAgent.roleName} in a software project.
Your core domain responsibilities are: ${targetAgent.responsibilities}
${parentAgent ? `Your supervisor is ${parentAgent.personName} (${parentAgent.roleName}). Their decisions/guidelines are:\n${parentAgent.decisions || 'Align with clean architecture.'}\n` : 'You are the Head Architect overseeing the master blueprint.'}

Context/Instruction: ${context || 'Draft a comprehensive, production-ready Markdown technical architecture specification for your domain.'}

Generate a detailed, well-structured Markdown document containing:
# ${isRoot ? 'Master System Blueprint & Topology' : `Domain Architecture Specification: ${targetAgent.roleName}`}
1. Executive Domain Summary & Scope
2. Core Architectural Principles & Technical Design
3. Data Models, Schemas, & API Interfaces
4. Operational Controls, Error Handling, & Quality Standards`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        generatedBlueprint = response.text;
      } catch (geminiErr) {
        console.warn("Gemini architecture generation fallback used:", geminiErr);
      }
    }

    if (!generatedBlueprint) {
      if (isRoot) {
        generatedBlueprint = `# Master System Blueprint & Topology\n\n` +
          `**Author**: ${targetAgent.personName} (${targetAgent.roleName})\n` +
          `**Scope**: ${targetAgent.responsibilities}\n\n` +
          `## System Architecture Overview\n` +
          `${context || 'Defining modular hexagonal domain boundaries, microservice parameters, and event bus topologies.'}\n\n` +
          `### Key Domain Directives\n` +
          `1. **Planner & Governance Domain**: State machine invariants, transition rules, and schema validators.\n` +
          `2. **Backend Services Domain**: Hexagonal Ports & Adapters architecture using Python 3.11+ and FastAPI / Express API routes.\n` +
          `3. **Frontend Client Domain**: React 18 SPA with real-time state visualization and decision workspace.\n` +
          `4. **Tools & Platform Domain**: Cloud SQL persistence, container runtimes, and event distribution bus.`;
      } else {
        generatedBlueprint = `# Domain Architecture Specification: ${targetAgent.roleName}\n\n` +
          `**Author**: ${targetAgent.personName} (${targetAgent.roleName})\n` +
          `**Supervisor**: ${parentAgent ? `${parentAgent.personName} (${parentAgent.roleName})` : 'System Head'}\n` +
          `**Domain Scope**: ${targetAgent.responsibilities}\n\n` +
          `## 1. Domain Technical Architecture & Design\n` +
          `Defining precise interface boundaries, contract structures, and runtime workflows for **${targetAgent.roleName}**.\n\n` +
          `## 2. API Schemas & Data Models\n` +
          `\`\`\`json\n` +
          `{\n` +
          `  "domain": "${targetAgent.roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}",\n` +
          `  "version": "1.0.0",\n` +
          `  "status": "active_spec"\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `## 3. Operational Policies & Invariants\n` +
          `- Ensure 100% adherence to supervisor guidelines.\n` +
          `- Implement input validation, fault-tolerant error recovery, and logging.`;
      }
    }

    if (isRoot) {
      proj.masterBlueprint = generatedBlueprint;
    }
    targetAgent.status = 'drafting';
    targetAgent.decisions = generatedBlueprint;

    saveProjectsToDisk(projects);
    res.json({ 
      success: true, 
      project_id: proj.id, 
      root_agent_id: targetAgent.id, 
      master_blueprint: generatedBlueprint, 
      root_status: 'drafting' 
    });
  });

  app.post("/api/architecture/finalize", async (req, res) => {
    const { project_id, agent_id } = req.body;
    const projects = loadProjectsFromDisk();
    const proj = projects.find((p: any) => p.id === project_id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const supervisor = proj.agents[agent_id || proj.rootAgentId];
    if (!supervisor) return res.status(400).json({ error: "Supervisor agent not found" });

    supervisor.status = 'delegated';

    const directReportIds = supervisor.childrenIds || [];
    const delegatedSlices: Record<string, string> = {};

    for (const childId of directReportIds) {
      const child = proj.agents[childId];
      if (child) {
        child.status = 'drafting';
        const subPlan = `# Delegated Sub-Plan: ${child.roleName}\n\n` +
          `**Assigned Specialist**: ${child.personName}\n` +
          `**Domain Responsibilities**: ${child.responsibilities}\n\n` +
          `## Actionable Directives from Master Blueprint\n` +
          `1. Expand domain implementation details for **${child.roleName}** derived from Master Blueprint.\n` +
          `2. Establish clean interface schemas, data structures, and state management rules.\n` +
          `3. Refine specifications in workspace and submit up to supervisor upon completion.`;
        child.decisions = subPlan;
        delegatedSlices[childId] = subPlan;
      }
    }

    saveProjectsToDisk(projects);
    res.json({ success: true, project_id: proj.id, root_status: 'delegated', delegated_slices: delegatedSlices });
  });

  app.post("/api/architecture/publish", async (req, res) => {
    const { project_id, agent_id, content, title } = req.body;
    const projects = loadProjectsFromDisk();
    const proj = projects.find((p: any) => p.id === project_id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const agent = proj.agents[agent_id];
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const previousContent = agent.decisions || '';
    agent.decisions = content;

    // Generate textual diff
    let diffSummary = "--- Supervisor Blueprint\n+++ Author Sub-Plan\n@@ -1,5 +1,5 @@\n";
    if (previousContent) {
      const prevLines = previousContent.split('\n').slice(0, 5);
      const newLines = content.split('\n').slice(0, 5);
      diffSummary += prevLines.map((l: string) => `- ${l}`).join('\n') + '\n' + newLines.map((l: string) => `+ ${l}`).join('\n');
    } else {
      diffSummary += `+ ${content.slice(0, 200)}...`;
    }

    agent.diffSummary = diffSummary;

    // If author has direct reports, delegate downward
    if (agent.childrenIds && agent.childrenIds.length > 0) {
      agent.status = 'delegated';
      for (const cid of agent.childrenIds) {
        const child = proj.agents[cid];
        if (child) {
          child.status = 'drafting';
          child.decisions = `# Delegated Sub-Plan from ${agent.personName} (${agent.roleName})\n\n${content.slice(0, 300)}...`;
        }
      }
    }

    // If author has a supervisor, set to awaiting_review and record pending approval
    if (agent.parentId) {
      agent.status = 'awaiting_review';
      if (!proj.pendingApprovals) proj.pendingApprovals = {};
      if (!proj.pendingApprovals[agent.parentId]) proj.pendingApprovals[agent.parentId] = [];
      
      const existingIdx = proj.pendingApprovals[agent.parentId].findIndex((p: any) => p.author_id === agent.id);
      const approvalObj = {
        slice_id: `slice-${agent.id}`,
        supervisor_id: agent.parentId,
        author_id: agent.id,
        title: title || `Spec: ${agent.roleName}`,
        content: content,
        diff_text: diffSummary,
        version: (agent.version || 1) + 1,
        is_finalized: true
      };

      if (existingIdx >= 0) {
        proj.pendingApprovals[agent.parentId][existingIdx] = approvalObj;
      } else {
        proj.pendingApprovals[agent.parentId].push(approvalObj);
      }
    }

    saveProjectsToDisk(projects);
    res.json({ success: true, agent_id: agent.id, agent_status: agent.status, diff_summary: diffSummary });
  });

  app.post("/api/architecture/approve", async (req, res) => {
    const { project_id, supervisor_id, subordinate_id } = req.body;
    const projects = loadProjectsFromDisk();
    const proj = projects.find((p: any) => p.id === project_id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const supervisor = proj.agents[supervisor_id];
    const subordinate = proj.agents[subordinate_id];
    if (!supervisor || !subordinate) return res.status(404).json({ error: "Supervisor or subordinate not found" });

    subordinate.status = 'approved';

    // Merge subordinate decisions into supervisor decisions / master blueprint
    supervisor.decisions += `\n\n### [APPROVED SLICE] ${subordinate.roleName} (${subordinate.personName})\n${subordinate.decisions}`;
    if (supervisor.id === proj.rootAgentId) {
      proj.masterBlueprint = supervisor.decisions;
    }

    // Remove pending approval
    if (proj.pendingApprovals && proj.pendingApprovals[supervisor.id]) {
      proj.pendingApprovals[supervisor.id] = proj.pendingApprovals[supervisor.id].filter(
        (p: any) => p.author_id !== subordinate.id
      );
    }

    saveProjectsToDisk(projects);
    res.json({ success: true, supervisor_id: supervisor.id, subordinate_id: subordinate.id, subordinate_status: 'approved', updated_master_blueprint: supervisor.decisions });
  });

  app.delete("/api/projects/:id", (req, res) => {
    const projectId = req.params.id;
    let projects = loadProjectsFromDisk();
    projects = projects.filter((p: any) => p.id !== projectId);
    saveProjectsToDisk(projects);
    res.json({ success: true, id: projectId });
  });

  // AI Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { agent, parentAgent, message, history } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;

      let systemPrompt = `You are ${agent.personName}, acting as the ${agent.roleName} for a software project.\n`;
      systemPrompt += `Your core responsibilities are: ${agent.responsibilities}\n`;
      
      if (parentAgent) {
        systemPrompt += `\nYour supervisor is ${parentAgent.personName} (${parentAgent.roleName}). `;
        if (parentAgent.decisions) {
          systemPrompt += `They have formalized the following architectural decisions/context which you must align with:\n${parentAgent.decisions}\n`;
        }
      } else {
        systemPrompt += `\nYou are the Head of the project. You define the overall architecture and delegate downward.\n`;
      }

      systemPrompt += `\nYou manage your own PRIVATE document memory bank. Your documents belong exclusively to you (${agent.personName}) and are not shared or forwarded to other team members as-is.\n`;
      systemPrompt += `If the user asks you to create, update, or delete a document in your memory bank, include action tags in your response:\n`;
      systemPrompt += `- To create a document: [CREATE_DOC: "Title" | content here...]\n`;
      systemPrompt += `- To update a document: [UPDATE_DOC: "Title or category" | new content here...]\n`;
      systemPrompt += `- To delete a document: [DELETE_DOC: "Title or category"]\n`;
      systemPrompt += `You are chatting with the human project director. Discuss your part of the architecture, clarify details, and help formalize the understanding. Keep your responses concise, professional, clear, and focused on system design.`;

      // Mock response if no valid API key is provided
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "dummy") {
        return res.json({ 
          reply: `As ${agent.personName} (${agent.roleName}), I have received your instruction: "${message}". Based on my responsibilities (${agent.responsibilities}), I recommend structuring this component cleanly and maintaining strict API boundaries with the rest of the team.` 
        });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Understood. I am ready." }] },
            ...history.map((h: any) => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }]
            })),
            { role: 'user', parts: [{ text: message }] }
          ]
        });

        res.json({ reply: response.text });
      } catch (geminiError: any) {
        console.warn("Gemini API unavailable or high demand, using intelligent fallback reply:", geminiError?.message || geminiError);
        res.json({ 
          reply: `As ${agent.personName} (${agent.roleName}), I have received your message: "${message}".\n\n` +
            `Based on my responsibilities (${agent.responsibilities}), I am aligning our strategy to ensure clean architecture and robust integration across our team.` 
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });

  // Delegation Endpoint: Breaks down supervisor master plan for direct reports
  app.post("/api/delegate", async (req, res) => {
    try {
      const { supervisor, directReports, parentPlan } = req.body;

      if (!supervisor || !directReports || !Array.isArray(directReports) || directReports.length === 0) {
        return res.status(400).json({ error: "Invalid delegation payload. Must provide supervisor and non-empty directReports array." });
      }

      // Helper function to build fallback structured delegation
      const buildFallbackDelegations = () => {
        const fallbackMap: Record<string, string> = {};
        for (const child of directReports) {
          fallbackMap[child.id] = `[Delegated Sub-Plan from ${supervisor.personName} (${supervisor.roleName})]\n\n` +
            `🎯 Domain Target: ${child.roleName}\n` +
            `📌 Core Responsibilities: ${child.responsibilities}\n\n` +
            `📋 Directives derived from Master Plan:\n` +
            `1. Align implementation with overall direction: "${(parentPlan || 'Master strategy defined').slice(0, 150)}..."\n` +
            `2. Develop domain-specific solutions, code structures, and design components for ${child.roleName}.\n` +
            `3. Verify interfaces and submit updated sub-plan back to ${supervisor.personName}.`;
        }
        return fallbackMap;
      };

      const apiKey = process.env.GEMINI_API_KEY;

      // Fallback generator if no key
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "dummy") {
        return res.json({ success: true, delegations: buildFallbackDelegations() });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an AI Multi-Agent Workflow Orchestrator.
The Lead/Supervisor "${supervisor.personName}" (${supervisor.roleName}) has finalized the following overall project master plan:

--- MASTER PLAN BEGIN ---
${parentPlan || 'General system architecture and implementation strategy.'}
--- MASTER PLAN END ---

The supervisor is delegating tasks to their DIRECT REPORTS ONLY:
${directReports.map((dr: any, idx: number) => `${idx + 1}. ID: "${dr.id}" | Name: ${dr.personName} | Role: ${dr.roleName} | Responsibilities: ${dr.responsibilities}`).join('\n')}

INSTRUCTIONS:
1. For EACH direct report listed above, extract and expand a detailed, actionable, domain-specific sub-plan tailored ONLY to their exact role and responsibilities.
2. Return ONLY a valid JSON object mapping each direct report's exact ID to their tailored string sub-plan.
3. Example JSON format:
{
  "agent-id-1": "Detailed sub-plan for Agent 1...",
  "agent-id-2": "Detailed sub-plan for Agent 2..."
}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ]
        });

        let responseText = response.text || '';
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        try {
          const parsedDelegations = JSON.parse(responseText);
          res.json({ success: true, delegations: parsedDelegations });
        } catch (pErr) {
          // Fallback parsing if LLM didn't return strict JSON
          const fallbackMap = buildFallbackDelegations();
          for (const child of directReports) {
            if (responseText.includes(child.id) || responseText.includes(child.personName)) {
              fallbackMap[child.id] = `[Delegated Sub-Plan from ${supervisor.personName} (${supervisor.roleName})]\n\n${responseText.slice(0, 600)}`;
            }
          }
          res.json({ success: true, delegations: fallbackMap });
        }
      } catch (geminiErr: any) {
        console.warn("Gemini API high demand / 503 error during delegation, serving structured fallbacks:", geminiErr?.message || geminiErr);
        res.json({ success: true, delegations: buildFallbackDelegations(), warning: "Served high-demand fallback delegation." });
      }

    } catch (error) {
      console.error("Delegation error:", error);
      res.status(500).json({ error: "Failed to process delegation breakdown." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
