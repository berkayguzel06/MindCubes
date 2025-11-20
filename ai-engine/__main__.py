"""
MindCubes AI Engine - Main Entry Point
Run with: python -m ai-engine
"""

import uvicorn
from api import app

if __name__ == "__main__":
    print("🚀 Starting MindCubes AI Engine...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

