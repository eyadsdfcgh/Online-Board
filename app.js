
// Initialize Fabric Canvas
const canvas = new fabric.Canvas('c', {
    isDrawingMode: false,
    selection: true,
    backgroundColor: '#0f0f12', // Match CSS dark variable
    width: window.innerWidth,
    height: window.innerHeight,
});

// App State
const state = {
    currentMode: 'pan', // pan, pen, highlighter, shape
    color: '#6366f1',
    strokeWidth: 3,
    isDashed: false,
    clipboard: null,
    history: [],
    historyIndex: -1,
    maxHistory: 20,
    drawingColor: '#f3f4f6',
    highlighterColor: 'rgba(255, 255, 0, 0.4)',
};

// Colors Palette
const colors = [
    '#f3f4f6', // white/text
    '#ef4444', // red
    '#f59e0b', // orange
    '#10b981', // green
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#000000', // black
];

// DOM Elements
const toolbarBtns = document.querySelectorAll('.tool-btn');
const propPanel = document.getElementById('properties-panel');
const colorPalette = document.getElementById('color-palette');
const strokeInput = document.getElementById('stroke-width');
const dashInput = document.getElementById('stroke-dashed');
const loader = document.getElementById('loader');

// History Management
let isHistoryProcessing = false;

function saveHistory() {
    if (isHistoryProcessing) return;
    // Remove future history if we are in middle
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    const json = JSON.stringify(canvas.toJSON());
    state.history.push(json);
    if (state.history.length > state.maxHistory) state.history.shift();
    state.historyIndex = state.history.length - 1;
}

canvas.on('object:added', () => !isHistoryProcessing && saveHistory());
canvas.on('object:modified', () => !isHistoryProcessing && saveHistory());
canvas.on('object:removed', () => !isHistoryProcessing && saveHistory());

document.getElementById('btn-undo').addEventListener('click', () => {
    if (state.historyIndex > 0) {
        isHistoryProcessing = true;
        state.historyIndex--;
        canvas.loadFromJSON(state.history[state.historyIndex], () => {
            canvas.renderAll();
            isHistoryProcessing = false;
        });
    }
});

document.getElementById('btn-redo').addEventListener('click', () => {
    if (state.historyIndex < state.history.length - 1) {
        isHistoryProcessing = true;
        state.historyIndex++;
        canvas.loadFromJSON(state.history[state.historyIndex], () => {
            canvas.renderAll();
            isHistoryProcessing = false;
        });
    }
});

// Resizing
window.addEventListener('resize', () => {
    canvas.setWidth(window.innerWidth);
    canvas.setHeight(window.innerHeight);
});

// Brush Instances
const pencilBrush = new fabric.PencilBrush(canvas);
const highlighterBrush = new fabric.PencilBrush(canvas);

// Tool Switching Logic
function setMode(mode) {
    state.currentMode = mode;

    // Reset
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'default';
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    // UI Update
    toolbarBtns.forEach(btn => btn.classList.remove('active'));

    if (mode.startsWith('shape-')) {
        const el = document.getElementById(`tool-${mode}`);
        if (el) el.classList.add('active');
    } else {
        const el = document.getElementById(`tool-${mode}`);
        if (el) el.classList.add('active');
    }

    // Properties Panel Visibilty
    if (mode === 'pen' || mode === 'highlighter') {
        propPanel.classList.add('visible');
    } else {
        if (!canvas.getActiveObject()) {
            propPanel.classList.remove('visible');
        }
    }

    // Implementation
    if (mode === 'pan') {
        canvas.defaultCursor = 'grab';
        canvas.selection = true;
    } else if (mode === 'pen') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = pencilBrush;
        updateBrush();
    } else if (mode === 'highlighter') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = highlighterBrush;
        updateBrush();
    } else if (mode === 'eraser') {
        canvas.defaultCursor = 'not-allowed';
        canvas.selection = true;
    }
}

// Show properties on selection
canvas.on('selection:created', updatePropsFromSelection);
canvas.on('selection:updated', updatePropsFromSelection);
canvas.on('selection:cleared', () => {
    if (state.currentMode !== 'pen' && state.currentMode !== 'highlighter') {
        propPanel.classList.remove('visible');
    }
});

function updatePropsFromSelection() {
    propPanel.classList.add('visible');
    const active = canvas.getActiveObject();
    if (active) {
        // Sync color
        if (active.stroke) {
            // Find swatch? Or just assume it works.
            // We won't auto-select swatch visual as it might be custom color, but we could try.
        }
        // Sync Width
        if (active.strokeWidth) {
            strokeInput.value = active.strokeWidth;
            state.strokeWidth = active.strokeWidth;
        }
        // Sync Dashed
        if (active.strokeDashArray && active.strokeDashArray.length > 0) {
            dashInput.checked = true;
            state.isDashed = true;
        } else {
            dashInput.checked = false;
            state.isDashed = false;
        }
    }
}

// Event Listeners for Toolbar
document.getElementById('tool-pan').addEventListener('click', () => setMode('pan'));
document.getElementById('tool-pen').addEventListener('click', () => {
    state.color = state.drawingColor;
    updateBrush();
    setMode('pen');
});
document.getElementById('tool-highlighter').addEventListener('click', () => {
    setMode('highlighter');
});
document.getElementById('tool-eraser').addEventListener('click', () => {
    const active = canvas.getActiveObjects();
    if (active.length) {
        canvas.discardActiveObject();
        active.forEach(obj => canvas.remove(obj));
    } else {
        setMode('eraser');
    }
});
document.getElementById('tool-shape-rect').addEventListener('click', () => {
    const rect = new fabric.Rect({
        left: canvas.vptCoords.tl.x + window.innerWidth / 2 - 50,
        top: canvas.vptCoords.tl.y + window.innerHeight / 2 - 50,
        fill: 'transparent',
        stroke: state.color === state.highlighterColor ? state.drawingColor : state.color,
        strokeWidth: state.strokeWidth, // use current
        strokeDashArray: state.isDashed ? [15, 15] : null,
        width: 100,
        height: 100
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setMode('pan');
});
document.getElementById('tool-shape-circle').addEventListener('click', () => {
    const circle = new fabric.Circle({
        left: canvas.vptCoords.tl.x + window.innerWidth / 2 - 50,
        top: canvas.vptCoords.tl.y + window.innerHeight / 2 - 50,
        fill: 'transparent',
        stroke: state.color === state.highlighterColor ? state.drawingColor : state.color,
        strokeWidth: state.strokeWidth,
        strokeDashArray: state.isDashed ? [15, 15] : null,
        radius: 50
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    setMode('pan');
});
document.getElementById('tool-shape-line').addEventListener('click', () => {
    const line = new fabric.Line([0, 0, 200, 0], {
        left: canvas.vptCoords.tl.x + window.innerWidth / 2 - 100,
        top: canvas.vptCoords.tl.y + window.innerHeight / 2,
        stroke: state.color === state.highlighterColor ? state.drawingColor : state.color,
        strokeWidth: state.strokeWidth,
        strokeDashArray: state.isDashed ? [15, 15] : null,
        strokeLineCap: 'round'
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    setMode('pan');
});

// Object Deletion in Eraser Mode
canvas.on('mouse:down', (opt) => {
    if (state.currentMode === 'eraser' && opt.target) {
        canvas.remove(opt.target);
    }
});

// Panning Logic
let isDragging = false;
let lastPosX, lastPosY;

canvas.on('mouse:down', function (opt) {
    const evt = opt.e;
    if (evt.altKey || state.currentMode === 'pan') {
        if (!opt.target || evt.altKey) {
            isDragging = true;
            // canvas.selection = false; 
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
        }
    }
});

canvas.on('mouse:move', function (opt) {
    if (isDragging) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
    }
});

canvas.on('mouse:up', function (opt) {
    if (isDragging) {
        canvas.setViewportTransform(canvas.viewportTransform);
        isDragging = false;
    }
});

// Zoom Logic
canvas.on('mouse:wheel', function (opt) {
    var delta = opt.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    // Center zoom on mouse
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
});

// Sub-properties
strokeInput.addEventListener('input', (e) => {
    state.strokeWidth = parseInt(e.target.value, 10);
    updateBrush();
    // Update active object
    const active = canvas.getActiveObject();
    if (active) {
        active.set({ strokeWidth: state.strokeWidth });
        canvas.renderAll();
        saveHistory();
    }
});

dashInput.addEventListener('change', (e) => {
    state.isDashed = e.target.checked;
    updateBrush();
    const active = canvas.getActiveObject();
    if (active) {
        active.set({ strokeDashArray: state.isDashed ? [15, 15] : null });
        canvas.renderAll();
        saveHistory();
    }
});


// Build Color Palette
colors.forEach(color => {
    const div = document.createElement('div');
    div.className = 'color-swatch';
    div.style.backgroundColor = color;
    div.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        state.drawingColor = color;
        state.color = color; // sync
        updateBrush();

        // Update selection if any
        const active = canvas.getActiveObject();
        if (active) {
            active.set({ stroke: color });
            canvas.renderAll();
            saveHistory();
        } else {
            // Auto-hide panel if in drawing mode
            if (state.currentMode === 'pen' || state.currentMode === 'highlighter') {
                propPanel.classList.remove('visible');
            }
        }
    });
    colorPalette.appendChild(div);
});

function updateBrush() {
    if (state.currentMode === 'pen') {
        canvas.freeDrawingBrush.color = state.drawingColor;
        canvas.freeDrawingBrush.width = state.strokeWidth;
        canvas.freeDrawingBrush.strokeDashArray = state.isDashed ? [15, 15] : null;
    } else if (state.currentMode === 'highlighter') {
        canvas.freeDrawingBrush.color = state.highlighterColor;
        canvas.freeDrawingBrush.width = state.strokeWidth * 3;
        canvas.freeDrawingBrush.strokeDashArray = null; // Highlighter usually solid
    }
}

// Dark/Light Mode
let isDark = true;
document.getElementById('btn-darkmode').addEventListener('click', () => {
    isDark = !isDark;
    const bgColor = isDark ? '#0f0f12' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    const panelBg = isDark ? 'rgba(28, 28, 32, 0.85)' : 'rgba(255, 255, 255, 0.85)';

    document.documentElement.style.setProperty('--bg-color', bgColor);
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--panel-bg', panelBg);

    canvas.backgroundColor = bgColor;
    canvas.renderAll();
});

// Save (Download)
document.getElementById('btn-save').addEventListener('click', () => {
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
    });
    const link = document.createElement('a');
    link.download = 'vr-whiteboard.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Persistence (LocalStorage)
window.addEventListener('beforeunload', () => {
    localStorage.setItem('vr-board-state', JSON.stringify(canvas.toJSON()));
});
window.addEventListener('load', () => {
    const saved = localStorage.getItem('vr-board-state');
    if (saved) {
        canvas.loadFromJSON(saved, () => {
            canvas.renderAll();
            loader.style.opacity = 0;
            setTimeout(() => loader.remove(), 500);
        });
    } else {
        loader.style.opacity = 0;
        setTimeout(() => loader.remove(), 500);
    }
    document.querySelector('.color-swatch').classList.add('selected');
});

// Setup Initial State
saveHistory();
setMode('pan');

// Calculator Logic
const calcPanel = document.getElementById('calculator-panel');
const calcDisplay = document.getElementById('calc-display');
let calcVisible = false;

document.getElementById('btn-calc').addEventListener('click', () => {
    calcVisible = !calcVisible;
    if (calcVisible) {
        calcPanel.classList.add('visible');
        document.getElementById('btn-calc').style.background = 'rgba(255,255,255,0.3)';
    } else {
        calcPanel.classList.remove('visible');
        document.getElementById('btn-calc').style.background = '';
    }
});

document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const val = btn.dataset.val;

        if (val !== undefined) {
            // Append Number
            if (calcDisplay.value === '0') calcDisplay.value = val;
            else calcDisplay.value += val;
        } else if (action === 'clear') {
            calcDisplay.value = '0';
        } else if (action === 'back') {
            calcDisplay.value = calcDisplay.value.slice(0, -1) || '0';
        } else if (action === '=') {
            try {
                // Safe calculation? For local app it's fine.
                // Replace symbols for JS eval
                let expr = calcDisplay.value.replace(/×/g, '*').replace(/÷/g, '/');
                calcDisplay.value = eval(expr);
            } catch (e) {
                calcDisplay.value = 'Error';
            }
        } else {
            // Operator
            const lastChar = calcDisplay.value.slice(-1);
            if ('+-*/'.includes(lastChar)) {
                calcDisplay.value = calcDisplay.value.slice(0, -1) + action;
            } else {
                calcDisplay.value += action;
            }
        }
    });
});

// Paste Functionality (Image & Text)
// Paste Functionality (Image & Text)
function addImageBlobToCanvas(blob) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const imgObj = new Image();
        imgObj.src = event.target.result;
        imgObj.onload = () => {
            let scale = 0.5;
            if (imgObj.width > window.innerWidth / 2) {
                scale = (window.innerWidth / 2) / imgObj.width;
            }

            const imgInstance = new fabric.Image(imgObj);
            imgInstance.set({
                left: canvas.vptCoords.tl.x + window.innerWidth / 2 - (imgObj.width * scale) / 2,
                top: canvas.vptCoords.tl.y + window.innerHeight / 2 - (imgObj.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                cornerSize: 12,
                transparentCorners: false
            });
            canvas.add(imgInstance);
            canvas.setActiveObject(imgInstance);
            saveHistory();
            setMode('pan');
        };
    };
    reader.readAsDataURL(blob);
}

function addTextToCanvas(text) {
    const iText = new fabric.IText(text, {
        left: canvas.vptCoords.tl.x + window.innerWidth / 2 - 100, // Center relative to viewport
        top: canvas.vptCoords.tl.y + window.innerHeight / 2,
        fontFamily: 'Inter',
        fill: state.drawingColor,
        fontSize: 40,
        strokeWidth: 0,
        cornerSize: 12,
        transparentCorners: false
    });
    canvas.add(iText);
    canvas.setActiveObject(iText);
    saveHistory();
    setMode('pan');
}

// 1. Ctrl+V Paste
window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let blob = null;

    // Prioritize Image
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            blob = items[i].getAsFile();
            break;
        }
    }

    if (blob) {
        addImageBlobToCanvas(blob);
        e.preventDefault();
    } else {
        // Fallback to text
        const textData = (e.clipboardData || window.clipboardData).getData('text');
        if (textData) {
            addTextToCanvas(textData);
            e.preventDefault();
        }
    }
});

// 2. Paste Button Click
document.getElementById('btn-paste').addEventListener('click', async () => {
    try {
        // Try reading images first
        const clipboardItems = await navigator.clipboard.read();
        let imageFound = false;

        for (const item of clipboardItems) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
                const blob = await item.getType(imageType);
                addImageBlobToCanvas(blob);
                imageFound = true;
                break; // Handle one image
            }
        }

        if (!imageFound) {
            // Try reading text
            const text = await navigator.clipboard.readText();
            if (text) addTextToCanvas(text);
        }

    } catch (err) {
        console.warn('navigator.clipboard.read() failed, trying readText() fallback', err);
        // Fallback for browsers that don't support read() well (like Firefox default)
        try {
            const text = await navigator.clipboard.readText();
            if (text) addTextToCanvas(text);
        } catch (err2) {
            console.error('Clipboard access denied', err2);
            alert('Please use Ctrl+V to paste (Clipboard access denied or not supported).');
        }
    }
});
