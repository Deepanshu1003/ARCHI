import os
import json
from typing import List, Dict, Any, Optional

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class LLMClient:
    """
    Client wrapper for interacting with Gemini API models in Python.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if HAS_GENAI and self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def generate_response(
        self, 
        system_instruction: str, 
        history: List[Dict[str, str]], 
        user_message: str
    ) -> str:
        """
        Generates a response from the Gemini model or provides a structured fallback.
        """
        if self.client:
            try:
                contents = [
                    {"role": "user", "parts": [{"text": system_instruction}]},
                    {"role": "model", "parts": [{"text": "Understood. Proceeding as instructed."}]}
                ]
                for h in history:
                    contents.append({
                        "role": "user" if h.get("role") == "user" else "model",
                        "parts": [{"text": h.get("content", "")}]
                    })
                contents.append({"role": "user", "parts": [{"text": user_message}]})

                response = self.client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=contents
                )
                return response.text
            except Exception as e:
                print(f"[LLMClient] API error: {e}")

        # Fallback structured mock
        return f"[Python Core Agent Output] Received prompt: '{user_message}'. Response aligned with system instruction: '{system_instruction[:80]}...'."
