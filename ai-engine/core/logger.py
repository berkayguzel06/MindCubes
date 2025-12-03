"""
Central logging configuration for the AI Engine.

Özellikler:
- Konsola log yazma
- Günlük log dosyası (ai-engine.log) için günlük rotasyon (her gece 00:00)
- Eski log dosyaları için yedek (backupCount) limiti

Çevre değişkenleri:
- AI_ENGINE_LOG_DIR: Log dosyalarının dizini (varsayılan: ./logs)
- AI_ENGINE_LOG_LEVEL: Log seviyesi (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- AI_ENGINE_LOG_BACKUP_DAYS: Kaç günlük log tutulacağı (varsayılan: 7)
"""

import logging
import os
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from typing import Optional


BASE_LOGGER_NAME = "ai_engine"


def _configure_root_logger() -> logging.Logger:
    """Configure and return the base AI engine logger."""
    log_dir = os.getenv("AI_ENGINE_LOG_DIR")
    if not log_dir:
        # varsayılan: ai-engine/logs
        base_dir = Path(__file__).resolve().parent.parent
        log_dir = base_dir / "logs"
    else:
        log_dir = Path(log_dir)

    log_dir.mkdir(parents=True, exist_ok=True)

    log_level_str = os.getenv("AI_ENGINE_LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    backup_days = int(os.getenv("AI_ENGINE_LOG_BACKUP_DAYS", "7"))

    logger = logging.getLogger(BASE_LOGGER_NAME)
    logger.setLevel(log_level)
    logger.propagate = False  # root logger'a gitmesin

    # Aynı handler'ları tekrar eklememek için
    if logger.handlers:
        return logger

    log_format = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(log_format)
    logger.addHandler(console_handler)

    # Günlük dönen file handler (her gece 00:00, backup_days kadar eski dosya tutulur)
    file_path = log_dir / "ai-engine.log"
    file_handler = TimedRotatingFileHandler(
        filename=str(file_path),
        when="midnight",
        interval=1,
        backupCount=backup_days,
        encoding="utf-8",
        utc=False,
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(log_format)
    logger.addHandler(file_handler)

    logger.info("AI Engine logger initialized (dir=%s, level=%s)", log_dir, log_level_str)
    return logger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a child logger.

    Örnek:
        from core.logger import get_logger
        logger = get_logger(__name__)
        logger.info("Mesaj")
    """
    root = _configure_root_logger()
    if not name or name == BASE_LOGGER_NAME:
        return root
    return root.getChild(name)



