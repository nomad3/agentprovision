import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.schemas.chat import ChatSessionCreate, ChatMessageCreate

logger = logging.getLogger(__name__)

class ChatImportService:
    """Service for importing chat history from external providers."""

    def parse_chatgpt_export(self, file_content: bytes) -> List[Dict[str, Any]]:
        """
        Parse ChatGPT conversations.json export.

        Returns a list of session dictionaries with 'title', 'messages', 'external_id'.
        """
        try:
            data = json.loads(file_content)
            sessions = []

            for item in data:
                title = item.get("title", "Untitled Chat")
                external_id = item.get("id")
                mapping = item.get("mapping", {})

                messages = []
                # ChatGPT mapping is a tree, but usually linear for simple chats.
                # We need to traverse or sort by create_time.

                # Collect all message nodes
                nodes = []
                for node_id, node_data in mapping.items():
                    if node_data.get("message"):
                        nodes.append(node_data["message"])

                # Sort by create_time
                nodes.sort(key=lambda x: x.get("create_time") or 0)

                for msg in nodes:
                    author = msg.get("author", {})
                    role = author.get("role")
                    content_parts = msg.get("content", {}).get("parts", [])

                    # Skip system messages or empty content
                    if role == "system" or not content_parts:
                        continue

                    text_content = ""
                    for part in content_parts:
                        if isinstance(part, str):
                            text_content += part
                        elif isinstance(part, dict):
                            # Handle multimodal or other types if needed
                            pass

                    if text_content and role in ["user", "assistant"]:
                        messages.append({
                            "role": role,
                            "content": text_content,
                            "created_at": msg.get("create_time")
                        })

                if messages:
                    sessions.append({
                        "title": title,
                        "external_id": external_id,
                        "messages": messages,
                        "source": "chatgpt_import"
                    })

            return sessions

        except json.JSONDecodeError:
            raise ValueError("Invalid JSON file")
        except Exception as e:
            logger.error(f"Error parsing ChatGPT export: {e}")
            raise ValueError(f"Failed to parse ChatGPT export: {str(e)}")

    def parse_claude_export(self, file_content: bytes) -> List[Dict[str, Any]]:
        """
        Parse Claude conversations.json export.
        """
        try:
            data = json.loads(file_content)
            sessions = []

            for item in data:
                title = item.get("name", "Untitled Chat")
                external_id = item.get("uuid")
                chat_messages = item.get("chat_messages", [])

                messages = []
                for msg in chat_messages:
                    sender = msg.get("sender")
                    text = msg.get("text")

                    role = "user" if sender == "human" else "assistant"

                    if text:
                        messages.append({
                            "role": role,
                            "content": text,
                            "created_at": msg.get("created_at") # Claude might use different field
                        })

                if messages:
                    sessions.append({
                        "title": title,
                        "external_id": external_id,
                        "messages": messages,
                        "source": "claude_import"
                    })

            return sessions

        except json.JSONDecodeError:
            raise ValueError("Invalid JSON file")
        except Exception as e:
            logger.error(f"Error parsing Claude export: {e}")
            raise ValueError(f"Failed to parse Claude export: {str(e)}")

chat_import_service = ChatImportService()
