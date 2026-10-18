import { VoiceFilterSettings, ExportAudioFormat } from '../types/audio';
import * as lamejsModule from '@breezystack/lamejs';

// Resolve lamejs Mp3Encoder
const LameMp3Encoder = (lamejsModule as any).Mp3Encoder || (lamejsModule as any).default?.Mp3Encoder;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private voiceBuffer: AudioBuffer | null = null;

  // Active playing source
  private voiceSource: AudioBufferSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // Playback state
  private isPlaying: boolean = false;
  private isRecording: boolean = false;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // DSP Rack Nodes
  private inputGain: GainNode | null = null;
  private noiseGateGain: GainNode | null = null;
  private lowCutFilter: BiquadFilterNode | null = null;
  private deEsserFilter: BiquadFilterNode | null = null;
  private eqWarmthFilter: BiquadFilterNode | null = null;
  private eqClarityFilter: BiquadFilterNode | null = null;
  private eqPresenceFilter: BiquadFilterNode | null = null;
  private eqAirFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private saturator: WaveShaperNode | null = null;
  private voiceGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Spatial & Reverb Nodes
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private delayWetGain: GainNode | null = null;

  // Visualizer Analyser
  private masterAnalyser: AnalyserNode | null = null;

  // Current settings
  public settings: VoiceFilterSettings;

  // Listeners
  public onPlaybackEnd?: () => void;
  public onRecordingComplete?: (buffer: AudioBuffer) => void;
  public onAudioMetricsUpdate?: (metrics: { rmsDb: number; peakDb: number }) => void;

  constructor(initialSettings: VoiceFilterSettings) {
    this.settings = { ...initialSettings };
  }

  public async init(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.buildGraph();
    this.applySettings(this.settings);
    this.startMetricsLoop();
  }

  private buildGraph(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Create Audio Nodes
    this.inputGain = ctx.createGain();
    this.noiseGateGain = ctx.createGain();

    // 1. Low Cut HPF (Rumble / Pops removal)
    this.lowCutFilter = ctx.createBiquadFilter();
    this.lowCutFilter.type = 'highpass';
    this.lowCutFilter.frequency.value = this.settings.lowCutFrequency;

    // 2. De-Esser (Notch cut at 6500Hz)
    this.deEsserFilter = ctx.createBiquadFilter();
    this.deEsserFilter.type = 'peaking';
    this.deEsserFilter.frequency.value = 6500;
    this.deEsserFilter.Q.value = 2.2;

    // 3. 4-Band Parametric EQ
    // 3a. Warmth (Low shelf at 200Hz)
    this.eqWarmthFilter = ctx.createBiquadFilter();
    this.eqWarmthFilter.type = 'lowshelf';
    this.eqWarmthFilter.frequency.value = 200;

    // 3b. Clarity / Articulation (Peaking at 850Hz)
    this.eqClarityFilter = ctx.createBiquadFilter();
    this.eqClarityFilter.type = 'peaking';
    this.eqClarityFilter.frequency.value = 850;
    this.eqClarityFilter.Q.value = 1.0;

    // 3c. Presence / Intelligibility (Peaking at 3500Hz)
    this.eqPresenceFilter = ctx.createBiquadFilter();
    this.eqPresenceFilter.type = 'peaking';
    this.eqPresenceFilter.frequency.value = 3500;
    this.eqPresenceFilter.Q.value = 1.2;

    // 3d. Air & Sheen (High shelf at 10000Hz)
    this.eqAirFilter = ctx.createBiquadFilter();
    this.eqAirFilter.type = 'highshelf';
    this.eqAirFilter.frequency.value = 10000;

    // 4. Broadcast Dynamics Compressor
    this.compressor = ctx.createDynamicsCompressor();

    // 5. Analog Tube Saturator
    this.saturator = ctx.createWaveShaper();
    this.updateSaturationCurve();

    // 6. Studio Room Reverb
    this.reverbConvolver = ctx.createConvolver();
    this.generateReverbImpulse(this.settings.reverbType, this.settings.reverbDecay);
    this.reverbWetGain = ctx.createGain();

    // 7. Stereo Delay / Slapback
    this.delayNode = ctx.createDelay(1.5);
    this.delayFeedbackGain = ctx.createGain();
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = 4000;
    this.delayWetGain = ctx.createGain();

    // 8. Voice Gain & Master Gain
    this.voiceGain = ctx.createGain();
    this.masterGain = ctx.createGain();

    // 9. Master Analyser
    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.85;

    // Connect DSP Chain:
    // inputGain -> noiseGateGain -> lowCutFilter -> deEsserFilter -> eqWarmthFilter -> eqClarityFilter -> eqPresenceFilter -> eqAirFilter -> compressor -> saturator
    this.inputGain.connect(this.noiseGateGain);
    this.noiseGateGain.connect(this.lowCutFilter);
    this.lowCutFilter.connect(this.deEsserFilter);
    this.deEsserFilter.connect(this.eqWarmthFilter);
    this.eqWarmthFilter.connect(this.eqClarityFilter);
    this.eqClarityFilter.connect(this.eqPresenceFilter);
    this.eqPresenceFilter.connect(this.eqAirFilter);
    this.eqAirFilter.connect(this.compressor);
    this.compressor.connect(this.saturator);

    // Dry signal from saturator -> voiceGain
    this.saturator.connect(this.voiceGain);

    // Wet signal: Reverb
    this.saturator.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWetGain);
    this.reverbWetGain.connect(this.voiceGain);

    // Wet signal: Delay
    this.saturator.connect(this.delayNode);
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayFilter.connect(this.delayWetGain);
    this.delayWetGain.connect(this.voiceGain);

    // voiceGain -> masterGain -> masterAnalyser -> destination
    this.voiceGain.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(ctx.destination);
  }

  public applySettings(settings: VoiceFilterSettings): void {
    this.settings = { ...settings };
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Master / Voice Gain
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(settings.masterVolume, now, 0.02);
    if (this.voiceGain) this.voiceGain.gain.setTargetAtTime(settings.voiceGain, now, 0.02);

    // Low Cut Filter
    if (this.lowCutFilter) {
      const freq = settings.noiseGateEnabled ? Math.max(settings.lowCutFrequency, 50) : 20;
      this.lowCutFilter.frequency.setTargetAtTime(freq, now, 0.02);
    }

    // De-Esser Notch
    if (this.deEsserFilter) {
      const deEssGain = settings.deEsserEnabled ? -(settings.deEsserAmount / 100) * 12 : 0;
      this.deEsserFilter.gain.setTargetAtTime(deEssGain, now, 0.02);
    }

    // 4-Band Speech EQ
    if (this.eqWarmthFilter) {
      this.eqWarmthFilter.gain.setTargetAtTime(settings.eqEnabled ? settings.eqWarmth : 0, now, 0.02);
    }
    if (this.eqClarityFilter) {
      this.eqClarityFilter.gain.setTargetAtTime(settings.eqEnabled ? settings.eqClarity : 0, now, 0.02);
    }
    if (this.eqPresenceFilter) {
      this.eqPresenceFilter.gain.setTargetAtTime(settings.eqEnabled ? settings.eqPresence : 0, now, 0.02);
    }
    if (this.eqAirFilter) {
      this.eqAirFilter.gain.setTargetAtTime(settings.eqEnabled ? settings.eqAir : 0, now, 0.02);
    }

    // Compressor
    if (this.compressor) {
      if (settings.compressorEnabled) {
        this.compressor.threshold.setTargetAtTime(settings.compressorThreshold, now, 0.02);
        this.compressor.ratio.setTargetAtTime(settings.compressorRatio, now, 0.02);
        this.compressor.attack.setTargetAtTime(settings.compressorAttack, now, 0.02);
        this.compressor.release.setTargetAtTime(settings.compressorRelease, now, 0.02);
      } else {
        this.compressor.threshold.setTargetAtTime(0, now, 0.02);
        this.compressor.ratio.setTargetAtTime(1, now, 0.02);
      }
    }

    // Tube Saturation
    this.updateSaturationCurve();

    // Reverb Wet
    if (this.reverbWetGain) {
      const wet = settings.reverbEnabled ? (settings.reverbWet / 100) : 0;
      this.reverbWetGain.gain.setTargetAtTime(wet, now, 0.03);
    }

    // Delay Wet & Feedback
    if (this.delayNode && this.delayFeedbackGain && this.delayWetGain) {
      const wet = settings.delayEnabled ? (settings.delayWet / 100) : 0;
      const feedback = settings.delayEnabled ? (settings.delayFeedback / 100) : 0;
      this.delayNode.delayTime.setTargetAtTime(settings.delayTime / 1000, now, 0.02);
      this.delayFeedbackGain.gain.setTargetAtTime(feedback, now, 0.02);
      this.delayWetGain.gain.setTargetAtTime(wet, now, 0.03);
    }
  }

  public generateReverbImpulse(type: 'Booth' | 'PodcastRoom' | 'Auditorium' | 'Cathedral', decaySeconds: number): void {
    if (!this.ctx || !this.reverbConvolver) return;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * Math.max(0.3, decaySeconds));
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    const decayConstant = decaySeconds * 1.6;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.exp(-t * (5.0 / decayConstant));
      const preDelayFactor = t < 0.015 ? 0.2 : 1.0;
      left[i] = (Math.random() * 2 - 1) * envelope * preDelayFactor;
      right[i] = (Math.random() * 2 - 1) * envelope * preDelayFactor;
    }
    this.reverbConvolver.buffer = impulse;
  }

  private updateSaturationCurve(): void {
    if (!this.saturator || !this.ctx) return;
    const drive = this.settings.saturationEnabled ? (this.settings.saturationDrive / 100) : 0;
    const nSamples = 2048;
    const curve = new Float32Array(nSamples);
    const k = drive * 6;
    for (let i = 0; i < nSamples; i++) {
      const x = (i * 2) / nSamples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
    }
    this.saturator.curve = curve;
  }

  private startMetricsLoop(): void {
    const checkMetrics = () => {
      if (this.masterAnalyser && (this.isPlaying || this.isRecording || this.settings.monitorMic)) {
        const buffer = new Float32Array(this.masterAnalyser.fftSize);
        this.masterAnalyser.getFloatTimeDomainData(buffer);

        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < buffer.length; i++) {
          const abs = Math.abs(buffer[i]);
          if (abs > peak) peak = abs;
          sumSquares += abs * abs;
        }

        const rms = Math.sqrt(sumSquares / buffer.length);
        const rmsDb = 20 * Math.log10(Math.max(1e-5, rms));
        const peakDb = 20 * Math.log10(Math.max(1e-5, peak));

        // Noise gate ducking
        if (this.noiseGateGain && this.ctx && this.settings.noiseGateEnabled) {
          const isSilent = rmsDb < this.settings.noiseGateThreshold;
          const targetGain = isSilent ? 0.01 : 1.0;
          this.noiseGateGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, isSilent ? 0.08 : 0.01);
        } else if (this.noiseGateGain && this.ctx) {
          this.noiseGateGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.01);
        }

        if (this.onAudioMetricsUpdate) {
          this.onAudioMetricsUpdate({ rmsDb, peakDb });
        }
      }
      requestAnimationFrame(checkMetrics);
    };
    requestAnimationFrame(checkMetrics);
  }

  // --- Voice Buffer Management ---
  public setVoiceBuffer(buffer: AudioBuffer): void {
    this.voiceBuffer = buffer;
  }

  public getVoiceBuffer(): AudioBuffer | null {
    return this.voiceBuffer;
  }

  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.init();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
    this.setVoiceBuffer(decoded);
    return decoded;
  }

  public async decodeAudioArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    await this.init();
    const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
    this.setVoiceBuffer(decoded);
    return decoded;
  }

  // --- Microphone Recording & Monitoring ---
  public async startMicMonitoring(): Promise<void> {
    await this.init();
    if (this.micStream) return;
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
        },
      });
      this.micSource = this.ctx!.createMediaStreamSource(this.micStream);
      if (this.inputGain) {
        this.micSource.connect(this.inputGain);
      }
    } catch (err) {
      console.error('Failed to get mic stream:', err);
      throw err;
    }
  }

  public stopMicMonitoring(): void {
    if (this.micSource && this.inputGain) {
      try { this.micSource.disconnect(); } catch (e) {}
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
  }

  public async startRecording(): Promise<void> {
    await this.init();
    if (this.isRecording) return;
    if (!this.micStream) {
      await this.startMicMonitoring();
    }
    if (!this.micStream) {
      throw new Error('Microphone stream unavailable');
    }
    this.recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    this.mediaRecorder = new MediaRecorder(this.micStream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    this.mediaRecorder.onstop = async () => {
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      const arrayBuf = await blob.arrayBuffer();
      const decoded = await this.ctx!.decodeAudioData(arrayBuf);
      this.voiceBuffer = decoded;
      this.isRecording = false;
      if (this.onRecordingComplete) {
        this.onRecordingComplete(decoded);
      }
    };
    this.mediaRecorder.start(100);
    this.isRecording = true;
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  // --- Playback Controls ---
  public async play(): Promise<void> {
    await this.init();
    if (!this.voiceBuffer) return;
    if (this.isPlaying) return;

    const ctx = this.ctx!;
    const offset = this.pauseOffset;
    this.startTime = ctx.currentTime - offset;

    if (this.inputGain) {
      this.voiceSource = ctx.createBufferSource();
      this.voiceSource.buffer = this.voiceBuffer;
      this.voiceSource.connect(this.inputGain);
      this.voiceSource.onended = () => {
        if (this.isPlaying) {
          this.handleEnded();
        }
      };
      this.voiceSource.start(0, offset);
    }
    this.isPlaying = true;
  }

  public pause(): void {
    if (!this.isPlaying || !this.ctx) return;
    this.pauseOffset = this.ctx.currentTime - this.startTime;
    this.stopSource();
    this.isPlaying = false;
  }

  public stop(): void {
    this.pauseOffset = 0;
    this.stopSource();
    this.isPlaying = false;
  }

  public seek(positionSeconds: number): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stopSource();
    }
    this.pauseOffset = Math.max(0, positionSeconds);
    if (wasPlaying) {
      this.isPlaying = false;
      this.play();
    }
  }

  private stopSource(): void {
    if (this.voiceSource) {
      try {
        this.voiceSource.stop();
        this.voiceSource.disconnect();
      } catch (e) {}
      this.voiceSource = null;
    }
  }

  private handleEnded(): void {
    this.isPlaying = false;
    this.pauseOffset = 0;
    this.stopSource();
    if (this.onPlaybackEnd) this.onPlaybackEnd();
  }

  // --- Getters ---
  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    return this.ctx.currentTime - this.startTime;
  }

  public getDuration(): number {
    return this.voiceBuffer ? this.voiceBuffer.duration : 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getMasterAnalyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  // --- High-Quality Offline Master Rendering & Multi-Format Exporter ---

  /**
   * Renders the processed voice with full DSP rack in an OfflineAudioContext
   */
  public async renderProcessedBuffer(sampleRate: number = 48000, normalize: boolean = true): Promise<AudioBuffer> {
    if (!this.voiceBuffer) {
      throw new Error('Chưa có âm thanh giọng nói để xuất.');
    }

    const duration = this.voiceBuffer.duration;
    const OfflineCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtxClass(2, Math.ceil(duration * sampleRate), sampleRate);

    // Build DSP rack in offline context
    const offInput = offlineCtx.createGain();
    const offLowCut = offlineCtx.createBiquadFilter();
    offLowCut.type = 'highpass';
    offLowCut.frequency.value = this.settings.noiseGateEnabled ? Math.max(this.settings.lowCutFrequency, 40) : 20;

    const offDeEsser = offlineCtx.createBiquadFilter();
    offDeEsser.type = 'peaking';
    offDeEsser.frequency.value = 6500;
    offDeEsser.gain.value = this.settings.deEsserEnabled ? -(this.settings.deEsserAmount / 100) * 12 : 0;

    const offEQWarmth = offlineCtx.createBiquadFilter();
    offEQWarmth.type = 'lowshelf';
    offEQWarmth.frequency.value = 200;
    offEQWarmth.gain.value = this.settings.eqEnabled ? this.settings.eqWarmth : 0;

    const offEQClarity = offlineCtx.createBiquadFilter();
    offEQClarity.type = 'peaking';
    offEQClarity.frequency.value = 850;
    offEQClarity.gain.value = this.settings.eqEnabled ? this.settings.eqClarity : 0;

    const offEQPresence = offlineCtx.createBiquadFilter();
    offEQPresence.type = 'peaking';
    offEQPresence.frequency.value = 3500;
    offEQPresence.gain.value = this.settings.eqEnabled ? this.settings.eqPresence : 0;

    const offEQAir = offlineCtx.createBiquadFilter();
    offEQAir.type = 'highshelf';
    offEQAir.frequency.value = 10000;
    offEQAir.gain.value = this.settings.eqEnabled ? this.settings.eqAir : 0;

    const offComp = offlineCtx.createDynamicsCompressor();
    if (this.settings.compressorEnabled) {
      offComp.threshold.value = this.settings.compressorThreshold;
      offComp.ratio.value = this.settings.compressorRatio;
      offComp.attack.value = this.settings.compressorAttack;
      offComp.release.value = this.settings.compressorRelease;
    }

    const offSat = offlineCtx.createWaveShaper();
    if (this.saturator?.curve) {
      offSat.curve = this.saturator.curve;
    }

    const offVoiceGain = offlineCtx.createGain();
    offVoiceGain.gain.value = this.settings.voiceGain;

    const offMasterGain = offlineCtx.createGain();
    offMasterGain.gain.value = this.settings.masterVolume;

    // Connect serial chain
    offInput.connect(offLowCut);
    offLowCut.connect(offDeEsser);
    offDeEsser.connect(offEQWarmth);
    offEQWarmth.connect(offEQClarity);
    offEQClarity.connect(offEQPresence);
    offEQPresence.connect(offEQAir);
    offEQAir.connect(offComp);
    offComp.connect(offSat);
    offSat.connect(offVoiceGain);

    // Reverb branch
    if (this.settings.reverbEnabled && this.reverbConvolver?.buffer) {
      const offReverb = offlineCtx.createConvolver();
      offReverb.buffer = this.reverbConvolver.buffer;
      const offRevWet = offlineCtx.createGain();
      offRevWet.gain.value = this.settings.reverbWet / 100;
      offSat.connect(offReverb);
      offReverb.connect(offRevWet);
      offRevWet.connect(offVoiceGain);
    }

    // Delay branch
    if (this.settings.delayEnabled) {
      const offDelay = offlineCtx.createDelay();
      offDelay.delayTime.value = this.settings.delayTime / 1000;
      const offDelFeedback = offlineCtx.createGain();
      offDelFeedback.gain.value = this.settings.delayFeedback / 100;
      const offDelWet = offlineCtx.createGain();
      offDelWet.gain.value = this.settings.delayWet / 100;
      offSat.connect(offDelay);
      offDelay.connect(offDelFeedback);
      offDelFeedback.connect(offDelay);
      offDelay.connect(offDelWet);
      offDelWet.connect(offVoiceGain);
    }

    offVoiceGain.connect(offMasterGain);
    offMasterGain.connect(offlineCtx.destination);

    // Source
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = this.voiceBuffer;
    sourceNode.connect(offInput);
    sourceNode.start(0);

    const rendered = await offlineCtx.startRendering();

    // Normalization to -0.5 dB True Peak
    if (normalize) {
      let maxPeak = 0;
      for (let c = 0; c < rendered.numberOfChannels; c++) {
        const data = rendered.getChannelData(c);
        for (let i = 0; i < data.length; i++) {
          const abs = Math.abs(data[i]);
          if (abs > maxPeak) maxPeak = abs;
        }
      }
      if (maxPeak > 0.001) {
        // Target peak = 0.94 (-0.54 dB)
        const scale = 0.94 / maxPeak;
        for (let c = 0; c < rendered.numberOfChannels; c++) {
          const data = rendered.getChannelData(c);
          for (let i = 0; i < data.length; i++) {
            data[i] = data[i] * scale;
          }
        }
      }
    }

    return rendered;
  }

  /**
   * Export Master in specified format: WAV (16/24 bit), MP3 (320/256/128 kbps), WebM
   */
  public async exportMasterAudio(
    format: ExportAudioFormat,
    sampleRate: number = 44100,
    normalize: boolean = true,
    onProgress?: (pct: number) => void
  ): Promise<{ blob: Blob; ext: string }> {
    if (onProgress) onProgress(20);
    const rendered = await this.renderProcessedBuffer(sampleRate, normalize);
    if (onProgress) onProgress(60);

    let blob: Blob;
    let ext: string;

    switch (format) {
      case 'wav-24':
        blob = this.audioBufferToWav24(rendered);
        ext = 'wav';
        break;
      case 'wav-16':
        blob = this.audioBufferToWav16(rendered);
        ext = 'wav';
        break;
      case 'mp3-320':
        blob = this.audioBufferToMp3(rendered, 320);
        ext = 'mp3';
        break;
      case 'mp3-256':
        blob = this.audioBufferToMp3(rendered, 256);
        ext = 'mp3';
        break;
      case 'mp3-128':
        blob = this.audioBufferToMp3(rendered, 128);
        ext = 'mp3';
        break;
      case 'webm':
      default:
        blob = this.audioBufferToWav16(rendered);
        ext = 'wav';
        break;
    }

    if (onProgress) onProgress(100);
    return { blob, ext };
  }

  /**
   * Standard 16-bit PCM Linear WAV Encoder
   */
  private audioBufferToWav16(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * 24-bit Hi-Res PCM Linear WAV Encoder (Lossless High-Definition Studio Audio)
   */
  private audioBufferToWav24(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 24;
    const bytesPerSample = 3;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    const scale = 0x7fffff; // 2^23 - 1
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = Math.round(sample * scale);
        // Write 3 bytes little endian
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * MP3 Encoder using LameJS with configurable bitrate (320kbps / 256kbps / 128kbps)
   */
  private audioBufferToMp3(buffer: AudioBuffer, bitrateKbps: number = 320): Blob {
    if (!LameMp3Encoder) {
      console.warn('LameMp3Encoder not found, falling back to 16-bit WAV');
      return this.audioBufferToWav16(buffer);
    }

    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const mp3encoder = new LameMp3Encoder(channels, sampleRate, bitrateKbps);
    const mp3Data: Uint8Array[] = [];

    // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
    const leftFloat = buffer.getChannelData(0);
    const rightFloat = channels > 1 ? buffer.getChannelData(1) : leftFloat;
    const sampleBlockSize = 1152;
    const length = buffer.length;

    const left = new Int16Array(sampleBlockSize);
    const right = new Int16Array(sampleBlockSize);

    for (let i = 0; i < length; i += sampleBlockSize) {
      const blockSize = Math.min(sampleBlockSize, length - i);
      for (let j = 0; j < blockSize; j++) {
        const sL = Math.max(-1, Math.min(1, leftFloat[i + j]));
        const sR = Math.max(-1, Math.min(1, rightFloat[i + j]));
        left[j] = sL < 0 ? sL * 0x8000 : sL * 0x7fff;
        right[j] = sR < 0 ? sR * 0x8000 : sR * 0x7fff;
      }

      let mp3buf: Int8Array | Uint8Array;
      if (channels === 1) {
        mp3buf = mp3encoder.encodeBuffer(left.subarray(0, blockSize));
      } else {
        mp3buf = mp3encoder.encodeBuffer(left.subarray(0, blockSize), right.subarray(0, blockSize));
      }
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }

    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) {
      mp3Data.push(new Uint8Array(endBuf));
    }

    return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mp3' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
