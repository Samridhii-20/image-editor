/* ==========================================
   PixelForge — Image Editor Core
   ========================================== */

(function () {
    'use strict';

    // ──────────── DOM REFS ────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const fileInput = $('#file-input');
    const canvas = $('#main-canvas');
    const ctx = canvas.getContext('2d');
    const canvasWrapper = $('#canvas-wrapper');
    const placeholder = $('#placeholder-msg');
    const zoomDisplay = $('#zoom-display');

    // Top bar
    const btnReset = $('#btn-reset');
    const btnDownload = $('#btn-download');
    const btnCrop = $('#btn-crop');
    const btnResize = $('#btn-resize');
    const btnRotateLeft = $('#btn-rotate-left');
    const btnRotateRight = $('#btn-rotate-right');
    const btnFlipH = $('#btn-flip-h');
    const btnFlipV = $('#btn-flip-v');
    const btnUndo = $('#btn-undo');
    const btnRedo = $('#btn-redo');
    const btnRemoveBg = $('#btn-remove-bg');

    // Crop / Resize
    const cropOverlay = $('#crop-overlay');
    const cropSelection = $('#crop-selection');
    const cropToolbar = $('#crop-toolbar');
    const cropW = $('#crop-w');
    const cropH = $('#crop-h');
    const btnApplyCrop = $('#btn-apply-crop');
    const btnCancelCrop = $('#btn-cancel-crop');
    const resizeDialog = $('#resize-dialog');
    const resizeW = $('#resize-w');
    const resizeH = $('#resize-h');
    const resizeLock = $('#resize-lock');
    const btnApplyResize = $('#btn-apply-resize');
    const bgRemoveDialog = $('#bg-remove-dialog');
    const bgToleranceInput = $('#bg-tolerance');
    const bgToleranceVal = $('#bg-tolerance-val');
    const bgRemoveProcessing = $('#bg-remove-processing');
    const btnCancelBg = $('#btn-cancel-bg');
    const btnCancelResize = $('#btn-cancel-resize');

    // Left tools
    const toolBtns = $$('.tool-btn');
    const brushOptions = $('#brush-options');
    const textOptions = $('#text-options');
    const shapeOptions = $('#shape-options');
    const brushSizeInput = $('#brush-size');
    const brushSizeVal = $('#brush-size-val');
    const brushOpacityInput = $('#brush-opacity');
    const brushOpacityVal = $('#brush-opacity-val');
    const brushColorInput = $('#brush-color');
    const brushHardness = $('#brush-hardness');
    const textContent = $('#text-content');
    const textSizeInput = $('#text-size');
    const textSizeVal = $('#text-size-val');
    const textFont = $('#text-font');
    const textColorInput = $('#text-color');
    const btnTextBold = $('#text-bold');
    const btnTextItalic = $('#text-italic');
    const btnTextStroke = $('#text-stroke');
    const btnAddText = $('#btn-add-text');
    const shapeType = $('#shape-type');
    const shapeStrokeWidth = $('#shape-stroke-width');
    const shapeColor = $('#shape-color');
    const shapeFill = $('#shape-fill');
    const shapeNoFill = $('#shape-no-fill');

    // Layers
    const layersList = $('#layers-list');
    const btnAddLayer = $('#btn-add-layer');
    const btnDeleteLayer = $('#btn-delete-layer');
    const btnMergeLayers = $('#btn-merge-layers');

    // Filters
    const filterSliders = $$('.filter-slider');
    const presetBtns = $$('.preset-btn');

    // ──────────── STATE ────────────
    let originalImage = null;
    let currentTool = 'select';
    let zoom = 1;
    let panX = 0, panY = 0;
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let isDrawing = false;
    let lastPoint = null;

    // Undo / Redo
    const undoStack = [];
    const redoStack = [];
    const MAX_UNDO = 30;

    // Layers
    let layers = [];
    let activeLayerIndex = 0;

    // Crop state
    let cropRect = { x: 0, y: 0, w: 0, h: 0 };
    let cropDragging = false;
    let cropResizing = false;
    let cropResizeHandle = '';
    let cropStartPt = { x: 0, y: 0 };

    // Shape drawing
    let shapeStart = null;
    let bgRemoveMode = false;
    let shapeTempCanvas = null;

    // Filters
    let filters = {
        brightness: 100, contrast: 100, exposure: 100, saturate: 100,
        'hue-rotate': 0, blur: 0, grayscale: 0, sepia: 0, opacity: 100, invert: 0
    };

    // Text styles
    let textBold = false, textItalic = false, textStroke = false;

    // ──────────── PRESETS ────────────
    const presets = {
        original:  { brightness: 100, contrast: 100, exposure: 100, saturate: 100, 'hue-rotate': 0, blur: 0, grayscale: 0, sepia: 0, opacity: 100, invert: 0 },
        vintage:   { brightness: 110, contrast: 85, exposure: 105, saturate: 60, 'hue-rotate': 20, blur: 0, grayscale: 10, sepia: 40, opacity: 100, invert: 0 },
        cold:      { brightness: 105, contrast: 110, exposure: 100, saturate: 80, 'hue-rotate': 200, blur: 0, grayscale: 0, sepia: 0, opacity: 100, invert: 0 },
        warm:      { brightness: 110, contrast: 105, exposure: 110, saturate: 130, 'hue-rotate': 10, blur: 0, grayscale: 0, sepia: 20, opacity: 100, invert: 0 },
        dramatic:  { brightness: 90, contrast: 160, exposure: 95, saturate: 140, 'hue-rotate': 0, blur: 0, grayscale: 0, sepia: 0, opacity: 100, invert: 0 },
        darken:    { brightness: 60, contrast: 120, exposure: 80, saturate: 110, 'hue-rotate': 0, blur: 0, grayscale: 0, sepia: 0, opacity: 100, invert: 0 },
        vivid:     { brightness: 115, contrast: 130, exposure: 110, saturate: 170, 'hue-rotate': 0, blur: 0, grayscale: 0, sepia: 0, opacity: 100, invert: 0 },
        noir:      { brightness: 95, contrast: 140, exposure: 90, saturate: 0, 'hue-rotate': 0, blur: 0, grayscale: 100, sepia: 0, opacity: 100, invert: 0 },
    };

    // ──────────── INIT ────────────
    function init() {
        canvas.width = 800;
        canvas.height = 600;
        updateCanvasTransform();
        createLayer('Background');
        renderLayersList();
    }

    // ──────────── LAYER SYSTEM ────────────
    function createLayer(name, w, h) {
        const lCanvas = document.createElement('canvas');
        lCanvas.width = w || canvas.width;
        lCanvas.height = h || canvas.height;
        const lCtx = lCanvas.getContext('2d');
        layers.push({
            name: name || `Layer ${layers.length + 1}`,
            canvas: lCanvas,
            ctx: lCtx,
            visible: true,
            opacity: 100,
        });
        activeLayerIndex = layers.length - 1;
        renderLayersList();
        compositeAndRender();
    }

    function renderLayersList() {
        layersList.innerHTML = '';
        for (let i = layers.length - 1; i >= 0; i--) {
            const l = layers[i];
            const item = document.createElement('div');
            item.className = 'layer-item' + (i === activeLayerIndex ? ' active' : '');
            item.dataset.index = i;
            item.innerHTML = `
                <button class="layer-visibility" data-index="${i}">
                    <span class="material-symbols-outlined">${l.visible ? 'visibility' : 'visibility_off'}</span>
                </button>
                <div class="layer-thumb"><canvas></canvas></div>
                <input class="layer-name" value="${l.name}" data-index="${i}">
                <span class="layer-opacity">${l.opacity}%</span>
            `;
            layersList.appendChild(item);

            // Thumbnail
            const thumbCanvas = item.querySelector('.layer-thumb canvas');
            thumbCanvas.width = 32;
            thumbCanvas.height = 32;
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCtx.drawImage(l.canvas, 0, 0, 32, 32);

            // Click to select
            item.addEventListener('click', (e) => {
                if (e.target.closest('.layer-visibility') || e.target.classList.contains('layer-name')) return;
                activeLayerIndex = i;
                renderLayersList();
            });
        }

        // Visibility toggles
        layersList.querySelectorAll('.layer-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index);
                layers[idx].visible = !layers[idx].visible;
                renderLayersList();
                compositeAndRender();
            });
        });

        // Name edits
        layersList.querySelectorAll('.layer-name').forEach(input => {
            input.addEventListener('change', (e) => {
                layers[parseInt(input.dataset.index)].name = input.value;
            });
        });
    }

    function compositeAndRender() {
        // Clear main canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each visible layer
        for (const l of layers) {
            if (!l.visible) continue;
            ctx.globalAlpha = l.opacity / 100;
            ctx.drawImage(l.canvas, 0, 0);
        }
        ctx.globalAlpha = 1;

        // Apply CSS filters visually
        canvas.style.filter = buildCSSFilter();
    }

    function buildCSSFilter() {
        const f = filters;
        return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) hue-rotate(${f['hue-rotate']}deg) blur(${f.blur}px) grayscale(${f.grayscale}%) sepia(${f.sepia}%) opacity(${f.opacity}%) invert(${f.invert}%)`;
    }

    // ──────────── UNDO / REDO ────────────
    function saveState() {
        // Save all layers state
        const state = layers.map(l => {
            const c = document.createElement('canvas');
            c.width = l.canvas.width;
            c.height = l.canvas.height;
            c.getContext('2d').drawImage(l.canvas, 0, 0);
            return {
                name: l.name,
                canvas: c,
                visible: l.visible,
                opacity: l.opacity,
            };
        });
        undoStack.push({
            layers: state,
            activeLayerIndex,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            filters: { ...filters },
        });
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        redoStack.length = 0;
    }

    function restoreState(state) {
        canvas.width = state.canvasWidth;
        canvas.height = state.canvasHeight;
        layers = state.layers.map(l => {
            const c = document.createElement('canvas');
            c.width = l.canvas.width;
            c.height = l.canvas.height;
            c.getContext('2d').drawImage(l.canvas, 0, 0);
            return {
                name: l.name,
                canvas: c,
                ctx: c.getContext('2d'),
                visible: l.visible,
                opacity: l.opacity,
            };
        });
        activeLayerIndex = state.activeLayerIndex;
        filters = { ...state.filters };
        updateFilterSliders();
        renderLayersList();
        compositeAndRender();
        updateCanvasTransform();
    }

    function undo() {
        if (undoStack.length === 0) return;
        const current = {
            layers: layers.map(l => {
                const c = document.createElement('canvas');
                c.width = l.canvas.width;
                c.height = l.canvas.height;
                c.getContext('2d').drawImage(l.canvas, 0, 0);
                return { name: l.name, canvas: c, visible: l.visible, opacity: l.opacity };
            }),
            activeLayerIndex,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            filters: { ...filters },
        };
        redoStack.push(current);
        restoreState(undoStack.pop());
    }

    function redo() {
        if (redoStack.length === 0) return;
        const current = {
            layers: layers.map(l => {
                const c = document.createElement('canvas');
                c.width = l.canvas.width;
                c.height = l.canvas.height;
                c.getContext('2d').drawImage(l.canvas, 0, 0);
                return { name: l.name, canvas: c, visible: l.visible, opacity: l.opacity };
            }),
            activeLayerIndex,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            filters: { ...filters },
        };
        undoStack.push(current);
        restoreState(redoStack.pop());
    }

    // ──────────── IMAGE I/O ────────────
    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                canvas.width = img.width;
                canvas.height = img.height;
                // Reset layers
                layers = [];
                activeLayerIndex = 0;
                undoStack.length = 0;
                redoStack.length = 0;
                createLayer('Background');
                layers[0].canvas.width = img.width;
                layers[0].canvas.height = img.height;
                layers[0].ctx = layers[0].canvas.getContext('2d');
                layers[0].ctx.drawImage(img, 0, 0);
                resetFilters();
                compositeAndRender();
                renderLayersList();
                placeholder.classList.add('hidden');
                fitCanvasToView();
                saveState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function downloadImage() {
        if (!originalImage && layers.length <= 1 && isCanvasBlank()) return;
        // Render final with filters baked in
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const ectx = exportCanvas.getContext('2d');
        ectx.filter = buildCSSFilter();
        // Draw composite
        for (const l of layers) {
            if (!l.visible) continue;
            ectx.globalAlpha = l.opacity / 100;
            ectx.drawImage(l.canvas, 0, 0);
        }
        ectx.globalAlpha = 1;

        const link = document.createElement('a');
        link.download = 'pixelforge-edited.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }

    function isCanvasBlank() {
        const b = layers[0]?.canvas;
        if (!b) return true;
        const c = b.getContext('2d');
        const pix = c.getImageData(0, 0, b.width, b.height).data;
        for (let i = 3; i < pix.length; i += 4) {
            if (pix[i] !== 0) return false;
        }
        return true;
    }

    function resetAll() {
        if (originalImage) {
            saveState();
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            layers = [];
            createLayer('Background');
            layers[0].canvas.width = originalImage.width;
            layers[0].canvas.height = originalImage.height;
            layers[0].ctx = layers[0].canvas.getContext('2d');
            layers[0].ctx.drawImage(originalImage, 0, 0);
            resetFilters();
            compositeAndRender();
            renderLayersList();
            fitCanvasToView();
        }
    }

    // ──────────── FILTERS ────────────
    function resetFilters() {
        filters = { ...presets.original };
        updateFilterSliders();
        presetBtns.forEach(b => b.classList.toggle('active', b.dataset.preset === 'original'));
    }

    function updateFilterSliders() {
        filterSliders.forEach(slider => {
            const key = slider.id.replace('filter-', '');
            if (filters[key] !== undefined) {
                slider.value = filters[key];
                const valSpan = document.querySelector(`.filter-value[data-for="${slider.id}"]`);
                if (valSpan) {
                    let display = filters[key];
                    if (key === 'hue-rotate') display += '°';
                    valSpan.textContent = display;
                }
            }
        });
    }

    function applyPreset(name) {
        if (!presets[name]) return;
        saveState();
        filters = { ...presets[name] };
        updateFilterSliders();
        compositeAndRender();
        presetBtns.forEach(b => b.classList.toggle('active', b.dataset.preset === name));
    }

    // ──────────── CROP ────────────
    function startCrop() {
        if (!originalImage && isCanvasBlank()) return;
        cropOverlay.classList.remove('hidden');
        cropToolbar.classList.remove('hidden');
        const pad = 40;
        cropRect = { x: pad, y: pad, w: canvas.width - pad * 2, h: canvas.height - pad * 2 };
        updateCropSelection();
        cropW.value = Math.round(cropRect.w);
        cropH.value = Math.round(cropRect.h);
    }

    function updateCropSelection() {
        cropSelection.style.left = cropRect.x + 'px';
        cropSelection.style.top = cropRect.y + 'px';
        cropSelection.style.width = cropRect.w + 'px';
        cropSelection.style.height = cropRect.h + 'px';
    }

    function applyCrop() {
        saveState();
        const sx = cropRect.x, sy = cropRect.y, sw = cropRect.w, sh = cropRect.h;
        // Resize all layers
        layers.forEach(l => {
            const temp = document.createElement('canvas');
            temp.width = sw;
            temp.height = sh;
            temp.getContext('2d').drawImage(l.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
            l.canvas.width = sw;
            l.canvas.height = sh;
            l.ctx = l.canvas.getContext('2d');
            l.ctx.drawImage(temp, 0, 0);
        });
        canvas.width = sw;
        canvas.height = sh;
        cancelCrop();
        compositeAndRender();
        renderLayersList();
        fitCanvasToView();
    }

    function cancelCrop() {
        cropOverlay.classList.add('hidden');
        cropToolbar.classList.add('hidden');
    }

    // ──────────── RESIZE ────────────
    function openResize() {
        resizeDialog.classList.remove('hidden');
        resizeW.value = canvas.width;
        resizeH.value = canvas.height;
    }

    function applyResize() {
        saveState();
        const nw = parseInt(resizeW.value) || canvas.width;
        const nh = parseInt(resizeH.value) || canvas.height;
        layers.forEach(l => {
            const temp = document.createElement('canvas');
            temp.width = nw;
            temp.height = nh;
            temp.getContext('2d').drawImage(l.canvas, 0, 0, nw, nh);
            l.canvas.width = nw;
            l.canvas.height = nh;
            l.ctx = l.canvas.getContext('2d');
            l.ctx.drawImage(temp, 0, 0);
        });
        canvas.width = nw;
        canvas.height = nh;
        resizeDialog.classList.add('hidden');
        compositeAndRender();
        renderLayersList();
        fitCanvasToView();
    }

    // ──────────── ROTATE / FLIP ────────────
    function rotateCanvas(deg) {
        saveState();
        const rad = (deg * Math.PI) / 180;
        layers.forEach(l => {
            const temp = document.createElement('canvas');
            const w = l.canvas.width, h = l.canvas.height;
            if (Math.abs(deg) === 90 || Math.abs(deg) === 270) {
                temp.width = h; temp.height = w;
            } else {
                temp.width = w; temp.height = h;
            }
            const tctx = temp.getContext('2d');
            tctx.translate(temp.width / 2, temp.height / 2);
            tctx.rotate(rad);
            tctx.drawImage(l.canvas, -w / 2, -h / 2);
            l.canvas.width = temp.width;
            l.canvas.height = temp.height;
            l.ctx = l.canvas.getContext('2d');
            l.ctx.drawImage(temp, 0, 0);
        });
        canvas.width = layers[0].canvas.width;
        canvas.height = layers[0].canvas.height;
        compositeAndRender();
        renderLayersList();
        fitCanvasToView();
    }

    function flipCanvas(dir) {
        saveState();
        layers.forEach(l => {
            const temp = document.createElement('canvas');
            temp.width = l.canvas.width;
            temp.height = l.canvas.height;
            const tctx = temp.getContext('2d');
            if (dir === 'h') {
                tctx.translate(temp.width, 0);
                tctx.scale(-1, 1);
            } else {
                tctx.translate(0, temp.height);
                tctx.scale(1, -1);
            }
            tctx.drawImage(l.canvas, 0, 0);
            l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
            l.ctx.drawImage(temp, 0, 0);
        });
        compositeAndRender();
        renderLayersList();
    }

    // ──────────── ZOOM & PAN ────────────
    function fitCanvasToView() {
        const area = document.getElementById('canvas-area');
        const maxW = area.clientWidth - 40;
        const maxH = area.clientHeight - 40;
        const scaleX = maxW / canvas.width;
        const scaleY = maxH / canvas.height;
        zoom = Math.min(scaleX, scaleY, 2);
        panX = 0;
        panY = 0;
        updateCanvasTransform();
    }

    function updateCanvasTransform() {
        canvasWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
        zoomDisplay.textContent = Math.round(zoom * 100) + '%';
    }

    function zoomBy(delta, centerX, centerY) {
        const oldZoom = zoom;
        zoom = Math.max(0.1, Math.min(10, zoom + delta));
        // Adjust pan to zoom towards pointer
        if (centerX !== undefined) {
            panX -= (centerX - panX) * (zoom / oldZoom - 1);
            panY -= (centerY - panY) * (zoom / oldZoom - 1);
        }
        updateCanvasTransform();
    }

    // ──────────── DRAWING TOOLS ────────────
    function getActiveLayer() {
        return layers[activeLayerIndex];
    }

    function getCanvasPoint(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom
        };
    }

    function drawBrush(from, to) {
        const layer = getActiveLayer();
        if (!layer) return;
        const lctx = layer.ctx;
        const size = parseInt(brushSizeInput.value);
        const opacity = parseInt(brushOpacityInput.value) / 100;
        const color = brushColorInput.value;
        const hardness = brushHardness.value;

        lctx.globalAlpha = opacity;
        lctx.strokeStyle = color;
        lctx.fillStyle = color;
        lctx.lineWidth = size;
        lctx.lineCap = hardness === 'square' ? 'square' : 'round';
        lctx.lineJoin = 'round';

        if (hardness === 'soft') {
            // Soft brush with shadow blur
            lctx.shadowBlur = size / 2;
            lctx.shadowColor = color;
        } else {
            lctx.shadowBlur = 0;
        }

        lctx.beginPath();
        lctx.moveTo(from.x, from.y);
        lctx.lineTo(to.x, to.y);
        lctx.stroke();

        lctx.globalAlpha = 1;
        lctx.shadowBlur = 0;
        compositeAndRender();
    }

    function drawEraser(from, to) {
        const layer = getActiveLayer();
        if (!layer) return;
        const lctx = layer.ctx;
        const size = parseInt(brushSizeInput.value);

        lctx.save();
        lctx.globalCompositeOperation = 'destination-out';
        lctx.globalAlpha = 1;
        lctx.strokeStyle = 'rgba(255,255,255,1)';
        lctx.lineWidth = size;
        lctx.lineCap = 'round';
        lctx.lineJoin = 'round';
        lctx.shadowBlur = 0;

        lctx.beginPath();
        lctx.moveTo(from.x, from.y);
        lctx.lineTo(to.x, to.y);
        lctx.stroke();

        lctx.restore();
        compositeAndRender();
    }

    // ──────────── TEXT OVERLAY ────────────
    function addText() {
        const txt = textContent.value.trim();
        if (!txt) return;
        saveState();
        const layer = getActiveLayer();
        const lctx = layer.ctx;
        const size = parseInt(textSizeInput.value);
        const font = textFont.value;
        const color = textColorInput.value;

        let fontStr = '';
        if (textItalic) fontStr += 'italic ';
        if (textBold) fontStr += 'bold ';
        fontStr += size + 'px ' + font;

        lctx.font = fontStr;
        lctx.textBaseline = 'middle';

        // Center the text
        const x = canvas.width / 2;
        const y = canvas.height / 2;

        if (textStroke) {
            lctx.strokeStyle = color;
            lctx.lineWidth = Math.max(2, size / 10);
            lctx.strokeText(txt, x - lctx.measureText(txt).width / 2, y);
        }
        lctx.fillStyle = color;
        lctx.fillText(txt, x - lctx.measureText(txt).width / 2, y);

        compositeAndRender();
        renderLayersList();
    }

    // ──────────── SHAPES ────────────
    function drawShape(from, to, layer, preview) {
        const lctx = preview ? shapeTempCanvas.getContext('2d') : layer.ctx;
        const type = shapeType.value;
        const sw = parseInt(shapeStrokeWidth.value);
        const col = shapeColor.value;
        const fc = shapeFill.value;
        const noFill = shapeNoFill.checked;

        if (preview) {
            shapeTempCanvas.getContext('2d').clearRect(0, 0, shapeTempCanvas.width, shapeTempCanvas.height);
        }

        lctx.strokeStyle = col;
        lctx.lineWidth = sw;
        lctx.fillStyle = noFill ? 'transparent' : fc;

        const x = Math.min(from.x, to.x);
        const y = Math.min(from.y, to.y);
        const w = Math.abs(to.x - from.x);
        const h = Math.abs(to.y - from.y);

        lctx.beginPath();
        switch (type) {
            case 'rect':
                lctx.rect(x, y, w, h);
                break;
            case 'circle':
                const rx = w / 2, ry = h / 2;
                lctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2);
                break;
            case 'line':
                lctx.moveTo(from.x, from.y);
                lctx.lineTo(to.x, to.y);
                break;
            case 'arrow':
                lctx.moveTo(from.x, from.y);
                lctx.lineTo(to.x, to.y);
                // Arrowhead
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                const headLen = 15;
                lctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
                lctx.moveTo(to.x, to.y);
                lctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
                break;
        }
        if (!noFill && type !== 'line' && type !== 'arrow') lctx.fill();
        lctx.stroke();

        if (preview) {
            // Draw temp canvas onto main
            compositeAndRender();
            ctx.drawImage(shapeTempCanvas, 0, 0);
        }
    }

    // ──────────── EYEDROPPER ────────────
    function pickColor(e) {
        const pt = getCanvasPoint(e);
        const pixel = ctx.getImageData(Math.round(pt.x), Math.round(pt.y), 1, 1).data;
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(c => c.toString(16).padStart(2, '0')).join('');
        brushColorInput.value = hex;
        textColorInput.value = hex;
        shapeColor.value = hex;
    }

    // ──────────── BACKGROUND REMOVAL ────────────
    function openBgRemove() {
        if (!originalImage && isCanvasBlank()) return;
        bgRemoveMode = true;
        bgRemoveDialog.classList.remove('hidden');
        canvasWrapper.classList.add('bg-remove-mode');
    }

    function cancelBgRemove() {
        bgRemoveMode = false;
        bgRemoveDialog.classList.add('hidden');
        bgRemoveProcessing.classList.add('hidden');
        canvasWrapper.classList.remove('bg-remove-mode');
    }

    function removeBackground(clickX, clickY) {
        const layer = getActiveLayer();
        if (!layer) return;

        const tolerance = parseInt(bgToleranceInput.value);
        const lctx = layer.ctx;
        const w = layer.canvas.width;
        const h = layer.canvas.height;
        const imageData = lctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Get the target color at the clicked pixel
        const idx = (Math.round(clickY) * w + Math.round(clickX)) * 4;
        const targetR = data[idx];
        const targetG = data[idx + 1];
        const targetB = data[idx + 2];

        // Euclidean distance threshold (scaled: tolerance 0–100 maps to distance 0–442)
        const maxDist = (tolerance / 100) * 441.67; // sqrt(255^2 * 3)

        // Process all pixels
        for (let i = 0; i < data.length; i += 4) {
            const dr = data[i] - targetR;
            const dg = data[i + 1] - targetG;
            const db = data[i + 2] - targetB;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

            if (dist <= maxDist) {
                data[i + 3] = 0; // Make pixel fully transparent
            }
        }

        lctx.putImageData(imageData, 0, 0);
        compositeAndRender();
        renderLayersList();
    }

    // ──────────── TOOL SWITCHING ────────────
    function selectTool(tool) {
        currentTool = tool;
        toolBtns.forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
        canvasWrapper.className = 'tool-' + tool;

        // Show/hide option panels
        brushOptions.classList.toggle('hidden', !['brush', 'eraser'].includes(tool));
        textOptions.classList.toggle('hidden', tool !== 'text');
        shapeOptions.classList.toggle('hidden', tool !== 'shape');
    }

    // ──────────── EVENT HANDLERS ────────────

    // File Input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) loadImage(e.target.files[0]);
    });

    // Drag & Drop
    document.addEventListener('dragover', (e) => { e.preventDefault(); });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });

    // Top bar buttons
    btnReset.addEventListener('click', resetAll);
    btnDownload.addEventListener('click', downloadImage);
    btnCrop.addEventListener('click', startCrop);
    btnResize.addEventListener('click', openResize);
    btnRotateLeft.addEventListener('click', () => rotateCanvas(-90));
    btnRotateRight.addEventListener('click', () => rotateCanvas(90));
    btnFlipH.addEventListener('click', () => flipCanvas('h'));
    btnFlipV.addEventListener('click', () => flipCanvas('v'));
    btnUndo.addEventListener('click', undo);
    btnRemoveBg.addEventListener('click', openBgRemove);
    btnCancelBg.addEventListener('click', cancelBgRemove);
    bgToleranceInput.addEventListener('input', () => {
        bgToleranceVal.textContent = bgToleranceInput.value;
    });
    btnRedo.addEventListener('click', redo);

    // Crop
    btnApplyCrop.addEventListener('click', applyCrop);
    btnCancelCrop.addEventListener('click', cancelCrop);
    btnApplyResize.addEventListener('click', applyResize);
    btnCancelResize.addEventListener('click', () => resizeDialog.classList.add('hidden'));

    // Crop - drag/resize the selection
    cropSelection.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('crop-handle')) {
            cropResizing = true;
            cropResizeHandle = [...e.target.classList].find(c => c !== 'crop-handle');
        } else {
            cropDragging = true;
        }
        cropStartPt = { x: e.clientX, y: e.clientY };
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (cropDragging) {
            const dx = (e.clientX - cropStartPt.x) / zoom;
            const dy = (e.clientY - cropStartPt.y) / zoom;
            cropRect.x += dx;
            cropRect.y += dy;
            cropRect.x = Math.max(0, Math.min(canvas.width - cropRect.w, cropRect.x));
            cropRect.y = Math.max(0, Math.min(canvas.height - cropRect.h, cropRect.y));
            updateCropSelection();
            cropW.value = Math.round(cropRect.w);
            cropH.value = Math.round(cropRect.h);
            cropStartPt = { x: e.clientX, y: e.clientY };
        }
        if (cropResizing) {
            const dx = (e.clientX - cropStartPt.x) / zoom;
            const dy = (e.clientY - cropStartPt.y) / zoom;
            if (cropResizeHandle.includes('right')) cropRect.w = Math.max(20, cropRect.w + dx);
            if (cropResizeHandle.includes('left')) { cropRect.x += dx; cropRect.w = Math.max(20, cropRect.w - dx); }
            if (cropResizeHandle.includes('bottom')) cropRect.h = Math.max(20, cropRect.h + dy);
            if (cropResizeHandle.includes('top')) { cropRect.y += dy; cropRect.h = Math.max(20, cropRect.h - dy); }
            updateCropSelection();
            cropW.value = Math.round(cropRect.w);
            cropH.value = Math.round(cropRect.h);
            cropStartPt = { x: e.clientX, y: e.clientY };
        }
    });

    document.addEventListener('mouseup', () => {
        cropDragging = false;
        cropResizing = false;
    });

    // Resize lock aspect ratio
    let aspectRatio = 1;
    resizeW.addEventListener('focus', () => { aspectRatio = canvas.width / canvas.height; });
    resizeW.addEventListener('input', () => {
        if (resizeLock.checked) resizeH.value = Math.round(parseInt(resizeW.value) / aspectRatio);
    });
    resizeH.addEventListener('input', () => {
        if (resizeLock.checked) resizeW.value = Math.round(parseInt(resizeH.value) * aspectRatio);
    });

    // Crop dimension inputs
    cropW.addEventListener('input', () => {
        cropRect.w = Math.max(20, parseInt(cropW.value) || 20);
        updateCropSelection();
    });
    cropH.addEventListener('input', () => {
        cropRect.h = Math.max(20, parseInt(cropH.value) || 20);
        updateCropSelection();
    });

    // Tool buttons
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => selectTool(btn.dataset.tool));
    });

    // Brush size/opacity live display
    brushSizeInput.addEventListener('input', () => { brushSizeVal.textContent = brushSizeInput.value; });
    brushOpacityInput.addEventListener('input', () => { brushOpacityVal.textContent = brushOpacityInput.value + '%'; });
    textSizeInput.addEventListener('input', () => { textSizeVal.textContent = textSizeInput.value; });

    // Text style toggles
    btnTextBold.addEventListener('click', () => { textBold = !textBold; btnTextBold.classList.toggle('active'); });
    btnTextItalic.addEventListener('click', () => { textItalic = !textItalic; btnTextItalic.classList.toggle('active'); });
    btnTextStroke.addEventListener('click', () => { textStroke = !textStroke; btnTextStroke.classList.toggle('active'); });
    btnAddText.addEventListener('click', addText);

    // Layer buttons
    btnAddLayer.addEventListener('click', () => { saveState(); createLayer(); });
    btnDeleteLayer.addEventListener('click', () => {
        if (layers.length <= 1) return;
        saveState();
        layers.splice(activeLayerIndex, 1);
        activeLayerIndex = Math.min(activeLayerIndex, layers.length - 1);
        renderLayersList();
        compositeAndRender();
    });
    btnMergeLayers.addEventListener('click', () => {
        if (activeLayerIndex <= 0) return;
        saveState();
        const below = layers[activeLayerIndex - 1];
        const above = layers[activeLayerIndex];
        below.ctx.globalAlpha = above.opacity / 100;
        below.ctx.drawImage(above.canvas, 0, 0);
        below.ctx.globalAlpha = 1;
        layers.splice(activeLayerIndex, 1);
        activeLayerIndex--;
        renderLayersList();
        compositeAndRender();
    });

    // Filter sliders
    filterSliders.forEach(slider => {
        slider.addEventListener('input', () => {
            const key = slider.id.replace('filter-', '');
            filters[key] = parseFloat(slider.value);
            const valSpan = document.querySelector(`.filter-value[data-for="${slider.id}"]`);
            if (valSpan) {
                let display = slider.value;
                if (key === 'hue-rotate') display += '°';
                valSpan.textContent = display;
            }
            compositeAndRender();
            // Remove active from presets
            presetBtns.forEach(b => b.classList.remove('active'));
        });
        // Save state on mouseup/change
        slider.addEventListener('change', () => {
            saveState();
        });
    });

    // Preset buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // ──────────── CANVAS MOUSE EVENTS ────────────
    canvas.addEventListener('mousedown', (e) => {
        const pt = getCanvasPoint(e);

        // Handle background removal mode
        if (bgRemoveMode) {
            saveState();
            bgRemoveProcessing.classList.remove('hidden');
            // Use requestAnimationFrame to allow the UI to update before heavy processing
            requestAnimationFrame(() => {
                removeBackground(pt.x, pt.y);
                bgRemoveProcessing.classList.add('hidden');
                cancelBgRemove();
            });
            return;
        }

        switch (currentTool) {
            case 'brush':
            case 'eraser':
                saveState();
                isDrawing = true;
                lastPoint = pt;
                break;
            case 'pan':
                isPanning = true;
                panStart = { x: e.clientX - panX, y: e.clientY - panY };
                break;
            case 'zoom':
                zoomBy(e.shiftKey ? -0.2 : 0.2);
                break;
            case 'eyedropper':
                pickColor(e);
                break;
            case 'text':
                // Place text at click position
                const txt = textContent.value.trim();
                if (!txt) return;
                saveState();
                const layer = getActiveLayer();
                const lctx = layer.ctx;
                const size = parseInt(textSizeInput.value);
                const font = textFont.value;
                const color = textColorInput.value;
                let fontStr = '';
                if (textItalic) fontStr += 'italic ';
                if (textBold) fontStr += 'bold ';
                fontStr += size + 'px ' + font;
                lctx.font = fontStr;
                lctx.textBaseline = 'middle';
                if (textStroke) {
                    lctx.strokeStyle = color;
                    lctx.lineWidth = Math.max(2, size / 10);
                    lctx.strokeText(txt, pt.x, pt.y);
                }
                lctx.fillStyle = color;
                lctx.fillText(txt, pt.x, pt.y);
                compositeAndRender();
                renderLayersList();
                break;
            case 'shape':
                saveState();
                isDrawing = true;
                shapeStart = pt;
                shapeTempCanvas = document.createElement('canvas');
                shapeTempCanvas.width = canvas.width;
                shapeTempCanvas.height = canvas.height;
                break;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pt = getCanvasPoint(e);

        if (isDrawing && currentTool === 'brush') {
            drawBrush(lastPoint, pt);
            lastPoint = pt;
        } else if (isDrawing && currentTool === 'eraser') {
            drawEraser(lastPoint, pt);
            lastPoint = pt;
        } else if (isDrawing && currentTool === 'shape' && shapeStart) {
            drawShape(shapeStart, pt, getActiveLayer(), true);
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            panX = e.clientX - panStart.x;
            panY = e.clientY - panStart.y;
            updateCanvasTransform();
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (isDrawing && currentTool === 'shape' && shapeStart) {
            const pt = getCanvasPoint(e);
            drawShape(shapeStart, pt, getActiveLayer(), false);
            shapeStart = null;
            shapeTempCanvas = null;
            compositeAndRender();
            renderLayersList();
        }
        isDrawing = false;
        lastPoint = null;
    });

    document.addEventListener('mouseup', () => {
        isPanning = false;
        isDrawing = false;
        lastPoint = null;
    });

    // Scroll to zoom
    document.getElementById('canvas-area').addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoomBy(delta);
    }, { passive: false });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
            if (e.key === 'y') { e.preventDefault(); redo(); }
            if (e.key === 's') { e.preventDefault(); downloadImage(); }
            if (e.key === '0') { e.preventDefault(); fitCanvasToView(); }
            if (e.key === '=') { e.preventDefault(); zoomBy(0.1); }
            if (e.key === '-') { e.preventDefault(); zoomBy(-0.1); }
        }

        // Tool shortcuts
        const toolMap = { 'v': 'select', 'b': 'brush', 'e': 'eraser', 't': 'text', 'u': 'shape', 'i': 'eyedropper', 'z': 'zoom', 'h': 'pan' };
        if (!e.ctrlKey && !e.metaKey && toolMap[e.key]) {
            selectTool(toolMap[e.key]);
        }

        // Space for pan
        if (e.key === ' ' && !e.repeat) {
            e.preventDefault();
            selectTool('pan');
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === ' ') selectTool('select');
    });

    // ──────────── START ────────────
    init();

})();
