const MUTE_STORAGE_KEY = 'rasael_sound_muted';

class SoundLibrary {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    } catch {
      this.muted = false;
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(mute));
    } catch {
      // Ignore storage errors
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playClick();
    }
    return this.muted;
  }

  private playTone(
    freq: number,
    startOffset: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'triangle'
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** Soft marimba tap for interactive clicks and dhikr counter */
  public playClick(): void {
    this.playTone(587.33, 0, 0.09, 0.12, 'triangle'); // D5
  }

  /** Warm encouraging chime when answering a step correctly */
  public playSuccess(): void {
    this.playTone(523.25, 0, 0.16, 0.14, 'triangle'); // C5
    this.playTone(659.25, 0.09, 0.18, 0.14, 'triangle'); // E5
    this.playTone(783.99, 0.18, 0.28, 0.16, 'sine'); // G5
  }

  /** Joyful light celebration fanfare when completing a challenge or earning stars */
  public playCelebration(): void {
    const notes = [523.25, 659.25, 783.99, 880.0, 1046.5]; // C5 E5 G5 A5 C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, idx * 0.085, idx === notes.length - 1 ? 0.42 : 0.18, 0.15, 'triangle');
    });
  }

  /** Sparkly star pickup sound */
  public playStar(): void {
    this.playTone(783.99, 0, 0.14, 0.12, 'sine'); // G5
    this.playTone(1046.5, 0.07, 0.26, 0.14, 'sine'); // C6
  }

  /** Gentle soft nudge when child needs another try (never harsh) */
  public playNudge(): void {
    this.playTone(392.0, 0, 0.16, 0.1, 'sine'); // G4
    this.playTone(329.63, 0.11, 0.22, 0.1, 'sine'); // E4
  }
}

export const soundFX = new SoundLibrary();
