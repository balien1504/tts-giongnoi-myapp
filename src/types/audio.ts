export type VoiceEmotionId =
  | 'natural'
  | 'warm'
  | 'cheerful'
  | 'news'
  | 'whisper'
  | 'dramatic'
  | 'inspiring'
  | 'sad'
  | 'humorous';

export interface VoiceEmotion {
  id: VoiceEmotionId;
  name: string;
  tagline: string;
  icon: string;
  badgeColor: string;
  promptInstruction: string;
}

export interface TTSVoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  accent: string;
  geminiVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  description: string;
  category?: 'broadcast' | 'story' | 'podcast' | 'commercial' | 'character';
  ageGroup?: 'young' | 'adult' | 'elder' | 'child';
  stylePrompt?: string;
  samplePhrase?: string;
  recommendedPresetId?: string;
}

export interface VoiceFilterSettings {
  // Master Levels
  masterVolume: number; // 0 to 1.5
  voiceGain: number; // 0 to 2.0
  monitorMic: boolean;

  // Noise Gate & Rumble Cut
  noiseGateEnabled: boolean;
  noiseGateThreshold: number; // -60 to -15 dB
  lowCutFrequency: number; // 40 to 180 Hz

  // De-Esser (Sibilance softening)
  deEsserEnabled: boolean;
  deEsserAmount: number; // 0 to 100%

  // 4-Band Studio Speech EQ
  eqEnabled: boolean;
  eqWarmth: number; // -8 to +8 dB (low 200Hz)
  eqClarity: number; // -8 to +8 dB (mid 850Hz)
  eqPresence: number; // -8 to +8 dB (high-mid 3500Hz)
  eqAir: number; // -6 to +10 dB (high shelf 10000Hz)

  // Broadcast Dynamics Compressor
  compressorEnabled: boolean;
  compressorThreshold: number; // -45 to -5 dB
  compressorRatio: number; // 1.5 to 10
  compressorAttack: number; // 0.005 to 0.1 s
  compressorRelease: number; // 0.05 to 0.5 s

  // Tube Saturation (Analog Warmth)
  saturationEnabled: boolean;
  saturationDrive: number; // 0 to 60%

  // Room Ambience & Reverb
  reverbEnabled: boolean;
  reverbType: 'Booth' | 'PodcastRoom' | 'Auditorium' | 'Cathedral';
  reverbDecay: number; // 0.3 to 4.0 s
  reverbWet: number; // 0 to 45%

  // Tape Delay / Slapback
  delayEnabled: boolean;
  delayTime: number; // 60 to 500 ms
  delayFeedback: number; // 0 to 50%
  delayWet: number; // 0 to 35%
}

export interface FilterPreset {
  id: string;
  name: string;
  subtitle: string;
  category: 'broadcast' | 'story' | 'clean' | 'creative';
  icon: string;
  settings: Partial<VoiceFilterSettings>;
}

export type ExportAudioFormat =
  | 'wav-16'
  | 'wav-24'
  | 'mp3-320'
  | 'mp3-256'
  | 'mp3-128'
  | 'webm';

export interface SampleTextItem {
  id: string;
  title: string;
  category: string;
  emotionId: VoiceEmotionId;
  text: string;
}
