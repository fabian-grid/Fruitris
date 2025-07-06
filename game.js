// DOM references
const gridElement = document.getElementById('grid');
const cells = document.querySelectorAll('.cell');

const gridWidth = 10;
const gridHeight = 20;

// Create 2D grid array
let grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));

const fruitTypes = ['🍓', '🍌', '🍇', '🍍', '🍎', '🍒'];

let currentColumn = null; // array of 3 fruits
let columnX = 0;
let columnY = 0; // top position of column

let lastDrop = 0;
const dropInterval = 1000; // ms

function randomFruit() {
  const index = Math.floor(Math.random() * fruitTypes.length);
  return fruitTypes[index];
}

function spawnColumn() {
  currentColumn = [randomFruit(), randomFruit(), randomFruit()];
  columnX = Math.floor(gridWidth / 2);
  columnY = -3; // start above the grid
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

requestAnimationFrame(update);
