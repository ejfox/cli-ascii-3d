const { createCanvas } = require('canvas');

const width = 60;
const height = 30;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

function drawScene(time) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = 'white';
  const x = Math.cos(time) * 20 + width / 2;
  const y = Math.sin(time) * 10 + height / 2;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function canvasToAscii() {
  const imageData = ctx.getImageData(0, 0, width, height);
  const asciiChars = ' .:-=+*#%@';
  let ascii = '';

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      const charIndex = Math.floor(brightness / 255 * (asciiChars.length - 1));
      ascii += asciiChars[charIndex];
    }
    ascii += '\n';
  }

  return ascii;
}

function animate(time = 0) {
  drawScene(time);
  console.clear();
  console.log(canvasToAscii());
  setTimeout(() => animate(time + 0.1), 50);
}

animate();