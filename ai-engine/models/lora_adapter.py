"""
LoRA Adapter - Parameter-Efficient Fine-Tuning with LoRA
"""

from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime
import json


class LoRAAdapter:
    """
    LoRA (Low-Rank Adaptation) for parameter-efficient fine-tuning.
    Much faster and more memory-efficient than full fine-tuning.
    """
    
    def __init__(
        self,
        base_model: str,
        output_dir: str = "./models/lora_adapters",
        lora_config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize LoRA adapter.
        
        Args:
            base_model: Base model to adapt
            output_dir: Directory to save adapters
            lora_config: LoRA configuration
        """
        self.base_model = base_model
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Default LoRA configuration
        self.lora_config = {
            "r": 16,  # LoRA rank
            "lora_alpha": 32,  # LoRA alpha
            "lora_dropout": 0.1,
            "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
            "bias": "none",
            "task_type": "CAUSAL_LM",
            **(lora_config or {})
        }
        
        self.model = None
        self.tokenizer = None
        self.peft_model = None
    
    def load_base_model(self, device: str = "auto") -> None:
        """
        Load base model with LoRA configuration.
        
        Args:
            device: Device to load model on
        """
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
            import torch
            
            print(f"Loading base model: {self.base_model}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self.base_model)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model
            self.model = AutoModelForCausalLM.from_pretrained(
                self.base_model,
                device_map=device,
                torch_dtype=torch.float16
            )
            
            # Prepare for LoRA training
            self.model = prepare_model_for_kbit_training(self.model)
            
            # Create LoRA config
            peft_config = LoraConfig(
                r=self.lora_config["r"],
                lora_alpha=self.lora_config["lora_alpha"],
                lora_dropout=self.lora_config["lora_dropout"],
                target_modules=self.lora_config["target_modules"],
                bias=self.lora_config["bias"],
                task_type=self.lora_config["task_type"]
            )
            
            # Apply LoRA to model
            self.peft_model = get_peft_model(self.model, peft_config)
            
            # Print trainable parameters
            self.peft_model.print_trainable_parameters()
            
            print("Model loaded with LoRA adapters")
            
        except ImportError:
            raise ImportError("peft, transformers, and torch required. Install with: pip install peft transformers torch")
    
    def prepare_dataset(
        self,
        dataset_path: str,
        text_column: str = "text",
        max_length: int = 512
    ) -> Dict[str, Any]:
        """
        Prepare dataset for LoRA training.
        
        Args:
            dataset_path: Path to dataset
            text_column: Name of text column
            max_length: Maximum sequence length
            
        Returns:
            Prepared dataset
        """
        try:
            from datasets import load_dataset
            
            print(f"Loading dataset: {dataset_path}")
            
            # Load dataset
            if Path(dataset_path).exists():
                if dataset_path.endswith('.json'):
                    dataset = load_dataset('json', data_files=dataset_path)
                elif dataset_path.endswith('.csv'):
                    dataset = load_dataset('csv', data_files=dataset_path)
                else:
                    dataset = load_dataset('text', data_files=dataset_path)
            else:
                dataset = load_dataset(dataset_path)
            
            # Tokenize
            def tokenize_function(examples):
                return self.tokenizer(
                    examples[text_column],
                    padding="max_length",
                    truncation=True,
                    max_length=max_length
                )
            
            tokenized_dataset = dataset.map(
                tokenize_function,
                batched=True,
                remove_columns=dataset["train"].column_names
            )
            
            print(f"Dataset prepared: {len(tokenized_dataset['train'])} samples")
            
            return tokenized_dataset
            
        except ImportError:
            raise ImportError("datasets package required")
    
    def train_lora(
        self,
        train_dataset: Any,
        eval_dataset: Optional[Any] = None,
        num_epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 3e-4
    ) -> Dict[str, Any]:
        """
        Train LoRA adapter.
        
        Args:
            train_dataset: Training dataset
            eval_dataset: Validation dataset
            num_epochs: Number of training epochs
            batch_size: Batch size
            learning_rate: Learning rate
            
        Returns:
            Training results
        """
        if self.peft_model is None:
            raise ValueError("Model not loaded. Call load_base_model() first.")
        
        try:
            from transformers import Trainer, TrainingArguments, DataCollatorForLanguageModeling
            
            # Create output directory for this run
            run_name = f"lora_run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            run_output_dir = self.output_dir / run_name
            
            # Training arguments
            training_args = TrainingArguments(
                output_dir=str(run_output_dir),
                num_train_epochs=num_epochs,
                per_device_train_batch_size=batch_size,
                gradient_accumulation_steps=4,
                learning_rate=learning_rate,
                logging_steps=10,
                save_steps=100,
                eval_steps=100 if eval_dataset else None,
                evaluation_strategy="steps" if eval_dataset else "no",
                fp16=True,
                optim="paged_adamw_32bit",
                save_total_limit=3,
                load_best_model_at_end=True if eval_dataset else False,
                report_to=["tensorboard"]
            )
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=self.tokenizer,
                mlm=False
            )
            
            # Create trainer
            trainer = Trainer(
                model=self.peft_model,
                args=training_args,
                train_dataset=train_dataset,
                eval_dataset=eval_dataset,
                data_collator=data_collator
            )
            
            print("Starting LoRA training...")
            
            # Train
            train_result = trainer.train()
            
            # Save LoRA adapter
            self.peft_model.save_pretrained(str(run_output_dir / "adapter"))
            self.tokenizer.save_pretrained(str(run_output_dir / "adapter"))
            
            # Save training info
            training_info = {
                "run_name": run_name,
                "base_model": self.base_model,
                "lora_config": self.lora_config,
                "training_args": {
                    "num_epochs": num_epochs,
                    "batch_size": batch_size,
                    "learning_rate": learning_rate
                },
                "train_result": {
                    "train_loss": train_result.training_loss,
                    "train_runtime": train_result.metrics.get("train_runtime"),
                    "train_samples_per_second": train_result.metrics.get("train_samples_per_second")
                },
                "timestamp": datetime.now().isoformat()
            }
            
            with open(run_output_dir / "training_info.json", "w") as f:
                json.dump(training_info, f, indent=2)
            
            print(f"LoRA training completed! Adapter saved to {run_output_dir}")
            
            return training_info
            
        except ImportError:
            raise ImportError("transformers package required")
    
    def load_adapter(self, adapter_path: str) -> None:
        """
        Load a trained LoRA adapter.
        
        Args:
            adapter_path: Path to LoRA adapter
        """
        try:
            from peft import PeftModel
            from transformers import AutoModelForCausalLM, AutoTokenizer
            import torch
            
            print(f"Loading LoRA adapter from: {adapter_path}")
            
            # Load base model
            self.tokenizer = AutoTokenizer.from_pretrained(adapter_path)
            base_model = AutoModelForCausalLM.from_pretrained(
                self.base_model,
                device_map="auto",
                torch_dtype=torch.float16
            )
            
            # Load adapter
            self.peft_model = PeftModel.from_pretrained(base_model, adapter_path)
            
            print("LoRA adapter loaded successfully")
            
        except ImportError:
            raise ImportError("peft and transformers required")
    
    def merge_and_save(self, output_path: str) -> None:
        """
        Merge LoRA adapter with base model and save.
        
        Args:
            output_path: Path to save merged model
        """
        if self.peft_model is None:
            raise ValueError("No adapter loaded")
        
        print("Merging LoRA adapter with base model...")
        
        # Merge adapter with base model
        merged_model = self.peft_model.merge_and_unload()
        
        # Save merged model
        output_path = Path(output_path)
        output_path.mkdir(parents=True, exist_ok=True)
        
        merged_model.save_pretrained(str(output_path))
        self.tokenizer.save_pretrained(str(output_path))
        
        print(f"Merged model saved to {output_path}")

