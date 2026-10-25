/**
 * CYBER CHESS 2099 - Modern & Iconic Chess Pieces
 * Universal, clean, high-contrast Staunton vector designs that look
 * crystal clear and user-friendly on both mobile screens and desktop displays.
 * Supports Modern Classic style and Neon Cyber style.
 */

const ChessPiecesSVG = {
  style: 'classic', // 'classic' or 'cyber'

  setStyle(style) {
    this.style = style;
  },

  getPieceSVG(type, color) {
    if (this.style === 'cyber') {
      return this.getCyberPieceSVG(type, color);
    }
    return this.getClassicPieceSVG(type, color);
  },

  // --- Clean, High-Contrast Modern Classic Staunton Pieces ---
  getClassicPieceSVG(type, color) {
    const isWhite = color === 'w';
    const fill = isWhite ? '#ffffff' : '#222831';
    const stroke = isWhite ? '#1e293b' : '#f8fafc';
    const innerAccent = isWhite ? '#e2e8f0' : '#393e46';
    const strokeWidth = 1.5;

    let pathContent = '';

    switch (type) {
      case 'p': // PAWN
        pathContent = `
          <!-- Base -->
          <path d="M 22 82 L 78 82 L 72 74 L 28 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Pedestal -->
          <path d="M 32 74 Q 40 56 42 46 L 58 46 Q 60 56 68 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <ellipse cx="50" cy="46" rx="14" ry="4" fill="${innerAccent}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <!-- Head -->
          <circle cx="50" cy="30" r="14" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <circle cx="46" cy="26" r="3.5" fill="${isWhite ? '#ffffff' : '#4b5563'}" opacity="0.6" />
        `;
        break;

      case 'r': // ROOK
        pathContent = `
          <!-- Base -->
          <path d="M 20 84 L 80 84 L 74 74 L 26 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Tower Body -->
          <path d="M 28 74 L 32 38 L 68 38 L 72 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <path d="M 32 54 L 68 54" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <!-- Crenels Top -->
          <path d="M 24 38 L 24 22 L 35 22 L 35 29 L 45 29 L 45 22 L 55 22 L 55 29 L 65 29 L 65 22 L 76 22 L 76 38 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
        `;
        break;

      case 'n': // KNIGHT
        pathContent = `
          <!-- Base -->
          <path d="M 22 84 L 78 84 L 72 74 L 28 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Horse Contour -->
          <path d="M 28 74 C 28 62, 33 52, 26 44 C 21 37, 23 31, 30 30 C 34 30, 38 34, 42 32 C 40 25, 43 18, 50 16 C 54 15, 57 20, 60 21 C 65 18, 70 20, 73 25 C 77 34, 75 46, 74 54 C 73 63, 74 70, 72 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Eye & Mane -->
          <circle cx="36" cy="38" r="2.5" fill="${stroke}" />
          <path d="M 54 28 C 50 36, 52 48, 48 54" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" />
          <path d="M 64 32 C 60 40, 62 50, 60 58" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" />
        `;
        break;

      case 'b': // BISHOP
        pathContent = `
          <!-- Base -->
          <path d="M 22 84 L 78 84 L 72 74 L 28 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Stem -->
          <path d="M 32 74 Q 40 56 42 48 L 58 48 Q 60 56 68 74 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <ellipse cx="50" cy="48" rx="16" ry="4" fill="${innerAccent}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <!-- Mitre Cap -->
          <path d="M 33 48 C 29 34, 38 20, 50 14 C 62 20, 71 34, 67 48 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Slit -->
          <path d="M 46 22 L 56 34" stroke="${stroke}" stroke-width="${strokeWidth * 1.5}" stroke-linecap="round" />
          <!-- Top Ball -->
          <circle cx="50" cy="12" r="3.5" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        `;
        break;

      case 'q': // QUEEN
        pathContent = `
          <!-- Base -->
          <path d="M 18 85 L 82 85 L 75 75 L 25 75 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Body -->
          <path d="M 28 75 Q 38 54 40 44 L 60 44 Q 62 54 72 75 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <ellipse cx="50" cy="44" rx="18" ry="4.5" fill="${innerAccent}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <!-- Crown -->
          <path d="M 30 43 L 20 25 L 34 32 L 50 18 L 66 32 L 80 25 L 70 43 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Crown pearls -->
          <circle cx="20" cy="23" r="3" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <circle cx="34" cy="30" r="2.5" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <circle cx="50" cy="16" r="3.5" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <circle cx="66" cy="30" r="2.5" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <circle cx="80" cy="23" r="3" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        `;
        break;

      case 'k': // KING
        pathContent = `
          <!-- Base -->
          <path d="M 18 85 L 82 85 L 75 75 L 25 75 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Body -->
          <path d="M 28 75 Q 37 54 38 42 L 62 42 Q 63 54 72 75 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <ellipse cx="50" cy="42" rx="20" ry="5" fill="${innerAccent}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <!-- Crown Dome -->
          <path d="M 28 42 C 26 28, 36 22, 50 22 C 64 22, 74 28, 72 42 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
          <!-- Cross on top -->
          <path d="M 47 8 L 53 8 L 53 14 L 59 14 L 59 18 L 53 18 L 53 23 L 47 23 L 47 18 L 41 18 L 41 14 L 47 14 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
        `;
        break;
    }

    return `
      <svg viewBox="0 0 100 100" class="chess-piece-svg piece-${color}${type}" xmlns="http://www.w3.org/2000/svg">
        <filter id="piece-shadow-${color}" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)" />
        </filter>
        <g filter="url(#piece-shadow-${color})">
          ${pathContent}
        </g>
      </svg>
    `;
  },

  // --- Cyber Neon Pieces Alternative ---
  getCyberPieceSVG(type, color) {
    const isWhite = color === 'w';
    const mainStroke = isWhite ? '#00f3ff' : '#ff007f';
    const bodyFill = isWhite ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 0, 127, 0.15)';
    const coreAccent = isWhite ? '#00f3ff' : '#ff007f';
    const highlight = '#ffffff';

    let paths = '';
    switch (type) {
      case 'p':
        paths = `
          <path d="M 24 82 L 76 82 L 70 74 L 30 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 32 74 Q 40 54 42 46 L 58 46 Q 60 54 68 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <circle cx="50" cy="30" r="14" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2.2" />
          <circle cx="50" cy="30" r="5" fill="${highlight}" />
        `;
        break;
      case 'r':
        paths = `
          <path d="M 22 84 L 78 84 L 72 74 L 28 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 30 74 L 34 38 L 66 38 L 70 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 25 38 L 25 20 L 36 20 L 36 26 L 45 26 L 45 20 L 55 20 L 55 26 L 64 26 L 64 20 L 75 20 L 75 38 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <circle cx="50" cy="54" r="4" fill="${highlight}" />
        `;
        break;
      case 'n':
        paths = `
          <path d="M 22 84 L 78 84 L 72 74 L 28 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 30 74 C 30 62, 34 52, 28 44 C 23 37, 25 31, 32 30 C 36 30, 39 34, 43 32 C 42 27, 44 20, 50 18 C 53 17, 56 22, 59 23 C 63 20, 68 22, 71 27 C 76 35, 74 46, 73 54 C 72 63, 73 70, 71 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2.2" />
          <circle cx="38" cy="38" r="3" fill="${highlight}" />
        `;
        break;
      case 'b':
        paths = `
          <path d="M 22 84 L 78 84 L 72 74 L 28 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 32 74 Q 40 56 42 48 L 58 48 Q 60 56 68 74 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 34 48 C 30 36, 38 22, 50 16 C 62 22, 70 36, 66 48 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2.2" />
          <circle cx="50" cy="14" r="4" fill="${coreAccent}" stroke="${highlight}" stroke-width="1.2" />
        `;
        break;
      case 'q':
        paths = `
          <path d="M 18 85 L 82 85 L 75 75 L 25 75 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 28 75 Q 38 54 40 44 L 60 44 Q 62 54 72 75 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 30 43 L 20 25 L 34 32 L 50 18 L 66 32 L 80 25 L 70 43 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2.2" />
          <circle cx="50" cy="18" r="4" fill="${highlight}" />
        `;
        break;
      case 'k':
        paths = `
          <path d="M 18 85 L 82 85 L 75 75 L 25 75 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 28 75 Q 37 54 38 42 L 62 42 Q 63 54 72 75 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2" />
          <path d="M 28 42 C 26 30, 36 23, 50 23 C 64 23, 74 30, 72 42 Z" fill="${bodyFill}" stroke="${mainStroke}" stroke-width="2.2" />
          <rect x="47.5" y="7" width="5" height="15" rx="1.5" fill="${coreAccent}" />
          <rect x="42" y="11" width="16" height="5" rx="1.5" fill="${coreAccent}" />
        `;
        break;
    }

    return `
      <svg viewBox="0 0 100 100" class="chess-piece-svg piece-${color}${type} piece-cyber" xmlns="http://www.w3.org/2000/svg">
        <g class="piece-group">
          ${paths}
        </g>
      </svg>
    `;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChessPiecesSVG;
}
