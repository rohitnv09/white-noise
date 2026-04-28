interface AudioChannel {
  id: string;
  buffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
  isLoading: boolean;
}

const FADE_DURATION = 0.5;
const RAMP_TIME = 0.05;

export class NatureAudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private channels = new Map<string, AudioChannel>();
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer>>();

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
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(this.masterGain!);
      channel = {
        id: soundId,
        buffer: null,
        sourceNode: null,
        gainNode,
        isPlaying: false,
        isLoading: false,
      };
      this.channels.set(soundId, channel);
    }
    return channel;
  }

  private async loadSound(ctx: AudioContext, soundId: string, url: string): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(soundId);
    if (cached) return cached;

    const existing = this.loadingPromises.get(soundId);
    if (existing) return existing;

    const promise = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.bufferCache.set(soundId, audioBuffer);
        this.loadingPromises.delete(soundId);
        return audioBuffer;
      })
      .catch(err => {
        this.loadingPromises.delete(soundId);
        throw err;
      });

    this.loadingPromises.set(soundId, promise);
    return promise;
  }

  async play(soundId: string, url: string, volume: number): Promise<void> {
    const ctx = await this.ensureResumed();
    const channel = this.getOrCreateChannel(ctx, soundId);

    if (channel.isPlaying) return;

    channel.isLoading = true;
    const buffer = await this.loadSound(ctx, soundId, url);
    channel.buffer = buffer;
    channel.isLoading = false;

    // Re-check after async gap — user may have toggled off while loading
    if (!this.channels.has(soundId)) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(channel.gainNode);

    const now = ctx.currentTime;
    channel.gainNode.gain.cancelScheduledValues(now);
    channel.gainNode.gain.setValueAtTime(0, now);
    channel.gainNode.gain.linearRampToValueAtTime(volume, now + FADE_DURATION);

    source.start(0);
    channel.sourceNode = source;
    channel.isPlaying = true;

    source.onended = () => {
      if (channel.sourceNode === source) {
        channel.isPlaying = false;
        channel.sourceNode = null;
      }
    };
  }

  stop(soundId: string): void {
    const channel = this.channels.get(soundId);
    if (!channel?.isPlaying || !channel.sourceNode || !this.context) return;

    const ctx = this.context;
    const source = channel.sourceNode;
    const gain = channel.gainNode;
    const now = ctx.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + FADE_DURATION);

    channel.isPlaying = false;
    channel.sourceNode = null;

    setTimeout(() => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source may already be stopped
      }
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
      if (channel.sourceNode) {
        try {
          channel.sourceNode.stop();
          channel.sourceNode.disconnect();
        } catch {
          // Ignore
        }
      }
      channel.gainNode.disconnect();
    }
    this.channels.clear();
    this.bufferCache.clear();
    this.loadingPromises.clear();
    if (this.context) {
      void this.context.close();
      this.context = null;
      this.masterGain = null;
      this.analyser = null;
    }
  }
}
