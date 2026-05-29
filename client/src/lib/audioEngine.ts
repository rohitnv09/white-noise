interface AudioChannel {
  id: string;
  audio: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode;
  gainNode: GainNode;
  isPlaying: boolean;
  isLoading: boolean;
  stopTimer: number | null;
}

const FADE_DURATION = 0.5;
const RAMP_TIME = 0.05;

export class NatureAudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private channels = new Map<string, AudioChannel>();

  private initContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.75;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);
    }
    return this.context;
  }

  private async ensureResumed(): Promise<AudioContext> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }

  private getOrCreateChannel(ctx: AudioContext, soundId: string): AudioChannel {
    let channel = this.channels.get(soundId);
    if (!channel) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.loop = true;
      audio.preload = 'auto';

      const sourceNode = ctx.createMediaElementSource(audio);
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      sourceNode.connect(gainNode);
      gainNode.connect(this.masterGain!);

      channel = {
        id: soundId,
        audio,
        sourceNode,
        gainNode,
        isPlaying: false,
        isLoading: false,
        stopTimer: null,
      };
      this.channels.set(soundId, channel);
    }
    return channel;
  }

  async play(soundId: string, url: string, volume: number): Promise<void> {
    const ctx = await this.ensureResumed();
    const channel = this.getOrCreateChannel(ctx, soundId);

    if (channel.isPlaying) return;

    if (channel.stopTimer !== null) {
      window.clearTimeout(channel.stopTimer);
      channel.stopTimer = null;
    }

    channel.isLoading = true;
    if (channel.audio.src !== url) {
      channel.audio.src = url;
      channel.audio.load();
    }

    const now = ctx.currentTime;
    channel.gainNode.gain.cancelScheduledValues(now);
    channel.gainNode.gain.setValueAtTime(0, now);
    channel.gainNode.gain.linearRampToValueAtTime(volume, now + FADE_DURATION);

    try {
      await channel.audio.play();
      channel.isPlaying = true;
    } finally {
      channel.isLoading = false;
    }
  }

  stop(soundId: string): void {
    const channel = this.channels.get(soundId);
    if (!channel?.isPlaying || !this.context) return;

    const ctx = this.context;
    const gain = channel.gainNode;
    const now = ctx.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + FADE_DURATION);

    channel.isPlaying = false;

    channel.stopTimer = window.setTimeout(() => {
      channel.audio.pause();
      channel.stopTimer = null;
    }, FADE_DURATION * 1000 + 50);
  }

  setVolume(soundId: string, volume: number): void {
    const channel = this.channels.get(soundId);
    if (!channel || !this.context) return;

    const now = this.context.currentTime;
    channel.gainNode.gain.cancelScheduledValues(now);
    channel.gainNode.gain.setValueAtTime(channel.gainNode.gain.value, now);
    channel.gainNode.gain.linearRampToValueAtTime(volume, now + RAMP_TIME);
  }

  setMasterVolume(volume: number): void {
    if (!this.masterGain || !this.context) return;

    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(volume, now + RAMP_TIME);
  }

  getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  isChannelPlaying(soundId: string): boolean {
    return this.channels.get(soundId)?.isPlaying ?? false;
  }

  isChannelLoading(soundId: string): boolean {
    return this.channels.get(soundId)?.isLoading ?? false;
  }

  dispose(): void {
    for (const channel of this.channels.values()) {
      if (channel.stopTimer !== null) {
        window.clearTimeout(channel.stopTimer);
      }
      channel.audio.pause();
      channel.audio.removeAttribute('src');
      channel.audio.load();
      channel.sourceNode.disconnect();
      channel.gainNode.disconnect();
    }
    this.channels.clear();
    if (this.context) {
      void this.context.close();
      this.context = null;
      this.masterGain = null;
      this.analyser = null;
    }
  }
}
