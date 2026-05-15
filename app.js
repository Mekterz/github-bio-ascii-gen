const imageInput = document.getElementById('imageInput');
const widthScale = document.getElementById('widthScale');
const contrastInput = document.getElementById('contrast');
const brightnessInput = document.getElementById('brightness');
const thresholdInput = document.getElementById('threshold');
const invertInput = document.getElementById('invert');
const charStyle = document.getElementById('charStyle');
const output = document.getElementById('output');
const charCount = document.getElementById('charCount');
const copyBtn = document.getElementById('copyBtn');

let currentImage = null;

// --- Background Animation ---
const canvas_bg = document.getElementById('bg-canvas');
const ctx_bg = canvas_bg.getContext('2d');
let dots_bg = [];

function initBg() {
    canvas_bg.width = window.innerWidth;
    canvas_bg.height = window.innerHeight;
    dots_bg = [];
    for(let i=0; i<30; i++) {
        dots_bg.push({
            x: Math.random() * canvas_bg.width,
            y: Math.random() * canvas_bg.height,
            char: '+',
            opacity: Math.random(),
            speed: 0.005
        });
    }
}

function animateBg() {
    ctx_bg.clearRect(0, 0, canvas_bg.width, canvas_bg.height);
    ctx_bg.font = '10px monospace';
    ctx_bg.fillStyle = '#222';
    dots_bg.forEach(dot => {
        dot.opacity -= dot.speed;
        if(dot.opacity <= 0) dot.opacity = 1;
        ctx_bg.globalAlpha = dot.opacity;
        ctx_bg.fillText(dot.char, dot.x, dot.y);
    });
    requestAnimationFrame(animateBg);
}
initBg(); animateBg();

// --- Core Logic ---
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => { currentImage = img; render(); };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

[widthScale, contrastInput, brightnessInput, thresholdInput, invertInput, charStyle].forEach(el => {
    el.addEventListener('input', () => render());
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(output.textContent);
    copyBtn.textContent = 'COPIED';
    setTimeout(() => copyBtn.textContent = 'COPY_TO_BIO', 2000);
});

function render() {
    if (!currentImage) return;

    const style = charStyle.value;
    const charWidth = parseInt(widthScale.value);
    
    // Braille uses 2x4 pixels per char, Blocks uses 1x1 or 2x2
    const subWidth = (style === 'braille' || style === 'quadrants') ? 2 : 1;
    const subHeight = (style === 'braille') ? 4 : (style === 'quadrants' ? 2 : 1);

    const pixelWidth = charWidth * subWidth;
    const scale = pixelWidth / currentImage.width;
    const pixelHeight = Math.round(currentImage.height * scale);
    const charHeight = Math.ceil(pixelHeight / subHeight);

    const canvas = document.createElement('canvas');
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentImage, 0, 0, pixelWidth, pixelHeight);

    const data = ctx.getImageData(0, 0, pixelWidth, pixelHeight).data;
    const contrast = (parseInt(contrastInput.value) + 100) / 100;
    const brightness = parseInt(brightnessInput.value);
    const threshold = parseInt(thresholdInput.value);
    const isInverted = invertInput.checked;

    let pixels = new Float32Array(pixelWidth * pixelHeight);
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        let alpha = data[i + 3];
        avg = (avg - 128) * contrast + 128 + brightness;
        avg = Math.max(0, Math.min(255, avg));
        
        if (alpha < 50) {
            pixels[i / 4] = 255; 
        } else {
            pixels[i / 4] = isInverted ? 255 - avg : avg;
        }
    }

    let lines = [];
    const BLANK_BRAILLE = '\u2800';
    const ANCHOR = ''; 

    for (let y = 0; y < charHeight; y++) {
        let line = ANCHOR;
        for (let x = 0; x < charWidth; x++) {
            if (style === 'braille') {
                let code = 0;
                const dots = [[0,0,1], [0,1,2], [0,2,4], [1,0,8], [1,1,16], [1,2,32], [0,3,64], [1,3,128]];
                dots.forEach(([dx, dy, val]) => {
                    const px = x * 2 + dx, py = y * 4 + dy;
                    if (px < pixelWidth && py < pixelHeight && pixels[py * pixelWidth + px] < threshold) code += val;
                });
                line += code === 0 ? BLANK_BRAILLE : String.fromCharCode(0x2800 + code);
            } 
            else if (style === 'quadrants') {
                const q = [BLANK_BRAILLE, '▗', '▖', '▄', '▝', '▐', '▞', '▟', '▘', '▚', '▌', '▙', '▀', '▜', '▛', '█'];
                let code = 0;
                if (getPix(x*2, y*2, pixelWidth, pixelHeight, pixels, threshold)) code += 8;
                if (getPix(x*2+1, y*2, pixelWidth, pixelHeight, pixels, threshold)) code += 4;
                if (getPix(x*2, y*2+1, pixelWidth, pixelHeight, pixels, threshold)) code += 2;
                if (getPix(x*2+1, y*2+1, pixelWidth, pixelHeight, pixels, threshold)) code += 1;
                line += q[code];
            }
            else { // Classic Blocks 1x1
                const px = x, py = y;
                if (px < pixelWidth && py < pixelHeight) {
                    line += pixels[py * pixelWidth + px] < threshold ? '█' : BLANK_BRAILLE;
                }
            }
        }
        lines.push(line);
    }

    let finalResult = '';
    for (let l of lines) {
        if ((finalResult + l).length > 158) break; // 158 to be safe with newlines
        finalResult += (finalResult ? '\n' : '') + l;
    }

    output.textContent = finalResult;
    charCount.textContent = finalResult.length;
}

function getPix(x, y, w, h, pixels, threshold) {
    if (x >= w || y >= h) return false;
    return pixels[y * w + x] < threshold;
}
