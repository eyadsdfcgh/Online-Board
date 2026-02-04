# VR Whiteboard / Study Canvas

A modern, infinite canvas whiteboard optimized for Meta Quest 3S and other VR browsers. Built with HTML5 Canvas and Fabric.js.

## Features

- **Infinite Canvas**: Zoom and pan freely.
- **Tools**: Pen, Highlighter, Eraser (Delete), Shapes (Rectangle, Circle, Line).
- **VR Optimized**: Large buttons, high contrast, floating UI.
- **Persistence**: Auto-saves to LocalStorage. Export to PNG.
- **Theming**: Light and Dark modes.

## Quick Start (Local)

1.  **Run the Server**:
    Double-click `start_server.bat`
    (Or run `python -m http.server 8080` in terminal)
    
2.  **Open**: `http://localhost:8080`

## How to Share (Public Link)

To let anyone in the world access your whiteboard (without deploying/uploading files):

1.  First, ensure `start_server.bat` is running.
2.  Double-click **`share_publicly.bat`**.
3.  It will download a small tool (first time only) and generate a **random link** (e.g., `https://random-name.trycloudflare.com`).
4.  Send that link to anyone.

## Deployment (Cloudflare Pages)

If you want to host it permanently:

1.  Upload this folder to GitHub.
2.  Connect to Cloudflare Pages.
3.  Deploy (Static HTML).

## Tech Stack
-   **Core**: HTML5, CSS3, JavaScript (ES6+)
-   **Library**: Fabric.js (v5.3.1 via CDN)
