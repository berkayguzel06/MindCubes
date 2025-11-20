"""
Simple runner script for AI Engine
Run with: python ai-engine/run.py
"""

import sys
import os
import uvicorn

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Starting MindCubes AI Engine...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API Docs: http://localhost:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

