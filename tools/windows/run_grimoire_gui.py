"""
Grimoire — Standalone Native Desktop GUI Runner (Windows)
Runs Grimoire as a true native desktop application window using pywebview (WebView2 Win32),
with full OS file system access, local media streaming, and offline vault storage.
"""

import os
import sys
import time
import socket
import threading
import subprocess
from pathlib import Path
from http.server import ThreadingHTTPServer

if getattr(sys, "frozen", False):
    EXE_DIR = Path(sys.executable).resolve().parent
    if (EXE_DIR / "ChroniclesVault-Windows-Installer").exists():
        REPO_ROOT = EXE_DIR
    elif (EXE_DIR.parent / "ChroniclesVault-Windows-Installer").exists():
        REPO_ROOT = EXE_DIR.parent
    else:
        REPO_ROOT = Path(r"c:\Users\67rah\Desktop\Chronciles Vault")
else:
    TOOLS_DIR = Path(__file__).resolve().parent
    REPO_ROOT = TOOLS_DIR.parent.parent

INSTALLER_DIR = REPO_ROOT / "ChroniclesVault-Windows-Installer"
PORT = 47920

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0

def ensure_server_running():
    if is_port_in_use(PORT):
        print(f"[Grimoire GUI] Server already running on port {PORT}.")
        return

    print(f"[Grimoire GUI] Starting local server engine on port {PORT}...")
    sys.path.insert(0, str(INSTALLER_DIR))
    from pc_workstation_app import PCStudioRequestHandler

    server = ThreadingHTTPServer(("0.0.0.0", PORT), PCStudioRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.6)
    print(f"[Grimoire GUI] Local server engine started on http://127.0.0.1:{PORT}/")

def run_native_gui():
    target_url = f"http://127.0.0.1:{PORT}/"
    ensure_server_running()

    print("[Grimoire GUI] Launching native Windows application window...")
    try:
        import webview
        window = webview.create_window(
            title="Grimoire — Sovereign Reading Sanctum",
            url=target_url,
            width=1420,
            height=880,
            min_size=(900, 600),
            confirm_close=False,
            easy_drag=False,
            text_select=True,
        )
        # Starts the Win32 native message loop using WebView2 EdgeChromium engine
        webview.start(gui="edgechromium", debug=False)
        print("[Grimoire GUI] Native window closed by user.")
    except Exception as exc:
        print(f"[Grimoire GUI] pywebview native window failed: {exc}. Falling back to standalone app window...")
        # Fallback to standalone app window
        cmd = f'Start-Process msedge -ArgumentList "--app={target_url}", "--window-size=1420,880"'
        subprocess.run(["powershell", "-Command", cmd])

if __name__ == "__main__":
    run_native_gui()
