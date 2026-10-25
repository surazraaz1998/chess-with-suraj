/**
 * CYBER CHESS 2099 - Web Audio Sound Synthesizer
 * Generates rich futuristic sci-fi sound effects using pure Web Audio API.
 * No external audio files or network requests needed.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('cyberchess_muted') === 'true';
    this.volume = 0.6;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('cyberchess_muted', muted ? 'true' : 'false');
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playMove() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playCapture() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Sub bass punch
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    subGain.gain.setValueAtTime(this.volume * 0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.28);

    // Laser discharge
    const laserOsc = this.ctx.createOscillator();
    const laserGain = this.ctx.createGain();
    laserOsc.type = 'sawtooth';
    laserOsc.frequency.setValueAtTime(980, t);
    laserOsc.frequency.exponentialRampToValueAtTime(180, t + 0.18);
    laserGain.gain.setValueAtTime(this.volume * 0.35, t);
    laserGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    laserOsc.connect(laserGain);
    laserGain.connect(this.ctx.destination);
    laserOsc.start(t);
    laserOsc.stop(t + 0.2);
  }

  playCastle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.exponentialRampToValueAtTime(640, t + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(480, t + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(960, t + 0.22);

    gain.gain.setValueAtTime(this.volume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.16);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.28);
  }

  playCheck() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [700, 950, 1200];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.volume * 0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  playCheckmate() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chord = [392, 523.25, 659.25, 783.99, 1046.5]; // G, C, E, G, C (Epic Cyber Chords)

    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(this.volume * 0.45, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.85);
    });
  }

  playSelect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, t);

    gain.gain.setValueAtTime(this.volume * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  playIllegal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.setValueAtTime(110, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  playLowTimeAlert() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);

    gain.gain.setValueAtTime(this.volume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

window.soundSynth = new SoundSynthesizer();
