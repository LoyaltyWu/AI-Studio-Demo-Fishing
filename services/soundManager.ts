
class SoundManager {
  private audioCtx: AudioContext | null = null;

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playCast() {
    this.playTone(400, 'sine', 0.2, 0.05);
    setTimeout(() => this.playTone(300, 'sine', 0.1, 0.03), 100);
  }

  playBite() {
    // Ringing bell sound
    this.playTone(880, 'triangle', 0.1, 0.1);
    setTimeout(() => this.playTone(880, 'triangle', 0.1, 0.1), 150);
  }

  playHook() {
    this.playTone(200, 'square', 0.1, 0.05);
  }

  playSplash() {
    this.playTone(150, 'sine', 0.5, 0.1);
  }

  playCollect() {
    this.playTone(523, 'sine', 0.1, 0.1); // C5
    setTimeout(() => this.playTone(659, 'sine', 0.1, 0.1), 100); // E5
    setTimeout(() => this.playTone(783, 'sine', 0.1, 0.1), 200); // G5
  }

  playUnlock() {
    this.playTone(1046, 'sine', 0.3, 0.1);
  }

  playCoin() {
    this.playTone(1500, 'sine', 0.05, 0.05);
  }
}

export const sounds = new SoundManager();
