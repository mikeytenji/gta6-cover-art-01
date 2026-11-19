import { drawCover, exportPNG, LAYOUTS } from './cover.js';
import { applyShotMode } from './shots.js';

const state = {
    photos: [],
    layout: 'quad',
    grade: 'sunset',
    caption1: '',
    caption2: '',
    focus: [
        { x: 0.5, y: 0.5, zoom: 1 },
        { x: 0.5, y: 0.5, zoom: 1 },
        { x: 0.5, y: 0.5, zoom: 1 },
        { x: 0.5, y: 0.5, zoom: 1 }
    ]
};

let selectedPanel = 0;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

const els = {
    photoInput: document.getElementById('photo-input'),
    samplePier: document.getElementById('sample-pier'),
    sampleBoulevard: document.getElementById('sample-boulevard'),
    photoList: document.getElementById('photo-list'),
    caption1: document.getElementById('caption1'),
    caption2: document.getElementById('caption2'),
    zoomSlider: document.getElementById('zoom-slider'),
};

function render() {
    drawCover(ctx, canvas.width, canvas.height, state);
}

function updateUI() {
    els.caption1.value = state.caption1;
    els.caption2.value = state.caption2;
    
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `layout-${state.layout}` || btn.id === `grade-${state.grade}`) {
            btn.classList.add('active');
        }
    });

    if (state.focus[selectedPanel]) {
        els.zoomSlider.value = state.focus[selectedPanel].zoom;
    }

    render();
}
window.updateUI = updateUI;

async function addPhoto(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            state.photos.push(img);
            const thumb = new Image();
            thumb.src = src;
            thumb.className = 'photo-thumb';
            els.photoList.appendChild(thumb);
            resolve();
        };
        img.src = src;
    });
}

els.photoInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    for (const file of files) {
        const url = URL.createObjectURL(file);
        await addPhoto(url);
    }
    render();
});

els.samplePier.addEventListener('click', () => addPhoto('samples/pier.jpg').then(render));
els.sampleBoulevard.addEventListener('click', () => addPhoto('samples/boulevard.jpg').then(render));

LAYOUTS.forEach(l => {
    document.getElementById(`layout-${l}`).addEventListener('click', () => {
        state.layout = l;
        updateUI();
    });
});

['sunset', 'neon', 'noir'].forEach(g => {
    document.getElementById(`grade-${g}`).addEventListener('click', () => {
        state.grade = g;
        updateUI();
    });
});

els.caption1.addEventListener('input', (e) => {
    state.caption1 = e.target.value;
    render();
});

els.caption2.addEventListener('input', (e) => {
    state.caption2 = e.target.value;
    render();
});

els.zoomSlider.addEventListener('input', (e) => {
    if (state.focus[selectedPanel]) {
        state.focus[selectedPanel].zoom = parseFloat(e.target.value);
        render();
    }
});

// Canvas Interaction
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Simple panel selection based on layout
    // For now, let's just cycle through or use basic regions
    // Quad: top, bottom-left, bottom-mid, bottom-right
    if (state.layout === 'quad') {
        if (y < canvas.height * 0.4) selectedPanel = 0;
        else if (x < canvas.width / 3) selectedPanel = 1;
        else if (x < (canvas.width * 2) / 3) selectedPanel = 2;
        else selectedPanel = 3;
    } else if (state.layout === 'trio') {
        if (x < canvas.width * 0.4) selectedPanel = 0;
        else if (y < canvas.height / 2) selectedPanel = 1;
        else selectedPanel = 2;
    } else { // duo
        // diagonal split approx
        if (x + y < canvas.width) selectedPanel = 0;
        else selectedPanel = 1;
    }

    isDragging = true;
    lastMouse = { x, y };
    updateUI();
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const dx = x - lastMouse.x;
    const dy = y - lastMouse.y;

    if (state.focus[selectedPanel]) {
        // Sensitivity adjustment
        state.focus[selectedPanel].x -= dx / 1000;
        state.focus[selectedPanel].y -= dy / 1000;
        render();
    }
    lastMouse = { x, y };
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// Export
const exportSizes = {
    '1080x1080': { w: 1080, h: 1080 },
    '1080x1350': { w: 1080, h: 1350 },
    '1920x1080': { w: 1920, h: 1080 }
};

Object.entries(exportSizes).forEach(([id, dims]) => {
    document.getElementById(`export-${id}`).addEventListener('click', () => {
        const dataUrl = exportPNG(state, dims.w, dims.h);
        const link = document.createElement('a');
        link.download = `gtacover-${dims.w}x${dims.h}.png`;
        link.href = dataUrl;
        link.click();
    });
});

// Init
(async function init() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('shot')) {
        await applyShotMode(state, els);
    } else {
        // Initial samples
        await addPhoto('samples/pier.jpg');
        await addPhoto('samples/boulevard.jpg');
        updateUI();
    }
})();
