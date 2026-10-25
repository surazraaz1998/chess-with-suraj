/**
 * CYBER CHESS 2099 - Cyberpunk Canvas Particle & Grid Background
 * Render perspective synthwave grid, glowing star motes, and interactive energy waves.
 */

class CyberBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 55;
    this.mouse = { x: -1000, y: -1000, radius: 150 };
    this.gridOffset = 0;
    this.running = true;

    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.15,
        color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f',
        alpha: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.01
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
    document.addEventListener('visibilitychange', () => {
      this.running = !document.hidden;
      if (this.running) this.animate();
    });
  }

  drawGrid() {
    const horizonY = this.height * 0.45;
    const gridSpacing = 45;

    this.gridOffset = (this.gridOffset + 0.4) % gridSpacing;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
    this.ctx.lineWidth = 1;

    // Horizontal receding lines
    for (let y = horizonY; y < this.height; y += gridSpacing) {
      const screenY = y + this.gridOffset;
      if (screenY > this.height) continue;
      const progress = (screenY - horizonY) / (this.height - horizonY);
      this.ctx.strokeStyle = `rgba(0, 243, 255, ${0.03 + progress * 0.12})`;
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.width, screenY);
      this.ctx.stroke();
    }

    // Perspective vanishing lines
    const vpX = this.width * 0.5;
    const lines = 24;
    for (let i = -lines; i <= lines; i++) {
      const bottomX = vpX + i * 90;
      this.ctx.beginPath();
      this.ctx.moveTo(vpX, horizonY);
      this.ctx.lineTo(bottomX, this.height);
      this.ctx.stroke();
    }

    // Top subtle ambient glow
    const grad = this.ctx.createRadialGradient(
      this.width * 0.5, horizonY, 10,
      this.width * 0.5, horizonY, this.width * 0.7
    );
    grad.addColorStop(0, 'rgba(255, 0, 127, 0.12)');
    grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.restore();
  }

  animate() {
    if (!this.running) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawGrid();

    // Render particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse repulsion
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        p.x -= (dx / dist) * force * 3;
        p.y -= (dy / dist) * force * 3;
      }

      p.alpha += Math.sin(Date.now() * 0.002 + i) * 0.005;
      const alpha = Math.max(0.15, Math.min(0.85, p.alpha));

      this.ctx.save();
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.CyberBackground = CyberBackground;
