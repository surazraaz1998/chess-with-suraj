/**
 * CYBER CHESS - User-Friendly & Mobile-First Main Application Controller
 * High-performance mobile touch events, drag & drop, dual keyboard navigation,
 * real-time chess clocks, themes, and audio synthesizer integration.
 */

class ChessApp {
  constructor() {
    this.engine = new ChessEngine();
    this.ai = new ChessAI(this.engine);
    this.sound = window.soundSynth;

    // Config
    this.gameMode = 'pvp_local'; // 'pvp_local' or 'pve_ai'
    this.aiDifficulty = 'medium';
    this.aiColor = 'b';
    this.flipped = false;
    this.autoFlip = false;
    this.timeControl = 300; // 5 mins in seconds
    this.timers = { w: 300, b: 300 };
    this.clockRunning = false;
    this.timerInterval = null;

    // Interaction states
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.pendingPromotion = null;
    this.reviewIndex = -1;

    // Keyboard cursors for P1 (WASD) and P2 (Arrows)
    this.cursor = {
      w: { row: 6, col: 4 },
      b: { row: 1, col: 4 }
    };

    // Touch & Drag state
    this.touchDragElement = null;
    this.touchStartSquare = null;
    this.isDraggingTouch = false;

    this.initDOM();
    this.bindEvents();
    this.bindTouchEvents();
    this.setupNewGame();
  }

  initDOM() {
    this.boardEl = document.getElementById('chess-board');
    this.boardContainer = document.getElementById('board-container-outer');
    this.statusBannerEl = document.getElementById('status-banner');
    this.p1TimerEl = document.getElementById('p1-timer');
    this.p2TimerEl = document.getElementById('p2-timer');
    this.p1BarEl = document.getElementById('player-bar-w');
    this.p2BarEl = document.getElementById('player-bar-b');
    this.p1CapturedEl = document.getElementById('p1-captured');
    this.p2CapturedEl = document.getElementById('p2-captured');
    this.p1AdvantageEl = document.getElementById('p1-advantage');
    this.p2AdvantageEl = document.getElementById('p2-advantage');
    this.moveListEl = document.getElementById('move-list');
    this.promoDialog = document.getElementById('promotion-dialog');
    this.gameoverDialog = document.getElementById('gameover-dialog');
    this.gameoverTitleEl = document.getElementById('gameover-title');
    this.gameoverReasonEl = document.getElementById('gameover-reason');
    this.gameoverStatsEl = document.getElementById('gameover-stats');
    this.toastEl = document.getElementById('app-toast');
  }

  setupNewGame() {
    this.stopClocks();
    this.engine.reset();
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.pendingPromotion = null;
    this.reviewIndex = -1;

    this.cursor = {
      w: { row: 6, col: 4 },
      b: { row: 1, col: 4 }
    };

    this.timers = {
      w: this.timeControl,
      b: this.timeControl
    };
    this.clockRunning = false;
    this.updateClockDisplays();

    this.renderBoard();
    this.updateHUD();
    this.updateMoveList();
  }

  // --- Clock Timers ---
  startClock() {
    if (this.timeControl === 0 || this.clockRunning) return;
    this.clockRunning = true;
    this.timerInterval = setInterval(() => {
      const activeColor = this.engine.turn;
      if (this.timers[activeColor] > 0) {
        this.timers[activeColor]--;
        this.updateClockDisplays();

        if (this.timers[activeColor] <= 10 && this.timers[activeColor] > 0) {
          this.sound.playLowTimeAlert();
        }

        if (this.timers[activeColor] <= 0) {
          this.handleTimeout(activeColor);
        }
      }
    }, 1000);
  }

  stopClocks() {
    this.clockRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleTimeout(loserColor) {
    this.stopClocks();
    const winner = loserColor === 'w' ? 'Black' : 'White';
    this.sound.playCheckmate();
    this.showGameOverModal('Time Out!', `${winner} wins on time.`);
  }

  formatTime(totalSeconds) {
    if (totalSeconds <= 0) return '00:00';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateClockDisplays() {
    if (this.timeControl === 0) {
      this.p1TimerEl.textContent = '∞';
      this.p2TimerEl.textContent = '∞';
      this.p1TimerEl.classList.remove('time-danger');
      this.p2TimerEl.classList.remove('time-danger');
      return;
    }

    this.p1TimerEl.textContent = this.formatTime(this.timers.w);
    this.p2TimerEl.textContent = this.formatTime(this.timers.b);

    this.p1TimerEl.classList.toggle('time-danger', this.timers.w <= 20);
    this.p2TimerEl.classList.toggle('time-danger', this.timers.b <= 20);
  }

  // --- Board & UI Rendering ---
  renderBoard() {
    this.boardEl.innerHTML = '';
    const turn = this.engine.turn;
    const isLive = this.reviewIndex === -1;
    const currentBoard = isLive ? this.engine.board : this.getBoardAtReview(this.reviewIndex);

    // Check King square
    let checkKingSquare = null;
    if (isLive && this.engine.isCheck) {
      const kingPos = this.engine.findKing(turn);
      if (kingPos) checkKingSquare = kingPos;
    }

    const lastMove = this.engine.moveHistory[this.engine.moveHistory.length - 1];

    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const r = this.flipped ? 7 - displayRow : displayRow;
        const c = this.flipped ? 7 - displayCol : displayCol;

        const squareEl = document.createElement('div');
        squareEl.className = 'chess-square';
        squareEl.dataset.row = r;
        squareEl.dataset.col = c;

        const isLight = (r + c) % 2 === 0;
        squareEl.classList.add(isLight ? 'square-light' : 'square-dark');

        // Coordinate labels
        if (displayCol === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-label rank-label';
          rankLabel.textContent = 8 - r;
          squareEl.appendChild(rankLabel);
        }
        if (displayRow === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-label file-label';
          fileLabel.textContent = String.fromCharCode(97 + c);
          squareEl.appendChild(fileLabel);
        }

        // Highlight last move
        if (lastMove && isLive) {
          if ((lastMove.from.row === r && lastMove.from.col === c) ||
              (lastMove.to.row === r && lastMove.to.col === c)) {
            squareEl.classList.add('last-move-highlight');
          }
        }

        // Highlight selected square
        if (this.selectedSquare && this.selectedSquare.row === r && this.selectedSquare.col === c) {
          squareEl.classList.add('selected-highlight');
        }

        // Legal move markers
        const legalMove = this.legalMovesForSelected.find(m => m.to.row === r && m.to.col === c);
        if (legalMove) {
          if (legalMove.capture || legalMove.isEnPassant) {
            squareEl.classList.add('legal-capture-highlight');
            const targetRing = document.createElement('div');
            targetRing.className = 'cyber-target-ring';
            squareEl.appendChild(targetRing);
          } else {
            const moveDot = document.createElement('div');
            moveDot.className = 'cyber-move-dot';
            squareEl.appendChild(moveDot);
          }
        }

        // King check danger
        if (checkKingSquare && checkKingSquare.row === r && checkKingSquare.col === c) {
          squareEl.classList.add('check-danger-pulse');
        }

        // Keyboard reticles
        if (isLive) {
          if (this.cursor.w.row === r && this.cursor.w.col === c) {
            const cursorW = document.createElement('div');
            cursorW.className = `keyboard-cursor cursor-w ${turn === 'w' ? 'cursor-active' : ''}`;
            squareEl.appendChild(cursorW);
          }
          if (this.cursor.b.row === r && this.cursor.b.col === c) {
            const cursorB = document.createElement('div');
            cursorB.className = `keyboard-cursor cursor-b ${turn === 'b' ? 'cursor-active' : ''}`;
            squareEl.appendChild(cursorB);
          }
        }

        // Render piece
        const piece = currentBoard[r][c];
        if (piece) {
          const pieceContainer = document.createElement('div');
          pieceContainer.className = `chess-piece piece-${piece.color}`;
          pieceContainer.dataset.type = piece.type;
          pieceContainer.dataset.color = piece.color;
          pieceContainer.dataset.row = r;
          pieceContainer.dataset.col = c;
          pieceContainer.innerHTML = ChessPiecesSVG.getPieceSVG(piece.type, piece.color);

          if (isLive && piece.color === turn) {
            pieceContainer.draggable = true;
          }

          squareEl.appendChild(pieceContainer);
        }

        this.boardEl.appendChild(squareEl);
      }
    }
  }

  getBoardAtReview(index) {
    if (index < 0 || index >= this.engine.moveHistory.length) {
      return this.engine.board;
    }
    const tempEngine = new ChessEngine(this.engine.moveHistory[index].fenAfter);
    return tempEngine.board;
  }

  updateHUD() {
    const turn = this.engine.turn;
    const isWhite = turn === 'w';

    this.p1BarEl.classList.toggle('active-turn', isWhite);
    this.p2BarEl.classList.toggle('active-turn', !isWhite);

    if (this.engine.isCheckmate) {
      const winner = isWhite ? 'Black' : 'White';
      this.statusBannerEl.textContent = `Checkmate! ${winner} is victorious! 🏆`;
      this.statusBannerEl.className = 'status-pill-banner is-victory';
    } else if (this.engine.isDraw) {
      this.statusBannerEl.textContent = `Draw by ${this.engine.drawReason}`;
      this.statusBannerEl.className = 'status-pill-banner';
    } else if (this.engine.isCheck) {
      this.statusBannerEl.textContent = `⚠️ Check! ${isWhite ? 'White' : 'Black'} King is in danger!`;
      this.statusBannerEl.className = 'status-pill-banner is-check';
    } else {
      this.statusBannerEl.textContent = isWhite ? "White's Turn" : "Black's Turn";
      this.statusBannerEl.className = 'status-pill-banner';
    }

    this.updateCapturedPieces();
  }

  updateCapturedPieces() {
    const capturedWhite = [];
    const capturedBlack = [];
    let scoreW = 0;
    let scoreB = 0;
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

    for (const move of this.engine.moveHistory) {
      if (move.captured) {
        if (move.captured.color === 'w') {
          capturedWhite.push(move.captured.type);
          scoreB += values[move.captured.type] || 0;
        } else {
          capturedBlack.push(move.captured.type);
          scoreW += values[move.captured.type] || 0;
        }
      }
    }

    this.p1CapturedEl.innerHTML = capturedBlack
      .map(type => `<span class="captured-icon">${this.getPieceSymbol(type, 'b')}</span>`)
      .join('');
    this.p2CapturedEl.innerHTML = capturedWhite
      .map(type => `<span class="captured-icon">${this.getPieceSymbol(type, 'w')}</span>`)
      .join('');

    const diff = scoreW - scoreB;
    this.p1AdvantageEl.textContent = diff > 0 ? `+${diff}` : '';
    this.p2AdvantageEl.textContent = diff < 0 ? `+${Math.abs(diff)}` : '';
  }

  getPieceSymbol(type, color) {
    const symbols = {
      w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
      b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
    };
    return symbols[color][type] || '';
  }

  updateMoveList() {
    this.moveListEl.innerHTML = '';
    const moves = this.engine.moveHistory;

    for (let i = 0; i < moves.length; i += 2) {
      const turnNum = Math.floor(i / 2) + 1;
      const row = document.createElement('div');
      row.className = 'move-history-row';

      const numCol = document.createElement('span');
      numCol.className = 'move-num';
      numCol.textContent = `${turnNum}.`;
      row.appendChild(numCol);

      const whiteMove = document.createElement('span');
      whiteMove.className = `move-san white-san ${this.reviewIndex === i ? 'active-review' : ''}`;
      whiteMove.textContent = moves[i].san;
      whiteMove.onclick = () => this.jumpToReview(i);
      row.appendChild(whiteMove);

      if (moves[i + 1]) {
        const blackMove = document.createElement('span');
        blackMove.className = `move-san black-san ${this.reviewIndex === i + 1 ? 'active-review' : ''}`;
        blackMove.textContent = moves[i + 1].san;
        blackMove.onclick = () => this.jumpToReview(i + 1);
        row.appendChild(blackMove);
      }

      this.moveListEl.appendChild(row);
    }

    this.moveListEl.scrollTop = this.moveListEl.scrollHeight;
  }

  jumpToReview(index) {
    this.reviewIndex = index;
    this.renderBoard();
    this.updateMoveList();
  }

  returnToLive() {
    this.reviewIndex = -1;
    this.renderBoard();
    this.updateMoveList();
  }

  // --- Core Move Handler ---
  handleSquareSelect(row, col) {
    if (this.reviewIndex !== -1) {
      this.returnToLive();
    }

    if (this.engine.isCheckmate || this.engine.isDraw) return;
    if (this.gameMode === 'pve_ai' && this.engine.turn === this.aiColor) return;

    const clickedPiece = this.engine.getPiece(row, col);

    // 1. Move to clicked valid destination square
    if (this.selectedSquare) {
      const matchedMove = this.legalMovesForSelected.find(m => m.to.row === row && m.to.col === col);
      if (matchedMove) {
        if (matchedMove.promotion) {
          this.promptPromotion(this.selectedSquare, { row, col });
          return;
        }

        this.executeMove({
          from: this.selectedSquare,
          to: { row, col }
        });
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        return;
      }
    }

    // 2. Select piece of current player's turn
    if (clickedPiece && clickedPiece.color === this.engine.turn) {
      this.selectedSquare = { row, col };
      this.legalMovesForSelected = this.engine.getMovesForSquare(row, col);
      this.sound.playSelect();
      this.renderBoard();
    } else {
      this.selectedSquare = null;
      this.legalMovesForSelected = [];
      this.renderBoard();
    }
  }

  executeMove(moveInput) {
    const fromPiece = this.engine.getPiece(moveInput.from.row, moveInput.from.col);
    const result = this.engine.makeMove(moveInput);
    if (!result.success) {
      this.sound.playIllegal();
      return;
    }

    if (!this.clockRunning && this.timeControl > 0) {
      this.startClock();
    }

    // Sounds
    if (result.isCheckmate) {
      this.sound.playCheckmate();
    } else if (result.isCheck) {
      this.sound.playCheck();
    } else if (result.move.isCastling) {
      this.sound.playCastle();
    } else if (result.move.captured) {
      this.sound.playCapture();
    } else {
      this.sound.playMove();
    }

    // Auto-flip for local 2-player pass & play if enabled
    if (this.autoFlip && this.gameMode === 'pvp_local') {
      this.flipped = this.engine.turn === 'b';
    }

    this.renderBoard();
    this.updateHUD();
    this.updateMoveList();

    if (result.isCheckmate) {
      this.stopClocks();
      const winner = this.engine.turn === 'w' ? 'Black' : 'White';
      this.showGameOverModal('Checkmate!', `${winner} has won the match.`);
      return;
    } else if (result.isDraw) {
      this.stopClocks();
      this.showGameOverModal('Game Drawn', `Draw by ${result.drawReason}.`);
      return;
    }

    if (this.gameMode === 'pve_ai' && this.engine.turn === this.aiColor) {
      setTimeout(() => this.makeAIMove(), 320);
    }
  }

  makeAIMove() {
    if (this.engine.isCheckmate || this.engine.isDraw) return;
    const bestMove = this.ai.getBestMove(this.aiColor, this.aiDifficulty);
    if (bestMove) {
      this.executeMove(bestMove);
    }
  }

  promptPromotion(from, to) {
    this.pendingPromotion = { from, to };
    this.promoDialog.showModal();
  }

  choosePromotion(promoType) {
    if (!this.pendingPromotion) return;
    const { from, to } = this.pendingPromotion;
    this.promoDialog.close();
    this.pendingPromotion = null;
    this.executeMove({
      from,
      to,
      promotion: promoType
    });
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
  }

  showGameOverModal(title, reason) {
    this.gameoverTitleEl.textContent = title;
    this.gameoverReasonEl.textContent = reason;
    this.gameoverStatsEl.textContent = `Total moves: ${this.engine.moveHistory.length}`;
    this.gameoverDialog.showModal();
  }

  // --- Mobile Touch Drag & Tap Integration ---
  bindTouchEvents() {
    let touchStartX = 0;
    let touchStartY = 0;

    this.boardEl.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const square = targetEl?.closest('.chess-square');
      if (!square) return;

      const row = parseInt(square.dataset.row, 10);
      const col = parseInt(square.dataset.col, 10);
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      const piece = this.engine.getPiece(row, col);
      if (piece && piece.color === this.engine.turn) {
        this.touchStartSquare = { row, col };
        this.isDraggingTouch = false;
      }
    }, { passive: false });

    this.boardEl.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
      if (dist > 10 && this.touchStartSquare) {
        this.isDraggingTouch = true;
        e.preventDefault(); // Prevent accidental scroll when dragging piece
      }
    }, { passive: false });

    this.boardEl.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const square = targetEl?.closest('.chess-square');

      if (this.isDraggingTouch && this.touchStartSquare && square) {
        // Drag drop end
        const targetRow = parseInt(square.dataset.row, 10);
        const targetCol = parseInt(square.dataset.col, 10);

        const legalMoves = this.engine.getMovesForSquare(this.touchStartSquare.row, this.touchStartSquare.col);
        const matchedMove = legalMoves.find(m => m.to.row === targetRow && m.to.col === targetCol);

        if (matchedMove) {
          if (matchedMove.promotion) {
            this.promptPromotion(this.touchStartSquare, { row: targetRow, col: targetCol });
          } else {
            this.executeMove({
              from: this.touchStartSquare,
              to: { row: targetRow, col: targetCol }
            });
          }
        }
      } else if (square) {
        // Simple tap to select / tap to move
        const row = parseInt(square.dataset.row, 10);
        const col = parseInt(square.dataset.col, 10);
        this.handleSquareSelect(row, col);
      }

      this.touchStartSquare = null;
      this.isDraggingTouch = false;
    }, { passive: false });
  }

  // --- Keyboard & Desktop Events ---
  handleKeyDown(e) {
    if (this.promoDialog.open || this.gameoverDialog.open) {
      if (this.promoDialog.open) {
        if (e.key === '1') this.choosePromotion('q');
        if (e.key === '2') this.choosePromotion('r');
        if (e.key === '3') this.choosePromotion('b');
        if (e.key === '4') this.choosePromotion('n');
      }
      return;
    }

    const key = e.key.toLowerCase();
    const isWhiteTurn = this.engine.turn === 'w';

    // Player 1 (WASD + Space/F)
    if (['w', 'a', 's', 'd', ' ', 'f'].includes(key)) {
      let { row, col } = this.cursor.w;
      if (key === 'w') row = Math.max(0, row - 1);
      if (key === 's') row = Math.min(7, row + 1);
      if (key === 'a') col = Math.max(0, col - 1);
      if (key === 'd') col = Math.min(7, col + 1);

      this.cursor.w = { row, col };

      if (key === ' ' || key === 'f') {
        if (isWhiteTurn) {
          this.handleSquareSelect(row, col);
        } else {
          this.sound.playIllegal();
        }
      }
      this.renderBoard();
      e.preventDefault();
      return;
    }

    // Player 2 (Arrows + Enter)
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter'].includes(key)) {
      let { row, col } = this.cursor.b;
      if (key === 'arrowup') row = Math.max(0, row - 1);
      if (key === 'arrowdown') row = Math.min(7, row + 1);
      if (key === 'arrowleft') col = Math.max(0, col - 1);
      if (key === 'arrowright') col = Math.min(7, col + 1);

      this.cursor.b = { row, col };

      if (key === 'enter') {
        if (!isWhiteTurn || this.gameMode === 'pve_ai') {
          this.handleSquareSelect(row, col);
        } else {
          this.handleSquareSelect(row, col);
        }
      }
      this.renderBoard();
      e.preventDefault();
      return;
    }

    if (e.key === 'Escape') {
      if (this.selectedSquare) {
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.renderBoard();
      }
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Mouse clicks
    this.boardEl.addEventListener('click', (e) => {
      const square = e.target.closest('.chess-square');
      if (!square) return;
      const row = parseInt(square.dataset.row, 10);
      const col = parseInt(square.dataset.col, 10);
      this.handleSquareSelect(row, col);
    });

    // Drag and drop for mouse
    let dragOrigin = null;
    this.boardEl.addEventListener('dragstart', (e) => {
      const piece = e.target.closest('.chess-piece');
      if (!piece) return;
      const square = piece.closest('.chess-square');
      if (!square) return;

      const row = parseInt(square.dataset.row, 10);
      const col = parseInt(square.dataset.col, 10);

      const pieceData = this.engine.getPiece(row, col);
      if (!pieceData || pieceData.color !== this.engine.turn) {
        e.preventDefault();
        return;
      }

      dragOrigin = { row, col };
      this.selectedSquare = { row, col };
      this.legalMovesForSelected = this.engine.getMovesForSquare(row, col);
      this.renderBoard();

      e.dataTransfer.setData('text/plain', `${row},${col}`);
    });

    this.boardEl.addEventListener('dragover', (e) => e.preventDefault());

    this.boardEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const square = e.target.closest('.chess-square');
      if (!square || !dragOrigin) return;

      const targetRow = parseInt(square.dataset.row, 10);
      const targetCol = parseInt(square.dataset.col, 10);

      const matchedMove = this.legalMovesForSelected.find(m => m.to.row === targetRow && m.to.col === targetCol);
      if (matchedMove) {
        if (matchedMove.promotion) {
          this.promptPromotion(dragOrigin, { row: targetRow, col: targetCol });
        } else {
          this.executeMove({
            from: dragOrigin,
            to: { row: targetRow, col: targetCol }
          });
        }
      }

      dragOrigin = null;
      this.selectedSquare = null;
      this.legalMovesForSelected = [];
      this.renderBoard();
    });

    // Theme selector
    document.getElementById('select-theme')?.addEventListener('change', (e) => {
      const theme = e.target.value;
      if (theme === 'emerald') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    });

    // Piece Artwork Style selector
    document.getElementById('select-piece-style')?.addEventListener('change', (e) => {
      ChessPiecesSVG.setStyle(e.target.value);
      this.renderBoard();
    });

    // Tab buttons in Tactical Console
    const tabMoves = document.getElementById('tab-btn-moves');
    const tabSettings = document.getElementById('tab-btn-settings');
    const paneMoves = document.getElementById('pane-moves');
    const paneSettings = document.getElementById('pane-settings');

    tabMoves?.addEventListener('click', () => {
      tabMoves.classList.add('tab-active');
      tabSettings?.classList.remove('tab-active');
      paneMoves?.classList.add('pane-active');
      paneSettings?.classList.remove('pane-active');
    });

    tabSettings?.addEventListener('click', () => {
      tabSettings.classList.add('tab-active');
      tabMoves?.classList.remove('tab-active');
      paneSettings?.classList.add('pane-active');
      paneMoves?.classList.remove('pane-active');
    });

    // Buttons
    document.getElementById('btn-new-game')?.addEventListener('click', () => this.setupNewGame());
    document.getElementById('btn-restart-modal')?.addEventListener('click', () => {
      this.gameoverDialog.close();
      this.setupNewGame();
    });

    document.getElementById('btn-flip')?.addEventListener('click', () => {
      this.flipped = !this.flipped;
      this.sound.playSelect();
      this.renderBoard();
    });

    document.getElementById('btn-resign')?.addEventListener('click', () => {
      if (this.engine.isCheckmate || this.engine.isDraw) return;
      const loser = this.engine.turn === 'w' ? 'White' : 'Black';
      const winner = this.engine.turn === 'w' ? 'Black' : 'White';
      this.stopClocks();
      this.sound.playCheckmate();
      this.showGameOverModal('Resigned', `${loser} conceded defeat. ${winner} wins.`);
    });

    document.getElementById('btn-draw')?.addEventListener('click', () => {
      if (this.engine.isCheckmate || this.engine.isDraw) return;
      this.stopClocks();
      this.sound.playMove();
      this.showGameOverModal('Draw Agreed', 'Both players agreed to a draw.');
    });

    document.getElementById('select-time-control')?.addEventListener('change', (e) => {
      this.timeControl = parseInt(e.target.value, 10);
      this.setupNewGame();
    });

    document.getElementById('select-game-mode')?.addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      const aiDiff = document.getElementById('select-ai-difficulty');
      if (aiDiff) {
        aiDiff.style.display = this.gameMode === 'pve_ai' ? 'inline-block' : 'none';
      }
      this.setupNewGame();
    });

    document.getElementById('select-ai-difficulty')?.addEventListener('change', (e) => {
      this.aiDifficulty = e.target.value;
    });

    document.getElementById('check-auto-flip')?.addEventListener('change', (e) => {
      this.autoFlip = e.target.checked;
      if (this.autoFlip && this.gameMode === 'pvp_local') {
        this.flipped = this.engine.turn === 'b';
        this.renderBoard();
      }
    });

    const soundBtn = document.getElementById('btn-toggle-sound');
    soundBtn?.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      soundBtn.innerHTML = isMuted ? '<span class="icon">🔇</span>' : '<span class="icon">🔊</span>';
      soundBtn.style.opacity = isMuted ? '0.5' : '1';
    });

    document.getElementById('btn-copy-pgn')?.addEventListener('click', () => {
      const pgn = this.engine.exportPGN();
      navigator.clipboard.writeText(pgn).then(() => {
        this.showToast('PGN copied to clipboard!');
      });
    });

    document.getElementById('btn-copy-fen')?.addEventListener('click', () => {
      const fen = this.engine.exportFEN();
      navigator.clipboard.writeText(fen).then(() => {
        this.showToast('FEN copied to clipboard!');
      });
    });

    // Promotion buttons
    document.querySelectorAll('.promo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pieceType = btn.dataset.piece;
        this.choosePromotion(pieceType);
      });
    });

    // History review controls
    document.getElementById('btn-history-start')?.addEventListener('click', () => {
      if (this.engine.moveHistory.length > 0) this.jumpToReview(0);
    });
    document.getElementById('btn-history-prev')?.addEventListener('click', () => {
      const target = this.reviewIndex === -1 ? this.engine.moveHistory.length - 2 : this.reviewIndex - 1;
      if (target >= 0) this.jumpToReview(target);
    });
    document.getElementById('btn-history-next')?.addEventListener('click', () => {
      if (this.reviewIndex !== -1) {
        if (this.reviewIndex + 1 < this.engine.moveHistory.length) {
          this.jumpToReview(this.reviewIndex + 1);
        } else {
          this.returnToLive();
        }
      }
    });
    document.getElementById('btn-history-end')?.addEventListener('click', () => {
      this.returnToLive();
    });
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2200);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new CyberBackground('bg-canvas');
  window.chessApp = new ChessApp();
});
