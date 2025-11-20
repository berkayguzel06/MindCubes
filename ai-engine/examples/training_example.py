"""
Example: Training and Fine-tuning Models
"""

import asyncio
from models import ModelTrainer, FineTuner, LoRAAdapter, ModelManager


def example_full_training():
    """Example: Full model training from scratch."""
    print("=" * 60)
    print("Example: Full Model Training")
    print("=" * 60)
    
    # Initialize trainer
    trainer = ModelTrainer(
        model_name="gpt2",  # Small model for example
        output_dir="./models/trained",
        config={
            "num_epochs": 3,
            "batch_size": 4,
            "learning_rate": 5e-5
        }
    )
    
    # Load model
    trainer.load_model(device="auto")
    
    # Prepare dataset (example with a local file)
    # dataset = trainer.prepare_dataset(
    #     dataset_path="./data/training_data.json",
    #     text_column="text",
    #     validation_split=0.1
    # )
    
    # Train
    # results = trainer.train(
    #     train_dataset=dataset["train"],
    #     eval_dataset=dataset["validation"]
    # )
    
    print("Training configuration loaded successfully!")
    print(f"Model: {trainer.model_name}")
    print(f"Config: {trainer.config}")


def example_fine_tuning():
    """Example: Fine-tuning a pre-trained model."""
    print("\n" + "=" * 60)
    print("Example: Fine-tuning")
    print("=" * 60)
    
    # Initialize fine-tuner
    fine_tuner = FineTuner(
        base_model="gpt2",
        task_type="text-generation",
        output_dir="./models/fine_tuned",
        config={
            "num_epochs": 5,
            "batch_size": 4,
            "learning_rate": 5e-5
        }
    )
    
    # Fine-tune on your dataset
    # results = fine_tuner.fine_tune(
    #     dataset_path="./data/instruction_data.json",
    #     task_config={
    #         "prompt_column": "prompt",
    #         "completion_column": "completion"
    #     }
    # )
    
    print("Fine-tuning configuration loaded successfully!")
    print(f"Base Model: {fine_tuner.model_name}")
    print(f"Task Type: {fine_tuner.task_type}")


def example_lora_training():
    """Example: LoRA adapter training."""
    print("\n" + "=" * 60)
    print("Example: LoRA Training")
    print("=" * 60)
    
    # Initialize LoRA adapter
    lora_adapter = LoRAAdapter(
        base_model="gpt2",
        output_dir="./models/lora_adapters",
        lora_config={
            "r": 8,
            "lora_alpha": 16,
            "lora_dropout": 0.1,
            "target_modules": ["c_attn"]  # GPT-2 specific
        }
    )
    
    # Load base model
    # lora_adapter.load_base_model(device="auto")
    
    # Prepare dataset
    # dataset = lora_adapter.prepare_dataset(
    #     dataset_path="./data/training_data.json",
    #     text_column="text",
    #     max_length=512
    # )
    
    # Train LoRA adapter
    # results = lora_adapter.train_lora(
    #     train_dataset=dataset["train"],
    #     eval_dataset=dataset.get("validation"),
    #     num_epochs=3,
    #     batch_size=4,
    #     learning_rate=3e-4
    # )
    
    # Merge and save (optional)
    # lora_adapter.merge_and_save("./models/merged_model")
    
    print("LoRA configuration loaded successfully!")
    print(f"Base Model: {lora_adapter.base_model}")
    print(f"LoRA Config: {lora_adapter.lora_config}")


def example_model_management():
    """Example: Managing multiple models."""
    print("\n" + "=" * 60)
    print("Example: Model Management")
    print("=" * 60)
    
    # Initialize model manager
    manager = ModelManager(models_dir="./models")
    
    # Register models
    manager.register_model(
        model_id="gpt2-base",
        model_path="gpt2",
        model_type="base",
        metadata={
            "description": "Base GPT-2 model",
            "size": "small"
        }
    )
    
    manager.register_model(
        model_id="custom-code-model",
        model_path="./models/fine_tuned/code_model",
        model_type="fine-tuned",
        metadata={
            "description": "Fine-tuned for code generation",
            "base_model": "gpt2"
        }
    )
    
    # List all models
    print("\nRegistered Models:")
    for model in manager.list_models():
        print(f"  - {model['model_id']} ({model['model_type']})")
    
    # Load a model
    # model_data = manager.load_model("gpt2-base")
    # print(f"\nLoaded: {model_data['info']['model_id']}")
    
    # Get stats
    stats = manager.get_stats()
    print(f"\nModel Manager Stats:")
    print(f"  Total Models: {stats['total_models']}")
    print(f"  Models by Type: {stats['models_by_type']}")


def main():
    """Run all examples."""
    print("\n" + "=" * 80)
    print("MindCubes - Model Training Examples")
    print("=" * 80)
    
    # Note: These are demonstrations of configuration
    # Actual training requires:
    # 1. Training data in the correct format
    # 2. Sufficient compute resources (GPU recommended)
    # 3. Proper environment setup with all dependencies
    
    example_full_training()
    example_fine_tuning()
    example_lora_training()
    example_model_management()
    
    print("\n" + "=" * 80)
    print("Examples completed!")
    print("=" * 80)
    print("\nTo actually train models:")
    print("1. Prepare your training data")
    print("2. Ensure GPU is available (CUDA)")
    print("3. Install all required packages")
    print("4. Uncomment the training calls in the examples")


if __name__ == "__main__":
    main()

