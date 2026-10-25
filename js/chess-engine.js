/**
 * CYBER CHESS 2099 - High-Performance Chess Engine
 * Complete implementation of FIDE chess rules:
 * - Legal move generation with pin/check restrictions
 * - Castling (kingside & queenside) with attack-path validation
 * - En Passant capture and tracking
 * - Pawn promotion (Queen, Rook, Bishop, Knight)
 * - Check, Checkmate, and Stalemate detection
 * - Insufficient material draw, 50-move rule, threefold repetition
 * - Full FEN parser & exporter
 * - Algebraic Notation (SAN) generator and PGN exporter
 */

class ChessEngine {
  constructor(fen) {
    this.reset(fen);
  }

  reset(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.turn = 'w'; // 'w' or 'b'
    this.castling = {
      w: { k: true, q: true },
      b: { k: true, q: true }
    };
    this.enPassant = null; // { row, col } or null
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.moveHistory = [];
    this.positionHistory = [];
    this.isCheck = false;
    this.isCheckmate = false;
    this.isStalemate = false;
    this.isDraw = false;
    this.drawReason = null;

    if (fen) {
      this.loadFEN(fen);
    }
  }

  cloneState() {
    return {
      board: this.board.map(row => row.map(cell => cell ? { ...cell } : null)),
      turn: this.turn,
      castling: {
        w: { ...this.castling.w },
        b: { ...this.castling.b }
      },
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      isCheck: this.isCheck,
      isCheckmate: this.isCheckmate,
      isStalemate: this.isStalemate,
      isDraw: this.isDraw,
      drawReason: this.drawReason
    };
  }

  isInside(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  getPiece(row, col) {
    if (!this.isInside(row, col)) return null;
    return this.board[row][col];
  }

  setPiece(row, col, piece) {
    if (this.isInside(row, col)) {
      this.board[row][col] = piece;
    }
  }

  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  isSquareAttacked(targetRow, targetCol, attackerColor) {
    // 1. Pawn attacks
    const pawnRowOffset = attackerColor === 'w' ? 1 : -1;
    const pawnRow = targetRow + pawnRowOffset;
    for (const cOffset of [-1, 1]) {
      const pCol = targetCol + cOffset;
      if (this.isInside(pawnRow, pCol)) {
        const p = this.board[pawnRow][pCol];
        if (p && p.type === 'p' && p.color === attackerColor) return true;
      }
    }

    // 2. Knight attacks
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = targetRow + dr;
      const nc = targetCol + dc;
      if (this.isInside(nr, nc)) {
        const p = this.board[nr][nc];
        if (p && p.type === 'n' && p.color === attackerColor) return true;
      }
    }

    // 3. Bishop & Queen diagonal rays
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
      let r = targetRow + dr;
      let c = targetCol + dc;
      while (this.isInside(r, c)) {
        const p = this.board[r][c];
        if (p) {
          if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true;
          break;
        }
        r += dr;
        c += dc;
      }
    }

    // 4. Rook & Queen straight rays
    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of straightDirs) {
      let r = targetRow + dr;
      let c = targetCol + dc;
      while (this.isInside(r, c)) {
        const p = this.board[r][c];
        if (p) {
          if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true;
          break;
        }
        r += dr;
        c += dc;
      }
    }

    // 5. King adjacent
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const kr = targetRow + dr;
        const kc = targetCol + dc;
        if (this.isInside(kr, kc)) {
          const p = this.board[kr][kc];
          if (p && p.type === 'k' && p.color === attackerColor) return true;
        }
      }
    }

    return false;
  }

  isInCheck(color = this.turn) {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;
    const opponent = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(kingPos.row, kingPos.col, opponent);
  }

  generatePseudoMoves(color = this.turn) {
    const moves = [];
    const opponent = color === 'w' ? 'b' : 'w';
    const forward = color === 'w' ? -1 : 1;
    const startPawnRank = color === 'w' ? 6 : 1;
    const promoRank = color === 'w' ? 0 : 7;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece || piece.color !== color) continue;

        if (piece.type === 'p') {
          // Single step forward
          const f1r = r + forward;
          if (this.isInside(f1r, c) && !this.board[f1r][c]) {
            if (f1r === promoRank) {
              for (const promo of ['q', 'r', 'b', 'n']) {
                moves.push({ from: { row: r, col: c }, to: { row: f1r, col: c }, promotion: promo });
              }
            } else {
              moves.push({ from: { row: r, col: c }, to: { row: f1r, col: c } });
              // Double step forward from starting rank
              const f2r = r + 2 * forward;
              if (r === startPawnRank && this.isInside(f2r, c) && !this.board[f2r][c]) {
                moves.push({ from: { row: r, col: c }, to: { row: f2r, col: c }, isDoubleJump: true });
              }
            }
          }

          // Pawn captures
          for (const dc of [-1, 1]) {
            const tr = r + forward;
            const tc = c + dc;
            if (this.isInside(tr, tc)) {
              const targetPiece = this.board[tr][tc];
              if (targetPiece && targetPiece.color === opponent) {
                if (tr === promoRank) {
                  for (const promo of ['q', 'r', 'b', 'n']) {
                    moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc }, promotion: promo, capture: true });
                  }
                } else {
                  moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc }, capture: true });
                }
              } else if (this.enPassant && this.enPassant.row === tr && this.enPassant.col === tc) {
                // En Passant capture
                moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc }, isEnPassant: true, capture: true });
              }
            }
          }
        } else if (piece.type === 'n') {
          const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
          ];
          for (const [dr, dc] of knightMoves) {
            const tr = r + dr;
            const tc = c + dc;
            if (this.isInside(tr, tc)) {
              const target = this.board[tr][tc];
              if (!target) {
                moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
              } else if (target.color === opponent) {
                moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc }, capture: true });
              }
            }
          }
        } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
          const directions = [];
          if (piece.type === 'b' || piece.type === 'q') {
            directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
          }
          if (piece.type === 'r' || piece.type === 'q') {
            directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
          }

          for (const [dr, dc] of directions) {
            let tr = r + dr;
            let tc = c + dc;
            while (this.isInside(tr, tc)) {
              const target = this.board[tr][tc];
              if (!target) {
                moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
              } else {
                if (target.color === opponent) {
                  moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc }, capture: true });
                }
                break;
              }
              tr += dr;
              tc += dc;
            }
          }
        } else if (piece.type === 'k') {
          // Normal 1-step King moves
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const tr = r + dr;
              const tc = c + dc;
              if (this.isInside(tr, tc)) {
                const target = this.board[tr][tc];
                if (!target) {
                  moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
                } else if (target.color === opponent) {
                  moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc }, capture: true });
                }
              }
            }
          }

          // Castling
          const kingRow = color === 'w' ? 7 : 0;
          if (r === kingRow && c === 4 && !this.isInCheck(color)) {
            // Kingside Castling
            if (this.castling[color].k) {
              const fPiece = this.board[kingRow][5];
              const gPiece = this.board[kingRow][6];
              const rookPiece = this.board[kingRow][7];
              if (
                !fPiece && !gPiece &&
                rookPiece && rookPiece.type === 'r' && rookPiece.color === color &&
                !this.isSquareAttacked(kingRow, 5, opponent) &&
                !this.isSquareAttacked(kingRow, 6, opponent)
              ) {
                moves.push({
                  from: { row: r, col: c },
                  to: { row: kingRow, col: 6 },
                  isCastling: 'k'
                });
              }
            }

            // Queenside Castling
            if (this.castling[color].q) {
              const dPiece = this.board[kingRow][3];
              const cPiece = this.board[kingRow][2];
              const bPiece = this.board[kingRow][1];
              const rookPiece = this.board[kingRow][0];
              if (
                !dPiece && !cPiece && !bPiece &&
                rookPiece && rookPiece.type === 'r' && rookPiece.color === color &&
                !this.isSquareAttacked(kingRow, 3, opponent) &&
                !this.isSquareAttacked(kingRow, 2, opponent)
              ) {
                moves.push({
                  from: { row: r, col: c },
                  to: { row: kingRow, col: 2 },
                  isCastling: 'q'
                });
              }
            }
          }
        }
      }
    }

    return moves;
  }

  getLegalMoves(color = this.turn) {
    const pseudo = this.generatePseudoMoves(color);
    const legal = [];

    for (const move of pseudo) {
      if (this.testMoveLegal(move, color)) {
        legal.push(move);
      }
    }

    return legal;
  }

  getMovesForSquare(row, col) {
    const legal = this.getLegalMoves(this.turn);
    return legal.filter(m => m.from.row === row && m.from.col === col);
  }

  testMoveLegal(move, color = this.turn) {
    const originalPiece = this.board[move.from.row][move.from.col];
    const destinationPiece = this.board[move.to.row][move.to.col];
    let epPawn = null;
    let epPawnPos = null;

    // Apply temporary move
    this.board[move.from.row][move.from.col] = null;
    if (move.isEnPassant) {
      const epRow = color === 'w' ? move.to.row + 1 : move.to.row - 1;
      epPawnPos = { row: epRow, col: move.to.col };
      epPawn = this.board[epRow][move.to.col];
      this.board[epRow][move.to.col] = null;
    }

    this.board[move.to.row][move.to.col] = move.promotion ? { type: move.promotion, color } : originalPiece;

    const inCheck = this.isInCheck(color);

    // Revert temporary move
    this.board[move.from.row][move.from.col] = originalPiece;
    this.board[move.to.row][move.to.col] = destinationPiece;
    if (move.isEnPassant && epPawnPos) {
      this.board[epPawnPos.row][epPawnPos.col] = epPawn;
    }

    return !inCheck;
  }

  generateSAN(move, piece, capturedPiece) {
    if (move.isCastling === 'k') return 'O-O';
    if (move.isCastling === 'q') return 'O-O-O';

    let san = '';
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    if (piece.type !== 'p') {
      san += piece.type.toUpperCase();
      // Disambiguation if multiple same pieces can move to target
      const samePieceMoves = this.getLegalMoves(this.turn).filter(m =>
        m.to.row === move.to.row &&
        m.to.col === move.to.col &&
        (m.from.row !== move.from.row || m.from.col !== move.from.col) &&
        this.board[m.from.row][m.from.col]?.type === piece.type
      );
      if (samePieceMoves.length > 0) {
        const sameFile = samePieceMoves.some(m => m.from.col === move.from.col);
        const sameRank = samePieceMoves.some(m => m.from.row === move.from.row);
        if (!sameFile) {
          san += files[move.from.col];
        } else if (!sameRank) {
          san += ranks[move.from.row];
        } else {
          san += files[move.from.col] + ranks[move.from.row];
        }
      }
    } else if (capturedPiece || move.isEnPassant) {
      san += files[move.from.col];
    }

    if (capturedPiece || move.isEnPassant) {
      san += 'x';
    }

    san += files[move.to.col] + ranks[move.to.row];

    if (move.promotion) {
      san += '=' + move.promotion.toUpperCase();
    }

    return san;
  }

  makeMove(moveInput) {
    // moveInput: { from: {row, col}, to: {row, col}, promotion?: 'q'|'r'|'b'|'n' }
    const legalMoves = this.getMovesForSquare(moveInput.from.row, moveInput.from.col);
    const matchedMove = legalMoves.find(m =>
      m.to.row === moveInput.to.row &&
      m.to.col === moveInput.to.col &&
      (!moveInput.promotion || m.promotion === moveInput.promotion)
    );

    if (!matchedMove) {
      return { success: false, reason: 'Illegal move' };
    }

    const color = this.turn;
    const opponent = color === 'w' ? 'b' : 'w';
    const piece = this.board[matchedMove.from.row][matchedMove.from.col];
    let capturedPiece = this.board[matchedMove.to.row][matchedMove.to.col];
    const previousCastling = {
      w: { ...this.castling.w },
      b: { ...this.castling.b }
    };
    const previousEnPassant = this.enPassant ? { ...this.enPassant } : null;
    const previousHalfmoveClock = this.halfmoveClock;
    const fenBefore = this.exportFEN();

    // Handle En Passant capture removal
    if (matchedMove.isEnPassant) {
      const epRow = color === 'w' ? matchedMove.to.row + 1 : matchedMove.to.row - 1;
      capturedPiece = this.board[epRow][matchedMove.to.col];
      this.board[epRow][matchedMove.to.col] = null;
    }

    // Move piece on board
    this.board[matchedMove.from.row][matchedMove.from.col] = null;
    const finalPiece = matchedMove.promotion
      ? { type: matchedMove.promotion, color }
      : piece;
    this.board[matchedMove.to.row][matchedMove.to.col] = finalPiece;

    // Handle Castling Rook move
    if (matchedMove.isCastling === 'k') {
      const rookRow = color === 'w' ? 7 : 0;
      const rook = this.board[rookRow][7];
      this.board[rookRow][7] = null;
      this.board[rookRow][5] = rook;
    } else if (matchedMove.isCastling === 'q') {
      const rookRow = color === 'w' ? 7 : 0;
      const rook = this.board[rookRow][0];
      this.board[rookRow][0] = null;
      this.board[rookRow][3] = rook;
    }

    // Update castling rights
    if (piece.type === 'k') {
      this.castling[color].k = false;
      this.castling[color].q = false;
    } else if (piece.type === 'r') {
      if (matchedMove.from.row === (color === 'w' ? 7 : 0)) {
        if (matchedMove.from.col === 0) this.castling[color].q = false;
        if (matchedMove.from.col === 7) this.castling[color].k = false;
      }
    }
    // If rook was captured on original square
    if (capturedPiece && capturedPiece.type === 'r') {
      if (matchedMove.to.row === (opponent === 'w' ? 7 : 0)) {
        if (matchedMove.to.col === 0) this.castling[opponent].q = false;
        if (matchedMove.to.col === 7) this.castling[opponent].k = false;
      }
    }

    // Update enPassant state
    if (matchedMove.isDoubleJump) {
      this.enPassant = {
        row: color === 'w' ? matchedMove.from.row - 1 : matchedMove.from.row + 1,
        col: matchedMove.from.col
      };
    } else {
      this.enPassant = null;
    }

    // Update 50-move clock
    if (piece.type === 'p' || capturedPiece) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    if (color === 'b') {
      this.fullmoveNumber++;
    }

    // Switch turn
    this.turn = opponent;

    // Generate SAN
    let san = this.generateSAN(matchedMove, piece, capturedPiece);

    // Check game state for new turn
    const opponentInCheck = this.isInCheck(this.turn);
    const opponentLegalMoves = this.getLegalMoves(this.turn);

    this.isCheck = opponentInCheck;
    if (opponentInCheck && opponentLegalMoves.length === 0) {
      this.isCheckmate = true;
      san += '#';
    } else if (!opponentInCheck && opponentLegalMoves.length === 0) {
      this.isStalemate = true;
      this.isDraw = true;
      this.drawReason = 'Stalemate';
    } else if (opponentInCheck) {
      san += '+';
    }

    // Check 50-move rule
    if (this.halfmoveClock >= 100) {
      this.isDraw = true;
      this.drawReason = '50-Move Rule';
    }

    // Check insufficient material
    if (this.isInsufficientMaterial()) {
      this.isDraw = true;
      this.drawReason = 'Insufficient Material';
    }

    // Record position for threefold repetition
    const fenAfter = this.exportFEN();
    const positionKey = fenAfter.split(' ').slice(0, 4).join(' ');
    this.positionHistory.push(positionKey);
    const repetitionCount = this.positionHistory.filter(p => p === positionKey).length;
    if (repetitionCount >= 3) {
      this.isDraw = true;
      this.drawReason = 'Threefold Repetition';
    }

    const recordedMove = {
      ...matchedMove,
      piece,
      captured: capturedPiece,
      san,
      fenBefore,
      fenAfter,
      prevCastling: previousCastling,
      prevEnPassant: previousEnPassant,
      prevHalfmoveClock: previousHalfmoveClock
    };

    this.moveHistory.push(recordedMove);

    return {
      success: true,
      move: recordedMove,
      isCheck: this.isCheck,
      isCheckmate: this.isCheckmate,
      isStalemate: this.isStalemate,
      isDraw: this.isDraw,
      drawReason: this.drawReason
    };
  }

  isInsufficientMaterial() {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p) pieces.push({ ...p, r, c });
      }
    }

    // King vs King
    if (pieces.length === 2) return true;

    // King + Bishop/Knight vs King
    if (pieces.length === 3) {
      return pieces.some(p => p.type === 'b' || p.type === 'n');
    }

    // King + Bishop vs King + Bishop (same square colors)
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === 'b');
      if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
        const color1 = (bishops[0].r + bishops[0].c) % 2;
        const color2 = (bishops[1].r + bishops[1].c) % 2;
        return color1 === color2;
      }
    }

    return false;
  }

  loadFEN(fen) {
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) return false;

    const [placement, turn, castling, enPassant, halfmove = '0', fullmove = '1'] = parts;

    // Clear board
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));

    const rows = placement.split('/');
    if (rows.length !== 8) return false;

    for (let r = 0; r < 8; r++) {
      let col = 0;
      for (const ch of rows[r]) {
        if (ch >= '1' && ch <= '8') {
          col += parseInt(ch, 10);
        } else {
          const color = ch === ch.toUpperCase() ? 'w' : 'b';
          const type = ch.toLowerCase();
          if (col < 8) {
            this.board[r][col] = { type, color };
            col++;
          }
        }
      }
    }

    this.turn = turn;
    this.castling = {
      w: { k: castling.includes('K'), q: castling.includes('Q') },
      b: { k: castling.includes('k'), q: castling.includes('q') }
    };

    if (enPassant !== '-') {
      const col = enPassant.charCodeAt(0) - 97;
      const rank = parseInt(enPassant[1], 10);
      const row = 8 - rank;
      this.enPassant = { row, col };
    } else {
      this.enPassant = null;
    }

    this.halfmoveClock = parseInt(halfmove, 10) || 0;
    this.fullmoveNumber = parseInt(fullmove, 10) || 1;
    this.isCheck = this.isInCheck(this.turn);
    this.positionHistory = [fen.split(' ').slice(0, 4).join(' ')];

    return true;
  }

  exportFEN() {
    let fen = '';
    // 1. Piece placement
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          const char = piece.type;
          fen += piece.color === 'w' ? char.toUpperCase() : char;
        }
      }
      if (emptyCount > 0) fen += emptyCount;
      if (r < 7) fen += '/';
    }

    // 2. Active color
    fen += ' ' + this.turn;

    // 3. Castling rights
    let castlingStr = '';
    if (this.castling.w.k) castlingStr += 'K';
    if (this.castling.w.q) castlingStr += 'Q';
    if (this.castling.b.k) castlingStr += 'k';
    if (this.castling.b.q) castlingStr += 'q';
    fen += ' ' + (castlingStr || '-');

    // 4. En passant
    if (this.enPassant) {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const rank = 8 - this.enPassant.row;
      fen += ' ' + files[this.enPassant.col] + rank;
    } else {
      fen += ' -';
    }

    // 5. Halfmove clock & Fullmove number
    fen += ` ${this.halfmoveClock} ${this.fullmoveNumber}`;

    return fen;
  }

  exportPGN(headers = {}) {
    const defaultHeaders = {
      Event: 'Neon Chess 2099 Tactical Showdown',
      Site: 'Cyber Grid Arena',
      Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      Round: '1',
      White: 'Player 1 (Neon Cyan)',
      Black: 'Player 2 (Crimson Magenta)',
      Result: this.isCheckmate ? (this.turn === 'w' ? '0-1' : '1-0') : (this.isDraw ? '1/2-1/2' : '*')
    };

    const finalHeaders = { ...defaultHeaders, ...headers };
    let pgn = '';
    for (const [key, value] of Object.entries(finalHeaders)) {
      pgn += `[${key} "${value}"]\n`;
    }
    pgn += '\n';

    let moveText = '';
    for (let i = 0; i < this.moveHistory.length; i++) {
      if (i % 2 === 0) {
        moveText += `${Math.floor(i / 2) + 1}. `;
      }
      moveText += `${this.moveHistory[i].san} `;
    }

    if (this.isCheckmate) {
      moveText += this.turn === 'w' ? '0-1' : '1-0';
    } else if (this.isDraw) {
      moveText += '1/2-1/2';
    } else {
      moveText += '*';
    }

    pgn += moveText.trim();
    return pgn;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChessEngine;
}
