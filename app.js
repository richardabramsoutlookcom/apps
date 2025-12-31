const rows = 6;
const cols = 7;
const humanPlayer = 1;
const aiPlayer = 2;
let board = [];
let currentPlayer = humanPlayer;
let gameOver = false;
let aiThinking = false;
let aiDifficulty = 3;
let audioCtx = null;
let aiTimeoutId = null;

const boardEl = document.getElementById("board");
const buttonsEl = document.getElementById("column-buttons");
const statusEl = document.getElementById("status");
const resetEl = document.getElementById("reset");
const difficultyEl = document.getElementById("difficulty");

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
  currentPlayer = humanPlayer;
  gameOver = false;
  aiThinking = false;
  if (aiTimeoutId) {
    clearTimeout(aiTimeoutId);
    aiTimeoutId = null;
  }
  boardEl.classList.remove("celebrate", "defeat");
  buildBoard();
  updateStatus("Your turn · Red");
  enableButtons();
}

function updateStatus(text) {
  statusEl.textContent = text;
}

function handleDrop(col) {
  if (gameOver || aiThinking || currentPlayer !== humanPlayer) return;

  const placedRow = applyMove(col, humanPlayer);
  if (placedRow === -1) return;

  const winningLine = getWinningLine(board, placedRow, col, humanPlayer);
  if (winningLine) {
    gameOver = true;
    updateStatus("You win!");
    applyWinEffects(winningLine, humanPlayer);
    disableButtons();
    playWinSound();
    return;
  }

  if (isDraw()) {
    gameOver = true;
    updateStatus("Draw game!");
    disableButtons();
    playDrawSound();
    return;
  }

  currentPlayer = aiPlayer;
  aiThinking = true;
  updateStatus("Computer thinking...");
  disableButtons();
  aiTimeoutId = setTimeout(computerMove, 450);
}

function computerMove() {
  aiTimeoutId = null;
  if (gameOver) return;
  const col = getAIMove();
  if (col === null) {
    gameOver = true;
    updateStatus("Draw game!");
    disableButtons();
    playDrawSound();
    return;
  }

  const placedRow = applyMove(col, aiPlayer);
  const winningLine = getWinningLine(board, placedRow, col, aiPlayer);
  if (winningLine) {
    gameOver = true;
    updateStatus("Computer wins!");
    applyWinEffects(winningLine, aiPlayer);
    disableButtons();
    playLoseSound();
    return;
  }

  if (isDraw()) {
    gameOver = true;
    updateStatus("Draw game!");
    disableButtons();
    playDrawSound();
    return;
  }

  currentPlayer = humanPlayer;
  aiThinking = false;
  updateStatus("Your turn · Red");
  enableButtons();
}

function applyMove(col, player) {
  const row = getNextOpenRow(board, col);
  if (row === -1) return -1;
  board[row][col] = player;
  renderToken(row, col, player);
  triggerImpact(row, col);
  playDropSound();
  return row;
}

function renderToken(row, col, player) {
  const cell = boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  const token = document.createElement("div");
  token.className = `token player-${player}`;
  cell.appendChild(token);
  requestAnimationFrame(() => token.classList.add("drop"));
}

function triggerImpact(row, col) {
  const cell = boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  cell.classList.add("impact");
  setTimeout(() => cell.classList.remove("impact"), 350);
  for (let i = 0; i < 3; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${20 + Math.random() * 60}%`;
    spark.style.top = `${20 + Math.random() * 60}%`;
    cell.appendChild(spark);
    setTimeout(() => spark.remove(), 700);
  }
}

function getNextOpenRow(localBoard, col) {
  for (let r = rows - 1; r >= 0; r -= 1) {
    if (localBoard[r][col] === 0) return r;
  }
  return -1;
}

function getWinningLine(localBoard, row, col, player) {
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
  ];

  for (const { dr, dc } of directions) {
    const forward = collectLine(localBoard, row, col, player, dr, dc);
    const backward = collectLine(localBoard, row, col, player, -dr, -dc);
    const line = [...backward.reverse(), [row, col], ...forward];
    if (line.length >= 4) return line;
  }

  return null;
}

function collectLine(localBoard, row, col, player, dr, dc) {
  const cells = [];
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < rows && c >= 0 && c < cols) {
    if (localBoard[r][c] !== player) break;
    cells.push([r, c]);
    r += dr;
    c += dc;
  }
  return cells;
}

function applyWinEffects(line, player) {
  boardEl.classList.add(player === humanPlayer ? "celebrate" : "defeat");
  line.forEach(([r, c]) => {
    const cell = boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (!cell) return;
    const token = cell.querySelector(".token");
    if (token) token.classList.add("win");
    for (let i = 0; i < 4; i += 1) {
      const spark = document.createElement("span");
      spark.className = "spark";
      spark.style.left = `${10 + Math.random() * 80}%`;
      spark.style.top = `${10 + Math.random() * 80}%`;
      cell.appendChild(spark);
      setTimeout(() => spark.remove(), 900);
    }
  });
}

function isDraw() {
  return board.every((row) => row.every((cell) => cell !== 0));
}

function disableButtons() {
  buttonsEl.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
}

function enableButtons() {
  buttonsEl.querySelectorAll("button").forEach((button) => {
    button.disabled = false;
  });
}

function getAIMove() {
  const validColumns = getValidColumns(board);
  if (validColumns.length === 0) return null;

  if (aiDifficulty === 1) {
    return randomChoice(validColumns);
  }

  const winningMove = findWinningMove(board, aiPlayer);
  if (winningMove !== null) return winningMove;

  if (aiDifficulty >= 2) {
    const blockMove = findWinningMove(board, humanPlayer);
    if (blockMove !== null) return blockMove;
  }

  if (aiDifficulty === 2) {
    return randomChoice(validColumns);
  }

  if (aiDifficulty === 3) {
    return weightedCenterMove(validColumns);
  }

  const depth = aiDifficulty === 4 ? 3 : 5;
  const { col } = minimax(board, depth, -Infinity, Infinity, true);
  return col ?? weightedCenterMove(validColumns);
}

function getValidColumns(localBoard) {
  const valid = [];
  for (let c = 0; c < cols; c += 1) {
    if (localBoard[0][c] === 0) valid.push(c);
  }
  return valid;
}

function findWinningMove(localBoard, player) {
  const valid = getValidColumns(localBoard);
  for (const col of valid) {
    const row = simulateDrop(localBoard, col, player);
    const hasWin = checkBoardWin(localBoard, player);
    undoMove(localBoard, row, col);
    if (hasWin) return col;
  }
  return null;
}

function weightedCenterMove(validColumns) {
  const center = Math.floor(cols / 2);
  const sorted = [...validColumns].sort((a, b) => Math.abs(center - a) - Math.abs(center - b));
  return randomChoice(sorted.slice(0, 3));
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function minimax(localBoard, depth, alpha, beta, maximizingPlayer) {
  const validColumns = getValidColumns(localBoard);
  const terminal =
    checkBoardWin(localBoard, humanPlayer) ||
    checkBoardWin(localBoard, aiPlayer) ||
    validColumns.length === 0;

  if (depth === 0 || terminal) {
    if (checkBoardWin(localBoard, aiPlayer)) return { score: 100000 };
    if (checkBoardWin(localBoard, humanPlayer)) return { score: -100000 };
    if (validColumns.length === 0) return { score: 0 };
    return { score: scorePosition(localBoard, aiPlayer) };
  }

  const ordered = orderColumns(validColumns);
  if (maximizingPlayer) {
    let value = -Infinity;
    let bestCol = ordered[0];
    for (const col of ordered) {
      const row = simulateDrop(localBoard, col, aiPlayer);
      const newScore = minimax(localBoard, depth - 1, alpha, beta, false).score;
      undoMove(localBoard, row, col);
      if (newScore > value) {
        value = newScore;
        bestCol = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return { col: bestCol, score: value };
  }

  let value = Infinity;
  let bestCol = ordered[0];
  for (const col of ordered) {
    const row = simulateDrop(localBoard, col, humanPlayer);
    const newScore = minimax(localBoard, depth - 1, alpha, beta, true).score;
    undoMove(localBoard, row, col);
    if (newScore < value) {
      value = newScore;
      bestCol = col;
    }
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return { col: bestCol, score: value };
}

function orderColumns(validColumns) {
  const center = Math.floor(cols / 2);
  return [...validColumns].sort((a, b) => Math.abs(center - a) - Math.abs(center - b));
}

function simulateDrop(localBoard, col, player) {
  const row = getNextOpenRow(localBoard, col);
  if (row === -1) return -1;
  localBoard[row][col] = player;
  return row;
}

function undoMove(localBoard, row, col) {
  if (row === -1) return;
  localBoard[row][col] = 0;
}

function checkBoardWin(localBoard, player) {
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (localBoard[r][c] !== player) continue;
      if (checkDirection(localBoard, r, c, 0, 1, player)) return true;
      if (checkDirection(localBoard, r, c, 1, 0, player)) return true;
      if (checkDirection(localBoard, r, c, 1, 1, player)) return true;
      if (checkDirection(localBoard, r, c, 1, -1, player)) return true;
    }
  }
  return false;
}

function checkDirection(localBoard, row, col, dr, dc, player) {
  for (let i = 0; i < 4; i += 1) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (localBoard[r][c] !== player) return false;
  }
  return true;
}

function scorePosition(localBoard, player) {
  let score = 0;
  const centerCol = Math.floor(cols / 2);
  let centerCount = 0;
  for (let r = 0; r < rows; r += 1) {
    if (localBoard[r][centerCol] === player) centerCount += 1;
  }
  score += centerCount * 3;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols - 3; c += 1) {
      const window = [localBoard[r][c], localBoard[r][c + 1], localBoard[r][c + 2], localBoard[r][c + 3]];
      score += evaluateWindow(window, player);
    }
  }

  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows - 3; r += 1) {
      const window = [localBoard[r][c], localBoard[r + 1][c], localBoard[r + 2][c], localBoard[r + 3][c]];
      score += evaluateWindow(window, player);
    }
  }

  for (let r = 0; r < rows - 3; r += 1) {
    for (let c = 0; c < cols - 3; c += 1) {
      const window = [
        localBoard[r][c],
        localBoard[r + 1][c + 1],
        localBoard[r + 2][c + 2],
        localBoard[r + 3][c + 3],
      ];
      score += evaluateWindow(window, player);
    }
  }

  for (let r = 0; r < rows - 3; r += 1) {
    for (let c = 3; c < cols; c += 1) {
      const window = [
        localBoard[r][c],
        localBoard[r + 1][c - 1],
        localBoard[r + 2][c - 2],
        localBoard[r + 3][c - 3],
      ];
      score += evaluateWindow(window, player);
    }
  }

  return score;
}

function evaluateWindow(window, player) {
  const opponent = player === humanPlayer ? aiPlayer : humanPlayer;
  const playerCount = window.filter((cell) => cell === player).length;
  const opponentCount = window.filter((cell) => cell === opponent).length;
  const emptyCount = window.filter((cell) => cell === 0).length;

  if (playerCount === 4) return 100;
  if (playerCount === 3 && emptyCount === 1) return 8;
  if (playerCount === 2 && emptyCount === 2) return 4;
  if (opponentCount === 3 && emptyCount === 1) return -10;
  return 0;
}

function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioCtx = new AudioContext();
}

function playTone({ frequency, duration, type, volume }) {
  if (!audioCtx) return;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

function playDropSound() {
  ensureAudio();
  if (!audioCtx) return;
  playTone({ frequency: 320, duration: 0.12, type: "triangle", volume: 0.12 });
}

function playWinSound() {
  ensureAudio();
  if (!audioCtx) return;
  playTone({ frequency: 520, duration: 0.18, type: "sine", volume: 0.16 });
  setTimeout(() => playTone({ frequency: 660, duration: 0.2, type: "sine", volume: 0.16 }), 140);
}

function playLoseSound() {
  ensureAudio();
  if (!audioCtx) return;
  playTone({ frequency: 220, duration: 0.2, type: "sawtooth", volume: 0.12 });
  setTimeout(() => playTone({ frequency: 180, duration: 0.2, type: "sawtooth", volume: 0.12 }), 140);
}

function playDrawSound() {
  ensureAudio();
  if (!audioCtx) return;
  playTone({ frequency: 300, duration: 0.16, type: "square", volume: 0.1 });
  setTimeout(() => playTone({ frequency: 240, duration: 0.16, type: "square", volume: 0.1 }), 140);
}

difficultyEl.addEventListener("change", () => {
  aiDifficulty = Number(difficultyEl.value);
  if (!gameOver && !aiThinking && currentPlayer === humanPlayer) {
    updateStatus("Your turn · Red");
  }
});

resetEl.addEventListener("click", resetGame);

resetGame();
