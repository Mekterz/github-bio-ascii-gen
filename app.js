const imageInput = document.getElementById('imageInput');
const widthScale = document.getElementById('widthScale');
const widthValue = document.getElementById('widthValue');
const contrastInput = document.getElementById('contrast');
const brightnessInput = document.getElementById('brightness');
const ditheringInput = document.getElementById('dithering');
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
    for(let i=0; i<50; i++) {
        dots_bg.push({
            x: Math.random() * canvas_bg.width,
            y: Math.random() * canvas_bg.height,
            char: String.fromCharCode(0x2800 + Math.floor(Math.random() * 255)),
            opacity: Math.random(),
            speed: 0.005 + Math.random() * 0.01
        });
    }
}

function animateBg() {
    ctx_bg.clearRect(0, 0, canvas_bg.width, canvas_bg.height);
    ctx_bg.font = '14px JetBrains Mono';
    ctx_bg.fillStyle = 'rgba(0, 255, 65, 0.5)';
    
    dots_bg.forEach(dot => {
        dot.opacity -= dot.speed;
        if(dot.opacity <= 0) {
            dot.x = Math.random() * canvas_bg.width;
            dot.y = Math.random() * canvas_bg.height;
            dot.opacity = 1;
            dot.char = String.fromCharCode(0x2800 + Math.floor(Math.random() * 255));
        }
        ctx_bg.globalAlpha = dot.opacity;
        ctx_bg.fillText(dot.char, dot.x, dot.y);
    });
    requestAnimationFrame(animateBg);
}

window.addEventListener('resize', initBg);
initBg();
animateBg();

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

[widthScale, contrastInput, brightnessInput, ditheringInput, invertInput, charStyle].forEach(el => {
    el.addEventListener('input', () => {
        widthValue.textContent = widthScale.value;
        render();
    });
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(output.textContent);
    const original = copyBtn.textContent;
    copyBtn.textContent = 'DONE';
    setTimeout(() => copyBtn.textContent = original, 2000);
});

function render() {
    if (!currentImage) return;

    const style = charStyle.value;
    const charWidth = parseInt(widthScale.value);
    const subWidth = 2;
    const subHeight = (style === 'braille') ? 4 : 2;

    const pixelWidth = charWidth * subWidth;
    const scale = pixelWidth / currentImage.width;
    const pixelHeight = Math.round(currentImage.height * scale);
    const charHeight = Math.ceil(pixelHeight / subHeight);

    const canvas = document.createElement('canvas');
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentImage, 0, 0, pixelWidth, pixelHeight);

    const imageData = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
    const data = imageData.data;
    
    const contrast = (parseInt(contrastInput.value) + 100) / 100;
    const brightness = parseInt(brightnessInput.value);
    const isInverted = invertInput.checked;

    let pixels = new Float32Array(pixelWidth * pixelHeight);
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        let alpha = data[i + 3];
        avg = (avg - 128) * contrast + 128 + brightness;
        avg = Math.max(0, Math.min(255, avg));
        
        if (alpha < 128) {
            pixels[i / 4] = 255; 
        } else {
            pixels[i / 4] = isInverted ? 255 - avg : avg;
        }
    }

    if (ditheringInput.checked) {
        for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
                let oldP = pixels[y * pixelWidth + x];
                let newP = oldP < 128 ? 0 : 255;
                pixels[y * pixelWidth + x] = newP;
                let err = oldP - newP;
                if (x + 1 < pixelWidth) pixels[y * pixelWidth + x + 1] += err * 7/16;
                if (y + 1 < pixelHeight) {
                    if (x > 0) pixels[(y+1) * pixelWidth + x - 1] += err * 3/16;
                    pixels[(y+1) * pixelWidth + x] += err * 5/16;
                    if (x + 1 < pixelWidth) pixels[(y+1) * pixelWidth + x + 1] += err * 1/16;
                }
            }
        }
    }

    let lines = [];
    const BLANK = '\u2800'; 

    if (style === 'braille') {
        const dots = [[0,0,1], [0,1,2], [0,2,4], [1,0,8], [1,1,16], [1,2,32], [0,3,64], [1,3,128]];
        for (let y = 0; y < charHeight; y++) {
            let line = '';
            for (let x = 0; x < charWidth; x++) {
                let code = 0;
                dots.forEach(([dx, dy, val]) => {
                    const px = x * 2 + dx;
                    const py = y * 4 + dy;
                    if (px < pixelWidth && py < pixelHeight && pixels[py * pixelWidth + px] < 128) code += val;
                });
                line += code === 0 ? BLANK : String.fromCharCode(0x2800 + code);
            }
            lines.push(line);
        }
    } else {
        const quadrants = [BLANK, '▗', '▖', '▄', '▝', '▐', '▞', '▟', '▘', '▚', '▌', '▙', '▀', '▜', '▛', '█'];
        for (let y = 0; y < charHeight; y++) {
            let line = '';
            for (let x = 0; x < charWidth; x++) {
                let code = 0;
                if (getPix(x*2, y*2, pixelWidth, pixelHeight, pixels)) code += 8;
                if (getPix(x*2+1, y*2, pixelWidth, pixelHeight, pixels)) code += 4;
                if (getPix(x*2, y*2+1, pixelWidth, pixelHeight, pixels)) code += 2;
                if (getPix(x*2+1, y*2+1, pixelWidth, pixelHeight, pixels)) code += 1;
                line += quadrants[code];
            }
            lines.push(line);
        }
    }

    let finalResult = '';
    for (let line of lines) {
        if ((finalResult + line).length > 160) break;
        finalResult += (finalResult ? '\n' : '') + line;
    }

    output.textContent = finalResult;
    charCount.textContent = finalResult.length;
}

function getPix(x, y, w, h, pixels) {
    if (x >= w || y >= h) return false;
    return pixels[y * w + x] < 128;
}
