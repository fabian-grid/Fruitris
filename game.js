// DOM references
const gridElement = document.getElementById('grid');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const scoreTopDisplay = document.getElementById('scoreTop');
const gameOverDisplay = document.getElementById('gameOver');
const levelDisplay = document.getElementById('level');
const levelUpDisplay = document.getElementById('levelUp');
const touchControls = document.getElementById('touchControls');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const restartButton = document.getElementById('restartButton');

let startTouchX = 0;
let startTouchY = 0;

// simple sound effects using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// note frequency lookup table
const noteFreq = {
  C4: 261.63,
  D4: 293.66,
  F4: 349.23,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5
};

function playOsc(type, frequency, duration, start = audioCtx.currentTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

function playNoise(duration, start = audioCtx.currentTime) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  source.start(start);
  source.stop(start + duration);
}

function playSequence({ waveforms, notes, duration }) {
  const noteDuration = duration / notes.length;
  let time = audioCtx.currentTime;
  notes.forEach(n => {
    waveforms.forEach(wave => {
      if (wave === 'noise') {
        playNoise(noteDuration, time);
      } else {
        playOsc(wave, noteFreq[n], noteDuration, time);
      }
    });
    time += noteDuration;
  });
}

function playRestartSound() {
  playSequence({ waveforms: ['square', 'triangle'], notes: ['C5', 'E5', 'G5'], duration: 0.5 });
}

function playGameOverSound() {
  playSequence({ waveforms: ['square'], notes: ['C5', 'A4', 'F4', 'D4'], duration: 0.8 });
}

function playMatchSound() {
  playSequence({ waveforms: ['square'], notes: ['G5', 'C6'], duration: 0.3 });
}

function playDestroySound() {
  playSequence({ waveforms: ['noise', 'triangle'], notes: ['C6'], duration: 0.4 });
}

function playMoveSound() {
  playSequence({ waveforms: ['square'], notes: ['B4'], duration: 0.15 });
}

function playRotateSound() {
  playSequence({ waveforms: ['triangle'], notes: ['A4', 'C5'], duration: 0.2 });
}

function playDropSound() {
  playSequence({ waveforms: ['triangle', 'noise'], notes: ['C4'], duration: 0.3 });
}

function playBigClearSound() {
  playSequence({ waveforms: ['sawtooth', 'square'], notes: ['C5', 'E5', 'G5', 'C6'], duration: 0.6 });
}

function playSuccessSound() {
  playSequence({ waveforms: ['square', 'triangle'], notes: ['C5', 'G5', 'C6'], duration: 0.45 });
}


function initAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
document.addEventListener('keydown', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });

const gridWidth = 10;
const gridHeight = 18;

// Create grid cells in the DOM
for (let y = 0; y < gridHeight; y++) {
  for (let x = 0; x < gridWidth; x++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.x = x;
    cell.dataset.y = y;
    gridElement.appendChild(cell);
  }
}

// Create 2D grid array
let grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));

// base fruit set
const baseFruits = ['🥥', '🍌', '🍇', '🍊', '🍏', '🍒'];
let fruitTypes = baseFruits.slice(0, 4); // standard difficulty default
const skullEmoji = '⛑️';
const specialTypes = ['💣', '🔫', '🏹', skullEmoji, '💩', '🤡', '🔥', '❄️'];

let nextSpecialTime = 30 + Math.random() * 15; // seconds until first special

function availableSpecials() {
  const list = ['💣', '🔫', '🏹', skullEmoji];
  if (level > 2) list.push('💩');
  if (level > 3) list.push('🤡');
  if (level > 4) list.push('🔥');
  if (level > 5) list.push('❄️');
  return list;
}

function chooseSpecial() {
  const specials = availableSpecials();
  const skullChance = Math.min(0.3 + (level - 1) * 0.05, 0.8);
  if (Math.random() < skullChance) return skullEmoji;
  const pool = specials.filter(s => s !== skullEmoji);
  const weights = pool.map(s => {
    if (s === '💩') return Math.max(1, level - 1);
    if (s === '🤡') return Math.max(1, level - 2);
    if (s === '🔥') return Math.max(1, level - 3);
    if (s === '❄️') return Math.max(1, level - 4);
    return 2;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    if (r < weights[i]) return pool[i];
    r -= weights[i];
  }
  return pool[0];
}

let currentColumn = null; // array of 3 fruits
let columnX = 0;
let columnY = 0; // top cell index of the falling column

let isClearing = false; // flag while matches are being removed
let lastDrop = 0;
let startTime = null;
let score = 0;
let level = 1;
let gameOver = false;
let fallProgress = 0; // fraction between drops for smooth animation
let prevColumnCells = [];
const skullTimers = new Map();
const poopTimers = new Map();
const freezeTimers = new Map();

const startInterval = 1000; // ms
const minInterval = 100; // ms

function randomFruit() {
  const index = Math.floor(Math.random() * fruitTypes.length);
  return fruitTypes[index];
}

function spawnColumn(elapsed = 0) {
  currentColumn = [randomFruit(), randomFruit(), randomFruit()];
  // insert special power if it's time
  if (elapsed >= nextSpecialTime) {
    const idx = Math.floor(Math.random() * 3);
    currentColumn[idx] = chooseSpecial();
    scheduleNextSpecial(elapsed, computeDropInterval(level));
  }
  // keep using the previous column position
  if (columnX < 0 || columnX >= gridWidth) {
    columnX = Math.floor(gridWidth / 2);
  }
  // start just above the grid so the top fruit appears immediately
  columnY = -1;
  // reset drop timer so new column begins falling immediately
  lastDrop = performance.now();
  for (let i = 0; i < 3; i++) {
    const y = i;
    if (grid[y][columnX]) {
      endGame();
      currentColumn = null;
      return;
    }
  }
  console.log('New column:', currentColumn.join(' '));
}

function updateCell(x, y, emoji) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (cell) {
    cell.textContent = emoji || '';
  }
}

function renderGrid() {
  // clear previous column transforms
  prevColumnCells.forEach(({ x, y }) => {
    const c = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (c) c.style.transform = '';
  });
  prevColumnCells = [];

  const cellSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--cell-size')
  );
  const offset = fallProgress * cellSize; // pixel offset for smooth fall

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      updateCell(x, y, grid[y][x]);
    }
  }
  if (currentColumn) {
    for (let i = 0; i < 3; i++) {
      const y = columnY + i;
      if (y >= 0 && y < gridHeight) {
        updateCell(columnX, y, currentColumn[i]);
        const cell = document.querySelector(
          `.cell[data-x="${columnX}"][data-y="${y}"]`
        );
        if (cell) {
          cell.style.transform = `translateY(${offset}px)`;
          prevColumnCells.push({ x: columnX, y });
        }
      }
    }
  }
}

function canMoveDown() {
  const bottom = columnY + 2;
  if (bottom + 1 >= gridHeight) return false;
  if (bottom >= 0 && grid[bottom + 1][columnX]) return false;
  return true;
}

function canMoveLeft() {
  if (columnX - 1 < 0) return false;
  for (let i = 0; i < 3; i++) {
    const y = columnY + i;
    if (y >= 0 && grid[y][columnX - 1]) return false;
  }
  return true;
}

function canMoveRight() {
  if (columnX + 1 >= gridWidth) return false;
  for (let i = 0; i < 3; i++) {
    const y = columnY + i;
    if (y >= 0 && grid[y][columnX + 1]) return false;
  }
  return true;
}

function rotateColumn() {
  // bottom fruit moves to the top
  const [top, middle, bottom] = currentColumn;
  currentColumn = [bottom, top, middle];
}

function findMatches() {
  const matches = new Set();
  const dirs = [
    [1, 0], // horizontal
    [0, 1], // vertical
    [1, 1], // diagonal down-right
    [1, -1] // diagonal up-right
  ];

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const fruit = grid[y][x];
      if (!fruit || fruit === skullEmoji) continue;

      for (const [dx, dy] of dirs) {
        const prevX = x - dx;
        const prevY = y - dy;
        if (
          prevX >= 0 &&
          prevX < gridWidth &&
          prevY >= 0 &&
          prevY < gridHeight &&
          grid[prevY][prevX] === fruit
        ) {
          continue; // not the start of a chain
        }

        let nx = x;
        let ny = y;
        const cells = [];
        while (
          nx >= 0 &&
          nx < gridWidth &&
          ny >= 0 &&
          ny < gridHeight &&
          grid[ny][nx] === fruit
        ) {
          cells.push(`${nx},${ny}`);
          nx += dx;
          ny += dy;
        }

        if (cells.length >= 3) {
          cells.forEach(c => matches.add(c));
        }
      }
    }
  }

  return Array.from(matches).map(str => {
    const [x, y] = str.split(',').map(Number);
    return { x, y };
  });
}

function applyGravity() {
  for (let x = 0; x < gridWidth; x++) {
    for (let y = gridHeight - 1; y >= 0; y--) {
      if (!grid[y][x]) {
        let above = y - 1;
        while (above >= 0 && !grid[above][x]) {
          above--;
        }
        if (above >= 0) {
          grid[y][x] = grid[above][x];
          grid[above][x] = null;
        }
      }
    }
  }
}

function computeLevel(value) {
  if (value < 50) return 1;
  if (value < 125) return 2;
  let lvl = 3;
  let threshold = 125;
  while (value >= threshold * 2) {
    threshold *= 2;
    lvl++;
  }
  return lvl;
}

function updateLevel() {
  const newLevel = computeLevel(score);
  if (newLevel > level) {
    level = newLevel;
    levelDisplay.textContent = `Level ${level}`;
    handleLevelUp();
  } else {
    level = newLevel;
    levelDisplay.textContent = `Level ${level}`;
  }
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
  if (scoreTopDisplay) scoreTopDisplay.textContent = `Score: ${score}`;
  updateLevel();
}

function bigClearCelebration(count) {
  // award additional bonus points for large clears
  const bonus = Math.floor((count / 3) * count);
  score += bonus;
  scoreDisplay.textContent = `Score: ${score}`;
  if (scoreTopDisplay) scoreTopDisplay.textContent = `Score: ${score}`;
  updateLevel();
  scoreDisplay.classList.add('flash');
  setTimeout(() => {
    scoreDisplay.classList.remove('flash');
  }, 600);
  playBigClearSound();
}

function clearBoard() {
  grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));
  currentColumn = null;
  columnX = 0;
  columnY = 0;
  isClearing = false;
  skullTimers.forEach(t => {
    clearTimeout(t[0]);
    clearTimeout(t[1]);
  });
  skullTimers.clear();
  poopTimers.forEach(t => {
    clearTimeout(t[0]);
    clearTimeout(t[1]);
  });
  poopTimers.clear();
  freezeTimers.forEach(t => {
    clearTimeout(t[0]);
    clearTimeout(t[1]);
  });
  freezeTimers.clear();
  document.querySelectorAll('.cell.blink').forEach(c => c.classList.remove('blink'));
  renderGrid();
}

function handleLevelUp() {
  playSuccessSound();
  if (levelUpDisplay) {
    levelUpDisplay.textContent = `Level ${level}`;
    levelUpDisplay.style.display = 'block';
    setTimeout(() => {
      levelUpDisplay.style.display = 'none';
    }, 1000);
  }
}

function updateTime(elapsed) {
  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(elapsed % 60)
    .toString()
    .padStart(2, '0');
  timeDisplay.textContent = `${minutes}:${seconds}`;
}

function computeDropInterval(lvl) {
  return Math.max(minInterval, startInterval - (lvl - 1) * 100);
}

function setDifficulty(level) {
  const counts = { easy: 3, standard: 4, hard: 5 };
  fruitTypes = baseFruits.slice(0, counts[level] || 4);
  cleanDisallowedFruits();
}

function cleanDisallowedFruits() {
  const allowed = new Set([...fruitTypes, ...specialTypes]);
  let changed = false;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] && !allowed.has(grid[y][x])) {
        grid[y][x] = null;
        changed = true;
      }
    }
  }
  if (currentColumn) {
    for (let i = 0; i < 3; i++) {
      if (currentColumn[i] && !allowed.has(currentColumn[i])) {
        currentColumn[i] = randomFruit();
      }
    }
  }
  if (changed) {
    applyGravity();
    renderGrid();
  }
}

function scheduleNextSpecial(elapsed, dropInterval) {
  const base = 30 + Math.random() * 15; // 30-45 seconds
  const factor = dropInterval / startInterval;
  const interval = Math.max(5, base * factor);
  nextSpecialTime = elapsed + interval;
}

function scheduleSkull(x, y) {
  const key = `${x},${y}`;
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  const flashTimeout = setTimeout(() => {
    if (cell) cell.classList.add('blink');
  }, 50000);
  const removeTimeout = setTimeout(() => {
    if (cell) cell.classList.remove('blink');
    if (grid[y][x] === skullEmoji) {
      grid[y][x] = null;
      applyGravity();
      renderGrid();
      setTimeout(processMatches, 200);
    }
    skullTimers.delete(key);
  }, 60000);
  skullTimers.set(key, [flashTimeout, removeTimeout]);
}

function schedulePoop(x, y) {
  const key = `${x},${y}`;
  const affected = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;
      if (dx === 0 && dy === 0) continue;
      const emoji = grid[ny][nx];
      if (emoji && !specialTypes.includes(emoji)) {
        affected.push({ x: nx, y: ny, emoji });
        grid[ny][nx] = '💩';
      }
    }
  }
  grid[y][x] = '💩';
  renderGrid();
  const cells = [{ x, y }, ...affected];
  const flashTimeout = setTimeout(() => {
    cells.forEach(c => {
      const el = document.querySelector(`.cell[data-x="${c.x}"][data-y="${c.y}"]`);
      if (el) el.classList.add('blink');
    });
  }, 50000);
  const removeTimeout = setTimeout(() => {
    cells.forEach(c => {
      const el = document.querySelector(`.cell[data-x="${c.x}"][data-y="${c.y}"]`);
      if (el) el.classList.remove('blink');
    });
    if (grid[y][x] === '💩') grid[y][x] = null;
    affected.forEach(({ x: ax, y: ay, emoji }) => {
      if (grid[ay][ax] === '💩') grid[ay][ax] = emoji;
    });
    applyGravity();
    renderGrid();
    setTimeout(processMatches, 200);
    poopTimers.delete(key);
  }, 60000);
  poopTimers.set(key, [flashTimeout, removeTimeout]);
}

function handleClown(x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;
      if (dx === 0 && dy === 0) continue;
      if (grid[ny][nx] && !specialTypes.includes(grid[ny][nx])) {
        let nf = randomFruit();
        while (nf === grid[ny][nx]) nf = randomFruit();
        grid[ny][nx] = nf;
      }
    }
  }
  let nf = randomFruit();
  grid[y][x] = nf;
  renderGrid();
  setTimeout(processMatches, 200);
}

function handleFire(x, y) {
  const cells = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;
      if (grid[ny][nx] && !specialTypes.includes(grid[ny][nx])) {
        cells.push({ x: nx, y: ny });
      }
    }
  }
  cells.push({ x, y });
  cells.forEach(c => {
    grid[c.y][c.x] = null;
  });
  applyGravity();
  renderGrid();
  setTimeout(processMatches, 200);
}

function scheduleFreeze(x, y) {
  const key = `${x},${y}`;
  const coords = [];
  for (let yy = y; yy < gridHeight; yy++) {
    for (let xx = 0; xx < gridWidth; xx++) {
      coords.push({ x: xx, y: yy });
      grid[yy][xx] = '🧊';
    }
  }
  renderGrid();
  const flashTimeout = setTimeout(() => {
    coords.forEach(c => {
      const el = document.querySelector(`.cell[data-x="${c.x}"][data-y="${c.y}"]`);
      if (el) el.classList.add('blink');
    });
  }, 50000);
  const removeTimeout = setTimeout(() => {
    coords.forEach(c => {
      const el = document.querySelector(`.cell[data-x="${c.x}"][data-y="${c.y}"]`);
      if (el) el.classList.remove('blink');
      if (grid[c.y][c.x] === '🧊') grid[c.y][c.x] = null;
    });
    applyGravity();
    renderGrid();
    setTimeout(processMatches, 200);
    freezeTimers.delete(key);
  }, 60000);
  freezeTimers.set(key, [flashTimeout, removeTimeout]);
}

function handleSpecial(x, y, emoji) {
  const cells = [];
  if (emoji === '💣') {
    // collect all fruit matching the one below the bomb
    const below = y + 1;
    if (below < gridHeight) {
      const target = grid[below][x];
      if (target && !specialTypes.includes(target)) {
        for (let yy = 0; yy < gridHeight; yy++) {
          for (let xx = 0; xx < gridWidth; xx++) {
            if (grid[yy][xx] === target) {
              cells.push({ x: xx, y: yy });
            }
          }
        }
      }
    }
  } else if (emoji === '🔫') {
    // Gun now fires to the left instead of the right
    for (let xx = x - 1; xx >= 0; xx--) {
      if (grid[y][xx] && grid[y][xx] !== skullEmoji) cells.push({ x: xx, y });
    }
  } else if (emoji === '🏹') {
    let sx = x + 1;
    let sy = y - 1;
    while (sx < gridWidth && sy >= 0) {
      if (grid[sy][sx] && grid[sy][sx] !== skullEmoji) cells.push({ x: sx, y: sy });
      sx++;
      sy--;
    }
  }
  if (emoji !== skullEmoji) cells.push({ x, y });
  return cells;
}

function resolveSpecialClears(cells) {
  if (cells.length === 0) {
    applyGravity();
    processMatches();
    return;
  }

  // remove duplicate coordinates
  const unique = [];
  const seen = new Set();
  cells.forEach(c => {
    const key = `${c.x},${c.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  });

  isClearing = true;
  const clearEmoji = unique.length > 6 ? '☄️' : '💥';
  unique.forEach(({ x, y }) => {
    grid[y][x] = clearEmoji;
  });
  renderGrid();

  // show explosion then remove fruits and score
  setTimeout(() => {
    unique.forEach(({ x, y }) => {
      grid[y][x] = null;
    });
    const count = unique.length;
    const basePoints = Math.floor((count / 3) * count);
    score += basePoints;
    updateScore();
    if (count > 6) {
      bigClearCelebration(count);
    } else {
      playDestroySound();
    }
    applyGravity();
    renderGrid();
    setTimeout(processMatches, 200);
  }, 200);
}

function endGame() {
  gameOver = true;
  gameOverDisplay.style.display = 'block';
  playGameOverSound();
}

function restartGame() {
  grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));
  currentColumn = null;
  columnX = 0;
  columnY = 0;
  isClearing = false;
  skullTimers.forEach(t => {
    clearTimeout(t[0]);
    clearTimeout(t[1]);
  });
  skullTimers.clear();
  poopTimers.forEach(t => {
    clearTimeout(t[0]);
    clearTimeout(t[1]);
  });
  poopTimers.clear();
  freezeTimers.forEach(t => {
    clearTimeout(t[0]);
    clearTimeout(t[1]);
  });
  freezeTimers.clear();
  document.querySelectorAll('.cell.blink').forEach(c => c.classList.remove('blink'));
  startTime = null;
  score = 0;
  level = 1;
  nextSpecialTime = 30 + Math.random() * 15;
  updateScore();
  updateTime(0);
  gameOver = false;
  gameOverDisplay.style.display = 'none';
  if (levelUpDisplay) levelUpDisplay.style.display = 'none';
  const selected = document.querySelector('input[name="difficulty"]:checked');
  if (selected) setDifficulty(selected.value);
  spawnColumn(0);
  renderGrid();
  requestAnimationFrame(update);
}

function processMatches() {
  const matches = findMatches();
  if (matches.length === 0) {
    isClearing = false;
    return;
  }

  isClearing = true;
  console.log('Match found:', matches.length, 'cells');
  const clearEmoji = matches.length > 6 ? '☄️' : '💥';
  matches.forEach(({ x, y }) => {
    grid[y][x] = clearEmoji;
  });
  renderGrid();

  setTimeout(() => {
    matches.forEach(({ x, y }) => {
      grid[y][x] = null;
    });
    const matchedCount = matches.length;
    const basePoints = Math.floor((matchedCount / 3) * matchedCount);
    score += basePoints;
    updateScore();
    if (matchedCount > 6) {
      bigClearCelebration(matchedCount);
    } else {
      playMatchSound();
    }
    applyGravity();
    renderGrid();
    setTimeout(processMatches, 200);
  }, 200);
}

function hardDrop() {
  while (canMoveDown()) {
    columnY++;
  }
  lockColumn();
}

function handleKey(e) {
  let handled = false;
  const blockKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'];
  if (blockKeys.includes(e.code)) e.preventDefault();
  if (e.code === 'KeyR') {
    playRestartSound();
    restartGame();
    handled = true;
  }
  if (!currentColumn) {
    return;
  }
  
  switch (e.code) {
    case 'ArrowLeft':
      if (canMoveLeft()) {
        columnX--;
        playMoveSound();
      }
      handled = true;
      break;
    case 'ArrowRight':
      if (canMoveRight()) {
        columnX++;
        playMoveSound();
      }
      handled = true;
      break;
    case 'ArrowDown':
      playDropSound();
      hardDrop();
      handled = true;
      break;
    case 'Space':
      rotateColumn();
      playRotateSound();
      handled = true;
      break;
  }
  if (handled) {
    e.preventDefault();
    renderGrid();
  }
}

function handleTouch(e) {
  const action = e.target.dataset.action;
  if (!currentColumn || !action) return;
  e.preventDefault();
  switch (action) {
    case 'left':
      if (canMoveLeft()) {
        columnX--;
        playMoveSound();
      }
      break;
    case 'right':
      if (canMoveRight()) {
        columnX++;
        playMoveSound();
      }
      break;
    case 'drop':
      playDropSound();
      hardDrop();
      break;
    case 'rotate':
      rotateColumn();
      playRotateSound();
      break;
  }
  renderGrid();
}

function onGridTouchStart(e) {
  if (!currentColumn) return;
  const t = e.touches[0];
  startTouchX = t.clientX;
  startTouchY = t.clientY;
  e.preventDefault();
}

function onGridTouchEnd(e) {
  if (!currentColumn) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - startTouchX;
  const dy = t.clientY - startTouchY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 30;

  if (absX > absY && absX > threshold) {
    let moved = false;
    if (dx > 0 && canMoveRight()) {
      columnX++;
      moved = true;
    }
    if (dx < 0 && canMoveLeft()) {
      columnX--;
      moved = true;
    }
    if (moved) playMoveSound();
  } else if (absY > absX && dy > threshold) {
    playDropSound();
    hardDrop();
  } else {
    const rect = gridElement.getBoundingClientRect();
    const cellSize = rect.width / gridWidth;
    const tapX = Math.floor((t.clientX - rect.left) / cellSize);
    const tapY = Math.floor((t.clientY - rect.top) / cellSize);
    let moved = false;
    if (tapX === columnX && tapY >= columnY && tapY <= columnY + 2) {
      rotateColumn();
      playRotateSound();
    } else if (tapX < columnX && canMoveLeft()) {
      columnX--;
      moved = true;
    } else if (tapX > columnX && canMoveRight()) {
      columnX++;
      moved = true;
    }
    if (moved) playMoveSound();
  }
  renderGrid();
}

function lockColumn() {
  let outOfBounds = false;
  const specials = [];
  for (let i = 0; i < 3; i++) {
    const y = columnY + i;
    if (y < 0) {
      outOfBounds = true;
    } else if (y < gridHeight) {
      grid[y][columnX] = currentColumn[i];
      if (specialTypes.includes(currentColumn[i])) {
        specials.push({ x: columnX, y, emoji: currentColumn[i] });
      }
      const cell = document.querySelector(
        `.cell[data-x="${columnX}"][data-y="${y}"]`
      );
      if (cell) cell.style.transform = '';
    }
  }
  currentColumn = null;
  fallProgress = 0;
  if (outOfBounds) {
    endGame();
  } else {
    const cleared = [];
    specials.forEach(s => {
      switch (s.emoji) {
        case skullEmoji:
          scheduleSkull(s.x, s.y);
          break;
        case '💩':
          schedulePoop(s.x, s.y);
          break;
        case '🤡':
          handleClown(s.x, s.y);
          break;
        case '🔥':
          handleFire(s.x, s.y);
          break;
        case '❄️':
          scheduleFreeze(s.x, s.y);
          break;
        default:
          cleared.push(...handleSpecial(s.x, s.y, s.emoji));
      }
    });
    if (cleared.length) {
      resolveSpecialClears(cleared);
    } else {
      applyGravity();
      renderGrid();
      setTimeout(processMatches, 200);
    }
  }
}

function update(timestamp) {
  if (!startTime) startTime = timestamp;
  if (gameOver) return;

  const elapsed = (timestamp - startTime) / 1000;
  updateTime(elapsed);

  if (!currentColumn && !isClearing) {
    spawnColumn(elapsed);
  }

  const interval = computeDropInterval(level);
  fallProgress = Math.min((timestamp - lastDrop) / interval, 1);
  if (timestamp - lastDrop > interval) {
    if (currentColumn && canMoveDown()) {
      columnY++;
    } else if (currentColumn) {
      lockColumn();
    }
    lastDrop = timestamp;
    fallProgress = 0;
  }

  renderGrid();
  requestAnimationFrame(update);
}

restartButton.addEventListener('click', () => {
  playRestartSound();
  restartGame();
});
document.addEventListener('keydown', handleKey);
if (touchControls) {
  touchControls.addEventListener('click', handleTouch);
  touchControls.addEventListener('touchstart', handleTouch);
}

gridElement.addEventListener('touchstart', onGridTouchStart, { passive: false });
gridElement.addEventListener('touchend', onGridTouchEnd);

difficultyRadios.forEach(r =>
  r.addEventListener('change', () => {
    if (r.checked) setDifficulty(r.value);
  })
);

restartGame();
