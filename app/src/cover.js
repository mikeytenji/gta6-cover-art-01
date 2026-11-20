export const LAYOUTS = ['duo', 'trio', 'quad'];

export function drawCover(ctx, W, H, state) {
    const { photos = [], layout = 'quad', grade = 'sunset', caption1 = '', caption2 = '', focus = [] } = state;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);

    const gutter = Math.max(2, Math.round(W * (10 / 1080)));

    const panels = getPanels(layout, W, H, gutter);

    panels.forEach((panel, i) => {
        const photo = photos[i] || photos[0];
        if (!photo) return;

        ctx.save();
        // Clip to panel
        ctx.beginPath();
        ctx.moveTo(panel.poly[0].x, panel.poly[0].y);
        for (let j = 1; j < panel.poly.length; j++) {
            ctx.lineTo(panel.poly[j].x, panel.poly[j].y);
        }
        ctx.closePath();
        ctx.clip();

        // Draw photo
        const f = focus[i] || { x: 0.5, y: 0.5, zoom: 1 };
        drawPhoto(ctx, photo, panel.rect, f);

        // Apply Grade
        applyGrade(ctx, panel.rect, grade);

        // Vignette
        applyVignette(ctx, panel.rect);

        // Inner white border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = Math.max(1, Math.round(W * (4 / 1080)));
        ctx.stroke();

        ctx.restore();
    });

    // Draw Captions
    drawCaptions(ctx, W, H, state);
}

function getPanels(layout, W, H, gutter) {
    const panels = [];
    const g = gutter / 2;

    if (layout === 'duo') {
        // Diagonal split
        panels.push({
            poly: [{ x: 0, y: 0 }, { x: W - gutter, y: 0 }, { x: 0, y: H - gutter }],
            rect: { x: 0, y: 0, w: W, h: H }
        });
        panels.push({
            poly: [{ x: W, y: gutter }, { x: W, y: H }, { x: gutter, y: H }],
            rect: { x: 0, y: 0, w: W, h: H }
        });
    } else if (layout === 'trio') {
        // 1 tall left, 2 stacked right
        const splitX = W * 0.4;
        panels.push({
            poly: [{ x: 0, y: 0 }, { x: splitX - g, y: 0 }, { x: splitX - g, y: H }, { x: 0, y: H }],
            rect: { x: 0, y: 0, w: splitX - g, h: H }
        });
        panels.push({
            poly: [{ x: splitX + g, y: 0 }, { x: W, y: 0 }, { x: W, y: H / 2 - g }, { x: splitX + g, y: H / 2 - g }],
            rect: { x: splitX + g, y: 0, w: W - splitX - g, h: H / 2 - g }
        });
        panels.push({
            poly: [{ x: splitX + g, y: H / 2 + g }, { x: W, y: H / 2 + g }, { x: W, y: H }, { x: splitX + g, y: H }],
            rect: { x: splitX + g, y: H / 2 + g, w: W - splitX - g, h: H / 2 - g }
        });
    } else {
        // quad: 1 wide top, 3 below
        const splitY = H * 0.4;
        const colW = (W - 2 * gutter) / 3;
        panels.push({
            poly: [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: splitY - g }, { x: 0, y: splitY - g }],
            rect: { x: 0, y: 0, w: W, h: splitY - g }
        });
        for (let i = 0; i < 3; i++) {
            const x = i * (colW + gutter);
            panels.push({
                poly: [{ x, y: splitY + g }, { x: x + colW, y: splitY + g }, { x: x + colW, y: H }, { x, y: H }],
                rect: { x, y: splitY + g, w: colW, h: H - splitY - g }
            });
        }
    }
    return panels;
}

function drawPhoto(ctx, img, rect, focus) {
    const { x, y, w, h } = rect;
    const { x: fx, y: fy, zoom } = focus;

    const imgAspect = img.width / img.height;
    const rectAspect = w / h;

    let drawW, drawH;
    if (imgAspect > rectAspect) {
        drawH = h * zoom;
        drawW = drawH * imgAspect;
    } else {
        drawW = w * zoom;
        drawH = drawW / imgAspect;
    }

    const offsetX = x + w / 2 - drawW * fx;
    const offsetY = y + h / 2 - drawH * fy;

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

function applyGrade(ctx, rect, grade) {
    const { x, y, w, h } = rect;
    ctx.save();
    if (grade === 'sunset') {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, 'rgba(255, 94, 58, 0.28)');
        grad.addColorStop(1, 'rgba(64, 0, 96, 0.38)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
        
        // Warm highlight
        const radial = ctx.createRadialGradient(x + w*0.7, y + h*0.2, 0, x + w*0.7, y + h*0.2, w);
        radial.addColorStop(0, 'rgba(255, 210, 63, 0.15)');
        radial.addColorStop(1, 'rgba(255, 210, 63, 0)');
        ctx.fillStyle = radial;
        ctx.fillRect(x, y, w, h);
    } else if (grade === 'neon') {
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, 'rgba(63, 242, 224, 0.25)');
        grad.addColorStop(1, 'rgba(255, 0, 255, 0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
    } else if (grade === 'noir') {
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = 'black';
        ctx.fillRect(x, y, w, h);
        ctx.globalCompositeOperation = 'contrast'; // Not a standard CSS blend mode, but we can simulate
        // Actually let's just use filters if available, but for now simple overlay
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y, w, h);
        ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
}

function applyVignette(ctx, rect) {
    const { x, y, w, h } = rect;
    const grad = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
}

function drawCaptions(ctx, W, H, state) {
    const { caption1, caption2, grade } = state;
    const accent = { sunset: '#ffd23f', neon: '#3ff2e0', noir: '#e8e8e8' }[grade] || '#fff';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (caption2) {
        const size2 = Math.round(H * 0.045);
        ctx.font = `900 ${size2}px "Arial Narrow", Impact, sans-serif`;
        drawText(ctx, caption2.toUpperCase(), W / 2, H * 0.815, accent, H * 0.008, H * 0.003);
    }

    if (caption1) {
        const size1 = Math.round(H * 0.085);
        ctx.font = `900 ${size1}px "Arial Narrow", Impact, sans-serif`;
        drawText(ctx, caption1.toUpperCase(), W / 2, H * 0.90, 'white', H * 0.016, H * 0.006);
    }
}

function drawText(ctx, text, x, y, fill, strokeWidth, shadowOffset) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = shadowOffset;
    ctx.shadowOffsetX = shadowOffset;
    ctx.shadowOffsetY = shadowOffset;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);

    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
    ctx.restore();
}

export function exportPNG(state, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    drawCover(ctx, w, h, state);
    return canvas.toDataURL('image/png');
}
