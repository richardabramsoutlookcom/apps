const rows = 6;
const cols = 7;
let board = [];
let currentPlayer = 1;
let gameOver = false;

const boardEl = document.getElementById("board");
const buttonsEl = document.getElementById("column-buttons");
const statusEl = document.getElementById("status");
const resetEl = document.getElementById("reset");

function buildBoard() {
  boardEl.innerHTML = "";
  buttonsEl.innerHTML = "";

  for (let c = 0; c < cols; c += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Drop";
    button.dataset.col = c;
    button.addEventListener("click", () => handleDrop(c));
    buttonsEl.appendChild(button);
  }

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      boardEl.appendChild(cell);
    }
  }
}

function resetGame() {
  board = Array.from({ length: rows }, () => Array(cols).fill(0));
  currentPlayer = 1;
  gameOver = false;
  buildBoard();
  updateStatus("Player 1: Red");
}

function updateStatus(text) {
  statusEl.textContent = text;
}

function handleDrop(col) {
  if (gameOver) return;

  let placedRow = -1;
  for (let r = rows - 1; r >= 0; r -= 1) {
    if (board[r][col] === 0) {
      board[r][col] = currentPlayer;
      placedRow = r;
      break;
    }
  }

  if (placedRow === -1) return;

  renderToken(placedRow, col, currentPlayer);

  if (checkWin(placedRow, col, currentPlayer)) {
    gameOver = true;
    updateStatus(`Player ${currentPlayer} wins!`);
    disableButtons();
    return;
  }

  if (isDraw()) {
    gameOver = true;
    updateStatus("Draw game!");
    disableButtons();
    return;
  }

  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateStatus(currentPlayer === 1 ? "Player 1: Red" : "Player 2: Yellow");
}

function renderToken(row, col, player) {
  const cell = boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  const token = document.createElement("div");
  token.className = `token player-${player}`;
  cell.appendChild(token);
  requestAnimationFrame(() => token.classList.add("drop"));
}

function checkWin(row, col, player) {
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
  ];

  return directions.some(({ dr, dc }) => {
    let count = 1;

    count += countInDirection(row, col, player, dr, dc);
    count += countInDirection(row, col, player, -dr, -dc);

    return count >= 4;
  });
}

function countInDirection(row, col, player, dr, dc) {
  let r = row + dr;
  let c = col + dc;
  let count = 0;

  while (r >= 0 && r < rows && c >= 0 && c < cols) {
    if (board[r][c] !== player) break;
    count += 1;
    r += dr;
    c += dc;
  }

  return count;
}

function isDraw() {
  return board.every((row) => row.every((cell) => cell !== 0));
}

function disableButtons() {
  buttonsEl.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
}

resetEl.addEventListener("click", resetGame);

resetGame();
