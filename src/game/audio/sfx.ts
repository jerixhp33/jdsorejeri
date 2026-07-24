class SFX {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ac(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  init() {
    if (typeof window !== 'undefined') {
      this.ac();
    }
  }

  private t(f: number, d: number, type: OscillatorType = 'sine', v = 0.1) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const c = this.ac();
      const o = c.createOscillator();
      const g = c.createGain();
      
      o.type = type;
      o.frequency.setValueAtTime(f, c.currentTime);
      
      g.gain.setValueAtTime(v, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
      
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + d);
    } catch (e) {
      // Ignore audio errors
    }
  }

  swap() { this.t(523, 0.06); setTimeout(() => this.t(659, 0.06), 35); }
  match(combo: number) {
    const b = 523 + combo * 80;
    this.t(b, 0.12, 'sine', 0.12);
    setTimeout(() => this.t(b * 1.25, 0.12, 'sine', 0.12), 50);
    setTimeout(() => this.t(b * 1.5, 0.15, 'triangle', 0.08), 100);
  }
  cascade() { [880, 1100, 1320].forEach((f, i) => setTimeout(() => this.t(f, 0.08, 'triangle', 0.06), i * 45)); }
  special() {
    [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => this.t(f, 0.15, 'sine', 0.1), i * 60));
  }
  bomb() {
    this.t(150, 0.4, 'sawtooth', 0.1);
    setTimeout(() => this.t(100, 0.3, 'square', 0.06), 50);
    [600, 800, 1000, 1200].forEach((f, i) => setTimeout(() => this.t(f, 0.1, 'sine', 0.05), i * 30 + 100));
  }
  fail() { this.t(200, 0.1, 'square', 0.04); setTimeout(() => this.t(160, 0.12, 'square', 0.04), 50); }
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.t(f, 0.25, 'sine', 0.1), i * 90)); }
  lose() { [392, 349, 330, 262].forEach((f, i) => setTimeout(() => this.t(f, 0.3, 'sine', 0.08), i * 120)); }
  booster() { this.t(1047, 0.15, 'sine', 0.1); setTimeout(() => this.t(1318, 0.2, 'sine', 0.1), 80); }
  tap() { this.t(800, 0.03, 'sine', 0.05); }
}

export const sfx = new SFX();
