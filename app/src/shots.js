import { drawCover } from './cover.js';

export async function applyShotMode(state, els) {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return;

    const photoName = params.get('photo') || 'pier';
    const otherPhoto = photoName === 'pier' ? 'boulevard' : 'pier';
    
    const [img1, img2] = await Promise.all([
        loadImage(`samples/${photoName}.jpg`),
        loadImage(`samples/${otherPhoto}.jpg`)
    ]);

    state.photos = [img1, img2, img1, img2]; // Fill with samples
    state.layout = params.get('layout') || 'quad';
    state.grade = params.get('grade') || 'sunset';
    state.caption1 = params.get('caption') || '';
    state.caption2 = params.get('caption2') || '';
    state.size = params.get('size') || 'wide';
    state.focus = [
        { x: 0.5, y: 0.5, zoom: 1 },
        { x: 0.5, y: 0.5, zoom: 1 },
        { x: 0.5, y: 0.5, zoom: 1 },
        { x: 0.5, y: 0.5, zoom: 1 }
    ];

    if (shot === 'cover') {
        document.body.classList.add('shot-mode-cover');
        const dims = {
            wide: { w: 1920, h: 1080 },
            square: { w: 1080, h: 1080 },
            tall: { w: 1080, h: 1350 }
        }[state.size] || { w: 1920, h: 1080 };

        const canvas = document.createElement('canvas');
        canvas.width = dims.w;
        canvas.height = dims.h;
        canvas.style.maxWidth = '100vw';
        canvas.style.maxHeight = '100vh';
        canvas.style.objectFit = 'contain';
        
        const ctx = canvas.getContext('2d');
        drawCover(ctx, dims.w, dims.h, state);
        
        document.body.innerHTML = '';
        document.body.appendChild(canvas);
        document.body.style.margin = '0';
        document.body.style.display = 'flex';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
        document.body.style.background = 'black';
        
        window.rendered = true;
    } else if (shot === 'editor') {
        // Just fill the state and let main.js handle the UI update
        // We need to trigger the UI update in main.js though
        if (window.updateUI) window.updateUI();
        window.rendered = true;
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
