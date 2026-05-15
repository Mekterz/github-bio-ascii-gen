const imageInput = document.getElementById('imageInput');
const widthScale = document.getElementById('widthScale');
const widthValue = document.getElementById('widthValue');
const thresholdInput = document.getElementById('threshold');
const ditheringInput = document.getElementById('dithering');
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

[widthScale, thresholdInput, ditheringInput].forEach(el => {
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

    const imageData = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
    const data = imageData.data;
    const threshold = parseInt(thresholdInput.value);
    
    // Grayscale conversion
    let pixels = new Float32Array(pixelWidth * pixelHeight);
    for (let i = 0; i < data.length; i += 4) {
        pixels[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    // Apply Floyd-Steinberg Dithering if enabled
    if (ditheringInput.checked) {
        for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
                let oldPixel = pixels[y * pixelWidth + x];
                let newPixel = oldPixel < threshold ? 0 : 255;
                pixels[y * pixelWidth + x] = newPixel;
                let error = oldPixel - newPixel;

                if (x + 1 < pixelWidth) pixels[y * pixelWidth + (x + 1)] += error * 7 / 16;
                if (y + 1 < pixelHeight) {
                    if (x - 1 >= 0) pixels[(y + 1) * pixelWidth + (x - 1)] += error * 3 / 16;
                    pixels[(y + 1) * pixelWidth + x] += error * 5 / 16;
                    if (x + 1 < pixelWidth) pixels[(y + 1) * pixelWidth + (x + 1)] += error * 1 / 16;
                }
            }
        }
    } else {
        for (let i = 0; i < pixels.length; i++) {
            pixels[i] = pixels[i] < threshold ? 0 : 255;
        }
    }

    let result = '';
    const dots = [[0,0,1], [0,1,2], [0,2,4], [1,0,8], [1,1,16], [1,2,32], [0,3,64], [1,3,128]];

    for (let y = 0; y < charHeight; y++) {
        for (let x = 0; x < charWidth; x++) {
            let code = 0;
            dots.forEach(([dx, dy, val]) => {
                const px = x * 2 + dx;
                const py = y * 4 + dy;
                if (px < pixelWidth && py < pixelHeight) {
                    if (pixels[py * pixelWidth + px] < 128) code += val;
                }
            });
            result += String.fromCharCode(0x2800 + code);
        }
        result += '\n';
    }

    output.textContent = result.trim();
    charCount.textContent = output.textContent.length;
}
