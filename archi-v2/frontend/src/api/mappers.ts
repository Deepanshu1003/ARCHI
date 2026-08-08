/**
 * Wire → UI translation.
 *
 * The only shape differences left are UI conveniences: the backend keeps
 * timestamps in seconds and statuses uppercase, the UI wants milliseconds and
 * its own lowercase union.
 */

import {
  AgentDoc,
  AgentNode,
  AgentStatus,
  ArchitectureSlice,
  ChatMessage,
  PendingApproval,
  Project,
} from '../types';
import {
  WireAgent,
  WireApproval,
  WireDocument,
  WireProject,
  WireSlice,
} from './types';

const toMillis = (seconds: number): number => Math.round(seconds * 1000);

export function toAgentStatus(status: string): AgentStatus {
  return status.toLowerCase() as AgentStatus;
}

export function toDoc(document: WireDocument): AgentDoc {
  return {
    id: document.docType,
    title: document.title,
    filename: `${document.docType}.md`,
    category: document.docType,
    docType: document.docType,
    content: document.content,
    updatedAt: toMillis(document.updatedAt),
    version: document.version,
    versions: document.versions.map(version => ({
      version: version.version,
      content: version.content,
      updatedAt: toMillis(version.updatedAt),
      author: version.author ?? undefined,
    })),
  };
}

export function toAgent(agent: WireAgent): AgentNode {
  return {
    id: agent.id,
    parentId: agent.parentId,
    roleName: agent.roleName,
    personName: agent.personName,
    responsibilities: agent.responsibilities,
    status: toAgentStatus(agent.status),
    decisions: agent.decisions,
    childrenIds: agent.childrenIds,
    documents: agent.documents.map(toDoc),
    chatHistory: agent.chatHistory.map(
      (message, index): ChatMessage => ({
        id: `${agent.id}-${index}`,
        role: message.role === 'user' ? 'user' : 'agent',
        content: message.content,
        timestamp: toMillis(message.timestamp),
      }),
    ),
  };
}

export function toSlice(slice: WireSlice): ArchitectureSlice {
  return {
    sliceId: slice.sliceId,
    agentId: slice.agentId,
    title: slice.title,
    domainScope: slice.domainScope,
    content: slice.content,
    version: slice.version,
    isFinalized: slice.isFinalized,
    diffSummary: slice.diffSummary ?? undefined,
  };
}

export function toApproval(approval: WireApproval): PendingApproval {
  return { ...approval };
}

export function toProject(project: WireProject): Project {
  return {
    id: project.projectId,
    name: project.name,
    description: project.description,
    createdAt: toMillis(project.createdAt),
    rootAgentId: project.rootAgentId,
    masterBlueprint: project.masterBlueprint,
    agents: Object.fromEntries(
      Object.entries(project.agents).map(([id, agent]) => [id, toAgent(agent)]),
    ),
    domainSlices: Object.fromEntries(
      Object.entries(project.domainSlices).map(([id, slice]) => [id, toSlice(slice)]),
    ),
    pendingApprovals: Object.fromEntries(
      Object.entries(project.pendingApprovals).map(([id, approvals]) => [
        id,
        approvals.map(toApproval),
      ]),
    ),
  };
}

export function toAgentPayload(agent: AgentNode) {
  return {
    id: agent.id,
    personName: agent.personName,
    roleName: agent.roleName,
    responsibilities: agent.responsibilities,
    parentId: agent.parentId,
    childrenIds: agent.childrenIds ?? [],
    status: (agent.status ?? 'idle').toUpperCase(),
  };
}
