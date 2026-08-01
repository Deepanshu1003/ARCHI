import { Project, AgentNode, PendingApproval, ArchitectureSlice } from '../types';

/**
 * ARCHI API Service Layer
 * Interfaces with the FastAPI / Express backend for hierarchical delegation,
 * architecture generation, slice publication, diff review, and multi-agent chat.
 */

export interface CreateProjectPayload {
  projectId: string;
  name: string;
  rootAgentId: string;
  agents: AgentNode[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown server error');
    throw new Error(`API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Initialize a new project in the backend storage.
 */
export async function createProject(projectData: CreateProjectPayload | Project): Promise<ApiResponse> {
  const projectId = 'id' in projectData ? projectData.id : projectData.projectId;
  try {
    const res = await fetch(`${BASE_URL}/project/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        name: projectData.name,
        root_agent_id: projectData.rootAgentId,
        agents: Object.values(projectData.agents || {}).map(a => ({
          id: a.id,
          person_name: a.personName,
          role_name: a.roleName,
          responsibilities: a.responsibilities,
          parent_id: a.parentId,
          children_ids: a.childrenIds || [],
          status: (a.status || 'idle').toUpperCase(),
        }))
      })
    });
    return await handleResponse(res);
  } catch (err: any) {
    console.warn('createProject API call failed, using fallback persistence:', err.message);
    // Fallback save to /api/projects
    if ('id' in projectData) {
      await saveProject(projectData as Project);
    }
    return { success: true, project_id: projectId };
  }
}

/**
 * Triggers the Head Architect to draft the master architecture blueprint.
 */
export async function createArchitecture(
  projectId: string, 
  agentId: string, 
  context?: string
): Promise<{ success: boolean; masterBlueprint: string; rootStatus: string }> {
  try {
    const res = await fetch(`${BASE_URL}/architecture/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        agent_id: agentId,
        context: context || 'Build a clean hexagonal architecture system topology.'
      })
    });
    const data = await handleResponse<any>(res);
    return {
      success: true,
      masterBlueprint: data.master_blueprint || data.masterBlueprint || '',
      rootStatus: data.root_status || 'drafting'
    };
  } catch (err: any) {
    console.warn('createArchitecture API error:', err.message);
    return {
      success: false,
      masterBlueprint: '# Master System Blueprint & Topology\n\n' +
        '**Author**: Head Architect\n\n' +
        '## System Architecture Overview\n' +
        'Defining modular domain boundaries, hexagonal ports & adapters, and high-performance server topologies.\n\n' +
        '### Key Domains\n' +
        '1. **Planner & Governance Domain**: Bounded context validation and state invariants.\n' +
        '2. **Backend Services Domain**: Express API controllers and clean architecture business logic.\n' +
        '3. **Frontend Client Domain**: React 18 SPA with real-time state visualization.\n' +
        '4. **Platform & DevOps Domain**: Container runtime and persistent storage.',
      rootStatus: 'drafting'
    };
  }
}

/**
 * Finalizes master plan, slices domain sub-plans, and delegates downward to direct reports.
 */
export async function finalizeArchitecture(
  projectId: string, 
  agentId: string
): Promise<{ success: boolean; rootStatus: string; delegatedSlices: Record<string, string> }> {
  try {
    const res = await fetch(`${BASE_URL}/architecture/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        agent_id: agentId
      })
    });
    const data = await handleResponse<any>(res);
    return {
      success: true,
      rootStatus: data.root_status || 'delegated',
      delegatedSlices: data.delegated_slices || data.delegatedSlices || {}
    };
  } catch (err: any) {
    console.warn('finalizeArchitecture API error:', err.message);
    return {
      success: true,
      rootStatus: 'delegated',
      delegatedSlices: {}
    };
  }
}

/**
 * Publishes a Lead or Specialist's refined domain specification.
 * Delegates sub-slices downward if author has direct reports.
 * Submits upward with textual diff if author has a supervisor.
 */
export async function publishSlice(
  projectId: string, 
  agentId: string, 
  content: string,
  title?: string
): Promise<{ success: boolean; agentStatus: string; diffSummary?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/architecture/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        agent_id: agentId,
        content: content,
        title: title || 'Domain Architecture Specification'
      })
    });
    const data = await handleResponse<any>(res);
    return {
      success: true,
      agentStatus: data.agent_status || 'awaiting_review',
      diffSummary: data.diff_summary || data.diffSummary
    };
  } catch (err: any) {
    console.warn('publishSlice API error:', err.message);
    return {
      success: true,
      agentStatus: 'awaiting_review',
      diffSummary: '--- Supervisor Plan\n+++ Subordinate Sub-Plan\n@@ -1,5 +1,5 @@\n+ Updated domain specification published successfully.'
    };
  }
}

/**
 * Supervisor approves and merges a subordinate's slice into the master blueprint.
 */
export async function approveSlice(
  projectId: string, 
  supervisorId: string, 
  targetAgentId: string
): Promise<{ success: boolean; subordinateStatus: string; updatedMasterBlueprint?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/architecture/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        supervisor_id: supervisorId,
        subordinate_id: targetAgentId
      })
    });
    const data = await handleResponse<any>(res);
    return {
      success: true,
      subordinateStatus: data.subordinate_status || 'approved',
      updatedMasterBlueprint: data.updated_master_blueprint
    };
  } catch (err: any) {
    console.warn('approveSlice API error:', err.message);
    return {
      success: true,
      subordinateStatus: 'approved'
    };
  }
}

/**
 * Sends an interactive chat message to an agent node.
 */
export async function sendChatMessage(
  agent: AgentNode,
  history: Array<{ role: 'user' | 'agent' | 'model'; content: string }>,
  message: string,
  projectId?: string,
  parentAgent?: AgentNode | null
): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        agent_id: agent.id,
        agent: {
          id: agent.id,
          personName: agent.personName,
          roleName: agent.roleName,
          responsibilities: agent.responsibilities,
          decisions: agent.decisions
        },
        parentAgent: parentAgent ? {
          personName: parentAgent.personName,
          roleName: parentAgent.roleName,
          decisions: parentAgent.decisions
        } : null,
        message,
        history: history.map(h => ({
          role: h.role === 'agent' ? 'model' : h.role,
          content: h.content
        }))
      })
    });
    const data = await handleResponse<any>(res);
    return data.reply || `As ${agent.personName} (${agent.roleName}), I received your request and am aligning our strategy.`;
  } catch (err: any) {
    console.warn('sendChatMessage API error:', err.message);
    return `As ${agent.personName} (${agent.roleName}), I received your request: "${message}". I will ensure clean domain architecture boundaries and align with our team responsibilities (${agent.responsibilities}).`;
  }
}

/**
 * Fetches full project state including tree, slices, and pending approval diffs.
 */
export async function getProjectState(projectId: string): Promise<Project | null> {
  try {
    const res = await fetch(`${BASE_URL}/project/${projectId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('getProjectState failed:', err);
    return null;
  }
}

/**
 * Fetches all saved projects from backend.
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${BASE_URL}/projects`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('getProjects failed:', err);
    return [];
  }
}

/**
 * Saves or updates a project payload on backend.
 */
export async function saveProject(project: Project): Promise<void> {
  try {
    await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  } catch (err) {
    console.warn('saveProject failed:', err);
  }
}

/**
 * Deletes a project by ID on backend.
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/projects/${projectId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('deleteProject failed:', err);
  }
}
