/**
 * Wire types, mirroring backend/api/schemas one-for-one.
 *
 * The backend generates camelCase aliases from its snake_case domain, so these
 * are exactly what crosses the network — no hand-translation anywhere.
 */

export type WireAgentStatus =
  | 'IDLE'
  | 'DRAFTING'
  | 'DELEGATED'
  | 'AWAITING_REVIEW'
  | 'APPROVED';

export type WireDocumentType = 'principles' | 'plan';

export interface WireDocumentVersion {
  version: number;
  content: string;
  updatedAt: number;
  author?: string | null;
  source: string;
}

export interface WireDocument {
  docType: WireDocumentType;
  agentId: string;
  title: string;
  content: string;
  version: number;
  updatedAt: number;
  isPopulated: boolean;
  versions: WireDocumentVersion[];
}

export interface WireChatMessage {
  role: string;
  content: string;
  timestamp: number;
}

export interface WireAgent {
  id: string;
  personName: string;
  roleName: string;
  responsibilities: string;
  parentId: string | null;
  childrenIds: string[];
  status: WireAgentStatus;
  decisions: string;
  isSupervisor: boolean;
  isSubordinate: boolean;
  chatHistory: WireChatMessage[];
  documents: WireDocument[];
}

export interface WireSlice {
  sliceId: string;
  agentId: string;
  title: string;
  domainScope: string;
  content: string;
  version: number;
  isFinalized: boolean;
  diffSummary?: string | null;
}

export interface WireApproval {
  sliceId: string;
  supervisorId: string;
  authorId: string;
  title: string;
  content: string;
  diffText: string;
  version: number;
  isFinalized: boolean;
  createdAt: number;
}

export interface WireProject {
  projectId: string;
  name: string;
  description: string;
  createdAt: number;
  rootAgentId: string;
  masterBlueprint: string;
  agents: Record<string, WireAgent>;
  domainSlices: Record<string, WireSlice>;
  pendingApprovals: Record<string, WireApproval[]>;
}

export interface DegradedInfo {
  degraded: boolean;
  reason: string;
  provider: string;
}

export interface DraftResponse {
  slice: WireSlice;
  agentStatus: WireAgentStatus;
  governanceViolations: string[];
  degradedInfo: DegradedInfo;
}

export interface DelegateResponse {
  supervisorId: string;
  recipients: string[];
  slices: Record<string, WireSlice>;
  agentStatuses: Record<string, WireAgentStatus>;
  degradedInfo: DegradedInfo;
}

export interface SubmitResponse {
  approval: WireApproval;
  agentStatus: WireAgentStatus;
}

export interface ApproveResponse {
  supervisorId: string;
  subordinateId: string;
  mergedContent: string;
  conflicts: string[];
  summary: string;
  agentStatuses: Record<string, WireAgentStatus>;
}

export interface ChatResponse {
  agentId: string;
  reply: string;
  documentsWritten: WireDocument[];
  degradedInfo: DegradedInfo;
}

export interface DocumentListResponse {
  agentId: string;
  documents: WireDocument[];
}

export interface DocumentUploadResponse {
  agentId: string;
  document: WireDocument;
}

export interface HealthResponse {
  status: string;
  llmProviders: string[];
  geminiConfigured: boolean;
}
