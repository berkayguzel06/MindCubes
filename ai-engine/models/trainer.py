"""
Model Trainer - Train models from scratch or continue training
"""

from typing import Dict, Any, Optional, List, Callable
from pathlib import Path
import json
from datetime import datetime


class ModelTrainer:
    """
    Handles training of AI models from scratch or continued training.
    """
    
    def __init__(
        self,
        model_name: str,
        output_dir: str = "./models/checkpoints",
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize model trainer.
        
        Args:
            model_name: Name/path of the base model
            output_dir: Directory to save checkpoints
            config: Training configuration
        """
        self.model_name = model_name
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Default configuration
        self.config = {
            "learning_rate": 2e-5,
            "batch_size": 8,
            "num_epochs": 3,
            "warmup_steps": 100,
            "logging_steps": 10,
            "save_steps": 500,
            "eval_steps": 500,
            "max_seq_length": 512,
            "gradient_accumulation_steps": 1,
            "fp16": True,
            "optim": "adamw_torch",
            **(config or {})
        }
        
        self.model = None
        self.tokenizer = None
        self.training_history = []
    
    def load_model(self, device: str = "auto") -> None:
        """
        Load model and tokenizer.
        
        Args:
            device: Device to load model on (auto, cuda, cpu)
        """
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            import torch
            
            print(f"Loading model: {self.model_name}")
            
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            
            # Add padding token if it doesn't exist
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                device_map=device,
                torch_dtype=torch.float16 if self.config["fp16"] else torch.float32
            )
            
            print(f"Model loaded successfully")
            
        except ImportError:
            raise ImportError("transformers and torch required. Install with: pip install transformers torch")
    
    def prepare_dataset(
        self,
        dataset_path: str,
        text_column: str = "text",
        validation_split: float = 0.1
    ) -> Dict[str, Any]:
        """
        Prepare dataset for training.
        
        Args:
            dataset_path: Path to dataset file or HuggingFace dataset name
            text_column: Name of the text column
            validation_split: Fraction of data to use for validation
            
        Returns:
            Prepared datasets
        """
        try:
            from datasets import load_dataset
            
            print(f"Loading dataset: {dataset_path}")
            
            # Load dataset
            if Path(dataset_path).exists():
                # Local file
                if dataset_path.endswith('.json'):
                    dataset = load_dataset('json', data_files=dataset_path)
                elif dataset_path.endswith('.csv'):
                    dataset = load_dataset('csv', data_files=dataset_path)
                else:
                    dataset = load_dataset('text', data_files=dataset_path)
            else:
                # HuggingFace dataset
                dataset = load_dataset(dataset_path)
            
            # Split into train/validation if needed
            if 'train' not in dataset and 'validation' not in dataset:
                dataset = dataset['train'].train_test_split(test_size=validation_split)
                dataset['validation'] = dataset.pop('test')
            
            # Tokenize dataset
            def tokenize_function(examples):
                return self.tokenizer(
                    examples[text_column],
                    padding="max_length",
                    truncation=True,
                    max_length=self.config["max_seq_length"]
                )
            
            tokenized_dataset = dataset.map(
                tokenize_function,
                batched=True,
                remove_columns=dataset["train"].column_names
            )
            
            print(f"Dataset prepared: {len(tokenized_dataset['train'])} train, {len(tokenized_dataset.get('validation', []))} val")
            
            return tokenized_dataset
            
        except ImportError:
            raise ImportError("datasets package required. Install with: pip install datasets")
    
    def train(
        self,
        train_dataset: Any,
        eval_dataset: Optional[Any] = None,
        callbacks: Optional[List[Callable]] = None
    ) -> Dict[str, Any]:
        """
        Train the model.
        
        Args:
            train_dataset: Training dataset
            eval_dataset: Validation dataset
            callbacks: Training callbacks
            
        Returns:
            Training results
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        try:
            from transformers import Trainer, TrainingArguments, DataCollatorForLanguageModeling
            
            # Create output directory for this run
            run_name = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            run_output_dir = self.output_dir / run_name
            
            # Training arguments
            training_args = TrainingArguments(
                output_dir=str(run_output_dir),
                num_train_epochs=self.config["num_epochs"],
                per_device_train_batch_size=self.config["batch_size"],
                gradient_accumulation_steps=self.config["gradient_accumulation_steps"],
                learning_rate=self.config["learning_rate"],
                warmup_steps=self.config["warmup_steps"],
                logging_steps=self.config["logging_steps"],
                save_steps=self.config["save_steps"],
                eval_steps=self.config["eval_steps"] if eval_dataset else None,
                evaluation_strategy="steps" if eval_dataset else "no",
                fp16=self.config["fp16"],
                optim=self.config["optim"],
                save_total_limit=3,
                load_best_model_at_end=True if eval_dataset else False,
                report_to=["tensorboard"]
            )
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=self.tokenizer,
                mlm=False  # Causal language modeling
            )
            
            # Create trainer
            trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=train_dataset,
                eval_dataset=eval_dataset,
                data_collator=data_collator,
                callbacks=callbacks
            )
            
            print("Starting training...")
            
            # Train
            train_result = trainer.train()
            
            # Save final model
            trainer.save_model(str(run_output_dir / "final"))
            
            # Save training history
            history = {
                "run_name": run_name,
                "model_name": self.model_name,
                "config": self.config,
                "train_result": {
                    "train_loss": train_result.training_loss,
                    "train_runtime": train_result.metrics.get("train_runtime"),
                    "train_samples_per_second": train_result.metrics.get("train_samples_per_second")
                },
                "timestamp": datetime.now().isoformat()
            }
            
            self.training_history.append(history)
            
            # Save history
            with open(run_output_dir / "training_history.json", "w") as f:
                json.dump(history, f, indent=2)
            
            print(f"Training completed! Model saved to {run_output_dir}")
            
            return history
            
        except ImportError:
            raise ImportError("transformers package required. Install with: pip install transformers")
    
    def evaluate(self, eval_dataset: Any) -> Dict[str, Any]:
        """
        Evaluate the model.
        
        Args:
            eval_dataset: Evaluation dataset
            
        Returns:
            Evaluation metrics
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        try:
            from transformers import Trainer, TrainingArguments, DataCollatorForLanguageModeling
            
            training_args = TrainingArguments(
                output_dir=str(self.output_dir / "eval"),
                per_device_eval_batch_size=self.config["batch_size"],
                fp16=self.config["fp16"]
            )
            
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=self.tokenizer,
                mlm=False
            )
            
            trainer = Trainer(
                model=self.model,
                args=training_args,
                eval_dataset=eval_dataset,
                data_collator=data_collator
            )
            
            print("Evaluating model...")
            metrics = trainer.evaluate()
            
            print(f"Evaluation results: {metrics}")
            
            return metrics
            
        except ImportError:
            raise ImportError("transformers package required")
    
    def save_model(self, save_path: str) -> None:
        """
        Save model and tokenizer.
        
        Args:
            save_path: Path to save the model
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        save_path = Path(save_path)
        save_path.mkdir(parents=True, exist_ok=True)
        
        self.model.save_pretrained(str(save_path))
        self.tokenizer.save_pretrained(str(save_path))
        
        print(f"Model saved to {save_path}")
    
    def get_training_history(self) -> List[Dict[str, Any]]:
        """Get training history."""
        return self.training_history

