import { VoiceEmotionId, TTSVoiceOption } from '../types/audio';
import { VOICE_EMOTIONS } from './voicePresets';
import { getStoredApiKey } from './apiKeyStorage';
import { GoogleGenAI } from '@google/genai';

export interface TTSRequestParams {
  text: string;
  emotionId: VoiceEmotionId;
  voice: TTSVoiceOption;
  customStyle?: string;
  audioCtx: AudioContext;
}

export interface TTSResult {
  audioBuffer: AudioBuffer;
  source: 'gemini' | 'browser';
  duration: number;
}

/**
 * Text-to-Speech Service
 * Primary: Gemini 3.8 Flash TTS via server endpoint /api/tts or direct client-side @google/genai
 * Requires personal Gemini API key configured in browser
 */
export async function generateSpeechAudio({
  text,
  emotionId,
  voice,
  customStyle = '',
  audioCtx,
}: TTSRequestParams): Promise<TTSResult> {
  const selectedEmotion = VOICE_EMOTIONS.find((e) => e.id === emotionId) || VOICE_EMOTIONS[0];
  const emotionName = `${selectedEmotion.name} (${selectedEmotion.promptInstruction})`;
  const storedApiKey = getStoredApiKey();

  // 1. Try Gemini TTS via backend with personal API key header
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (storedApiKey) {
      headers['x-gemini-api-key'] = storedApiKey;
    }

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        emotion: emotionName,
        voiceName: voice.geminiVoice,
        customStyle,
        voiceStylePrompt: voice.stylePrompt || '',
        apiKey: storedApiKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        // Decode base64 to binary ArrayBuffer
        const binaryString = atob(data.audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        return {
          audioBuffer,
          source: 'gemini',
          duration: audioBuffer.duration,
        };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData?.code === 'NO_API_KEY' && !storedApiKey) {
        throw new Error('NO_API_KEY');
      }
      console.warn('Backend TTS returned error, attempting direct client SDK or fallback:', errData);
    }
  } catch (error: any) {
    if (error?.message === 'NO_API_KEY') {
      throw error;
    }
    console.warn('Error calling /api/tts, attempting direct client SDK:', error);
  }

  // 2. Direct browser call using @google/genai (supports GitHub Pages / static host online)
  if (storedApiKey) {
    try {
      const hasVocalTags = /<[a-z]+>|\|[\w\p{L}-]+\||\[.*?\]/iu.test(text);
      const styleInstruction = [
        `Vietnamese speech.`,
        voice.stylePrompt ? `Character persona and delivery style: ${voice.stylePrompt}.` : '',
        `Emotion and tone: ${emotionName}.`,
        customStyle ? `Style note: ${customStyle}.` : '',
        `Speak naturally, expressively, with clear articulation and proper emotional pauses.`,
        hasVocalTags
          ? `Accurately perform and enact in-line audio tags: vocal sounds (<laugh>, <chuckle>, <gasp>, <sigh>, <breath>, <whisper>...</whisper>), conversational fillers (|yeah|, |mhm|, |oh|), and pause tags ([nghỉ 0.5s], [nghỉ 1.0s]) must be rendered naturally as authentic vocal acoustics and pauses.`
          : '',
      ]
        .filter(Boolean)
        .join(' ');

      const targetModel =
        hasVocalTags || voice.stylePrompt ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';

      const clientAi = new GoogleGenAI({ apiKey: storedApiKey });
      let response: any;

      try {
        response = await clientAi.models.generateContent({
          model: targetModel,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style: styleInstruction,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice.geminiVoice || 'Kore',
                },
              },
            },
          },
        });
      } catch (sdkErr) {
        console.warn(`Direct model ${targetModel} had error, retrying lite model:`, sdkErr);
        response = await clientAi.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style: styleInstruction,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice.geminiVoice || 'Kore',
                },
              },
            },
          },
        });
      }

      const candidate = response?.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

      if (audioPart?.inlineData?.data) {
        const binaryString = atob(audioPart.inlineData.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        return {
          audioBuffer,
          source: 'gemini',
          duration: audioBuffer.duration,
        };
      }
    } catch (clientErr: any) {
      console.warn('Direct client Gemini TTS error:', clientErr);
    }
  } else {
    // If no API key configured, signal app to show API key prompt
    throw new Error('NO_API_KEY');
  }

  // 3. Last fallback: Browser Web Speech API synthesizer
  return await synthesizeWithBrowserSpeech(text, emotionId, voice, audioCtx);
}

/**
 * Synthesizes voice locally via Web Speech API and converts to AudioBuffer
 */
async function synthesizeWithBrowserSpeech(
  text: string,
  emotionId: VoiceEmotionId,
  voice: TTSVoiceOption,
  audioCtx: AudioContext
): Promise<TTSResult> {
  if (!('speechSynthesis' in window)) {
    throw new Error('Trình duyệt không hỗ trợ Web Speech API và chưa kết nối được Gemini TTS.');
  }

  // Adjust pitch & rate based on emotion
  let pitch = 1.0;
  let rate = 1.0;

  switch (emotionId) {
    case 'warm':
      pitch = 0.95;
      rate = 0.9;
      break;
    case 'cheerful':
      pitch = 1.15;
      rate = 1.08;
      break;
    case 'news':
      pitch = 1.0;
      rate = 1.05;
      break;
    case 'whisper':
      pitch = 0.88;
      rate = 0.85;
      break;
    case 'dramatic':
      pitch = 0.9;
      rate = 0.88;
      break;
    case 'inspiring':
      pitch = 1.05;
      rate = 1.02;
      break;
    case 'sad':
      pitch = 0.85;
      rate = 0.8;
      break;
    case 'humorous':
      pitch = 1.2;
      rate = 1.1;
      break;
    default:
      pitch = 1.0;
      rate = 1.0;
  }

  // Clean vocal tags for Web Speech fallback
  const cleanText = text
    .replace(/<[a-z]+>|<\/[a-z]+>/gi, '')
    .replace(/\|[\w\p{L}-]+\|/giu, '')
    .replace(/\[.*?\]/g, '')
    .trim();

  return new Promise((resolve, reject) => {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = 'vi-VN';

      const voices = synth.getVoices();
      const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VN'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      // Generate synthesized tone into AudioBuffer
      const sampleRate = audioCtx.sampleRate;
      const approxDuration = Math.max(1, (cleanText.split(/\s+/).length / (2.5 * rate)));
      const buffer = audioCtx.createBuffer(
        1,
        Math.floor(sampleRate * approxDuration),
        sampleRate
      );

      const channelData = buffer.getChannelData(0);
      const baseFreq = voice.gender === 'female' ? 220 : 130;

      for (let i = 0; i < channelData.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin((Math.PI * i) / channelData.length);
        const harmonic1 = Math.sin(2 * Math.PI * baseFreq * t);
        const harmonic2 = 0.5 * Math.sin(2 * Math.PI * baseFreq * 2 * t);
        channelData[i] = (harmonic1 + harmonic2) * 0.25 * envelope;
      }

      utterance.onend = () => {
        resolve({
          audioBuffer: buffer,
          source: 'browser',
          duration: buffer.duration,
        });
      };

      utterance.onerror = (e) => {
        console.warn('Utterance error, returning fallback tone buffer:', e);
        resolve({
          audioBuffer: buffer,
          source: 'browser',
          duration: buffer.duration,
        });
      };

      synth.speak(utterance);
    } catch (e) {
      reject(e);
    }
  });
}
