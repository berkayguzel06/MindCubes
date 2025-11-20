"""
Fine Tuner - Fine-tune pre-trained models
"""

from typing import Dict, Any, Optional, List
from pathlib import Path
from .trainer import ModelTrainer


class FineTuner(ModelTrainer):
    """
    Fine-tune pre-trained models for specific tasks.
    Extends ModelTrainer with fine-tuning specific functionality.
    """
    
    def __init__(
        self,
        base_model: str,
        task_type: str = "text-generation",
        output_dir: str = "./models/fine_tuned",
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize fine-tuner.
        
        Args:
            base_model: Base pre-trained model
            task_type: Type of task (text-generation, classification, etc.)
            output_dir: Directory to save fine-tuned model
            config: Fine-tuning configuration
        """
        # Fine-tuning typically uses lower learning rate
        fine_tune_config = {
            "learning_rate": 5e-5,
            "num_epochs": 5,
            "batch_size": 4,
            "gradient_accumulation_steps": 4,
            **(config or {})
        }
        
        super().__init__(
            model_name=base_model,
            output_dir=output_dir,
            config=fine_tune_config
        )
        
        self.task_type = task_type
    
    def prepare_task_dataset(
        self,
        dataset_path: str,
        task_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Prepare dataset for specific task.
        
        Args:
            dataset_path: Path to dataset
            task_config: Task-specific configuration
            
        Returns:
            Prepared dataset
        """
        task_config = task_config or {}
        
        if self.task_type == "text-generation":
            return self._prepare_generation_dataset(dataset_path, task_config)
        elif self.task_type == "classification":
            return self._prepare_classification_dataset(dataset_path, task_config)
        elif self.task_type == "question-answering":
            return self._prepare_qa_dataset(dataset_path, task_config)
        else:
            # Default to standard dataset preparation
            return self.prepare_dataset(dataset_path)
    
    def _prepare_generation_dataset(
        self,
        dataset_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prepare dataset for text generation tasks."""
        prompt_column = config.get("prompt_column", "prompt")
        completion_column = config.get("completion_column", "completion")
        
        try:
            from datasets import load_dataset
            
            # Load dataset
            if Path(dataset_path).exists():
                dataset = load_dataset('json', data_files=dataset_path)
            else:
                dataset = load_dataset(dataset_path)
            
            # Format for instruction tuning
            def format_prompts(examples):
                texts = []
                for prompt, completion in zip(examples[prompt_column], examples[completion_column]):
                    text = f"### Instruction:\n{prompt}\n\n### Response:\n{completion}"
                    texts.append(text)
                return {"text": texts}
            
            formatted_dataset = dataset.map(
                format_prompts,
                batched=True,
                remove_columns=dataset["train"].column_names
            )
            
            # Tokenize
            return super().prepare_dataset(
                dataset_path="",  # Already loaded
                text_column="text"
            )
            
        except ImportError:
            raise ImportError("datasets package required")
    
    def _prepare_classification_dataset(
        self,
        dataset_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prepare dataset for classification tasks."""
        text_column = config.get("text_column", "text")
        label_column = config.get("label_column", "label")
        
        try:
            from datasets import load_dataset
            
            if Path(dataset_path).exists():
                dataset = load_dataset('json', data_files=dataset_path)
            else:
                dataset = load_dataset(dataset_path)
            
            # Tokenize with labels
            def tokenize_function(examples):
                result = self.tokenizer(
                    examples[text_column],
                    padding="max_length",
                    truncation=True,
                    max_length=self.config["max_seq_length"]
                )
                result["labels"] = examples[label_column]
                return result
            
            tokenized_dataset = dataset.map(
                tokenize_function,
                batched=True
            )
            
            return tokenized_dataset
            
        except ImportError:
            raise ImportError("datasets package required")
    
    def _prepare_qa_dataset(
        self,
        dataset_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prepare dataset for question-answering tasks."""
        question_column = config.get("question_column", "question")
        context_column = config.get("context_column", "context")
        answer_column = config.get("answer_column", "answer")
        
        try:
            from datasets import load_dataset
            
            if Path(dataset_path).exists():
                dataset = load_dataset('json', data_files=dataset_path)
            else:
                dataset = load_dataset(dataset_path)
            
            # Format QA pairs
            def format_qa(examples):
                texts = []
                for question, context, answer in zip(
                    examples[question_column],
                    examples[context_column],
                    examples[answer_column]
                ):
                    text = f"Context: {context}\n\nQuestion: {question}\n\nAnswer: {answer}"
                    texts.append(text)
                return {"text": texts}
            
            formatted_dataset = dataset.map(
                format_qa,
                batched=True,
                remove_columns=dataset["train"].column_names
            )
            
            # Tokenize
            def tokenize_function(examples):
                return self.tokenizer(
                    examples["text"],
                    padding="max_length",
                    truncation=True,
                    max_length=self.config["max_seq_length"]
                )
            
            tokenized_dataset = formatted_dataset.map(
                tokenize_function,
                batched=True,
                remove_columns=["text"]
            )
            
            return tokenized_dataset
            
        except ImportError:
            raise ImportError("datasets package required")
    
    def fine_tune(
        self,
        dataset_path: str,
        task_config: Optional[Dict[str, Any]] = None,
        validation_split: float = 0.1
    ) -> Dict[str, Any]:
        """
        Fine-tune the model on a specific task.
        
        Args:
            dataset_path: Path to training dataset
            task_config: Task-specific configuration
            validation_split: Validation split ratio
            
        Returns:
            Training results
        """
        # Load model
        self.load_model()
        
        # Prepare dataset
        dataset = self.prepare_task_dataset(dataset_path, task_config)
        
        # Split dataset if needed
        if "validation" not in dataset:
            split_dataset = dataset["train"].train_test_split(test_size=validation_split)
            train_dataset = split_dataset["train"]
            eval_dataset = split_dataset["test"]
        else:
            train_dataset = dataset["train"]
            eval_dataset = dataset["validation"]
        
        # Train
        print(f"Fine-tuning {self.model_name} for {self.task_type} task...")
        results = self.train(train_dataset, eval_dataset)
        
        print("Fine-tuning completed!")
        
        return results

