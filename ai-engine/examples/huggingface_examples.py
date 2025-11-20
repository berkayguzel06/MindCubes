"""
HuggingFace Model Integration Examples
Demonstrates how to use local models from HuggingFace Hub
"""

import asyncio
import os
from pathlib import Path

# Add parent directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from core import LocalModelProvider
from agents import CodeAgent

try:
    import torch  # type: ignore
    DEFAULT_DEVICE = "cuda" if torch.cuda.is_available() else (
        "mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu"
    )
except ImportError:
    DEFAULT_DEVICE = "cpu"


async def example_1_basic_usage():
    """Example 1: Basic HuggingFace model usage."""
    print("=" * 60)
    print("Example 1: Basic HuggingFace Model Usage")
    print("=" * 60)
    
    # Initialize provider with a small model
    provider = LocalModelProvider(
        model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",  # Small model (~1GB)
        device=DEFAULT_DEVICE,
        cache_dir="./models/cache"
    )
    
    # Generate text
    print("\nGenerating response...")
    response = await provider.generate(
        prompt="What is Python programming language?",
        system_prompt="You are a helpful coding assistant."
    )
    
    print(f"\nResponse:\n{response}")
    
    # Get model statistics
    stats = provider.get_stats()
    print(f"\nModel Stats:")
    print(f"  - Requests: {stats['requests']}")
    print(f"  - Total Tokens: {stats['total_tokens']}")
    
    # Get model size info
    size_info = provider.get_model_size()
    if "error" not in size_info:
        print(f"\nModel Size:")
        print(f"  - Parameters: {size_info['total_parameters_millions']}")
        if "gpu_memory_allocated_gb" in size_info:
            print(f"  - GPU Memory: {size_info['gpu_memory_allocated_gb']}")


async def example_2_quantized_model():
    """Example 2: Using 4-bit quantization for memory efficiency."""
    print("\n" + "=" * 60)
    print("Example 2: 4-bit Quantized Model")
    print("=" * 60)
    
    # Load model in 4-bit mode (uses ~4GB less memory)
    provider = LocalModelProvider(
        model_name="microsoft/phi-2",  # 2.7B parameter model
        device=DEFAULT_DEVICE,
        load_in_4bit=True,  # 4-bit quantization
        cache_dir="./models/cache"
    )
    
    print("\nGenerating code...")
    response = await provider.generate(
        prompt="Write a Python function to calculate fibonacci numbers",
        system_prompt="You are an expert Python programmer."
    )
    
    print(f"\nGenerated Code:\n{response}")
    
    # Unload model to free memory
    provider.unload_model()


async def example_3_code_generation():
    """Example 3: Using CodeLlama for code generation."""
    print("\n" + "=" * 60)
    print("Example 3: Code Generation with CodeLlama")
    print("=" * 60)
    
    provider = LocalModelProvider(
        model_name="codellama/CodeLlama-7b-Instruct-hf",
        device=DEFAULT_DEVICE,
        cache_dir="./models/cache",
        load_in_8bit=True  # 8-bit quantization
    )
    
    prompts = [
        "Write a Python function to reverse a string",
        "Create a binary search implementation in Python",
        "Write a function to find prime numbers"
    ]
    
    for prompt in prompts:
        print(f"\nPrompt: {prompt}")
        response = await provider.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=256
        )
        print(f"Response:\n{response[:200]}...")  # Show first 200 chars


async def example_4_with_agent():
    """Example 4: Using HuggingFace model with CodeAgent."""
    print("\n" + "=" * 60)
    print("Example 4: HuggingFace Model with CodeAgent")
    print("=" * 60)
    
    # Create LLM provider
    llm_provider = LocalModelProvider(
        model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        device=DEFAULT_DEVICE,
        cache_dir="./models/cache"
    )
    
    # Create agent with local model
    agent = CodeAgent(
        llm_provider=llm_provider,
        tools=[],  # No tools needed for this example
        memory=None
    )
    
    # Use agent
    print("\nAsking agent to generate code...")
    response = await agent.process(
        "Create a Python function that calculates the factorial of a number"
    )
    
    print(f"\nAgent Response:\n{response}")
    
    # Get agent stats
    stats = agent.get_stats()
    print(f"\nAgent Stats:")
    print(f"  - Total Tasks: {stats['total_tasks']}")


async def example_5_gated_model():
    """Example 5: Using gated models (requires HuggingFace token)."""
    print("\n" + "=" * 60)
    print("Example 5: Gated Model (Llama-2)")
    print("=" * 60)
    
    # Check if HF_TOKEN is set
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("\n⚠️  HF_TOKEN not set!")
        print("To use gated models:")
        print("1. Go to https://huggingface.co/settings/tokens")
        print("2. Create a new token")
        print("3. Set environment variable: export HF_TOKEN='your_token'")
        print("4. Request access to the model on HuggingFace")
        return
    
    try:
        provider = LocalModelProvider(
            model_name="meta-llama/Llama-2-7b-chat-hf",
            device=DEFAULT_DEVICE,
            cache_dir="./models/cache",
            hf_token=hf_token,
            load_in_4bit=True  # Recommended for 7B models
        )
        
        print("\nGenerating response with Llama-2...")
        response = await provider.generate(
            prompt="Explain machine learning in simple terms",
            system_prompt="You are a helpful AI assistant."
        )
        
        print(f"\nResponse:\n{response}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Make sure you have access to the model on HuggingFace")


async def example_6_compare_models():
    """Example 6: Compare different models."""
    print("\n" + "=" * 60)
    print("Example 6: Model Comparison")
    print("=" * 60)
    
    models = [
        ("TinyLlama/TinyLlama-1.1B-Chat-v1.0", "TinyLlama 1.1B"),
        ("microsoft/phi-2", "Phi-2 2.7B"),
    ]
    
    prompt = "What is recursion in programming?"
    
    for model_id, model_name in models:
        print(f"\n--- Testing {model_name} ---")
        
        try:
            provider = LocalModelProvider(
                model_name=model_id,
                device=DEFAULT_DEVICE,
                cache_dir="./models/cache",
                load_in_4bit=True
            )
            
            import time
            start = time.time()
            
            response = await provider.generate(
                prompt=prompt,
                max_tokens=100
            )
            
            duration = time.time() - start
            
            print(f"Response: {response[:150]}...")
            print(f"Time: {duration:.2f}s")
            
            # Unload to free memory for next model
            provider.unload_model()
            
        except Exception as e:
            print(f"Error: {e}")


async def example_7_custom_generation_params():
    """Example 7: Custom generation parameters."""
    print("\n" + "=" * 60)
    print("Example 7: Custom Generation Parameters")
    print("=" * 60)
    
    provider = LocalModelProvider(
        model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        device=DEFAULT_DEVICE,
        cache_dir="./models/cache"
    )
    
    prompt = "Complete this code: def fibonacci(n):"
    
    # Different temperature values
    temperatures = [0.3, 0.7, 1.0]
    
    for temp in temperatures:
        print(f"\n--- Temperature: {temp} ---")
        response = await provider.generate(
            prompt=prompt,
            temperature=temp,
            max_tokens=150,
            top_p=0.95,
            top_k=50,
            repetition_penalty=1.1
        )
        print(f"Response:\n{response[:200]}...")


async def main():
    """Run all examples."""
    print("\n" + "=" * 80)
    print("HuggingFace Model Integration Examples")
    print("=" * 80)
    
    print("\n📝 Note: First run will download models (~1-4GB each)")
    print("Models are cached for future use.")
    print("Press Ctrl+C to skip an example\n")
    
    examples = [
        ("Basic Usage", example_1_basic_usage),
        ("4-bit Quantization", example_2_quantized_model),
        ("Code Generation", example_3_code_generation),
        ("With Agent", example_4_with_agent),
        ("Gated Model", example_5_gated_model),
        ("Model Comparison", example_6_compare_models),
        ("Custom Parameters", example_7_custom_generation_params),
    ]
    
    for i, (name, func) in enumerate(examples, 1):
        try:
            print(f"\n\n{'='*80}")
            print(f"Running Example {i}/{len(examples)}: {name}")
            print(f"{'='*80}")
            await func()
        except KeyboardInterrupt:
            print(f"\n⏭️  Skipping {name}...")
            continue
        except Exception as e:
            print(f"\n❌ Error in {name}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 80)
    print("Examples completed!")
    print("=" * 80)


if __name__ == "__main__":
    # Check for required packages
    try:
        import torch  # type: ignore
        import transformers  # type: ignore
        from huggingface_hub import model_info  # type: ignore
    except ImportError as e:
        print("❌ Missing required packages!")
        print("Install with: pip install transformers torch huggingface-hub bitsandbytes")
        exit(1)
    
    # Run examples
    asyncio.run(main())

