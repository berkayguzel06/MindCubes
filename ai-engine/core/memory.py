"""
Memory management for agents
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
import json


class Memory(ABC):
    """Abstract base class for agent memory systems."""
    
    @abstractmethod
    async def store(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Store an interaction in memory.
        
        Args:
            input_text: User input
            output_text: Agent output
            metadata: Additional metadata
        """
        pass
    
    @abstractmethod
    async def retrieve(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant memories based on a query.
        
        Args:
            query: Search query
            limit: Maximum number of memories to retrieve
            
        Returns:
            List of relevant memories
        """
        pass
    
    @abstractmethod
    async def clear(self) -> None:
        """Clear all memories."""
        pass


class ConversationMemory(Memory):
    """Simple in-memory conversation storage."""
    
    def __init__(self, max_size: int = 100):
        """
        Initialize conversation memory.
        
        Args:
            max_size: Maximum number of conversations to store
        """
        self.max_size = max_size
        self.conversations: List[Dict[str, Any]] = []
        self.messages: List[Dict[str, Any]] = []
    
    async def store(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Store a conversation turn."""
        conversation = {
            "input": input_text,
            "output": output_text,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        
        self.conversations.append(conversation)
        
        # Maintain max size
        if len(self.conversations) > self.max_size:
            self.conversations = self.conversations[-self.max_size:]
    
    async def retrieve(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve recent conversations.
        Simple implementation returns last N conversations.
        """
        # Return most recent conversations
        relevant = self.conversations[-limit:]
        
        return [
            {
                "content": f"User: {conv['input']}\nAgent: {conv['output']}",
                "timestamp": conv["timestamp"]
            }
            for conv in relevant
        ]
    
    async def clear(self) -> None:
        """Clear all conversations."""
        self.conversations = []
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Add a single message to memory (chat-style).
        Compatible with API chat usage where messages are appended individually.
        """
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        
        # Trim to max size (per-message basis, so double max_size to approximate turn pairs)
        if len(self.messages) > self.max_size * 2:
            self.messages = self.messages[-self.max_size * 2:]
    
    def get_recent_messages(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Return recent chat-style messages."""
        if limit:
            return self.messages[-limit:]
        return self.messages.copy()
    
    def get_messages(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Alias for get_recent_messages - for API compatibility."""
        return self.get_recent_messages(limit)
    
    def get_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get conversation history."""
        if limit:
            return self.conversations[-limit:]
        return self.conversations.copy()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics."""
        return {
            "total_conversations": len(self.conversations),
            "max_size": self.max_size,
            "utilization": len(self.conversations) / self.max_size if self.max_size > 0 else 0
        }


class VectorMemory(Memory):
    """
    Vector-based semantic memory using embeddings.
    Requires integration with vector database or embedding service.
    """
    
    def __init__(
        self,
        embedding_model: str = "text-embedding-ada-002",
        dimension: int = 1536,
        max_size: int = 1000
    ):
        """
        Initialize vector memory.
        
        Args:
            embedding_model: Name of the embedding model
            dimension: Dimension of embeddings
            max_size: Maximum number of memories
        """
        self.embedding_model = embedding_model
        self.dimension = dimension
        self.max_size = max_size
        self.memories: List[Dict[str, Any]] = []
        self._embeddings_cache: Dict[str, List[float]] = {}
    
    async def store(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Store interaction with embeddings."""
        content = f"{input_text}\n{output_text}"
        
        # TODO: Generate embedding for content
        # embedding = await self._generate_embedding(content)
        
        memory = {
            "input": input_text,
            "output": output_text,
            "content": content,
            # "embedding": embedding,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        
        self.memories.append(memory)
        
        if len(self.memories) > self.max_size:
            self.memories = self.memories[-self.max_size:]
    
    async def retrieve(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve semantically similar memories.
        For now, returns recent memories. TODO: Implement semantic search.
        """
        # TODO: Implement semantic similarity search
        # query_embedding = await self._generate_embedding(query)
        # similarities = self._compute_similarities(query_embedding)
        
        # For now, return most recent
        relevant = self.memories[-limit:]
        
        return [
            {
                "content": mem["content"],
                "timestamp": mem["timestamp"]
            }
            for mem in relevant
        ]
    
    async def clear(self) -> None:
        """Clear all memories."""
        self.memories = []
        self._embeddings_cache = {}
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text.
        TODO: Implement using OpenAI embeddings or local model.
        """
        # Placeholder
        return [0.0] * self.dimension


class PersistentMemory(Memory):
    """
    Persistent memory that stores to database.
    Can be backed by MongoDB, PostgreSQL, etc.
    """
    
    def __init__(self, db_connection_string: str, collection_name: str = "agent_memories"):
        """
        Initialize persistent memory.
        
        Args:
            db_connection_string: Database connection string
            collection_name: Name of the collection/table
        """
        self.db_connection_string = db_connection_string
        self.collection_name = collection_name
        self._db = None
    
    async def _get_db(self):
        """Get database connection."""
        if self._db is None:
            # TODO: Implement database connection
            # For now, use in-memory fallback
            self._db = []
        return self._db
    
    async def store(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Store to database."""
        db = await self._get_db()
        
        memory = {
            "input": input_text,
            "output": output_text,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        
        # TODO: Implement actual database insert
        if isinstance(db, list):
            db.append(memory)
    
    async def retrieve(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve from database."""
        db = await self._get_db()
        
        # TODO: Implement actual database query
        if isinstance(db, list):
            recent = db[-limit:]
            return [
                {
                    "content": f"User: {mem['input']}\nAgent: {mem['output']}",
                    "timestamp": mem["timestamp"]
                }
                for mem in recent
            ]
        
        return []
    
    async def clear(self) -> None:
        """Clear database."""
        db = await self._get_db()
        
        # TODO: Implement actual database clear
        if isinstance(db, list):
            db.clear()

