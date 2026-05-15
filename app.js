const imageInput = document.getElementById('imageInput');
const widthScale = document.getElementById('widthScale');
const widthValue = document.getElementById('widthValue');
const thresholdInput = document.getElementById('threshold');
const output = document.getElementById('output');
const charCount = document.getElementById('charCount');
const copyBtn = document.getElementById('copyBtn');

let currentImage = null;

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            render();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

[widthScale, thresholdInput].forEach(el => {
    el.addEventListener('input', () => {
        widthValue.textContent = widthScale.value;
        render();
    });
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(output.textContent);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copié !';
    setTimeout(() => copyBtn.textContent = originalText, 2000);
});

function render() {
    if (!currentImage) return;

    const charWidth = parseInt(widthScale.value);
    const pixelWidth = charWidth * 2;
    const scale = pixelWidth / currentImage.width;
    const pixelHeight = Math.round(currentImage.height * scale);
    const charHeight = Math.ceil(pixelHeight / 4);

    const canvas = document.createElement('canvas');
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentImage, 0, 0, pixelWidth, pixelHeight);

    const imageData = ctx.getImageData(0, 0, pixelWidth, pixelHeight).data;
    const threshold = parseInt(thresholdInput.value);

    let result = '';
    for (let y = 0; y < charHeight; y++) {
        for (let x = 0; x < charWidth; x++) {
            result += getBrailleChar(x, y, pixelWidth, pixelHeight, imageData, threshold);
        }
        result += '\n';
    }

    output.textContent = result.trim();
    charCount.textContent = output.textContent.length;
}

function getBrailleChar(cx, cy, width, height, data, threshold) {
    let code = 0;
    const dots = [
        [0, 0, 1], [0, 1, 2], [0, 2, 4], [1, 0, 8],
        [1, 1, 16], [1, 2, 32], [0, 3, 64], [1, 3, 128]
    ];

    dots.forEach(([dx, dy, val]) => {
        const x = cx * 2 + dx;
        const y = cy * 4 + dy;
        if (x < width && y < height) {
            const idx = (y * width + x) * 4;
            const avg = (data[idx] + data[idx+1] + data[idx+2]) / 3;
            if (avg < threshold) code += val;
        }
    });

    return String.fromCharCode(0x2800 + code);
}
