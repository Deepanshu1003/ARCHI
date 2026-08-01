import { RoleDocumentSchema, AgentNode, AgentDoc } from '../types';

// Pre-seeded Role Schemas as specified in Section 3

export const MEMORY_ROLE_SCHEMA: RoleDocumentSchema = {
  roleId: 'memory-architect',
  requiredDocumentTypes: [
    {
      docType: 'memory_architecture',
      displayName: 'Memory Architecture',
      description: 'How the overall memory system is structured',
      required: true
    },
    {
      docType: 'episodic_memory_design',
      displayName: 'Episodic Memory Design',
      description: 'How episodic memory is captured and retrieved',
      required: true
    },
    {
      docType: 'working_memory_design',
      displayName: 'Working Memory Design',
      description: 'How short-term/working memory operates during a session',
      required: true
    },
    {
      docType: 'session_memory_design',
      displayName: 'Session Memory Design',
      description: 'How memory persists or resets across sessions',
      required: true
    },
    {
      docType: 'retrieval_strategy',
      displayName: 'Retrieval Strategy',
      description: 'How documents/memories are queried and surfaced',
      required: true
    }
  ]
};

export const TOOL_BUILDER_ROLE_SCHEMA: RoleDocumentSchema = {
  roleId: 'tool-builder',
  requiredDocumentTypes: [
    {
      docType: 'tool_spec',
      displayName: 'Tool Specification',
      description: 'What the tool does and its interface',
      required: true
    },
    {
      docType: 'model_selection_rationale',
      displayName: 'Model Selection Rationale',
      description: 'Which AI model/approach was chosen and why',
      required: true
    },
    {
      docType: 'required_dependencies',
      displayName: 'Required Dependencies',
      description: 'What the tool needs to function',
      required: true
    },
    {
      docType: 'test_plan',
      displayName: 'Test Plan',
      description: 'How the tool will be validated',
      required: true
    },
    {
      docType: 'integration_points',
      displayName: 'Integration Points',
      description: 'How the tool connects to the rest of the system',
      required: true
    }
  ]
};

export const STANDARD_ENGINEERING_ROLE_SCHEMA: RoleDocumentSchema = {
  roleId: 'default-engineering',
  requiredDocumentTypes: [
    {
      docType: 'architecture',
      displayName: 'Architecture Specification',
      description: 'System architecture, domain specifications, and interface contracts',
      required: true
    },
    {
      docType: 'design_principles',
      displayName: 'Design Principles',
      description: 'Core design principles, standards, and patterns',
      required: false
    },
    {
      docType: 'procedural',
      displayName: 'Procedural Memory',
      description: 'Operating SOPs, validation procedures, and execution guidelines',
      required: false
    },
    {
      docType: 'episodic',
      displayName: 'Episodic Memory',
      description: 'Interaction ledger, decision history, and retrospective logs',
      required: false
    },
    {
      docType: 'sprint_planning',
      displayName: 'Sprint Plan',
      description: 'Sprint backlog, deliverables, and task estimates',
      required: false
    }
  ]
};

/**
 * Resolves the appropriate RoleDocumentSchema for a given agent node
 */
export function getRoleSchemaForAgent(agent: AgentNode): RoleDocumentSchema {
  const roleLower = (agent.roleName || '').toLowerCase();
  const personLower = (agent.personName || '').toLowerCase();
  const respLower = (agent.responsibilities || '').toLowerCase();

  if (roleLower.includes('memory') || respLower.includes('memory') || personLower.includes('eve')) {
    return MEMORY_ROLE_SCHEMA;
  }

  if (roleLower.includes('tool') || roleLower.includes('builder') || respLower.includes('tool')) {
    return TOOL_BUILDER_ROLE_SCHEMA;
  }

  return STANDARD_ENGINEERING_ROLE_SCHEMA;
}

/**
 * Validates whether an agent can transition out of IDLE.
 * An agent cannot transition out of IDLE until all `required: true` document types exist (even as stubs).
 */
export function validateAgentTransitionFromIdle(agent: AgentNode): {
  canStart: boolean;
  missingTypes: { docType: string; displayName: string }[];
  schema: RoleDocumentSchema;
} {
  const schema = getRoleSchemaForAgent(agent);
  const docs = agent.documents || [];

  const activeDocs = docs.filter(d => !d.isArchived && !d.isQuarantined);
  const activeDocTypes = new Set(activeDocs.map(d => d.docType || d.category));

  const missingTypes: { docType: string; displayName: string }[] = [];

  for (const reqType of schema.requiredDocumentTypes) {
    if (reqType.required && !activeDocTypes.has(reqType.docType)) {
      missingTypes.push({
        docType: reqType.docType,
        displayName: reqType.displayName
      });
    }
  }

  return {
    canStart: missingTypes.length === 0,
    missingTypes,
    schema
  };
}

/**
 * Creates stub documents for missing required document types in an agent's memory bank
 */
export function initializeSchemaStubs(agent: AgentNode): AgentDoc[] {
  const schema = getRoleSchemaForAgent(agent);
  const existingDocs = agent.documents ? [...agent.documents] : [];
  const existingTypes = new Set(existingDocs.map(d => d.docType || d.category));

  const newStubs: AgentDoc[] = [];

  for (const reqType of schema.requiredDocumentTypes) {
    if (!existingTypes.has(reqType.docType)) {
      const now = Date.now();
      const initialContent = `# ${reqType.displayName}\n\n**Owner**: ${agent.personName} (${agent.roleName})\n**Description**: ${reqType.description}\n\n*Draft initial contents here...*`;
      const stubDoc: AgentDoc = {
        id: `${agent.id}-${reqType.docType}`,
        title: `${agent.personName}'s ${reqType.displayName}`,
        filename: `${agent.personName.toLowerCase()}_${reqType.docType}.md`,
        category: reqType.docType,
        docType: reqType.docType,
        content: initialContent,
        updatedAt: now,
        version: 1,
        versions: [
          {
            version: 1,
            content: initialContent,
            updatedAt: now,
            author: agent.personName
          }
        ],
        isArchived: false,
        isQuarantined: false
      };
      newStubs.push(stubDoc);
    }
  }

  return [...existingDocs, ...newStubs];
}

/**
 * Parses and processes memory instruction tags in LLM responses:
 * - [DOC_CREATE: Title | docType | Content] or [CREATE_DOC: Title | Content]
 * - [DOC_UPDATE: Title | Content] or [UPDATE_DOC: Title | Content]
 * - [DOC_DELETE: Title] or [DELETE_DOC: Title]
 *
 * Enforces role schema docType matching and quarantine rules.
 */
export function processAgentDocTags(
  replyText: string,
  agent: AgentNode
): {
  updatedDocs: AgentDoc[];
  cleanedReply: string;
  quarantinedTags: { tag: string; reason: string }[];
} {
  const schema = getRoleSchemaForAgent(agent);
  const allowedDocTypes = new Set(schema.requiredDocumentTypes.map(d => d.docType.toLowerCase()));

  // Include standard fallback docTypes
  allowedDocTypes.add('architecture');
  allowedDocTypes.add('design_principles');
  allowedDocTypes.add('procedural');
  allowedDocTypes.add('episodic');
  allowedDocTypes.add('sprint_planning');
  allowedDocTypes.add('custom');

  let currentDocs = agent.documents ? [...agent.documents] : [];
  let cleanedReply = replyText;
  const quarantinedTags: { tag: string; reason: string }[] = [];

  // 1. Process [DOC_CREATE: Title | docType | Content] and [CREATE_DOC: Title | Content]
  const createRegex = /\[(?:DOC_CREATE|CREATE_DOC):\s*"?(.*?)"?\s*\|\s*(.*?)(?:\s*\|\s*([\s\S]*?))?\]/gi;
  let match;
  while ((match = createRegex.exec(replyText)) !== null) {
    const rawTag = match[0];
    const title = match[1].trim();
    const secondPart = (match[2] || '').trim();
    const thirdPart = (match[3] || '').trim();

    let docType = 'custom';
    let content = '';

    if (thirdPart) {
      docType = secondPart;
      content = thirdPart;
    } else {
      // Check if secondPart is a docType or content
      if (allowedDocTypes.has(secondPart.toLowerCase())) {
        docType = secondPart;
        content = `# ${title}\n\n*Created via agent instruction.*`;
      } else {
        docType = 'custom';
        content = secondPart;
      }
    }

    const docTypeNormalized = docType.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const isTypeAllowed = allowedDocTypes.has(docTypeNormalized);

    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    const now = Date.now();

    if (!isTypeAllowed) {
      // Quarantine document
      const quarantineReason = `Unrecognized document type '[${docType}]' for agent role '${schema.roleId}'. Allowed types: ${Array.from(allowedDocTypes).join(', ')}`;
      quarantinedTags.push({ tag: rawTag, reason: quarantineReason });

      const quarantinedDoc: AgentDoc = {
        id: docId,
        title: `[QUARANTINED] ${title}`,
        filename,
        category: 'custom',
        docType: docTypeNormalized,
        content: `> **⚠️ QUARANTINED MEMORY INSTRUCTION**\n> **Reason**: ${quarantineReason}\n\n---\n\n${content}`,
        updatedAt: now,
        version: 1,
        versions: [{ version: 1, content, updatedAt: now, author: agent.personName }],
        isArchived: false,
        isQuarantined: true,
        quarantineReason
      };

      currentDocs.push(quarantinedDoc);
      cleanedReply = cleanedReply.replace(
        rawTag,
        `\n\n⚠️ **[DOC_CREATE Quarantined for Review]**: Document *"${title}"* with docType *"${docType}"* flagged for schema validation error.`
      );
    } else {
      // Valid document creation
      const validDoc: AgentDoc = {
        id: docId,
        title,
        filename,
        category: docTypeNormalized,
        docType: docTypeNormalized,
        content,
        updatedAt: now,
        version: 1,
        versions: [{ version: 1, content, updatedAt: now, author: agent.personName }],
        isArchived: false,
        isQuarantined: false
      };

      currentDocs.push(validDoc);
      cleanedReply = cleanedReply.replace(
        rawTag,
        `\n\n📄 **[Created New Document]**: *${title}* (Type: \`${docTypeNormalized}\`)`
      );
    }
  }

  // 2. Process [DOC_UPDATE: Title | Content] and [UPDATE_DOC: Title | Content]
  const updateRegex = /\[(?:DOC_UPDATE|UPDATE_DOC):\s*"?(.*?)"?\s*\|\s*([\s\S]*?)\]/gi;
  while ((match = updateRegex.exec(replyText)) !== null) {
    const rawTag = match[0];
    const targetQuery = match[1].trim().toLowerCase();
    const newContent = match[2].trim();
    let updated = false;

    currentDocs = currentDocs.map(doc => {
      const isMatch =
        doc.title.toLowerCase().includes(targetQuery) ||
        doc.id.toLowerCase() === targetQuery ||
        (doc.docType && doc.docType.toLowerCase() === targetQuery) ||
        doc.category.toLowerCase() === targetQuery;

      if (isMatch && !doc.isArchived) {
        updated = true;
        const currentVersion = doc.version || 1;
        const newVersionNumber = currentVersion + 1;
        const previousVersions = doc.versions || [
          { version: 1, content: doc.content, updatedAt: doc.updatedAt, author: agent.personName }
        ];

        return {
          ...doc,
          content: newContent,
          updatedAt: Date.now(),
          version: newVersionNumber,
          versions: [
            ...previousVersions,
            { version: newVersionNumber, content: newContent, updatedAt: Date.now(), author: agent.personName }
          ]
        };
      }
      return doc;
    });

    if (updated) {
      cleanedReply = cleanedReply.replace(
        rawTag,
        `\n\n📝 **[Updated Document]**: *${match[1]}* (Version incremented)`
      );
    } else {
      // Target document not found -> quarantine update tag
      const reason = `Target document matching title/category '${match[1]}' not found in ${agent.personName}'s memory bank.`;
      quarantinedTags.push({ tag: rawTag, reason });
      cleanedReply = cleanedReply.replace(
        rawTag,
        `\n\n⚠️ **[DOC_UPDATE Quarantined]**: Could not find target document *"${match[1]}"* to update.`
      );
    }
  }

  // 3. Process [DOC_DELETE: Title] and [DELETE_DOC: Title] -> Soft-delete only
  const deleteRegex = /\[(?:DOC_DELETE|DELETE_DOC):\s*"?(.*?)"?\]/gi;
  while ((match = deleteRegex.exec(replyText)) !== null) {
    const rawTag = match[0];
    const targetQuery = match[1].trim().toLowerCase();

    currentDocs = currentDocs.map(doc => {
      const isMatch =
        doc.title.toLowerCase().includes(targetQuery) ||
        doc.id.toLowerCase() === targetQuery ||
        doc.category.toLowerCase() === targetQuery;

      if (isMatch) {
        return {
          ...doc,
          isArchived: true,
          updatedAt: Date.now()
        };
      }
      return doc;
    });

    cleanedReply = cleanedReply.replace(
      rawTag,
      `\n\n🗑️ **[Soft-Deleted Document]**: *${match[1]}* (Archived)`
    );
  }

  return {
    updatedDocs: currentDocs,
    cleanedReply,
    quarantinedTags
  };
}

