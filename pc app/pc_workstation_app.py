"""
Chronicles Vault — Modern PC Workstation Studio App (`pc app/pc_workstation_app.py`)
Runs via `venv/Scripts/python.exe` as a standalone Native Desktop Application Window
(using Windows Edge WebView2 / Chromium `--app` mode with native Python OS hooks).

Key Features:
  1. Awesome 2026 Bright White + Vibrant Prism UI (Pure White cards, Electric Indigo,
     Coral Rose, Sky Cyan & Emerald accents, Extra-Bold typography, ZERO text overspill).
  2. Launch Screen: Shows ONLY the "Loading Your Room" animated 3D Bookshelf & Orb preloader
     with Room Profile selector and "Enter My Room ✦" button.
  3. Non-1:1 3-Pane Bento Desktop Workstation UI with Native Windows OS integration:
     - Native Windows File Picker (`Link Local Video / Book`)
     - Native Windows Folder Scanner (`Scan PC Disk Folder for EPUB/PDF/CBZ/MP4/MKV`)
     - Native Windows Media Launcher (`os.startfile` opens MP4/MKV in VLC/Windows Media Player)
     - Live Samsung Galaxy A14 Wi-Fi Connection & Streaming Hub (`http://<PC-IP>:47920/mobile`)
  4. Built-in Help Center housing all 32 Tiny-to-Tiny Features with Step-by-Step Instructions
     and 1-click Native Screenshot Attachment & Preview.
"""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import tkinter as tk
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tkinter import filedialog
from typing import Any, Dict, List
from urllib.parse import parse_qs, urlparse

THIS_DIR = Path(__file__).resolve().parent
REPO_ROOT = THIS_DIR.parent
VENV_DIR = REPO_ROOT / "venv"
if str(VENV_DIR) not in sys.path:
    sys.path.insert(0, str(VENV_DIR))

from sync_engine import CrossPlatformVaultStore  # noqa: E402

STORE = CrossPlatformVaultStore()
PORT = int(os.environ.get("CV_SYNC_PORT", "47920"))
SCREENSHOTS_FILE = THIS_DIR / "pc_feature_screenshots.json"


def get_lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def load_saved_screenshots() -> Dict[str, str]:
    if SCREENSHOTS_FILE.exists():
        try:
            return json.loads(SCREENSHOTS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_screenshots_map(data: Dict[str, str]) -> None:
    try:
        SCREENSHOTS_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass


def native_pick_media_file() -> str:
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    file_path = filedialog.askopenfilename(
        title="Select Local Video (MP4/MKV/WebM) or Ebook (EPUB/PDF/CBZ)",
        filetypes=[
            ("All Supported Media", "*.mp4 *.mkv *.webm *.avi *.epub *.pdf *.cbz"),
            ("Video Files", "*.mp4 *.mkv *.webm *.avi"),
            ("Ebooks & Comics", "*.epub *.pdf *.cbz"),
            ("All Files", "*.*"),
        ],
    )
    root.destroy()
    return file_path or ""


def native_pick_screenshot_file(feature_num: str) -> str:
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    file_path = filedialog.askopenfilename(
        title=f"Select Screenshot Image for Feature #{feature_num}",
        filetypes=[("Image Files", "*.png *.jpg *.jpeg *.webp *.bmp")],
    )
    root.destroy()
    if not file_path:
        return ""
    try:
        p = Path(file_path)
        mime, _ = mimetypes.guess_type(str(p))
        b64 = base64.b64encode(p.read_bytes()).decode("ascii")
        data_url = f"data:{mime or 'image/png'};base64,{b64}"
        shots = load_saved_screenshots()
        shots[feature_num] = data_url
        save_screenshots_map(shots)
        return data_url
    except Exception:
        return ""


def native_scan_folder() -> List[Dict[str, Any]]:
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    folder = filedialog.askdirectory(
        title="Select PC Folder to Scan for EPUB, PDF, CBZ, MP4, or MKV Files"
    )
    root.destroy()
    if not folder:
        return []
    exts = {".epub", ".pdf", ".cbz", ".mp4", ".mkv", ".webm"}
    found = [p for p in Path(folder).rglob("*") if p.is_file() and p.suffix.lower() in exts]
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    state = STORE.load()
    items = state.setdefault("items", [])
    added: List[Dict[str, Any]] = []
    for f in found[:30]:
        wid = f"pc-scan-{int(time.time() * 1000)}-{f.stem[:10]}"
        is_vid = f.suffix.lower() in {".mp4", ".mkv", ".webm"}
        new_item = {
            "work": {
                "id": wid,
                "title": f.stem.replace("_", " "),
                "contentType": "anime" if is_vid else "novel",
                "publicationStatus": "ongoing",
                "description": f"Indexed directly from PC Local Disk: {f}",
                "genres": ["PC Local Disk"],
                "tags": [f.suffix.lstrip(".").lower()],
                "creators": [],
                "personalRating": 9.0,
                "createdAt": now_iso,
                "updatedAt": now_iso,
                "deletedAt": None,
            },
            "relationship": {
                "id": f"rel-{wid}",
                "workId": wid,
                "personalState": "reading",
                "currentAnchor": {"type": "chapter", "chapter": 1},
                "lastActiveAt": now_iso,
            },
            "accessPaths": [
                {
                    "id": f"path-{wid}",
                    "workId": wid,
                    "kind": "local_file",
                    "label": f.name,
                    "provider": "PC Local Disk",
                    "filePath": str(f),
                    "format": f.suffix.lstrip(".").lower(),
                    "fileSizeBytes": f.stat().st_size,
                    "isPreferred": True,
                    "health": "healthy",
                }
            ],
            "memories": [],
            "updates": [],
        }
        items.insert(0, new_item)
        added.append(new_item)
    if added:
        STORE.save(state)
    return added


# ═══════════════════════════════════════════════════════════════════════════
# ULTRA-MODERN BRIGHT WHITE + VIBRANT PRISM PC STUDIO HTML/JS APPLICATION
# ═══════════════════════════════════════════════════════════════════════════
PC_STUDIO_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chronicles Vault — PC Studio Workstation</title>
  <style>
    :root, [data-theme="prism-white"] {
      --bg-canvas: #f0f4ff;
      --bg-gradient: radial-gradient(circle at 15% 15%, rgba(79, 70, 229, 0.14) 0%, rgba(14, 165, 233, 0.10) 45%, #f4f7ff 100%);
      --card-bg: #ffffff;
      --card-surface: #f4f7ff;
      --card-hover: #e0e7ff;
      --text-main: #0f172a;
      --text-secondary: #334155;
      --text-muted: #475569;
      --accent: #4f46e5;
      --accent-2: #0ea5e9;
      --accent-grad: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
      --accent-soft: rgba(79, 70, 229, 0.12);
      --border: rgba(79, 70, 229, 0.18);
      --border-strong: rgba(79, 70, 229, 0.36);
      --success: #059669;
      --success-soft: rgba(5, 150, 105, 0.14);
      --warning: #d97706;
      --danger: #e11d48;
      --shadow-card: 0 12px 32px -4px rgba(79, 70, 229, 0.12), 0 4px 12px rgba(15, 23, 42, 0.05);
      --shadow-glow: 0 10px 28px rgba(79, 70, 229, 0.32);
    }

    [data-theme="blossom-white"] {
      --bg-canvas: #fff5f7;
      --bg-gradient: radial-gradient(circle at 20% 15%, rgba(244, 63, 94, 0.15) 0%, rgba(251, 191, 36, 0.12) 48%, #fff5f7 100%);
      --card-bg: #ffffff;
      --card-surface: #ffe4e8;
      --card-hover: #fecdd3;
      --text-main: #2d0612;
      --text-secondary: #591124;
      --text-muted: #881337;
      --accent: #e11d48;
      --accent-2: #f59e0b;
      --accent-grad: linear-gradient(135deg, #e11d48 0%, #f43f5e 55%, #f59e0b 100%);
      --accent-soft: rgba(225, 29, 72, 0.12);
      --border: rgba(225, 29, 72, 0.20);
      --border-strong: rgba(225, 29, 72, 0.38);
      --shadow-card: 0 12px 32px -4px rgba(225, 29, 72, 0.14), 0 4px 12px rgba(45, 6, 18, 0.05);
      --shadow-glow: 0 10px 28px rgba(225, 29, 72, 0.34);
    }

    [data-theme="sunlit-white"], [data-theme="parchment-ink"] {
      --bg-canvas: #fffbeb;
      --bg-gradient: radial-gradient(circle at 20% 15%, rgba(234, 88, 12, 0.14) 0%, rgba(16, 185, 129, 0.10) 50%, #fffbeb 100%);
      --card-bg: #ffffff;
      --card-surface: #fef3c7;
      --card-hover: #fde68a;
      --text-main: #1c1917;
      --text-secondary: #44403c;
      --text-muted: #57534e;
      --accent: #ea580c;
      --accent-2: #059669;
      --accent-grad: linear-gradient(135deg, #ea580c 0%, #f59e0b 60%, #10b981 100%);
      --accent-soft: rgba(234, 88, 12, 0.13);
      --border: rgba(217, 119, 6, 0.22);
      --border-strong: rgba(217, 119, 6, 0.40);
      --shadow-card: 0 12px 32px -4px rgba(217, 119, 6, 0.14), 0 4px 12px rgba(28, 25, 23, 0.05);
      --shadow-glow: 0 10px 28px rgba(234, 88, 12, 0.32);
    }

    [data-theme="ink-white"], [data-theme="ink"] {
      --bg-canvas: #ffffff;
      --bg-gradient: linear-gradient(180deg, #ffffff 0%, #f4f4f5 100%);
      --card-bg: #ffffff;
      --card-surface: #f4f4f5;
      --card-hover: #e4e4e7;
      --text-main: #000000;
      --text-secondary: #18181b;
      --text-muted: #3f3f46;
      --accent: #000000;
      --accent-2: #dc2626;
      --accent-grad: linear-gradient(135deg, #000000 0%, #27272a 60%, #dc2626 100%);
      --accent-soft: rgba(0, 0, 0, 0.08);
      --border: #000000;
      --border-strong: #000000;
      --shadow-card: 3px 3px 0px #000000;
      --shadow-glow: 0 4px 14px rgba(0, 0, 0, 0.25);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg-gradient);
      background-color: var(--bg-canvas);
      color: var(--text-main);
      font-weight: 600;
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    button {
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    button:active {
      transform: scale(0.98);
    }

    /* ── LOADING YOUR ROOM VIEW (ONLY LOADING SECTION ON LAUNCH) ── */
    .loader-screen {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 28px;
    }
    .loader-card {
      width: 100%;
      max-width: 960px;
      background: var(--card-bg);
      border: 2px solid var(--border-strong);
      border-radius: 28px;
      box-shadow: var(--shadow-card);
      padding: 36px 42px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .loader-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 6px;
      background: var(--accent-grad);
    }
    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 18px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .loader-title {
      font-size: clamp(26px, 3.4vw, 38px);
      font-weight: 900;
      color: var(--text-main);
      letter-spacing: -0.025em;
      line-height: 1.2;
      margin-bottom: 8px;
      word-wrap: break-word;
    }
    .loader-sub {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-secondary);
      max-width: 660px;
      margin: 0 auto 24px auto;
      line-height: 1.5;
    }

    /* 3D Isometric Room Stage inside Loader (Zero Overspill!) */
    .room-stage {
      display: grid;
      grid-template-columns: 1fr 1.35fr 1fr;
      gap: 20px;
      align-items: stretch;
      background: var(--card-surface);
      border: 2px solid var(--border);
      border-radius: 22px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .shelf-box {
      background: var(--card-bg);
      border: 1.5px solid var(--border);
      border-radius: 16px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .shelf-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .shelf-row {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 7px;
      height: 44px;
      padding-bottom: 4px;
      border-bottom: 3px solid var(--border-strong);
    }
    .book-spine {
      width: 16px;
      border-radius: 4px 4px 2px 2px;
      background: #cbd5e1;
      transition: all 0.3s ease;
    }
    .book-spine.lit {
      background: var(--accent-grad);
      box-shadow: 0 0 10px rgba(79, 70, 229, 0.35);
      transform: translateY(-3px);
    }
    .center-orb-panel {
      background: var(--card-bg);
      border: 2px solid var(--border-strong);
      border-radius: 20px;
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: var(--shadow-card);
    }
    .percent-circle {
      width: 116px;
      height: 116px;
      border-radius: 999px;
      background: var(--accent-grad);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-glow);
    }
    .percent-num {
      font-size: 32px;
      font-weight: 900;
      line-height: 1;
    }
    .stage-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-align: center;
      max-width: 100%;
      word-wrap: break-word;
    }
    .active-profile-pill {
      width: 100%;
      padding: 10px 14px;
      border-radius: 12px;
      background: var(--card-surface);
      border: 1.5px solid var(--border);
      font-size: 13px;
      font-weight: 800;
      color: var(--text-main);
      text-align: center;
      word-wrap: break-word;
    }

    .room-selector-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
    }
    .room-chip {
      padding: 10px 18px;
      border-radius: 14px;
      background: var(--card-surface);
      border: 2px solid var(--border);
      color: var(--text-main);
      font-size: 13px;
      font-weight: 800;
    }
    .room-chip.active {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
    }
    .enter-room-cta {
      padding: 15px 42px;
      border-radius: 16px;
      background: var(--accent-grad);
      color: #ffffff;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.02em;
      box-shadow: var(--shadow-glow);
    }
    .enter-room-cta:hover {
      transform: translateY(-2px) scale(1.01);
    }

    /* ── 3-PANE BENTO WORKSTATION STUDIO UI ── */
    .studio-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: 14px;
      gap: 14px;
    }
    .studio-header {
      background: var(--card-bg);
      border: 2px solid var(--border);
      border-radius: 20px;
      padding: 12px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: var(--shadow-card);
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--accent-grad);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      box-shadow: 0 6px 14px rgba(79, 70, 229, 0.25);
    }
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .btn-pill {
      padding: 8px 15px;
      border-radius: 12px;
      background: var(--card-surface);
      border: 1.5px solid var(--border);
      color: var(--text-main);
      font-size: 13px;
      font-weight: 800;
    }
    .btn-pill:hover {
      background: var(--card-hover);
    }
    .btn-primary {
      padding: 9px 18px;
      border-radius: 12px;
      background: var(--accent-grad);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
    }

    .studio-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 265px 1fr 370px;
      gap: 14px;
      min-height: 0;
    }
    .bento-pane {
      background: var(--card-bg);
      border: 2px solid var(--border);
      border-radius: 22px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: var(--shadow-card);
      overflow-y: auto;
      min-width: 0;
    }
    .pane-section-title {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 4px;
    }
    .nav-item {
      width: 100%;
      text-align: left;
      padding: 11px 14px;
      border-radius: 13px;
      background: var(--card-surface);
      border: 1.5px solid transparent;
      color: var(--text-main);
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-item:hover {
      border-color: var(--border-strong);
    }
    .nav-item.active {
      background: var(--accent-grad);
      color: #ffffff;
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
    }
    .sync-card {
      margin-top: auto;
      background: var(--card-surface);
      border: 2px solid var(--border-strong);
      border-radius: 16px;
      padding: 14px;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }

    /* Center Table & Toolbar */
    .center-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .search-box {
      flex: 1;
      min-width: 180px;
      padding: 10px 14px;
      border-radius: 12px;
      border: 2px solid var(--border);
      background: var(--card-surface);
      color: var(--text-main);
      font-size: 14px;
      font-weight: 700;
      outline: none;
    }
    .search-box:focus {
      border-color: var(--accent);
      background: #ffffff;
    }
    .works-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .work-row-card {
      background: var(--card-surface);
      border: 2px solid var(--border);
      border-radius: 16px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 2.2fr 0.9fr 0.9fr 1.1fr 0.7fr;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .work-row-card:hover {
      border-color: var(--border-strong);
      background: #ffffff;
      transform: translateY(-1px);
    }
    .work-row-card.selected {
      background: #ffffff;
      border-color: var(--accent);
      box-shadow: 0 8px 22px rgba(79, 70, 229, 0.16);
    }
    .tag-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }

    /* Right Dossier Inspector (Zero Text Clipping!) */
    .dossier-title {
      font-size: 20px;
      font-weight: 900;
      color: var(--text-main);
      line-height: 1.25;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    .dossier-desc {
      background: var(--card-surface);
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-secondary);
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    .sub-card {
      background: var(--card-surface);
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }

    /* Modals (Help 32 Features & Samsung A14 Connect) */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 100;
    }
    .modal-window {
      width: 100%;
      max-width: 1140px;
      max-height: 88vh;
      background: var(--card-bg);
      border: 2px solid var(--border-strong);
      border-radius: 26px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.30);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-header {
      padding: 18px 24px;
      border-bottom: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--card-surface);
    }
    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
      gap: 18px;
    }
    .feature-card {
      background: var(--card-surface);
      border: 2px solid var(--border);
      border-radius: 18px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .screenshot-slot {
      background: #ffffff;
      border: 2px dashed var(--border-strong);
      border-radius: 14px;
      padding: 14px;
      text-align: center;
    }
    .screenshot-slot img {
      max-width: 100%;
      max-height: 220px;
      border-radius: 10px;
      object-fit: contain;
      margin-bottom: 8px;
    }
  </style>
</head>
<body data-theme="prism-white">
  <div id="app"></div>

  <script>
    const FEATURES_32 = __FEATURES_JSON__;
    let appState = {
      view: "loader", // "loader" | "studio"
      progress: 12,
      theme: "prism-white",
      activeRoom: "Archivist's Main Sanctum",
      filter: "all",
      search: "",
      items: [],
      rooms: [],
      selectedWorkId: null,
      lanUrl: "",
      screenshots: {},
      showHelpModal: false,
      showSamsungModal: false,
      showNewWorkModal: false,
    };

    async function fetchVaultState() {
      const [stRes, statusRes, shotsRes] = await Promise.all([
        fetch("/api/sync/state"),
        fetch("/api/sync/status"),
        fetch("/api/pc/screenshots"),
      ]);
      const st = await stRes.json();
      const status = await statusRes.json();
      const shots = await shotsRes.json();
      appState.items = (st.items || []).filter(i => !(i.work && i.work.deletedAt));
      appState.rooms = st.rooms || [];
      appState.lanUrl = status.lanUrl || "http://127.0.0.1:47920";
      appState.screenshots = shots || {};
      if (!appState.selectedWorkId && appState.items.length > 0) {
        appState.selectedWorkId = appState.items[0].work.id;
      }
      render();
    }

    function setTheme(themeId) {
      appState.theme = themeId;
      document.body.setAttribute("data-theme", themeId);
      render();
    }

    function selectRoom(name, themePref) {
      appState.activeRoom = name;
      if (themePref === "xianxia-realm") setTheme("blossom-white");
      else if (themePref === "parchment-ink") setTheme("sunlit-white");
      else if (themePref === "ink") setTheme("ink-white");
      else setTheme("prism-white");
    }

    async function stepChapter(delta) {
      if (!appState.selectedWorkId) return;
      await fetch("/api/pc/step-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId: appState.selectedWorkId, delta }),
      });
      await fetchVaultState();
    }

    async function linkLocalFile() {
      if (!appState.selectedWorkId) return;
      const res = await fetch("/api/pc/pick-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId: appState.selectedWorkId }),
      });
      const data = await res.json();
      if (data.ok) await fetchVaultState();
    }

    async function scanDiskFolder() {
      const res = await fetch("/api/pc/scan-folder", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        alert("Scanned & Added " + data.addedCount + " media files from your PC folder!");
        await fetchVaultState();
      }
    }

    async function openSelectedNatively() {
      if (!appState.selectedWorkId) return;
      await fetch("/api/pc/open-native", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId: appState.selectedWorkId }),
      });
    }

    async function attachFeatureScreenshot(num) {
      const res = await fetch("/api/pc/attach-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num }),
      });
      const data = await res.json();
      if (data.ok && data.dataUrl) {
        appState.screenshots[num] = data.dataUrl;
        render();
      }
    }

    async function createNewWork(e) {
      e.preventDefault();
      const title = document.getElementById("nw-title").value.trim();
      const medium = document.getElementById("nw-medium").value;
      const chapter = parseInt(document.getElementById("nw-ch").value || "1", 10);
      if (!title) return;
      await fetch("/api/pc/create-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, medium, chapter }),
      });
      appState.showNewWorkModal = false;
      await fetchVaultState();
    }

    function renderLoaderView() {
      const p = appState.progress;
      const stageLabel =
        p < 30 ? "01 // UNLOCKING SANCTUM DOORS" :
        p < 65 ? "02 // HYDRATING CHRONICLES & ANCHORS" :
        p < 99 ? "03 // STARTING LAN SYNC HUB (:47920)" :
                 "04 // ROOM READY FOR ENTRY";

      let westSpines = "";
      let eastSpines = "";
      const heights = [30, 36, 26, 34, 38, 28];
      for (let r = 0; r < 3; r++) {
        let rowW = '<div class="shelf-row">';
        let rowE = '<div class="shelf-row">';
        for (let b = 0; b < 6; b++) {
          const idx = r * 6 + b;
          const lit = p >= (idx + 1) * 5 ? "lit" : "";
          const h = heights[(idx + r) % heights.length];
          rowW += `<div class="book-spine ${lit}" style="height:${h}px"></div>`;
          rowE += `<div class="book-spine ${lit}" style="height:${h}px"></div>`;
        }
        rowW += "</div>";
        rowE += "</div>";
        westSpines += rowW;
        eastSpines += rowE;
      }

      const roomsHtml = (appState.rooms.length ? appState.rooms : [
        { name: "DemoUser1 // Grand Sanctum", themePreference: "midnight-arcana" },
        { name: "DemoUser1 // Antique Parchment", themePreference: "parchment-ink" },
        { name: "DemoUser1 // Blossom Pavilion", themePreference: "xianxia-realm" },
        { name: "DemoUser1 // Sumi-e Ink Atelier", themePreference: "ink" }
      ]).map(rm => {
        const act = rm.name === appState.activeRoom ? "active" : "";
        return `<button class="room-chip ${act}" onclick="selectRoom('${rm.name.replace(/'/g, "\\'")}', '${rm.themePreference}')">${rm.name}</button>`;
      }).join("");

      return `
        <div class="loader-screen">
          <div class="loader-card">
            <div class="pill-badge">✦ CHRONICLES VAULT // ACCOUNT: DEMOUSER1 // PC WORKSTATION ✦</div>
            <h1 class="loader-title">
              ${p >= 100 ? `Your Room Is Ready — ${appState.activeRoom}` : `Loading Your Room — ${appState.activeRoom}…`}
            </h1>
            <p class="loader-sub">
              Hydrating Chronicles, Local PC Watch Archive (C:\\Users\\67rah\\Downloads\\watch), Progress Anchors, and Samsung A14 Wi-Fi Sync Hub.
            </p>

            <div class="room-stage">
              <div class="shelf-box">
                <div class="shelf-label">West Archive Shelf</div>
                ${westSpines}
                <div style="font-size:11px;font-weight:800;color:var(--text-muted)">Novels &amp; Lore</div>
              </div>

              <div class="center-orb-panel">
                <div class="percent-circle">
                  <span class="percent-num">${p}%</span>
                </div>
                <div class="stage-badge">${stageLabel}</div>
                <div class="active-profile-pill">
                  Active Room Profile: ${appState.activeRoom}
                </div>
              </div>

              <div class="shelf-box">
                <div class="shelf-label">East Archive Shelf</div>
                ${eastSpines}
                <div style="font-size:11px;font-weight:800;color:var(--text-muted)">Manga, Manhwa &amp; Video</div>
              </div>
            </div>

            <div class="room-selector-row">
              <span style="font-size:12px;font-weight:800;color:var(--text-muted);text-transform:uppercase;">Select Room Profile:</span>
              ${roomsHtml}
            </div>

            <button class="enter-room-cta" onclick="appState.view='studio'; render();">
              ${p >= 100 ? "Enter My Room ✦" : `Loading Your Room (${p}%)…`}
            </button>
          </div>
        </div>
      `;
    }

    function renderStudioView() {
      const filtered = appState.items.filter(item => {
        const w = item.work || {};
        const rel = item.relationship || {};
        const paths = item.accessPaths || [];
        const st = (rel.personalState || "planning").toLowerCase();
        if (appState.filter === "reading" && st !== "reading" && st !== "watching") return false;
        if (appState.filter === "waiting" && st !== "waiting") return false;
        if (appState.filter === "completed" && st !== "completed") return false;
        if (appState.filter === "local_media" && !paths.some(p => p.kind === "local_file")) return false;
        if (appState.search.trim()) {
          const q = appState.search.toLowerCase();
          if (!(w.title || "").toLowerCase().includes(q) && !(w.contentType || "").toLowerCase().includes(q)) {
            return false;
          }
        }
        return true;
      });

      const selectedItem = appState.items.find(i => i.work && i.work.id === appState.selectedWorkId) || filtered[0] || null;

      const rowsHtml = filtered.map(item => {
        const w = item.work || {};
        const rel = item.relationship || {};
        const paths = item.accessPaths || [];
        const isSel = selectedItem && selectedItem.work.id === w.id ? "selected" : "";
        const ch = (rel.currentAnchor && (rel.currentAnchor.chapter || rel.currentAnchor.episode)) || 0;
        const tot = w.totalChapters ? ` / ${w.totalChapters}` : "";
        return `
          <div class="work-row-card ${isSel}" onclick="appState.selectedWorkId='${w.id}'; render();">
            <div>
              <div style="font-size:15px;font-weight:900;color:var(--text-main);">${w.title}</div>
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);">${w.originalTitle || ""}</div>
            </div>
            <div><span class="tag-pill">${(w.contentType || "novel").replace("_", " ")}</span></div>
            <div style="font-size:12px;font-weight:800;color:var(--accent);text-transform:uppercase;">${rel.personalState || "reading"}</div>
            <div style="font-size:13px;font-weight:900;color:var(--text-main);">Ch/Ep ${ch}${tot}</div>
            <div style="font-size:13px;font-weight:900;color:#d97706;">★ ${w.personalRating || "—"}</div>
          </div>
        `;
      }).join("");

      let dossierHtml = `<div style="color:var(--text-muted);font-weight:700;">Select a Chronicle to inspect its Dossier.</div>`;
      if (selectedItem) {
        const w = selectedItem.work || {};
        const paths = selectedItem.accessPaths || [];
        const mems = selectedItem.memories || [];
        dossierHtml = `
          <div class="pane-section-title">WORK DOSSIER INSPECTOR</div>
          <div class="dossier-title">${w.title}</div>
          ${w.originalTitle ? `<div style="font-size:13px;font-weight:800;color:var(--accent);">${w.originalTitle}</div>` : ""}
          <div class="dossier-desc">${w.description || "No description recorded."}</div>

          <div class="pane-section-title" style="margin-top:8px;">ACCESS PATHS (${paths.length})</div>
          ${paths.map(p => `
            <div class="sub-card">
              <div style="font-size:13px;font-weight:800;color:var(--text-main);">✦ ${p.label || p.provider || p.kind}</div>
              <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);margin-top:3px;">${p.filePath || p.url || ""}</div>
            </div>
          `).join("") || `<div class="sub-card" style="font-size:12px;color:var(--text-muted);">No sources linked yet. Click "📎 Link Local Video / Book" to attach a file.</div>`}

          <div class="pane-section-title" style="margin-top:8px;">MEMORIES &amp; QUOTES (${mems.length})</div>
          ${mems.map(m => `
            <div class="sub-card">
              <div style="font-size:13px;font-weight:800;color:var(--accent);">${m.title || "Quote"}</div>
              <div style="font-size:12.5px;font-weight:600;color:var(--text-main);margin-top:4px;line-height:1.5;">${m.body || ""}</div>
            </div>
          `).join("") || `<div class="sub-card" style="font-size:12px;color:var(--text-muted);">No memories recorded yet.</div>`}
        `;
      }

      return `
        <div class="studio-shell">
          <header class="studio-header">
            <div class="brand-group">
              <div class="brand-icon">✦</div>
              <div>
                <div style="font-size:16px;font-weight:900;color:var(--text-main);">
                  Chronicles Vault — PC Studio Workstation
                </div>
                <div style="font-size:12px;font-weight:700;color:var(--accent);">
                  Account: DemoUser1 · Room: ${appState.activeRoom}
                </div>
              </div>
            </div>

            <div class="header-actions">
              <button class="btn-pill" onclick="appState.view='loader'; render();">🏠 Room Lobby</button>
              <button class="btn-pill" onclick="appState.showSamsungModal=true; render();">📱 Run on Samsung A14</button>
              <button class="btn-primary" onclick="appState.showHelpModal=true; render();">📖 Help &amp; 32 Tiny Features</button>
              <button class="btn-pill" onclick="setTheme('prism-white')">Midnight / Prism</button>
              <button class="btn-pill" onclick="setTheme('sunlit-white')">Antique Parchment</button>
              <button class="btn-pill" onclick="setTheme('blossom-white')">Blossom</button>
              <button class="btn-pill" onclick="setTheme('ink-white')">Ink (White/Black)</button>
            </div>
          </header>

          <div class="studio-grid">
            <!-- LEFT DOCK -->
            <aside class="bento-pane">
              <div class="pane-section-title">SANCTUM EXPLORER</div>
              <button class="nav-item ${appState.filter==='all'?'active':''}" onclick="appState.filter='all';render();">
                <span>All Chronicles</span><span>${appState.items.length}</span>
              </button>
              <button class="nav-item ${appState.filter==='reading'?'active':''}" onclick="appState.filter='reading';render();">
                <span>Active Reading</span><span>✦</span>
              </button>
              <button class="nav-item ${appState.filter==='waiting'?'active':''}" onclick="appState.filter='waiting';render();">
                <span>Waiting for Updates</span><span>⏳</span>
              </button>
              <button class="nav-item ${appState.filter==='completed'?'active':''}" onclick="appState.filter='completed';render();">
                <span>Completed Archive</span><span>✓</span>
              </button>
              <button class="nav-item ${appState.filter==='local_media'?'active':''}" onclick="appState.filter='local_media';render();">
                <span>Local Video &amp; Books</span><span>🎬</span>
              </button>

              <div class="pane-section-title" style="margin-top:10px;">PC STUDIO ACTIONS</div>
              <button class="btn-primary" style="width:100%;text-align:left;" onclick="appState.showNewWorkModal=true;render();">+ Create New Chronicle</button>
              <button class="btn-pill" style="width:100%;text-align:left;" onclick="scanDiskFolder()">📂 Scan PC Disk Folder…</button>
              <button class="btn-pill" style="width:100%;text-align:left;" onclick="appState.showHelpModal=true;render();">📖 Help: All 32 Features</button>

              <div class="sync-card">
                <div style="font-size:11px;font-weight:900;color:var(--success);text-transform:uppercase;">
                  ● SAMSUNG A14 &amp; WEB SYNC HUB
                </div>
                <div style="font-size:13px;font-weight:900;color:var(--text-main);margin-top:4px;">
                  ${appState.lanUrl}/mobile
                </div>
                <div style="font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-top:4px;line-height:1.4;">
                  All files stay on your PC! Open the URL above on your Samsung Galaxy A14 over Wi-Fi.
                </div>
              </div>
            </aside>

            <!-- CENTER STAGE -->
            <main class="bento-pane">
              <div class="center-toolbar">
                <input
                  class="search-box"
                  type="text"
                  placeholder="Search Chronicles by title or medium…"
                  value="${appState.search}"
                  oninput="appState.search=this.value; render();"
                />
                <button class="btn-pill" onclick="stepChapter(-1)">−1 Ch/Ep</button>
                <button class="btn-primary" onclick="stepChapter(1)">+1 Ch/Ep</button>
                <button class="btn-pill" onclick="linkLocalFile()">📎 Link Local Video / Book</button>
                <button class="btn-pill" onclick="openSelectedNatively()">▶ Play / Open on PC</button>
              </div>

              <div class="works-list">
                ${rowsHtml}
              </div>
            </main>

            <!-- RIGHT INSPECTOR -->
            <aside class="bento-pane">
              ${dossierHtml}
            </aside>
          </div>
        </div>
      `;
    }

    function renderModals() {
      let html = "";
      if (appState.showHelpModal) {
        const cards = FEATURES_32.map(f => {
          const shot = appState.screenshots[f.num];
          return `
            <div class="feature-card">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span class="tag-pill">FEATURE #${f.num} · ${f.category}</span>
              </div>
              <div style="font-size:16px;font-weight:900;color:var(--text-main);">${f.title}</div>
              <div style="font-size:13px;font-weight:600;color:var(--text-secondary);line-height:1.5;">${f.why}</div>
              <div style="font-size:12.5px;font-weight:700;color:var(--text-main);line-height:1.6;">
                ${f.steps.map(s => `<div>${s}</div>`).join("")}
              </div>
              <div class="screenshot-slot">
                ${shot ? `<img src="${shot}" alt="Feature #${f.num}" />` : `<div style="font-size:12px;font-weight:800;color:var(--accent);margin-bottom:6px;">📸 ${f.placeholder}</div>`}
                <div>
                  <button class="btn-primary" onclick="attachFeatureScreenshot('${f.num}')">
                    ${shot ? "Replace Screenshot Image" : "Attach Screenshot from PC"}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("");

        html += `
          <div class="modal-backdrop" onclick="if(event.target===this){appState.showHelpModal=false;render();}">
            <div class="modal-window">
              <div class="modal-header">
                <div>
                  <div style="font-size:12px;font-weight:900;color:var(--accent);text-transform:uppercase;">PC APP HELP &amp; ENCYCLOPEDIA</div>
                  <div style="font-size:20px;font-weight:900;color:var(--text-main);">All 32 Tiny-to-Tiny Features, Steps &amp; Screenshot Slots</div>
                </div>
                <button class="btn-pill" onclick="appState.showHelpModal=false;render();">✕ Close</button>
              </div>
              <div class="modal-body">
                <div class="feature-grid">${cards}</div>
              </div>
            </div>
          </div>
        `;
      }

      if (appState.showSamsungModal) {
        html += `
          <div class="modal-backdrop" onclick="if(event.target===this){appState.showSamsungModal=false;render();}">
            <div class="modal-window" style="max-width:720px;">
              <div class="modal-header">
                <div style="font-size:19px;font-weight:900;color:var(--text-main);">📱 Run on Samsung Galaxy A14 (While All Files Sit on PC)</div>
                <button class="btn-pill" onclick="appState.showSamsungModal=false;render();">✕ Close</button>
              </div>
              <div class="modal-body" style="line-height:1.7;font-size:14px;">
                <p style="margin-bottom:12px;">Because your PC runs the <strong>Chronicles Vault LAN Hub</strong>, 100% of your files, database, and videos stay on your PC while your <strong>Samsung Galaxy A14</strong> runs the mobile app!</p>
                <div class="sub-card" style="margin-bottom:12px;">
                  <div style="font-weight:900;color:var(--accent);">Method 1: Instant Wi-Fi / Hotspot Install (Zero Cable Needed)</div>
                  <div>1. Connect your <strong>Samsung Galaxy A14</strong> and this PC to the same Wi-Fi (or turn on Mobile Hotspot on your Samsung A14 and connect your PC to it).</div>
                  <div>2. Open <strong>Chrome</strong> on your Samsung Galaxy A14 and type: <strong style="color:var(--accent);">${appState.lanUrl.replace(":47920", ":5174")}</strong> (or <strong>${appState.lanUrl}/mobile</strong>).</div>
                  <div>3. Tap the <strong>⋮ (Three Dots Menu)</strong> in Chrome on your Samsung A14 → tap <strong>"Add to Home screen" / "Install app"</strong>.</div>
                  <div>4. Chronicles Vault now appears on your Samsung A14 app drawer as a full-screen app while reading/streaming directly from your PC!</div>
                </div>
                <div class="sub-card">
                  <div style="font-weight:900;color:var(--accent);">Method 2: USB Cable Connection (Works Without Wi-Fi)</div>
                  <div>1. Plug your Samsung Galaxy A14 into your PC with a USB-C cable.</div>
                  <div>2. On your Samsung A14: Open <strong>Settings → Connections → Mobile Hotspot and Tethering → turn ON "USB Tethering"</strong>.</div>
                  <div>3. Open Chrome on your Samsung A14 and go to <strong style="color:var(--accent);">${appState.lanUrl}/mobile</strong>!</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      if (appState.showNewWorkModal) {
        html += `
          <div class="modal-backdrop" onclick="if(event.target===this){appState.showNewWorkModal=false;render();}">
            <div class="modal-window" style="max-width:480px;">
              <div class="modal-header">
                <div style="font-size:18px;font-weight:900;color:var(--text-main);">+ Create New Chronicle</div>
                <button class="btn-pill" onclick="appState.showNewWorkModal=false;render();">✕</button>
              </div>
              <form class="modal-body" onsubmit="createNewWork(event)" style="display:flex;flex-direction:column;gap:12px;">
                <label style="font-size:13px;font-weight:800;">Chronicle Title</label>
                <input id="nw-title" class="search-box" required placeholder="e.g. Solo Leveling" />
                <label style="font-size:13px;font-weight:800;">Medium</label>
                <select id="nw-medium" class="search-box">
                  <option value="manhwa">Manhwa</option>
                  <option value="web_novel">Web Novel</option>
                  <option value="manga">Manga</option>
                  <option value="anime">Anime / Donghua</option>
                </select>
                <label style="font-size:13px;font-weight:800;">Starting Chapter / Episode</label>
                <input id="nw-ch" type="number" class="search-box" value="1" />
                <button type="submit" class="btn-primary" style="margin-top:8px;">Save Chronicle</button>
              </form>
            </div>
          </div>
        `;
      }
      return html;
    }

    function render() {
      const root = document.getElementById("app");
      root.innerHTML = (appState.view === "loader" ? renderLoaderView() : renderStudioView()) + renderModals();
    }

    // Smoothly animate loader progress from 12% to 100%
    const timer = setInterval(() => {
      if (appState.progress < 100) {
        appState.progress = Math.min(100, appState.progress + 11);
        if (appState.view === "loader") render();
      } else {
        clearInterval(timer);
      }
    }, 80);

    fetchVaultState();
  </script>
</body>
</html>
"""

from pc_workstation_features_data import PC_HELP_32_FEATURES_LIST  # noqa: E402


class PCStudioRequestHandler(BaseHTTPRequestHandler):
    def _send_cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")

    def _send_json(self, code: int, payload: Any) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._send_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _send_html(self, html_str: str) -> None:
        raw = html_str.encode("utf-8")
        self.send_response(200)
        self._send_cors()
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/pc-studio", "/mobile"):
            rendered = PC_STUDIO_HTML.replace(
                "__FEATURES_JSON__", json.dumps(PC_HELP_32_FEATURES_LIST, ensure_ascii=False)
            )
            self._send_html(rendered)
            return

        if parsed.path == "/api/sync/status":
            state = STORE.load()
            self._send_json(
                200,
                {
                    "ok": True,
                    "hlc": state.get("hlc"),
                    "lastSyncedAt": state.get("lastSyncedAt"),
                    "worksCount": len(state.get("items") or []),
                    "roomsCount": len(state.get("rooms") or []),
                    "connectedDevices": state.get("connectedDevices") or {},
                    "lanUrl": f"http://{get_lan_ip()}:{PORT}",
                },
            )
            return

        if parsed.path == "/api/sync/state":
            self._send_json(200, STORE.load())
            return

        if parsed.path == "/api/pc/screenshots":
            self._send_json(200, load_saved_screenshots())
            return

        if parsed.path == "/api/media/stream":
            qs = parse_qs(parsed.query)
            file_path_list = qs.get("path")
            if not file_path_list:
                self._send_json(400, {"error": "Missing path"})
                return
            target = Path(file_path_list[0])
            if not target.exists() or not target.is_file():
                self._send_json(404, {"error": "File not found"})
                return
            mime, _ = mimetypes.guess_type(str(target))
            data = target.read_bytes()
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", mime or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

        if parsed.path == "/api/sync/merge":
            merged_state, stats = STORE.merge_remote_payload(
                platform_id=str(body.get("platform") or "web"),
                device_name=str(body.get("deviceName") or "Sanctum Device"),
                remote_items=body.get("items") or [],
                remote_rooms=body.get("rooms"),
                remote_hlc=body.get("hlc"),
            )
            self._send_json(200, {"ok": True, "stats": stats, "state": merged_state})
            return

        if parsed.path == "/api/pc/step-progress":
            wid = body.get("workId")
            delta = int(body.get("delta") or 1)
            state = STORE.load()
            for item in state.get("items") or []:
                if (item.get("work") or {}).get("id") == wid:
                    rel = item.setdefault("relationship", {})
                    anchor = rel.setdefault("currentAnchor", {"type": "chapter", "chapter": 0})
                    cur = int(anchor.get("chapter") or anchor.get("episode") or 0)
                    anchor["chapter"] = max(0, cur + delta)
                    rel["lastActiveAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    break
            STORE.save(state)
            self._send_json(200, {"ok": True})
            return

        if parsed.path == "/api/pc/pick-file":
            wid = body.get("workId")
            chosen = native_pick_media_file()
            if not chosen:
                self._send_json(200, {"ok": False})
                return
            p = Path(chosen)
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            state = STORE.load()
            for item in state.get("items") or []:
                if (item.get("work") or {}).get("id") == wid:
                    item.setdefault("accessPaths", []).append(
                        {
                            "id": f"local-{int(time.time())}",
                            "workId": wid,
                            "kind": "local_file",
                            "label": p.name,
                            "provider": "PC Local Disk",
                            "filePath": str(p),
                            "format": p.suffix.lstrip(".").lower(),
                            "fileSizeBytes": p.stat().st_size if p.exists() else 0,
                            "isPreferred": True,
                            "health": "healthy",
                            "createdAt": now_iso,
                            "updatedAt": now_iso,
                        }
                    )
                    break
            STORE.save(state)
            self._send_json(200, {"ok": True, "filePath": str(p)})
            return

        if parsed.path == "/api/pc/scan-folder":
            added = native_scan_folder()
            self._send_json(200, {"ok": True, "addedCount": len(added)})
            return

        if parsed.path == "/api/pc/open-native":
            wid = body.get("workId")
            state = STORE.load()
            for item in state.get("items") or []:
                if (item.get("work") or {}).get("id") == wid:
                    paths = item.get("accessPaths") or []
                    if paths:
                        pref = next((p for p in paths if p.get("isPreferred")), paths[0])
                        target = pref.get("filePath") or pref.get("url")
                        if target:
                            try:
                                os.startfile(target)  # type: ignore[attr-defined]
                            except Exception:
                                pass
                    break
            self._send_json(200, {"ok": True})
            return

        if parsed.path == "/api/pc/attach-screenshot":
            num = str(body.get("num") or "01")
            data_url = native_pick_screenshot_file(num)
            self._send_json(200, {"ok": bool(data_url), "dataUrl": data_url})
            return

        if parsed.path == "/api/pc/create-work":
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            wid = f"work-pc-{int(time.time() * 1000)}"
            state = STORE.load()
            state.setdefault("items", []).insert(
                0,
                {
                    "work": {
                        "id": wid,
                        "title": str(body.get("title") or "Untitled"),
                        "contentType": str(body.get("medium") or "manhwa"),
                        "publicationStatus": "ongoing",
                        "description": "Created in Chronicles Vault PC Studio Workstation.",
                        "personalRating": 9.0,
                        "createdAt": now_iso,
                        "updatedAt": now_iso,
                        "deletedAt": None,
                    },
                    "relationship": {
                        "id": f"rel-{wid}",
                        "workId": wid,
                        "personalState": "reading",
                        "currentAnchor": {"type": "chapter", "chapter": int(body.get("chapter") or 1)},
                        "lastActiveAt": now_iso,
                    },
                    "accessPaths": [],
                    "memories": [],
                    "updates": [],
                },
            )
            STORE.save(state)
            self._send_json(200, {"ok": True})
            return

        self._send_json(404, {"error": "Not found"})

    def log_message(self, format: str, *args: object) -> None:
        pass


def launch_native_desktop_window(url: str) -> None:
    """
    Launches Chronicles Vault PC Studio as a standalone Native OS App Window
    (using Edge WebView2 `--app` or Chrome `--app`, with no browser address bar or tabs).
    """
    candidates = [
        shutil.which("msedge"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        shutil.which("chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ]
    for exe in candidates:
        if exe and Path(exe).exists():
            subprocess.Popen(
                [
                    exe,
                    f"--app={url}",
                    "--window-size=1420,880",
                    "--disable-extensions",
                ]
            )
            return
    webbrowser.open(url)


if __name__ == "__main__":
    lan_ip = get_lan_ip()
    studio_url = f"http://127.0.0.1:{PORT}/pc-studio"
    print("==================================================================")
    print(" ✦ Chronicles Vault — PC Studio Workstation & Samsung A14 Hub ✦")
    print(f" • PC Studio GUI Window : {studio_url}")
    print(f" • Samsung A14 URL      : http://{lan_ip}:{PORT}/mobile")
    print("==================================================================")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), PCStudioRequestHandler)
    threading.Timer(0.4, lambda: launch_native_desktop_window(studio_url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
