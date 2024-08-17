const blessed = require('blessed');
const gl = require('gl');
const mat4 = require('gl-mat4');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('boxes', {
    alias: 'b',
    type: 'number',
    description: 'Number of boxes to display',
    default: 4
  })
  .option('speed', {
    alias: 's',
    type: 'number',
    description: 'Spin speed multiplier',
    default: 1
  })
  .help()
  .alias('help', 'h')
  .argv;

const numBoxes = Math.max(1, Math.min(10, argv.boxes)); // Clamp between 1 and 10
const spinSpeedMultiplier = Math.max(0.1, Math.min(5, argv.speed)); // Clamp between 0.1 and 5

const screen = blessed.screen({ smartCSR: true, title: 'Customizable Cyberpunk 3D ASCII Art' });

const vertexShaderSrc = `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec3 vPosition;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vPosition = position;
  }
`;

const fragmentShaderSrc = `
  precision mediump float;
  varying vec3 vPosition;
  uniform vec3 lightDir;
  void main() {
    vec3 normal = normalize(vPosition);
    float intensity = pow(max(0.1, dot(normal, lightDir)), 2.0);
    gl_FragColor = vec4(vec3(intensity), 1.0);
  }
`;

const primitives = {
  cube: new Float32Array([
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5,  0.5, -0.5, -0.5,  0.5, -0.5,
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5,  0.5, -0.5, -0.5,  0.5,
     0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
  ]),
  sphere: (() => {
    const vertices = [];
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const theta = (i * Math.PI) / segments;
        const phi = (j * 2 * Math.PI) / segments;
        const x = 0.5 * Math.sin(theta) * Math.cos(phi);
        const y = 0.5 * Math.cos(theta);
        const z = 0.5 * Math.sin(theta) * Math.sin(phi);
        vertices.push(x, y, z);
      }
    }
    return new Float32Array(vertices);
  })(),
  pyramid: new Float32Array([
     0.0,  0.5,  0.0, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,
     0.0,  0.5,  0.0,  0.5, -0.5,  0.5,  0.5, -0.5, -0.5,
     0.0,  0.5,  0.0,  0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
     0.0,  0.5,  0.0, -0.5, -0.5, -0.5, -0.5, -0.5,  0.5,
  ]),
};

function create3DRenderer(width, height, primitive) {
  const glContext = gl(width, height);
  const program = glContext.createProgram();

  [vertexShaderSrc, fragmentShaderSrc].forEach((src, index) => {
    const shader = glContext.createShader(index === 0 ? glContext.VERTEX_SHADER : glContext.FRAGMENT_SHADER);
    glContext.shaderSource(shader, src);
    glContext.compileShader(shader);
    glContext.attachShader(program, shader);
  });

  glContext.linkProgram(program);
  glContext.useProgram(program);

  const buffer = glContext.createBuffer();
  glContext.bindBuffer(glContext.ARRAY_BUFFER, buffer);
  glContext.bufferData(glContext.ARRAY_BUFFER, primitive, glContext.STATIC_DRAW);

  const positionLocation = glContext.getAttribLocation(program, 'position');
  glContext.enableVertexAttribArray(positionLocation);
  glContext.vertexAttribPointer(positionLocation, 3, glContext.FLOAT, false, 0, 0);

  const modelViewMatrixLocation = glContext.getUniformLocation(program, 'modelViewMatrix');
  const projectionMatrixLocation = glContext.getUniformLocation(program, 'projectionMatrix');
  const lightDirLocation = glContext.getUniformLocation(program, 'lightDir');

  const modelViewMatrix = mat4.create();
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, Math.PI / 4, width / height, 0.1, 100);

  let rotation = 0;
  const rotationSpeed = (Math.random() * 0.01 + 0.005) * spinSpeedMultiplier;
  const oscillationSpeed = (Math.random() * 0.02 + 0.01) * spinSpeedMultiplier;

  function render(time) {
    glContext.viewport(0, 0, width, height);
    glContext.clearColor(0, 0, 0, 1);
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
    glContext.enable(glContext.DEPTH_TEST);

    mat4.identity(modelViewMatrix);
    rotation += rotationSpeed;
    const oscillation = Math.sin(time * oscillationSpeed) * 0.5;
    mat4.translate(modelViewMatrix, modelViewMatrix, [oscillation, 0, -2]);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, rotation * 0.7);

    glContext.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
    glContext.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

    const lightDir = [Math.sin(rotation) * 2, 1, Math.cos(rotation) * 2];
    glContext.uniform3fv(lightDirLocation, lightDir);

    glContext.drawArrays(glContext.LINES, 0, primitive.length / 3);
  }

  function getAsciiFrame() {
    const pixels = new Uint8Array(width * height * 4);
    glContext.readPixels(0, 0, width, height, glContext.RGBA, glContext.UNSIGNED_BYTE, pixels);

    const asciiChars = ' .`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
    return Array.from({ length: height }, (_, y) => 
      Array.from({ length: width }, (_, x) => {
        const i = ((height - 1 - y) * width + x) * 4;
        const brightness = Math.pow((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 / 255, 0.5);
        return asciiChars[Math.floor(brightness * (asciiChars.length - 1))];
      }).join('')
    ).join('\n');
  }

  return { render, getAsciiFrame };
}

function createBox(isLarge = false) {
  const width = isLarge ? Math.floor(screen.width * 0.8) : Math.floor(Math.random() * 20) + 30;
  const height = isLarge ? Math.floor(screen.height * 0.8) : Math.floor(Math.random() * 10) + 20;
  const left = isLarge ? Math.floor(screen.width * 0.1) : Math.floor(Math.random() * (screen.width - width));
  const top = isLarge ? Math.floor(screen.height * 0.1) : Math.floor(Math.random() * (screen.height - height));

  const box = blessed.box({
    top, left, width, height,
    tags: true,
    border: { type: 'line' },
    style: { fg: 'white', border: { fg: '#ffffff' } }
  });

  const primitiveName = Object.keys(primitives)[Math.floor(Math.random() * Object.keys(primitives).length)];
  const renderer = create3DRenderer(width - 2, (height - 2) * 2, primitives[primitiveName]);

  return { box, renderer, lastUpdate: Date.now() };
}

function createSineWaveBackground() {
  return blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    style: {
      fg: ['blue', 'cyan', 'green', 'magenta'][Math.floor(Math.random() * 4)],
    },
  });
}

function updateSineWave(box, time) {
  const width = screen.width;
  const height = screen.height;
  
  const frequency = Math.random() * 0.2 + 0.05;
  const amplitude = Math.random() * 10 + 2;
  const speed = Math.random() * 0.1 + 0.02;
  const verticalShift = Math.random() * height;
  const waveChar = ['~', '-', '=', '*'][Math.floor(Math.random() * 4)];
  
  const numWaves = Math.floor(Math.random() * 3) + 1;
  
  let content = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let totalValue = 0;
      for (let i = 0; i < numWaves; i++) {
        const waveFreq = frequency * (i + 1);
        const waveAmp = amplitude / (i + 1);
        totalValue += Math.sin((x / width * waveFreq * Math.PI * 2) + (time * speed * (i + 1))) * waveAmp;
      }
      const yPos = Math.floor(verticalShift + totalValue);
      content += y === yPos ? waveChar : ' ';
    }
    content += '\n';
  }
  box.setContent(content);
}

const backgroundWave = createSineWaveBackground();
screen.append(backgroundWave);

let boxes = [createBox(true), ...Array(numBoxes - 1).fill().map(() => createBox())];
boxes.forEach(({ box }) => screen.append(box));

const unicodeFlair = ['▓▒░', '█▓▒░', '▀▄', '▌▐', '◢◣◥◤'];

function animate() {
  const now = Date.now();
  updateSineWave(backgroundWave, now * 0.001);
  
  boxes.forEach(({ box, renderer, lastUpdate }, index) => {
    renderer.render(now * 0.001);
    const frame = renderer.getAsciiFrame();
    const flairIndex = Math.floor(Math.random() * unicodeFlair.length);
    box.setContent(`${unicodeFlair[flairIndex]}\n${frame}`);

    if (index === 0 && now - lastUpdate > 30000) {
      screen.remove(box);
      boxes[0] = createBox(true);
      screen.append(boxes[0].box);
      boxes.slice(1).forEach(({ box }) => screen.append(box));
    }
  });

  screen.render();
  setTimeout(animate, 50);
}

animate();

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
screen.render();