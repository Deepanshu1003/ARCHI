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
  const roleLower = roleName.toLowerCase();
  const isSupervisor = roleLower.includes('head') || roleLower.includes('supervisor') || roleLower.includes('architect');
  const isLead = roleLower.includes('lead') || roleLower.includes('manager') || roleLower.includes('orchestrator');

  if (isSupervisor) {
    return [
      {
        id: `${agentId}-arch`,
        title: `Architecture Spec (${roleName})`,
        filename: `architecture_spec.md`,
        category: 'architecture',
        content: decisions || `# System Architecture Specification\n\n**Owner**: ${personName} (${roleName})\n**Scope**: ${responsibilities}\n\n## Overview\nHigh-level system topology, domain boundaries, and master delegation strategy.`,
        updatedAt: Date.now()
      },
      {
        id: `${agentId}-sprint`,
        title: `Sprint Roadmap (${roleName})`,
        filename: `sprint_roadmap.md`,
        category: 'sprint_planning',
        content: `# Milestone Sprint Roadmap\n\n**Lead**: ${personName}\n\n## Epics & Goals\n- [x] Initialize system hierarchy & delegation chains.\n- [ ] Define cross-domain service interfaces.\n- [ ] Execute validation and verification pipelines.`,
        updatedAt: Date.now()
      }
    ];
  } else if (isLead) {
    return [
      {
        id: `${agentId}-interface`,
        title: `Domain Interface (${roleName})`,
        filename: `domain_interface.md`,
        category: 'architecture',
        content: `# Domain Interface & Module Bounds: ${roleName}\n\n**Owner**: ${personName}\n\n## API Contracts & Services\n- Define module communication protocols and data exchange schemas.`,
        updatedAt: Date.now()
      },
      {
        id: `${agentId}-sop`,
        title: `Code Review SOP (${roleName})`,
        filename: `code_review_sop.md`,
        category: 'procedural',
        content: `# Code Review & Quality Gates SOP\n\n**Supervisor**: ${personName}\n\n## Guidelines\n1. Enforce strict type safety and schema validation.\n2. Review line-by-line diffs before merging.`,
        updatedAt: Date.now()
      }
    ];
  } else {
    return [
      {
        id: `${agentId}-toolspec`,
        title: `Tool API Spec (${roleName})`,
        filename: `tool_api_spec.md`,
        category: 'architecture',
        content: `# Tool & Driver API Specification: ${roleName}\n\n**Developer**: ${personName}\n\n## Endpoints & Schemas\n- Specify input/output parameters, error handling, and driver configurations.`,
        updatedAt: Date.now()
      },
      {
        id: `${agentId}-sandbox`,
        title: `Sandbox Config (${roleName})`,
        filename: `sandbox_config.md`,
        category: 'procedural',
        content: `# Sandbox Environment & Test Commands\n\n**Operator**: ${personName}\n\n## Instructions\n- Run linter and compiler tests locally before publishing diffs.`,
        updatedAt: Date.now()
      }
    ];
  }
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
      documents: []
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
      documents: []
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
      documents: []
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
      documents: []
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
      documents: []
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
      documents: []
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
      documents: []
    }
  };

  // Populate 5 default docs for each agent automatically
  for (const [id, agent] of Object.entries(agents)) {
    agent.documents = createAgentDefaultDocs(id, agent.personName, agent.roleName, agent.responsibilities, agent.decisions);
  }

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
  name: string = 'New Project',
  template: 'ai' | 'fullstack' | 'head_only' = 'head_only'
): Project {
  if (template === 'fullstack') {
    return createFullStackWebProject(name);
  }

  const rootId = uuidv4();
  const desc = 'A customizable project starting with a single Lead Agent. You can configure the hierarchy, add sub-agents, or paste a JSON hierarchy configuration.';
  return {
    id: uuidv4(),
    name,
    description: desc,
    createdAt: Date.now(),
    rootAgentId: rootId,
    agents: {
      [rootId]: {
        id: rootId,
        parentId: null,
        roleName: 'Lead Architect',
        personName: 'Lead',
        responsibilities: 'Oversee project goals, define strategy, and manage hierarchy.',
        status: 'idle',
        decisions: 'Project Goal: Customizable multi-agent structure.',
        chatHistory: [
          {
            id: uuidv4(),
            role: 'agent',
            content: 'Hello! I am the Lead Architect. Configure the hierarchy or paste your JSON configuration to get started.',
            timestamp: Date.now()
          }
        ],
        childrenIds: [],
        documents: []
      }
    },
    genesisDocuments: createProjectGenesisDocuments(name, desc)
  };
}
