// DOM references
const gridElement = document.getElementById('grid');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const gameOverDisplay = document.getElementById('gameOver');
const touchControls = document.getElementById('touchControls');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');

let startTouchX = 0;
let startTouchY = 0;

const gridWidth = 10;
const gridHeight = 20;

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

const baseFruits = ['🍓', '🍌', '🍇', '🍍', '🍎', '🍒'];
let fruitTypes = baseFruits.slice(0, 4); // standard difficulty default
const specialTypes = ['💣', '🔫', '🏹'];

let nextSpecialTime = 30 + Math.random() * 15; // seconds until first special

let currentColumn = null; // array of 3 fruits
let columnX = 0;
let columnY = 0; // top cell index of the falling column

let isClearing = false; // flag while matches are being removed
let lastDrop = 0;
let startTime = null;
let score = 0;
let gameOver = false;

const startInterval = 1000; // ms
const minInterval = 100; // ms
// Adjust curve so the game speeds up faster
const curveK = 0.05;
const curveMid = 90; // seconds (midpoint occurs after 1.5 minutes)

function randomFruit() {
  const index = Math.floor(Math.random() * fruitTypes.length);
  return fruitTypes[index];
}

function spawnColumn(elapsed = 0) {
  currentColumn = [randomFruit(), randomFruit(), randomFruit()];
  // insert special power if it's time
  if (elapsed >= nextSpecialTime) {
    const idx = Math.floor(Math.random() * 3);
    const special = specialTypes[Math.floor(Math.random() * specialTypes.length)];
    currentColumn[idx] = special;
    scheduleNextSpecial(elapsed, computeDropInterval(elapsed));
  }
  // spawn in a random column within the grid
  columnX = Math.floor(Math.random() * gridWidth);
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
  // clear existing column highlights
  document.querySelectorAll('.cell.highlight').forEach(c => {
    c.classList.remove('highlight');
  });

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
      }
    }
    // highlight the entire column
    for (let y = 0; y < gridHeight; y++) {
      const cell = document.querySelector(
        `.cell[data-x="${columnX}"][data-y="${y}"]`
      );
      if (cell) cell.classList.add('highlight');
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
      if (!fruit) continue;

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

function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
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

function computeDropInterval(elapsed) {
  const factor = 1 / (1 + Math.exp(-curveK * (elapsed - curveMid)));
  return minInterval + (startInterval - minInterval) * (1 - factor);
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
      if (grid[y][xx]) cells.push({ x: xx, y });
    }
  } else if (emoji === '🏹') {
    let sx = x - 1;
    let sy = y - 1;
    while (sx >= 0 && sy >= 0) {
      if (grid[sy][sx]) cells.push({ x: sx, y: sy });
      sx--;
      sy--;
    }
  }
  cells.push({ x, y });
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
  unique.forEach(({ x, y }) => {
    grid[y][x] = '💥';
  });
  renderGrid();

  // show explosion then remove fruits and score
  setTimeout(() => {
    unique.forEach(({ x, y }) => {
      grid[y][x] = null;
    });
    const count = unique.length;
    score += Math.floor((count / 3) * count);
    updateScore();
    applyGravity();
    renderGrid();
    setTimeout(processMatches, 200);
  }, 200);
}

function endGame() {
  gameOver = true;
  gameOverDisplay.style.display = 'block';
}

function processMatches() {
  const matches = findMatches();
  if (matches.length === 0) {
    isClearing = false;
    return;
  }

  isClearing = true;
  console.log('Match found:', matches.length, 'cells');
  matches.forEach(({ x, y }) => {
    grid[y][x] = '💥';
  });
  renderGrid();

  setTimeout(() => {
    matches.forEach(({ x, y }) => {
      grid[y][x] = null;
    });
    const matchedCount = matches.length;
    score += Math.floor((matchedCount / 3) * matchedCount);
    updateScore();
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
  if (!currentColumn) return;
  let handled = false;
  switch (e.code) {
    case 'ArrowLeft':
      if (canMoveLeft()) columnX--;
      handled = true;
      break;
    case 'ArrowRight':
      if (canMoveRight()) columnX++;
      handled = true;
      break;
    case 'ArrowDown':
      hardDrop();
      handled = true;
      break;
    case 'Space':
      rotateColumn();
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
      if (canMoveLeft()) columnX--;
      break;
    case 'right':
      if (canMoveRight()) columnX++;
      break;
    case 'drop':
      hardDrop();
      break;
    case 'rotate':
      rotateColumn();
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
    if (dx > 0 && canMoveRight()) columnX++;
    if (dx < 0 && canMoveLeft()) columnX--;
  } else if (absY > absX && dy > threshold) {
    hardDrop();
  } else {
    const rect = gridElement.getBoundingClientRect();
    const cellSize = rect.width / gridWidth;
    const tapX = Math.floor((t.clientX - rect.left) / cellSize);
    const tapY = Math.floor((t.clientY - rect.top) / cellSize);
    if (tapX === columnX && tapY >= columnY && tapY <= columnY + 2) {
      rotateColumn();
    } else if (tapX < columnX && canMoveLeft()) {
      columnX--;
    } else if (tapX > columnX && canMoveRight()) {
      columnX++;
    }
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
    }
  }
  currentColumn = null;
  if (outOfBounds) {
    endGame();
  } else {
    const cleared = [];
    specials.forEach(s => {
      cleared.push(...handleSpecial(s.x, s.y, s.emoji));
    });
    resolveSpecialClears(cleared);
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

  const interval = computeDropInterval(elapsed);
  if (timestamp - lastDrop > interval) {
    if (currentColumn && canMoveDown()) {
      columnY++;
    } else if (currentColumn) {
      lockColumn();
    }
    lastDrop = timestamp;
  }

  renderGrid();
  requestAnimationFrame(update);
}

setDifficulty('standard');
updateScore();
updateTime(0);
spawnColumn(0);
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

requestAnimationFrame(update);
