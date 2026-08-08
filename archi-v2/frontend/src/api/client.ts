/**
 * The only place the app talks to the network.
 *
 * Calls FastAPI directly. Unlike v1 there is no fabricated fallback data: a
 * failed call throws, so the UI can say what actually went wrong instead of
 * showing invented architecture text.
 */

import { AgentNode, Project } from '../types';
import { toAgentPayload, toProject } from './mappers';
import {
  ApproveResponse,
  ChatResponse,
  DelegateResponse,
  DocumentListResponse,
  DocumentUploadResponse,
  DraftResponse,
  HealthResponse,
  WireDocumentType,
  WireProject,
} from './types';

export const API_BASE_URL: string =
  (import.meta.env.VITE_ARCHI_API_URL as string | undefined) ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (cause) {
    throw new ApiError(0, `Cannot reach the ARCHI backend at ${API_BASE_URL}.`);
  }
  if (!response.ok) {
    throw new ApiError(response.status, await describeError(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function describeError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (Array.isArray(detail)) {
      return detail.map((item: unknown) => describeDetail(item)).join('; ');
    }
    if (detail) return describeDetail(detail);
    return JSON.stringify(body);
  } catch {
    return response.statusText || `Request failed with status ${response.status}`;
  }
}

function describeDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  const record = detail as { msg?: string; loc?: unknown[] };
  if (record?.msg) {
    return record.loc ? `${record.loc.join('.')}: ${record.msg}` : record.msg;
  }
  return JSON.stringify(detail);
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function health(): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health');
}

export async function getProjects(): Promise<Project[]> {
  const projects = await request<WireProject[]>('/api/projects');
  return projects.map(toProject);
}

export async function getProject(projectId: string): Promise<Project> {
  return toProject(await request<WireProject>(`/api/projects/${projectId}`));
}

export async function createProject(project: Project): Promise<Project> {
  const payload = {
    projectId: project.id,
    name: project.name,
    description: project.description ?? '',
    rootAgentId: project.rootAgentId,
    agents: Object.values(project.agents).map(toAgentPayload),
  };
  return toProject(await request<WireProject>('/api/projects', json(payload)));
}

export async function updateProject(project: Project): Promise<Project> {
  const payload = {
    name: project.name,
    description: project.description ?? '',
    rootAgentId: project.rootAgentId,
    agents: Object.values(project.agents).map(toAgentPayload),
  };
  return toProject(
    await request<WireProject>(`/api/projects/${project.id}`, {
      ...json(payload),
      method: 'PATCH',
    }),
  );
}

/** Creates the project if the backend has not seen it yet, otherwise updates it. */
export async function saveProject(project: Project): Promise<Project> {
  try {
    return await updateProject(project);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return createProject(project);
    }
    throw error;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  await request<void>(`/api/projects/${projectId}`, { method: 'DELETE' });
}

export async function draftArchitecture(
  projectId: string,
  agentId: string,
  context?: string,
): Promise<DraftResponse> {
  return request<DraftResponse>(
    `/api/projects/${projectId}/architecture/draft`,
    json({ agentId, context: context ?? '' }),
  );
}

export async function delegate(
  projectId: string,
  agentId: string,
): Promise<DelegateResponse> {
  return request<DelegateResponse>(
    `/api/projects/${projectId}/architecture/delegate`,
    json({ agentId }),
  );
}

export async function submitForReview(
  projectId: string,
  agentId: string,
  content?: string,
): Promise<import('./types').SubmitResponse> {
  return request(
    `/api/projects/${projectId}/architecture/submit`,
    json({ agentId, content }),
  );
}

export async function approve(
  projectId: string,
  supervisorId: string,
  subordinateId: string,
): Promise<ApproveResponse> {
  return request<ApproveResponse>(
    `/api/projects/${projectId}/architecture/approve`,
    json({ supervisorId, subordinateId }),
  );
}

export async function requestRevision(
  projectId: string,
  supervisorId: string,
  subordinateId: string,
): Promise<void> {
  await request(
    `/api/projects/${projectId}/architecture/request-revision`,
    json({ supervisorId, subordinateId }),
  );
}

export async function sendChatMessage(
  projectId: string,
  agent: AgentNode,
  message: string,
): Promise<ChatResponse> {
  return request<ChatResponse>(
    `/api/projects/${projectId}/chat`,
    json({ agentId: agent.id, message }),
  );
}

export async function listDocuments(
  projectId: string,
  agentId: string,
): Promise<DocumentListResponse> {
  return request<DocumentListResponse>(
    `/api/projects/${projectId}/agents/${agentId}/documents`,
  );
}

export async function uploadDocument(
  projectId: string,
  agentId: string,
  docType: WireDocumentType,
  file: File,
): Promise<DocumentUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  return request<DocumentUploadResponse>(
    `/api/projects/${projectId}/agents/${agentId}/documents/${docType}/upload`,
    { method: 'POST', body: form },
  );
}
