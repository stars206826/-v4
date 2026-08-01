// Audio synth for playing alarm and reminder ringtones on modern web browsers

class ReminderAudioPlayer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Plays an energetic Android-style double-chime reminder melody
  public playChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // First Note (E5 - 659.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Second Note (G#5 - 830.61 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.15);
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);

      // Third Note (B5 - 987.77 Hz)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(987.77, now + 0.32);
      gain3.gain.setValueAtTime(0, now + 0.32);
      gain3.gain.linearRampToValueAtTime(0.35, now + 0.37);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.32);
      osc3.stop(now + 0.95);

    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Repeating alarm sound for persistent popup alarm until dismissed
  public playAlarmLoop(onStopRef?: { current: boolean }): () => void {
    try {
      this.initCtx();
      if (!this.ctx) return () => {};

      let isPlaying = true;
      let timer: number | null = null;

      const playSequence = () => {
        if (!isPlaying || (onStopRef && onStopRef.current)) return;
        this.playChime();
        timer = window.setTimeout(playSequence, 1500);
      };

      playSequence();

      return () => {
        isPlaying = false;
        if (timer) window.clearTimeout(timer);
      };
    } catch {
      return () => {};
    }
  }
}

export const audioPlayer = new ReminderAudioPlayer();
