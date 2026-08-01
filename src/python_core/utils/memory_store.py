import json
import os
import time
from typing import Dict, List, Any, Optional

class MemoryStore:
    """
    Persistent Memory Store for the Agentic Architecture.
    Saves and loads all project data, prompt logs, agent histories,
    and decision contexts to disk.
    """

    def __init__(self, filepath: str = "data/python_memory.json"):
        self.filepath = filepath
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump({"projects": {}, "global_logs": []}, f, indent=2)

    def load_memory(self) -> Dict[str, Any]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[MemoryStore] Error loading memory: {e}")
            return {"projects": {}, "global_logs": []}

    def save_memory(self, data: Dict[str, Any]):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[MemoryStore] Error saving memory: {e}")

    def save_project(self, project_data: Dict[str, Any]):
        memory = self.load_memory()
        project_id = project_data.get("id")
        if project_id:
            memory["projects"][project_id] = project_data
            self.save_memory(memory)
            print(f"[MemoryStore] Project '{project_data.get('name')}' saved successfully.")

    def log_event(self, event_type: str, agent_id: str, payload: Dict[str, Any]):
        memory = self.load_memory()
        log_entry = {
            "timestamp": time.time(),
            "event_type": event_type,
            "agent_id": agent_id,
            "payload": payload
        }
        memory.setdefault("global_logs", []).append(log_entry)
        self.save_memory(memory)
