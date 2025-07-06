// DOM references
const gridElement = document.getElementById('grid');

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

const fruitTypes = ['🍓', '🍌', '🍇', '🍍', '🍎', '🍒'];

let currentColumn = null; // array of 3 fruits
let columnX = 0;
let columnY = 0; // top cell index of the falling column

let lastDrop = 0;
const dropInterval = 1000; // ms

function randomFruit() {
  const index = Math.floor(Math.random() * fruitTypes.length);
  return fruitTypes[index];
}

function spawnColumn() {
  currentColumn = [randomFruit(), randomFruit(), randomFruit()];
  // spawn in a random column within the grid
  columnX = Math.floor(Math.random() * gridWidth);
  // start just above the grid so the top fruit appears immediately
  columnY = -1;
  console.log('New column:', currentColumn.join(' '));
}

function updateCell(x, y, emoji) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (cell) {
    cell.textContent = emoji || '';
  }
}

function renderGrid() {
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

function lockColumn() {
  for (let i = 0; i < 3; i++) {
    const y = columnY + i;
    if (y >= 0 && y < gridHeight) {
      grid[y][columnX] = currentColumn[i];
    }
  }
  currentColumn = null;
}

function update(timestamp) {
  if (!currentColumn) {
    spawnColumn();
  }
  if (timestamp - lastDrop > dropInterval) {
    if (canMoveDown()) {
      columnY++;
    } else {
      lockColumn();
    }
    lastDrop = timestamp;
  }
  renderGrid();
  requestAnimationFrame(update);
}

spawnColumn();
document.addEventListener('keydown', handleKey);
requestAnimationFrame(update);
