/**
 * CYBER CHESS 2099 - AI Engine "CYBERNETIC SENTINEL"
 * Evaluates chess positions using Piece-Square tables, material balance,
 * king safety, and alpha-beta minimax search with multiple difficulty levels.
 */

class ChessAI {
  constructor(engine) {
    this.engine = engine;

    this.pieceValues = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 20000
    };

    // Positional Piece-Square tables (from White's perspective; mirrored for Black)
    this.pstPawn = [
      0,  0,  0,  0,  0,  0,  0,  0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
       5,  5, 10, 25, 25, 10,  5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5, -5,-10,  0,  0,-10, -5,  5,
       5, 10, 10,-20,-20, 10, 10,  5,
       0,  0,  0,  0,  0,  0,  0,  0
    ];

    this.pstKnight = [
      -50,-40,-30,-30,-30,-30,-40,-50,
      -40,-20,  0,  0,  0,  0,-20,-40,
      -30,  0, 10, 15, 15, 10,  0,-30,
      -30,  5, 15, 20, 20, 15,  5,-30,
      -30,  0, 15, 20, 20, 15,  0,-30,
      -30,  5, 10, 15, 15, 10,  5,-30,
      -40,-20,  0,  5,  5,  0,-20,-40,
      -50,-40,-30,-30,-30,-30,-40,-50
    ];

    this.pstBishop = [
      -20,-10,-10,-10,-10,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5, 10, 10,  5,  0,-10,
      -10,  5,  5, 10, 10,  5,  5,-10,
      -10,  0, 10, 10, 10, 10,  0,-10,
      -10, 10, 10, 10, 10, 10, 10,-10,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -20,-10,-10,-10,-10,-10,-10,-20
    ];

    this.pstRook = [
        0,  0,  0,  0,  0,  0,  0,  0,
        5, 10, 10, 10, 10, 10, 10,  5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
        0,  0,  0,  5,  5,  0,  0,  0
    ];

    this.pstQueen = [
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5,  5,  5,  5,  0,-10,
       -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
      -10,  5,  5,  5,  5,  5,  0,-10,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20
    ];

    this.pstKingMid = [
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -20,-30,-30,-40,-40,-30,-30,-20,
      -10,-20,-20,-20,-20,-20,-20,-10,
       20, 20,  0,  0,  0,  0, 20, 20,
       20, 30, 10,  0,  0, 10, 30, 20
    ];
  }

  evaluateBoard() {
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.engine.board[r][c];
        if (!piece) continue;

        const val = this.pieceValues[piece.type] || 0;
        let posVal = 0;
        const idx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

        switch (piece.type) {
          case 'p': posVal = this.pstPawn[idx]; break;
          case 'n': posVal = this.pstKnight[idx]; break;
          case 'b': posVal = this.pstBishop[idx]; break;
          case 'r': posVal = this.pstRook[idx]; break;
          case 'q': posVal = this.pstQueen[idx]; break;
          case 'k': posVal = this.pstKingMid[idx]; break;
        }

        const total = val + posVal;
        score += piece.color === 'w' ? total : -total;
      }
    }

    return score;
  }

  minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
      return this.evaluateBoard();
    }

    const color = isMaximizing ? 'w' : 'b';
    const moves = this.engine.getLegalMoves(color);

    if (moves.length === 0) {
      if (this.engine.isInCheck(color)) {
        return isMaximizing ? -50000 + (10 - depth) : 50000 - (10 - depth);
      }
      return 0; // Stalemate
    }

    // Sort moves to prioritize captures for better alpha-beta pruning
    moves.sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0));

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of moves) {
        const clonedState = this.engine.cloneState();
        this.engine.makeMove(m);
        const evalScore = this.minimax(depth - 1, alpha, beta, false);
        this.restoreEngineState(clonedState);

        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        const clonedState = this.engine.cloneState();
        this.engine.makeMove(m);
        const evalScore = this.minimax(depth - 1, alpha, beta, true);
        this.restoreEngineState(clonedState);

        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Pruning
      }
      return minEval;
    }
  }

  restoreEngineState(state) {
    this.engine.board = state.board;
    this.engine.turn = state.turn;
    this.engine.castling = state.castling;
    this.engine.enPassant = state.enPassant;
    this.engine.halfmoveClock = state.halfmoveClock;
    this.engine.fullmoveNumber = state.fullmoveNumber;
    this.engine.isCheck = state.isCheck;
    this.engine.isCheckmate = state.isCheckmate;
    this.engine.isStalemate = state.isStalemate;
    this.engine.isDraw = state.isDraw;
    this.engine.drawReason = state.drawReason;
  }

  getBestMove(color = 'b', difficulty = 'medium') {
    const moves = this.engine.getLegalMoves(color);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
      // 40% random, 60% depth 1 best capture
      if (Math.random() < 0.4) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    }

    const depth = difficulty === 'hard' ? 3 : (difficulty === 'easy' ? 1 : 2);
    const isMaximizing = color === 'w';

    let bestMove = null;
    let bestValue = isMaximizing ? -Infinity : Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    // Shuffle moves slightly to avoid robotic repetition on equal moves
    moves.sort(() => Math.random() - 0.5);
    moves.sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0));

    for (const move of moves) {
      // Always auto-promote pawn to Queen for AI
      if (move.promotion && move.promotion !== 'q') continue;

      const clonedState = this.engine.cloneState();
      this.engine.makeMove(move);
      const moveValue = this.minimax(depth - 1, alpha, beta, !isMaximizing);
      this.restoreEngineState(clonedState);

      if (isMaximizing) {
        if (moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = move;
        }
      } else {
        if (moveValue < bestValue) {
          bestValue = moveValue;
          bestMove = move;
        }
      }
    }

    return bestMove || moves[0];
  }
}

window.ChessAI = ChessAI;
