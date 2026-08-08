import { ProjectGenesisDocument } from '../types';

/**
 * Generates Phase 0 Project Genesis Documents (Project-Scoped):
 * 1. Origin Document (Founder's Concept, append-only/read-only for agents)
 * 2. Brainstorm Log (Exploration notes, alternatives considered, dead ends)
 * 3. Principles Document (Non-negotiable architectural rules seeded from Section 1)
 * 4. Vision & Scope Statement (Explicitly in-scope and out-of-scope items)
 */
export function createProjectGenesisDocuments(
  projectName: string,
  projectDescription?: string
): Record<string, ProjectGenesisDocument> {
  const now = Date.now();

  const originDoc: ProjectGenesisDocument = {
    id: 'genesis-origin',
    docType: 'origin_document',
    title: "Origin Document (Founder's Concept)",
    filename: '00_origin_document.md',
    scope: 'project',
    content: `# Origin Document (Founder's Concept)\n\n**Project**: ${projectName}\n**Created**: ${new Date(now).toLocaleDateString()}\n**Scope**: Project Level (Phase 0 Genesis)\n\n## Founder's Initial Vision\n${projectDescription || 'Build ARCHI (Agentic Role-based Collaborative Hierarchical Infrastructure), a multi-agent software engineering simulation platform where autonomous specialized agents collaborate hierarchically under deterministic state governance.'}\n\n## Core System Purpose\nTo model, simulate, and execute multi-agent software architecture delegation, sprint planning, and code repository release workflows with human-in-the-loop oversight.\n\n---\n*Note: This document represents the founder's immutable core concept. Agents must never silently edit or alter this document.*`,
    updatedAt: now,
    version: 1,
    versions: [
      {
        version: 1,
        content: `# Origin Document (Founder's Concept)\n\n**Project**: ${projectName}\n**Created**: ${new Date(now).toLocaleDateString()}\n**Scope**: Project Level (Phase 0 Genesis)\n\n## Founder's Initial Vision\n${projectDescription || 'Build ARCHI (Agentic Role-based Collaborative Hierarchical Infrastructure), a multi-agent software engineering simulation platform where autonomous specialized agents collaborate hierarchically under deterministic state governance.'}\n\n## Core System Purpose\nTo model, simulate, and execute multi-agent software architecture delegation, sprint planning, and code repository release workflows with human-in-the-loop oversight.\n\n---\n*Note: This document represents the founder's immutable core concept. Agents must never silently edit or alter this document.*`,
        updatedAt: now,
        author: 'Founder / Project Creator'
      }
    ],
    isReadOnly: true
  };

  const brainstormLog: ProjectGenesisDocument = {
    id: 'genesis-brainstorm',
    docType: 'brainstorm_log',
    title: 'Brainstorm Log & Alternatives Considered',
    filename: '01_brainstorm_log.md',
    scope: 'project',
    content: `# Brainstorm Log & Architectural Trade-off Analysis\n\n**Project**: ${projectName}\n\n## Exploration Notes & Alternatives Considered\n1. **Single Monolithic LLM Agent**: Dropped due to context window saturation, lack of specialized domain focus, and silent hallucinated state transitions.\n2. **Flat Peer-to-Peer Agent Mesh**: Dropped due to circular delegation loops, uncoordinated merge conflicts, and lack of supervisory review hierarchy.\n3. **Direct Express-Python Import Coupling**: Dropped to guarantee pure Python domain core modularity with zero external dependencies.\n\n## Key Technical Decisions\n- Adopted Hexagonal Architecture (Ports and Adapters) with pure Python domain core.\n- Implemented deterministic state machine transitions (\`IDLE\` -> \`DRAFTING\` -> \`DELEGATED\` -> \`AWAITING_REVIEW\` -> \`APPROVED\`).\n- Enforced diff-based supervisor reviews rather than automatic merges.`,
    updatedAt: now,
    version: 1,
    versions: [
      {
        version: 1,
        content: `# Brainstorm Log & Architectural Trade-off Analysis\n\n**Project**: ${projectName}\n\n## Exploration Notes & Alternatives Considered\n1. **Single Monolithic LLM Agent**: Dropped due to context window saturation, lack of specialized domain focus, and silent hallucinated state transitions.\n2. **Flat Peer-to-Peer Agent Mesh**: Dropped due to circular delegation loops, uncoordinated merge conflicts, and lack of supervisory review hierarchy.\n3. **Direct Express-Python Import Coupling**: Dropped to guarantee pure Python domain core modularity with zero external dependencies.\n\n## Key Technical Decisions\n- Adopted Hexagonal Architecture (Ports and Adapters) with pure Python domain core.\n- Implemented deterministic state machine transitions (\`IDLE\` -> \`DRAFTING\` -> \`DELEGATED\` -> \`AWAITING_REVIEW\` -> \`APPROVED\`).\n- Enforced diff-based supervisor reviews rather than automatic merges.`,
        updatedAt: now,
        author: 'Head Architect (Phase 0)'
      }
    ]
  };

  const principlesDoc: ProjectGenesisDocument = {
    id: 'genesis-principles',
    docType: 'principles_document',
    title: 'Principles Document (Non-Negotiable Architecture Rules)',
    filename: '02_principles_document.md',
    scope: 'project',
    content: `# Principles Document (Non-Negotiable Architectural Rules)\n\n**Project**: ${projectName}\n\n1. **Two Separate Runtimes, Connected Only Through Ports**\n   - Pure Python 3.11+ domain core (\`backend/core/\`) with ZERO third-party dependencies.\n   - Node/Express layer (\`server.ts\`) handles HTTP, disk persistence, and Gemini API calls.\n   - Runtimes communicate purely through HTTP REST boundaries via FastAPI.\n\n2. **Deterministic State Machine**\n   - Strict state transitions: \`IDLE\` -> \`DRAFTING\` -> \`DELEGATED\` -> \`AWAITING_REVIEW\` -> \`APPROVED\`.\n   - Invalid transitions raise explicit errors.\n\n3. **Diff-Based Review, Not Blind Merge**\n   - \`difflib.unified_diff\` computed for all subordinate sub-plans before supervisor approval.\n\n4. **Role-Based Memory Schemas**\n   - Role-driven schemas define required document types per agent.\n\n5. **No Silent Failures on LLM Output Parsing**\n   - Invalid memory tags (\`[DOC_CREATE]\`, \`[DOC_UPDATE]\`, \`[DOC_DELETE]\`) are quarantined for human review.`,
    updatedAt: now,
    version: 1,
    versions: [
      {
        version: 1,
        content: `# Principles Document (Non-Negotiable Architectural Rules)\n\n**Project**: ${projectName}\n\n1. **Two Separate Runtimes, Connected Only Through Ports**\n   - Pure Python 3.11+ domain core (\`backend/core/\`) with ZERO third-party dependencies.\n   - Node/Express layer (\`server.ts\`) handles HTTP, disk persistence, and Gemini API calls.\n   - Runtimes communicate purely through HTTP REST boundaries via FastAPI.\n\n2. **Deterministic State Machine**\n   - Strict state transitions: \`IDLE\` -> \`DRAFTING\` -> \`DELEGATED\` -> \`AWAITING_REVIEW\` -> \`APPROVED\`.\n   - Invalid transitions raise explicit errors.\n\n3. **Diff-Based Review, Not Blind Merge**\n   - \`difflib.unified_diff\` computed for all subordinate sub-plans before supervisor approval.\n\n4. **Role-Based Memory Schemas**\n   - Role-driven schemas define required document types per agent.\n\n5. **No Silent Failures on LLM Output Parsing**\n   - Invalid memory tags (\`[DOC_CREATE]\`, \`[DOC_UPDATE]\`, \`[DOC_DELETE]\`) are quarantined for human review.`,
        updatedAt: now,
        author: 'System Architecture Governance'
      }
    ]
  };

  const visionScopeDoc: ProjectGenesisDocument = {
    id: 'genesis-vision-scope',
    docType: 'vision_and_scope',
    title: 'Vision & Scope Statement',
    filename: '03_vision_and_scope.md',
    scope: 'project',
    content: `# Vision & Scope Statement\n\n**Project**: ${projectName}\n\n## Explicitly In-Scope (Current Version)\n- Pure Python hexagonal domain core with FastAPI gateway and Express server.\n- Role-based memory schemas and tag quarantine system.\n- Hierarchical delegation with line-by-line diff review modals.\n- Interactive Sprint Planning Workspace with Deadline Days metrics.\n- Code Repository Workspace with Morgan AI Git Merge Agent.\n\n## Explicitly Out-Of-Scope (Current Version)\n- Direct automated production deployment pipelines to cloud infrastructure.\n- Multi-tenant database clustering or distributed Redis state caches.`,
    updatedAt: now,
    version: 1,
    versions: [
      {
        version: 1,
        content: `# Vision & Scope Statement\n\n**Project**: ${projectName}\n\n## Explicitly In-Scope (Current Version)\n- Pure Python hexagonal domain core with FastAPI gateway and Express server.\n- Role-based memory schemas and tag quarantine system.\n- Hierarchical delegation with line-by-line diff review modals.\n- Interactive Sprint Planning Workspace with Deadline Days metrics.\n- Code Repository Workspace with Morgan AI Git Merge Agent.\n\n## Explicitly Out-Of-Scope (Current Version)\n- Direct automated production deployment pipelines to cloud infrastructure.\n- Multi-tenant database clustering or distributed Redis state caches.`,
        updatedAt: now,
        author: 'Product Vision Committee'
      }
    ]
  };

  return {
    'origin_document': originDoc,
    'brainstorm_log': brainstormLog,
    'principles_document': principlesDoc,
    'vision_and_scope': visionScopeDoc
  };
}
