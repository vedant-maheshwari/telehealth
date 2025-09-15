import subprocess
import threading
import time
import os
from pathlib import Path

def run_backend():
    """Run FastAPI backend"""
    os.chdir(Path.cwd())
    subprocess.run([
    "uvicorn",
    "main:app",
    "--reload",
    "--host", "0.0.0.0",
    "--port", "8000"
])


def run_frontend():
    """Run simple HTTP server for frontend"""
    os.chdir(Path.cwd() / "frontend")
    subprocess.run(["python", "-m", "http.server", "3000"])

if __name__ == "__main__":
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Give backend time to start
    time.sleep(2)
    
    # Start frontend server
    print("Starting servers...")
    print("Backend: http://localhost:8000")
    print("Frontend: http://localhost:3000")
    
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("Shutting down servers...")
