"""
LLM Provider classes for different model backends
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import os
from datetime import datetime


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    def __init__(
        self,
        model_name: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ):
        """
        Initialize LLM provider.
        
        Args:
            model_name: Name/identifier of the model
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        """
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.total_tokens_used = 0
        self.request_count = 0
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate text based on the prompt.
        
        Args:
            prompt: User prompt
            system_prompt: System prompt for context
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Generated text
        """
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """
        Generate text with streaming response.
        
        Args:
            prompt: User prompt
            system_prompt: System prompt for context
            **kwargs: Additional provider-specific parameters
            
        Yields:
            Text chunks as they're generated
        """
        pass
    
    def get_stats(self) -> Dict[str, Any]:
        """Get provider usage statistics."""
        return {
            "provider": self.__class__.__name__,
            "model": self.model_name,
            "total_tokens": self.total_tokens_used,
            "requests": self.request_count,
            "avg_tokens_per_request": self.total_tokens_used / self.request_count if self.request_count > 0 else 0
        }


class OpenAIProvider(LLMProvider):
    """OpenAI API provider."""
    
    def __init__(
        self,
        model_name: str = "gpt-4",
        api_key: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ):
        super().__init__(model_name, temperature, max_tokens)
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._client = None
    
    def _get_client(self):
        """Lazy initialization of OpenAI client."""
        if self._client is None:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed. Install with: pip install openai")
        return self._client
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> str:
        """Generate text using OpenAI API."""
        client = self._get_client()
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = await client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=kwargs.get("temperature", self.temperature),
            max_tokens=kwargs.get("max_tokens", self.max_tokens)
        )
        
        self.request_count += 1
        self.total_tokens_used += response.usage.total_tokens
        
        return response.choices[0].message.content
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """Generate text with streaming using OpenAI API."""
        client = self._get_client()
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        stream = await client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=kwargs.get("temperature", self.temperature),
            max_tokens=kwargs.get("max_tokens", self.max_tokens),
            stream=True
        )
        
        self.request_count += 1
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class AnthropicProvider(LLMProvider):
    """Anthropic Claude API provider."""
    
    def __init__(
        self,
        model_name: str = "claude-3-opus-20240229",
        api_key: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ):
        super().__init__(model_name, temperature, max_tokens)
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self._client = None
    
    def _get_client(self):
        """Lazy initialization of Anthropic client."""
        if self._client is None:
            try:
                from anthropic import AsyncAnthropic
                self._client = AsyncAnthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("anthropic package not installed. Install with: pip install anthropic")
        return self._client
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> str:
        """Generate text using Anthropic API."""
        client = self._get_client()
        
        response = await client.messages.create(
            model=self.model_name,
            max_tokens=kwargs.get("max_tokens", self.max_tokens),
            temperature=kwargs.get("temperature", self.temperature),
            system=system_prompt or "",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        self.request_count += 1
        self.total_tokens_used += response.usage.input_tokens + response.usage.output_tokens
        
        return response.content[0].text
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """Generate text with streaming using Anthropic API."""
        client = self._get_client()
        
        async with client.messages.stream(
            model=self.model_name,
            max_tokens=kwargs.get("max_tokens", self.max_tokens),
            temperature=kwargs.get("temperature", self.temperature),
            system=system_prompt or "",
            messages=[
                {"role": "user", "content": prompt}
            ]
        ) as stream:
            self.request_count += 1
            async for text in stream.text_stream:
                yield text


class LocalModelProvider(LLMProvider):
    """
    Provider for local models using HuggingFace Transformers.
    Automatically downloads models from HuggingFace Hub.
    """
    
    def __init__(
        self,
        model_name: str,
        device: str = "auto",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        cache_dir: Optional[str] = None,
        hf_token: Optional[str] = None,
        load_in_8bit: bool = False,
        load_in_4bit: bool = False,
        trust_remote_code: bool = False
    ):
        """
        Initialize local model provider with HuggingFace integration.
        
        Args:
            model_name: HuggingFace model ID (e.g., 'meta-llama/Llama-2-7b-hf')
            device: Device to load model on ('auto', 'cuda', 'cpu')
            temperature: Sampling temperature (0.0 - 2.0)
            max_tokens: Maximum tokens to generate
            cache_dir: Directory to cache downloaded models (default: ~/.cache/huggingface)
            hf_token: HuggingFace API token for private/gated models
            load_in_8bit: Load model in 8-bit precision (saves memory)
            load_in_4bit: Load model in 4-bit precision (saves more memory)
            trust_remote_code: Allow custom code from model repo
        """
        super().__init__(model_name, temperature, max_tokens)
        self.device = self._resolve_device(device)
        self.cache_dir = cache_dir or os.getenv("HF_HOME") or os.path.expanduser("~/.cache/huggingface")
        self.hf_token = hf_token or os.getenv("HF_TOKEN")
        self.load_in_8bit = load_in_8bit
        self.load_in_4bit = load_in_4bit
        self.trust_remote_code = trust_remote_code
        self._model = None
        self._tokenizer = None
        self._model_info = None
    
    def _resolve_device(self, device: str) -> str:
        """Resolve preferred device, prioritizing GPU when available."""
        if device != "auto":
            return device
        
        try:
            import torch
            if torch.cuda.is_available():
                print("⚡ Using CUDA GPU for local models")
                return "cuda"
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():  # macOS Metal
                print("⚡ Using Apple MPS for local models")
                return "mps"
        except Exception:
            pass
        
        print("⚠️ No GPU detected, falling back to CPU")
        return "cpu"
    
    def _get_model_info(self):
        """Fetch model information from HuggingFace Hub."""
        if self._model_info is None:
            try:
                from huggingface_hub import model_info
                self._model_info = model_info(
                    self.model_name,
                    token=self.hf_token
                )
                print(f"Model: {self.model_name}")
                print(f"  - Downloads: {self._model_info.downloads:,}")
                print(f"  - Likes: {self._model_info.likes}")
                if hasattr(self._model_info, 'pipeline_tag'):
                    print(f"  - Task: {self._model_info.pipeline_tag}")
            except Exception as e:
                print(f"Could not fetch model info: {e}")
        return self._model_info
    
    def _load_model(self):
        """
        Lazy loading of model and tokenizer from HuggingFace Hub.
        Models are automatically downloaded and cached.
        """
        if self._model is None:
            try:
                from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
                import torch
                
                print(f"Loading model from HuggingFace: {self.model_name}")
                print(f"Cache directory: {self.cache_dir}")
                
                # Get model info
                self._get_model_info()
                
                # Load tokenizer
                print("Loading tokenizer...")
                self._tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name,
                    cache_dir=self.cache_dir,
                    token=self.hf_token,
                    trust_remote_code=self.trust_remote_code
                )
                
                # Ensure pad token exists
                if self._tokenizer.pad_token is None:
                    self._tokenizer.pad_token = self._tokenizer.eos_token
                
                # Configure quantization if requested
                quantization_config = None
                if self.load_in_4bit:
                    print("Loading in 4-bit mode (requires bitsandbytes)...")
                    quantization_config = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_compute_dtype=torch.float16,
                        bnb_4bit_quant_type="nf4",
                        bnb_4bit_use_double_quant=True
                    )
                elif self.load_in_8bit:
                    print("Loading in 8-bit mode (requires bitsandbytes)...")
                    quantization_config = BitsAndBytesConfig(
                        load_in_8bit=True
                    )
                
                # Load model
                print("Loading model...")
                model_kwargs = {
                    "cache_dir": self.cache_dir,
                    "token": self.hf_token,
                    "trust_remote_code": self.trust_remote_code,
                    "device_map": self.device,
                }
                
                # Add quantization config if specified
                if quantization_config:
                    model_kwargs["quantization_config"] = quantization_config
                else:
                    # Use float16 on GPUs, fall back to bfloat16/float32 on CPU
                    if self.device in ("cuda", "mps"):
                        model_kwargs["torch_dtype"] = torch.float16
                    else:
                        # bfloat16 is generally faster if available, otherwise default float32
                        model_kwargs["torch_dtype"] = torch.bfloat16 if hasattr(torch, "bfloat16") else torch.float32
                
                self._model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    **model_kwargs
                )
                
                print(f"Model loaded successfully on {self._model.device}")
                
                # Print memory usage if on CUDA
                if torch.cuda.is_available():
                    memory_allocated = torch.cuda.memory_allocated() / 1024**3
                    print(f"GPU Memory allocated: {memory_allocated:.2f} GB")
                
            except ImportError as e:
                if "bitsandbytes" in str(e) and (self.load_in_4bit or self.load_in_8bit):
                    raise ImportError(
                        "bitsandbytes required for quantization. "
                        "Install with: pip install bitsandbytes"
                    )
                raise ImportError(
                    "transformers and torch required. "
                    "Install with: pip install transformers torch"
                )
            except Exception as e:
                raise RuntimeError(f"Failed to load model '{self.model_name}': {str(e)}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate text using local HuggingFace model.
        
        Args:
            prompt: User prompt
            system_prompt: System prompt for context
            **kwargs: Additional generation parameters
            
        Returns:
            Generated text
        """
        self._load_model()
        
        # Combine system prompt and user prompt
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        # Tokenize
        inputs = self._tokenizer(
            full_prompt, 
            return_tensors="pt",
            truncation=True,
            max_length=2048
        ).to(self._model.device)
        
        # Generation parameters
        gen_kwargs = {
            "max_new_tokens": kwargs.get("max_tokens", self.max_tokens),
            "temperature": kwargs.get("temperature", self.temperature),
            "do_sample": True,
            "top_p": kwargs.get("top_p", 0.95),
            "top_k": kwargs.get("top_k", 50),
            "repetition_penalty": kwargs.get("repetition_penalty", 1.1),
            "pad_token_id": self._tokenizer.eos_token_id,
        }
        
        # Generate
        outputs = self._model.generate(
            **inputs,
            **gen_kwargs
        )
        
        # Decode
        generated_text = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove the prompt from the output
        response = generated_text[len(full_prompt):].strip()
        
        # Update statistics
        self.request_count += 1
        self.total_tokens_used += len(outputs[0])
        
        return response
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """
        Generate text with streaming for local models.
        Note: Currently yields complete response. True token-by-token streaming
        requires TextIteratorStreamer which is more complex to implement.
        """
        # For now, yield the complete response
        # TODO: Implement token-by-token streaming with TextIteratorStreamer
        response = await self.generate(prompt, system_prompt, **kwargs)
        yield response
    
    def unload_model(self):
        """
        Unload model from memory to free up resources.
        Useful when switching between different models.
        """
        if self._model is not None:
            import gc
            import torch
            
            del self._model
            del self._tokenizer
            self._model = None
            self._tokenizer = None
            
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                print("Model unloaded and GPU memory cleared")
            else:
                print("Model unloaded from memory")
    
    def get_model_size(self) -> Dict[str, Any]:
        """Get model size information."""
        if self._model is None:
            return {"status": "not_loaded"}
        
        try:
            import torch
            
            # Count parameters
            total_params = sum(p.numel() for p in self._model.parameters())
            trainable_params = sum(p.numel() for p in self._model.parameters() if p.requires_grad)
            
            info = {
                "total_parameters": total_params,
                "trainable_parameters": trainable_params,
                "total_parameters_millions": f"{total_params / 1e6:.2f}M",
                "total_parameters_billions": f"{total_params / 1e9:.2f}B",
            }
            
            # Add memory info if on CUDA
            if torch.cuda.is_available():
                info["gpu_memory_allocated_gb"] = f"{torch.cuda.memory_allocated() / 1024**3:.2f} GB"
                info["gpu_memory_reserved_gb"] = f"{torch.cuda.memory_reserved() / 1024**3:.2f} GB"
            
            return info
        except Exception as e:
            return {"error": str(e)}

