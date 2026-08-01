import { v4 as uuidv4 } from 'uuid';
import { Project, AgentNode, AgentDoc } from '../types';
import { createProjectGenesisDocuments } from './genesisDocuments';

export function createAgentDefaultDocs(
  agentId: string,
  personName: string,
  roleName: string,
  responsibilities: string,
  decisions: string
): AgentDoc[] {
  return [
    {
      id: `${agentId}-arch`,
      title: `${personName}'s Architecture Spec`,
      filename: `${personName.toLowerCase()}_architecture.md`,
      category: 'architecture',
      content: decisions || `# Domain Architecture Specification: ${roleName}\n\n**Author**: ${personName} (${roleName})\n**Scope**: ${responsibilities}\n\n## Overview\nClick "Build Domain Architecture" or edit raw markdown to draft ${personName}'s domain technical specification.`,
      updatedAt: Date.now()
    },
    {
      id: `${agentId}-design`,
      title: `${personName}'s Design Principles`,
      filename: `${personName.toLowerCase()}_design_principles.md`,
      category: 'design_principles',
      content: `# Design Principles & Technical Patterns: ${roleName}\n\n**Owner**: ${personName}\n\n## Core Principles\n1. **High Cohesion & Bounded Contexts**: Keep domain logic isolated with strict interface contracts.\n2. **Type Safety & Schema Validation**: Validate inputs and state transitions strictly.\n3. **Resiliency & Fault Tolerance**: Provide graceful fallbacks and clear error logging.\n4. **Clean Code & Modularity**: Maintain readable, self-documenting code standards.`,
      updatedAt: Date.now()
    },
    {
      id: `${agentId}-procedural`,
      title: `${personName}'s Procedural SOPs`,
      filename: `${personName.toLowerCase()}_procedural_memory.md`,
      category: 'procedural',
      content: `# Procedural Memory & Operating SOPs: ${roleName}\n\n**Operator**: ${personName}\n\n## Rules of Engagement & SOPs\n1. **Directive Review**: Align all domain specifications with supervisor guidelines.\n2. **Diff Verification**: Publish line-by-line diffs upward prior to merging.\n3. **Validation Check**: Run linter and compiler verification before finalizing.`,
      updatedAt: Date.now()
    },
    {
      id: `${agentId}-episodic`,
      title: `${personName}'s Episodic Log`,
      filename: `${personName.toLowerCase()}_episodic_memory.md`,
      category: 'episodic',
      content: `# Episodic Memory & Interaction Ledger: ${personName}\n\n## Decision Log\n- [${new Date().toLocaleDateString()}] Persona initialized and assigned role: **${roleName}**.\n- [${new Date().toLocaleDateString()}] Domain scope configured: *${responsibilities}*.`,
      updatedAt: Date.now()
    },
    {
      id: `${agentId}-sprint`,
      title: `${personName}'s Sprint Plan`,
      filename: `${personName.toLowerCase()}_sprint_planning.md`,
      category: 'sprint_planning',
      content: `# Sprint Planning & Deliverables: ${roleName}\n\n**Lead**: ${personName}\n\n## Active Sprint Plan\n- [x] Establish role scope & direct report hierarchy.\n- [/] Draft domain architecture specification.\n- [ ] Submit domain slice for supervisor review & approval.`,
      updatedAt: Date.now()
    }
  ];
}

export function createFullStackWebProject(name: string = 'Full-Stack Web App'): Project {
  const rootId = uuidv4();
  const feLeadId = uuidv4();
  const beLeadId = uuidv4();

  const reactDevId = uuidv4();
  const uiuxDevId = uuidv4();

  const apiDevId = uuidv4();
  const dbDevId = uuidv4();

  const agents: Record<string, AgentNode> = {
    [rootId]: {
      id: rootId,
      parentId: null,
      roleName: 'Head Architect (Supervisor)',
      personName: 'Alice',
      responsibilities: 'Oversee full-stack web application scope, define core user features, set high-level system requirements, and delegate down to Frontend & Backend Leads.',
      status: 'idle',
      decisions: 'Core Web App Strategy: Modern React single-page application with Express backend API routes, Tailwind CSS styling, and persistent database storage.',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hello! I am Alice, Head Architect for this Web Application. I define the end-to-end product architecture and delegate specific domain tasks to our Frontend and Backend Leads.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [feLeadId, beLeadId],
      documents: createAgentDefaultDocs(
        rootId,
        'Alice',
        'Head Architect (Supervisor)',
        'Oversee full-stack web application scope, define core user features, set high-level system requirements, and delegate down to Frontend & Backend Leads.',
        'Core Web App Strategy: Modern React single-page application with Express backend API routes, Tailwind CSS styling, and persistent database storage.'
      )
    },
    [feLeadId]: {
      id: feLeadId,
      parentId: rootId,
      roleName: 'Frontend & UI/UX Lead',
      personName: 'Bob',
      responsibilities: 'Direct user interface architecture, client-side state management, page navigation, and design system implementation.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hi! I am Bob, leading Frontend & UI/UX. My team handles component hierarchies, responsive layouts, client interactions, and visual styling.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [reactDevId, uiuxDevId],
      documents: createAgentDefaultDocs(
        feLeadId,
        'Bob',
        'Frontend & UI/UX Lead',
        'Direct user interface architecture, client-side state management, page navigation, and design system implementation.',
        ''
      )
    },
    [beLeadId]: {
      id: beLeadId,
      parentId: rootId,
      roleName: 'Backend & Cloud API Lead',
      personName: 'Carol',
      responsibilities: 'Direct server API routes, database integrations, authentication services, and backend business logic.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Greetings! I am Carol, Backend & Cloud Lead. My team builds robust REST APIs, server controllers, database schemas, and external API connectors.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [apiDevId, dbDevId],
      documents: createAgentDefaultDocs(
        beLeadId,
        'Carol',
        'Backend & Cloud API Lead',
        'Direct server API routes, database integrations, authentication services, and backend business logic.',
        ''
      )
    },
    [reactDevId]: {
      id: reactDevId,
      parentId: feLeadId,
      roleName: 'React & State Specialist',
      personName: 'Dave',
      responsibilities: 'Implement modular React components, state management hooks, form validations, and interactive application views.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hello, I am Dave. I specialize in React component trees, custom hooks, and client state orchestration.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [],
      documents: createAgentDefaultDocs(
        reactDevId,
        'Dave',
        'React & State Specialist',
        'Implement modular React components, state management hooks, form validations, and interactive application views.',
        ''
      )
    },
    [uiuxDevId]: {
      id: uiuxDevId,
      parentId: feLeadId,
      roleName: 'UI/UX & Design Systems Specialist',
      personName: 'Eve',
      responsibilities: 'Design responsive layout grids, Tailwind CSS utility patterns, color palettes, typography hierarchy, and accessible transitions.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hi! I am Eve. I craft sleek, accessible UI designs, responsive breakpoints, and polished micro-interactions using Tailwind CSS.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [],
      documents: createAgentDefaultDocs(
        uiuxDevId,
        'Eve',
        'UI/UX & Design Systems Specialist',
        'Design responsive layout grids, Tailwind CSS utility patterns, color palettes, typography hierarchy, and accessible transitions.',
        ''
      )
    },
    [apiDevId]: {
      id: apiDevId,
      parentId: beLeadId,
      roleName: 'API Services & Controller Developer',
      personName: 'Frank',
      responsibilities: 'Develop Express router endpoints, request validation middleware, business logic handlers, and error handlers.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hello, I am Frank. I build clean RESTful API endpoints, request validators, and server middleware.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [],
      documents: createAgentDefaultDocs(
        apiDevId,
        'Frank',
        'API Services & Controller Developer',
        'Develop Express router endpoints, request validation middleware, business logic handlers, and error handlers.',
        ''
      )
    },
    [dbDevId]: {
      id: dbDevId,
      parentId: beLeadId,
      roleName: 'Database & Data Persistence Engineer',
      personName: 'Grace',
      responsibilities: 'Design database schemas, query optimizations, data serialization, and persistent storage handlers.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hi! I am Grace. I manage data models, database storage pipelines, and persistent state schemas.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [],
      documents: createAgentDefaultDocs(
        dbDevId,
        'Grace',
        'Database & Data Persistence Engineer',
        'Design database schemas, query optimizations, data serialization, and persistent storage handlers.',
        ''
      )
    }
  };

  const desc = 'A customizable full-stack web app team with Head Architect, Frontend Lead (React, UI/UX), and Backend Lead (APIs, Database).';
  return {
    id: uuidv4(),
    name,
    description: desc,
    createdAt: Date.now(),
    rootAgentId: rootId,
    agents,
    genesisDocuments: createProjectGenesisDocuments(name, desc)
  };
}

export function createDefaultProject(
  name: string = 'Custom AI Team',
  template: 'ai' | 'fullstack' | 'head_only' = 'head_only'
): Project {
  if (template === 'fullstack') {
    return createFullStackWebProject(name);
  }

  if (template === 'head_only') {
    const rootId = uuidv4();
    const headDesc = 'A customizable project starting with a single Head Architect. You can add direct reports and custom team members as needed.';
    return {
      id: uuidv4(),
      name,
      description: headDesc,
      createdAt: Date.now(),
      rootAgentId: rootId,
      agents: {
        [rootId]: {
          id: rootId,
          parentId: null,
          roleName: 'Head Architect (Supervisor)',
          personName: 'Alice',
          responsibilities: 'Oversee project goals, define strategy, and delegate to custom direct reports as added.',
          status: 'idle',
          decisions: 'Project Goal: Custom software platform.',
          chatHistory: [
            {
              id: uuidv4(),
              role: 'agent',
              content: 'Hello! I am Alice, the Head Architect. Configure my direct reports in the team editor to build out our specialized workforce.',
              timestamp: Date.now()
            }
          ],
          childrenIds: [],
          documents: createAgentDefaultDocs(
            rootId,
            'Alice',
            'Head Architect (Supervisor)',
            'Oversee project goals, define strategy, and delegate to custom direct reports as added.',
            'Project Goal: Custom software platform.'
          )
        }
      },
      genesisDocuments: createProjectGenesisDocuments(name, headDesc)
    };
  }
  const rootId = uuidv4();
  const platformLeadId = uuidv4();
  const toolsLeadId = uuidv4();

  const controlId = uuidv4();
  const memoryId = uuidv4();
  const governanceId = uuidv4();

  const toolAId = uuidv4();
  const toolBId = uuidv4();

  const agents: Record<string, AgentNode> = {
    [rootId]: {
      id: rootId,
      parentId: null,
      roleName: 'Head Architect (Supervisor)',
      personName: 'Alice',
      responsibilities: 'Oversee entire system architecture, set high-level goals, and delegate sub-tasks to Platform & Tools Leads.',
      status: 'idle',
      decisions: 'Core Architectural Goal: Build a modular multi-agent developer system with separate control, memory, and governance layers.',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hello! I am Alice, the Head Architect. I oversee the overall system design. Tell me about the project goals, and I will structure our architectural strategy and delegate tasks down to our team leads.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [platformLeadId, toolsLeadId]
    },
    [platformLeadId]: {
      id: platformLeadId,
      parentId: rootId,
      roleName: 'Platform Team Lead',
      personName: 'Bob',
      responsibilities: 'Lead the core platform infrastructure team comprising Control, Memory, and Governance layers.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hi! I am Bob, leading the Platform infrastructure. My sub-agents (Control, Memory, Governance) handle runtime execution, state persistence, and safety rules.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [controlId, memoryId, governanceId]
    },
    [toolsLeadId]: {
      id: toolsLeadId,
      parentId: rootId,
      roleName: 'Tools Team Lead',
      personName: 'Carol',
      responsibilities: 'Lead the developer tools suite, managing specialized tool builders and utility agents.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Greetings! I am Carol, Tools Team Lead. My team builds specialized integration tools, code generation utilities, and external API connectors.',
          timestamp: Date.now()
        }
      ],
      childrenIds: [toolAId, toolBId]
    },
    [controlId]: {
      id: controlId,
      parentId: platformLeadId,
      roleName: 'Control Layer Specialist',
      personName: 'Dave',
      responsibilities: 'Design orchestrator logic, message routing pipelines, and agent task scheduling controls.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hello, I am Dave. I manage the Control Layer, orchestrating task flow and event messaging between agents.',
          timestamp: Date.now()
        }
      ],
      childrenIds: []
    },
    [memoryId]: {
      id: memoryId,
      parentId: platformLeadId,
      roleName: 'Memory State Specialist',
      personName: 'Eve',
      responsibilities: 'Manage state retention, persistent memory storage, prompt history logging, and vector context retrieval.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hi! I am Eve. I manage Memory & State. I ensure every chat, prompt, and decision is recorded persistently for exact historical recall.',
          timestamp: Date.now()
        }
      ],
      childrenIds: []
    },
    [governanceId]: {
      id: governanceId,
      parentId: platformLeadId,
      roleName: 'Governance & Policy Auditor',
      personName: 'Frank',
      responsibilities: 'Enforce security rules, API rate limits, access policies, and architectural compliance.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hello, I am Frank. I audit governance, ensuring all agent actions comply with safety rules and system boundaries.',
          timestamp: Date.now()
        }
      ],
      childrenIds: []
    },
    [toolAId]: {
      id: toolAId,
      parentId: toolsLeadId,
      roleName: 'Code Spec & Linter Tool Builder',
      personName: 'Grace',
      responsibilities: 'Build automated code synthesis templates, type definition checkers, and syntax validation tools.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hi! I am Grace. I build code synthesis tools and syntax validators for developer workflows.',
          timestamp: Date.now()
        }
      ],
      childrenIds: []
    },
    [toolBId]: {
      id: toolBId,
      parentId: toolsLeadId,
      roleName: 'API & SDK Integration Builder',
      personName: 'Henry',
      responsibilities: 'Develop external API connectors, OAuth handlers, and third-party service adapters.',
      status: 'idle',
      decisions: '',
      chatHistory: [
        {
          id: uuidv4(),
          role: 'agent',
          content: 'Hello! I am Henry. I craft API integration adapters and external SDK interfaces.',
          timestamp: Date.now()
        }
      ],
      childrenIds: []
    }
  };

  const aiDesc = 'A modular, multi-agent AI workforce ecosystem for architectural design, system control, state memory, governance, and tool synthesis.';
  return {
    id: uuidv4(),
    name,
    description: aiDesc,
    createdAt: Date.now(),
    rootAgentId: rootId,
    agents,
    genesisDocuments: createProjectGenesisDocuments(name, aiDesc)
  };
}
