"""
Model Manager - Manage multiple models and their lifecycle
"""

from typing import Dict, Any, Optional, List
from pathlib import Path
import json
from datetime import datetime


class ModelManager:
    """
    Manages multiple AI models, their metadata, and lifecycle.
    """
    
    def __init__(self, models_dir: str = "./models"):
        """
        Initialize model manager.
        
        Args:
            models_dir: Root directory for models
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.registry_path = self.models_dir / "registry.json"
        self.registry = self._load_registry()
        
        self.loaded_models: Dict[str, Any] = {}
    
    def _load_registry(self) -> Dict[str, Any]:
        """Load model registry from disk."""
        if self.registry_path.exists():
            with open(self.registry_path, 'r') as f:
                return json.load(f)
        return {"models": {}}
    
    def _save_registry(self) -> None:
        """Save model registry to disk."""
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def register_model(
        self,
        model_id: str,
        model_path: str,
        model_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Register a model in the registry.
        
        Args:
            model_id: Unique model identifier
            model_path: Path to model files
            model_type: Type of model (base, fine-tuned, lora)
            metadata: Additional metadata
        """
        model_info = {
            "model_id": model_id,
            "model_path": model_path,
            "model_type": model_type,
            "registered_at": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self.registry["models"][model_id] = model_info
        self._save_registry()
        
        print(f"Model '{model_id}' registered successfully")
    
    def unregister_model(self, model_id: str) -> None:
        """
        Unregister a model.
        
        Args:
            model_id: Model identifier
        """
        if model_id in self.registry["models"]:
            del self.registry["models"][model_id]
            self._save_registry()
            print(f"Model '{model_id}' unregistered")
        else:
            print(f"Model '{model_id}' not found in registry")
    
    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all registered models.
        
        Returns:
            List of model information
        """
        return list(self.registry["models"].values())
    
    def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific model.
        
        Args:
            model_id: Model identifier
            
        Returns:
            Model information or None
        """
        return self.registry["models"].get(model_id)
    
    def load_model(self, model_id: str, device: str = "auto") -> Any:
        """
        Load a model into memory.
        
        Args:
            model_id: Model identifier
            device: Device to load on
            
        Returns:
            Loaded model
        """
        # Check if already loaded
        if model_id in self.loaded_models:
            print(f"Model '{model_id}' already loaded")
            return self.loaded_models[model_id]
        
        # Get model info
        model_info = self.get_model_info(model_id)
        if not model_info:
            raise ValueError(f"Model '{model_id}' not found in registry")
        
        model_path = model_info["model_path"]
        model_type = model_info["model_type"]
        
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            import torch
            
            print(f"Loading model '{model_id}' from {model_path}")
            
            # Load based on type
            if model_type == "lora":
                from peft import PeftModel
                
                # Load base model first
                base_model_name = model_info["metadata"].get("base_model")
                if not base_model_name:
                    raise ValueError("LoRA model requires base_model in metadata")
                
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_name,
                    device_map=device,
                    torch_dtype=torch.float16
                )
                
                model = PeftModel.from_pretrained(base_model, model_path)
            else:
                model = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    device_map=device,
                    torch_dtype=torch.float16
                )
            
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            
            self.loaded_models[model_id] = {
                "model": model,
                "tokenizer": tokenizer,
                "info": model_info
            }
            
            print(f"Model '{model_id}' loaded successfully")
            
            return self.loaded_models[model_id]
            
        except ImportError:
            raise ImportError("transformers and torch required")
    
    def unload_model(self, model_id: str) -> None:
        """
        Unload a model from memory.
        
        Args:
            model_id: Model identifier
        """
        if model_id in self.loaded_models:
            del self.loaded_models[model_id]
            
            # Force garbage collection
            import gc
            gc.collect()
            
            try:
                import torch
                torch.cuda.empty_cache()
            except:
                pass
            
            print(f"Model '{model_id}' unloaded from memory")
        else:
            print(f"Model '{model_id}' not loaded")
    
    def get_loaded_models(self) -> List[str]:
        """Get list of currently loaded model IDs."""
        return list(self.loaded_models.keys())
    
    def update_metadata(
        self,
        model_id: str,
        metadata: Dict[str, Any]
    ) -> None:
        """
        Update model metadata.
        
        Args:
            model_id: Model identifier
            metadata: Metadata to update
        """
        if model_id in self.registry["models"]:
            self.registry["models"][model_id]["metadata"].update(metadata)
            self._save_registry()
            print(f"Metadata updated for model '{model_id}'")
        else:
            print(f"Model '{model_id}' not found")
    
    def delete_model(self, model_id: str, delete_files: bool = False) -> None:
        """
        Delete a model from registry and optionally from disk.
        
        Args:
            model_id: Model identifier
            delete_files: Whether to delete model files from disk
        """
        model_info = self.get_model_info(model_id)
        if not model_info:
            print(f"Model '{model_id}' not found")
            return
        
        # Unload if loaded
        if model_id in self.loaded_models:
            self.unload_model(model_id)
        
        # Delete files if requested
        if delete_files:
            model_path = Path(model_info["model_path"])
            if model_path.exists():
                import shutil
                shutil.rmtree(model_path)
                print(f"Model files deleted from {model_path}")
        
        # Remove from registry
        self.unregister_model(model_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get model manager statistics."""
        models_by_type = {}
        for model_info in self.registry["models"].values():
            model_type = model_info["model_type"]
            models_by_type[model_type] = models_by_type.get(model_type, 0) + 1
        
        return {
            "total_models": len(self.registry["models"]),
            "loaded_models": len(self.loaded_models),
            "models_by_type": models_by_type
        }

