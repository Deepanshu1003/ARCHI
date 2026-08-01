export type AgentStatus = 'idle' | 'drafting' | 'delegated' | 'awaiting_review' | 'approved' | 'active' | 'waiting_on_subordinates' | 'reviewing';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export interface DocumentVersion {
  version: number;
  content: string;
  updatedAt: number;
  author?: string;
}

export interface RequiredDocumentType {
  docType: string;
  displayName: string;
  description: string;
  required: boolean;
}

export interface RoleDocumentSchema {
  roleId: string;
  requiredDocumentTypes: RequiredDocumentType[];
}

export interface AgentDoc {
  id: string;
  title: string;
  filename: string;
  category: 'design_principles' | 'architecture' | 'procedural' | 'episodic' | 'sprint_planning' | 'custom' | string;
  docType?: string;
  content: string;
  updatedAt: number;
  version?: number;
  versions?: DocumentVersion[];
  isArchived?: boolean;
  isQuarantined?: boolean;
  quarantineReason?: string;
}

export interface AgentNode {
  id: string;
  parentId: string | null;
  roleName: string;
  personName: string;
  responsibilities: string;
  status: AgentStatus;
  decisions: string;
  chatHistory: ChatMessage[];
  childrenIds: string[];
  documents?: AgentDoc[];
  diffSummary?: string;
  version?: number;
}

export interface ArchitectureSlice {
  sliceId: string;
  agentId: string;
  title: string;
  domainScope: string;
  content: string;
  version: number;
  isFinalized: boolean;
  diffSummary?: string;
}

export interface PendingApproval {
  slice_id: string;
  supervisor_id: string;
  author_id: string;
  title: string;
  content: string;
  diff_text: string;
  version: number;
  is_finalized: boolean;
}

export type SprintStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'DONE';

export interface SprintSubTask {
  subTaskId: string;
  title: string;
  assignedTo: string;
  assignedBy: string;
  deadlineDays: number;
  status: TaskStatus;
  executionDiff?: string;
  reviewNotes?: string;
}

export interface SprintTask {
  taskId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  deadlineDays: number;
  status: TaskStatus;
  subTasks: SprintSubTask[];
  executionDiff?: string;
  reviewNotes?: string;
}

export interface Sprint {
  sprintId: string;
  sprintName: string;
  createdBy: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  assignedMembers: string[];
  tasks: SprintTask[];
}

export interface CodeFile {
  filePath: string;
  language: string;
  content: string;
  lastUpdatedBy: string;
  updatedAt: number;
}

export interface PullRequest {
  id: string;
  title: string;
  authorId: string;
  branchName: string;
  targetBranch: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED' | 'CONFLICT';
  codeFiles: CodeFile[];
  summary: string;
  createdAt: number;
  mergedAt?: number;
  mergedBy?: string;
}

export interface CodeRepository {
  mainBranch: CodeFile[];
  pullRequests: PullRequest[];
  gitMergeAgent: {
    id: string;
    personName: string;
    roleName: string;
    status: 'idle' | 'analyzing' | 'merging';
  };
}

export interface ProjectGenesisDocument {
  id: string;
  docType: 'origin_document' | 'brainstorm_log' | 'principles_document' | 'vision_and_scope';
  title: string;
  filename: string;
  scope: 'project';
  content: string;
  updatedAt: number;
  version: number;
  versions?: DocumentVersion[];
  isReadOnly?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  rootAgentId: string;
  agents: Record<string, AgentNode>;
  genesisDocuments?: Record<string, ProjectGenesisDocument>;
  masterBlueprint?: string;
  domainSlices?: Record<string, ArchitectureSlice>;
  pendingApprovals?: Record<string, PendingApproval[]>;
  sprints?: Record<string, Sprint>;
  repository?: CodeRepository;
}
