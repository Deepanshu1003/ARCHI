"""
Agentic Project Architect - Core Python Orchestrator
---------------------------------------------------
Demonstrates generic agent instantiation, hierarchical delegation flow to DIRECT REPORTS ONLY, 
and persistent memory logging for ANY customizable project domain (e.g., Full-Stack Web App).
"""

import sys
import os

# Ensure python path includes src directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_core.utils.memory_store import MemoryStore
from python_core.agents import LeadAgent, SpecialistAgent

def main():
    print("=" * 60)
    print("🚀 Initializing Generic Agentic Workforce Ecosystem...")
    print("=" * 60)

    memory_store = MemoryStore("data/python_memory.json")

    # 1. Instantiate Root Supervisor (Head Architect)
    alice = LeadAgent(
        person_name="Alice",
        role_name="Head Architect (Supervisor)",
        responsibilities="Oversee end-to-end full-stack web application goals, system architecture, and delegate domain sub-tasks to direct leads.",
        memory_store=memory_store
    )

    # 2. Instantiate Direct Reports (Frontend Lead & Backend Lead)
    bob = LeadAgent(
        person_name="Bob",
        role_name="Frontend & UI/UX Lead",
        responsibilities="Direct UI components, client state, and design systems.",
        parent_id=alice.id,
        memory_store=memory_store
    )
    carol = LeadAgent(
        person_name="Carol",
        role_name="Backend & Cloud API Lead",
        responsibilities="Direct server REST endpoints, database persistence, and API services.",
        parent_id=alice.id,
        memory_store=memory_store
    )

    alice.add_child(bob.id)
    alice.add_child(carol.id)

    # 3. Instantiate Domain Specialists (Direct reports to Bob & Carol)
    dave = SpecialistAgent(
        person_name="Dave",
        role_name="React & State Specialist",
        responsibilities="Implement modular React components and state management.",
        parent_id=bob.id,
        memory_store=memory_store
    )
    eve = SpecialistAgent(
        person_name="Eve",
        role_name="UI/UX & Styling Specialist",
        responsibilities="Design responsive Tailwind layouts and accessible animations.",
        parent_id=bob.id,
        memory_store=memory_store
    )

    bob.add_child(dave.id)
    bob.add_child(eve.id)

    frank = SpecialistAgent(
        person_name="Frank",
        role_name="API Services Developer",
        responsibilities="Build Express controllers, request validation, and routes.",
        parent_id=carol.id,
        memory_store=memory_store
    )
    grace = SpecialistAgent(
        person_name="Grace",
        role_name="Database Persistence Engineer",
        responsibilities="Design database schemas, queries, and storage pipelines.",
        parent_id=carol.id,
        memory_store=memory_store
    )

    carol.add_child(frank.id)
    carol.add_child(grace.id)

    print(f"\n[Custom Team Hierarchy Assembled]")
    print(f"- Head: {alice.person_name} ({alice.role_name})")
    print(f"  └── Direct Reports: {bob.person_name} ({bob.role_name}), {carol.person_name} ({carol.role_name})")
    print(f"      ├── Bob's Direct Reports: {dave.person_name}, {eve.person_name}")
    print(f"      └── Carol's Direct Reports: {frank.person_name}, {grace.person_name}")

    # 4. Simulate Master Strategy Creation & Delegation to Direct Reports ONLY
    master_plan = "Core Web App Strategy: Modern React SPA with Express API backend routes, Tailwind CSS styling, and persistent database storage."
    print(f"\n[Alice's Master Strategy]:\n{master_plan}")

    print(f"\n--- Alice Delegating Downward to Direct Reports ONLY ({bob.person_name} & {carol.person_name}) ---")
    delegations = alice.delegate_to_direct_reports([bob, carol], parent_plan=master_plan)

    for agent_id, sub_plan in delegations.items():
        print(f"\n{sub_plan}")

    # 5. Simulate Bob delegating further to his direct reports (Dave & Eve)
    print(f"\n--- Bob Delegating Downward to Frontend Specialists ({dave.person_name} & {eve.person_name}) ---")
    bob_delegations = bob.delegate_to_direct_reports([dave, eve], parent_plan=bob.decisions)

    for agent_id, sub_plan in bob_delegations.items():
        print(f"\n{sub_plan}")

    # 6. Save Project Snapshot to Memory
    project_snapshot = {
        "id": "py-custom-001",
        "name": "Custom Full-Stack Web App",
        "createdAt": 1700000000,
        "rootAgentId": alice.id,
        "agents": {
            alice.id: alice.to_dict(),
            bob.id: bob.to_dict(),
            carol.id: carol.to_dict(),
            dave.id: dave.to_dict(),
            eve.id: eve.to_dict(),
            frank.id: frank.to_dict(),
            grace.id: grace.to_dict()
        }
    }
    memory_store.save_project(project_snapshot)

    print("\n=" * 60)
    print("✅ Generic Delegation Pipeline Complete. Saved snapshot to data/python_memory.json")
    print("=" * 60)

if __name__ == "__main__":
    main()
