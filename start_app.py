import os
import subprocess
import time
import webbrowser
import platform

# Configuration
FRONTEND_PORT = 3000
BACKEND_PORT = 5000
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
# Get the directory where this script is located
CWD = os.path.dirname(os.path.abspath(__file__))

def run_command(command, title="Process", cwd=None):
    if platform.system() == "Windows":
        # Launch in minimized window / separate cmd
        return subprocess.Popen(f'start "{title}" /MIN cmd /k "{command}"', shell=True, cwd=cwd)
    else:
        # Fallback for Linux/Mac
        return subprocess.Popen(command, shell=True, cwd=cwd)

def main():
    print("=========================================")
    print("   STARTING ROBOFLOW APPLICATION v1.0")
    print("=========================================")
    print("")

    # 1. Start Backend Python Server
    backend_path = os.path.join(CWD, "local_inference")
    if os.path.exists(os.path.join(backend_path, "server.py")):
        print(f"[1/3] Starting Backend Server (Port {BACKEND_PORT})...")
        run_command("python server.py", title="Roboflow Backend", cwd=backend_path)
    else:
        print("ERROR: Backend server.py not found in local_inference folder!")
        input("Press Enter to exit...")
        return

    time.sleep(2)

    # 2. Start Frontend React Server
    if os.path.exists(os.path.join(CWD, "package.json")):
        print(f"[2/3] Starting Frontend React Server (Port {FRONTEND_PORT})...")
        
        # Check node_modules
        if not os.path.exists(os.path.join(CWD, "node_modules")):
            print("Installing dependencies (first run)...")
            subprocess.call("npm install", shell=True, cwd=CWD)

        run_command("npm run dev", title="Roboflow Frontend", cwd=CWD)
    else:
        print("ERROR: package.json not found!")
        input("Press Enter to exit...")
        return
    
    # 3. Open Browser
    print(f"[3/3] Opening Browser at {FRONTEND_URL}...")
    time.sleep(5) # Wait for Vite to bundle
    webbrowser.open(FRONTEND_URL)

    print("")
    print("=========================================")
    print("   APPLICATION RUNNING SUCCESSFULLY")
    print("   Do not close the minimized windows.")
    print("=========================================")
    time.sleep(3)

if __name__ == "__main__":
    main()
