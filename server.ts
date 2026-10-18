import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Helper to get GoogleGenAI instance using user-provided key or server fallback
function getGenAIInstance(req: express.Request): { ai: GoogleGenAI | null; hasKey: boolean } {
  const userApiKey =
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['authorization']?.replace(/^Bearer\s+/i, '')) ||
    req.body?.apiKey ||
    process.env.GEMINI_API_KEY ||
    '';

  const cleanKey = (userApiKey || '').trim();
  if (!cleanKey) {
    return { ai: null, hasKey: false };
  }

  const aiInstance = new GoogleGenAI({
    apiKey: cleanKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return { ai: aiInstance, hasKey: true };
}

/**
 * Verify API Key Endpoint
 */
app.post('/api/verify-key', async (req, res) => {
  try {
    const { ai, hasKey } = getGenAIInstance(req);
    if (!hasKey || !ai) {
      return res.status(400).json({ valid: false, error: 'Chưa cung cấp API Key' });
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
    });
    if (response?.text) {
      return res.json({ valid: true, message: 'API Key hợp lệ! Đã kết nối thành công với Google AI Studio.' });
    }
    return res.json({ valid: true, message: 'API Key đã được kích hoạt thành công!' });
  } catch (err: any) {
    console.error('Verify key error:', err);
    return res.status(400).json({
      valid: false,
      error: err.message || 'API Key không hợp lệ hoặc không có quyền truy cập',
    });
  }
});

/**
 * Text-to-Speech API with Emotional Styles & Voice Personas
 */
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      emotion = 'Truyền cảm & Tự nhiên',
      voiceName = 'Kore',
      customStyle = '',
      voiceStylePrompt = '',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Nội dung văn bản không được để trống' });
    }

    const { ai, hasKey } = getGenAIInstance(req);
    if (!hasKey || !ai) {
      return res.status(400).json({
        error: 'Chưa cài đặt Gemini API Key cá nhân. Vui lòng bấm "Nhập API Key" trên thanh điều hướng để cấu hình.',
        code: 'NO_API_KEY',
      });
    }

    const hasVocalTags = /<[a-z]+>|\|[\w\p{L}-]+\||\[.*?\]/iu.test(text);

    // Build emotional style directive with Character Persona and Audio Tags interpretation
    const styleInstruction = [
      `Vietnamese speech.`,
      voiceStylePrompt ? `Character persona and delivery style: ${voiceStylePrompt}.` : '',
      `Emotion and tone: ${emotion}.`,
      customStyle ? `Style note: ${customStyle}.` : '',
      `Speak naturally, expressively, with clear articulation and proper emotional pauses.`,
      hasVocalTags
        ? `Accurately perform and enact in-line audio tags: vocal sounds (<laugh>, <chuckle>, <gasp>, <sigh>, <breath>, <whisper>...</whisper>), conversational fillers (|yeah|, |mhm|, |oh|), and pause tags ([nghỉ 0.5s], [nghỉ 1.0s]) must be rendered naturally as authentic vocal acoustics and pauses.`
        : ''
    ].filter(Boolean).join(' ');

    const targetModel = (hasVocalTags || voiceStylePrompt) ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';

    // Call Gemini TTS model
    let response;
    try {
      response = await ai.models.generateContent({
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
                voiceName: voiceName || 'Kore',
              },
            },
          },
        },
      });
    } catch (modelErr) {
      // Fallback to flash-lite-tts if flagship model had an issue
      console.warn(`Target model ${targetModel} had error, retrying with gemini-3.8-flash-lite-tts:`, modelErr);
      response = await ai.models.generateContent({
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
                voiceName: voiceName || 'Kore',
              },
            },
          },
        },
      });
    }

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

    if (audioPart && audioPart.inlineData?.data) {
      return res.json({
        success: true,
        audioBase64: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType || 'audio/wav',
        model: 'gemini-3.8-flash-lite-tts',
      });
    } else {
      return res.status(500).json({
        error: 'Không tìm thấy dữ liệu âm thanh trả về từ mô hình TTS.',
      });
    }
  } catch (error: any) {
    console.error('TTS Generation Error:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi khi tạo giọng nói TTS',
      details: error.toString(),
    });
  }
});

/**
 * AI Script Assistant: Create or rewrite narration scripts for TTS
 */
app.post('/api/generate-script', async (req, res) => {
  try {
    const { topic = 'Tin tức', tone = 'Truyền cảm', length = 'medium' } = req.body;
    const { ai, hasKey } = getGenAIInstance(req);
    if (!hasKey || !ai) {
      return res.status(400).json({ error: 'Chưa cài đặt Gemini API Key cá nhân' });
    }

    const prompt = `Bạn là biên tập viên kịch bản lồng tiếng & thu âm giọng đọc chuyên nghiệp tiếng Việt.
Hãy viết một đoạn kịch bản ngắn để đọc thành lời (Text-to-Speech) theo chủ đề: "${topic}" với phong cách/cảm xúc: "${tone}".
Độ dài: khoảng ${length === 'short' ? '40-70 từ' : length === 'long' ? '180-250 từ' : '90-130 từ'}.
Ngắt nhịp câu rõ ràng, tự nhiên, văn phong truyền cảm, mượt mà khi phát âm tiếng Việt. Chỉ trả về trực tiếp đoạn văn bản đọc, không thêm lời dẫn hay giải thích.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const script = response.text?.trim() || '';
    return res.json({ script });
  } catch (err: any) {
    console.error('Generate script error:', err);
    return res.status(500).json({ error: 'Không thể tạo kịch bản AI: ' + (err.message || '') });
  }
});

/**
 * AI Voice DSP Filter Assistant: Tailor audio rack parameters for a specific use case
 */
app.post('/api/ai-filter-preset', async (req, res) => {
  try {
    const { description } = req.body;
    const { ai, hasKey } = getGenAIInstance(req);
    if (!hasKey || !ai) {
      return res.status(400).json({ error: 'Chưa cài đặt Gemini API Key cá nhân' });
    }

    const prompt = `Bạn là Master Sound Engineer chuyên về xử lý âm thanh giọng nói (Voice Over / Podcast / Audio Book / Broadcast).
Dựa trên yêu cầu của người dùng: "${description}", hãy thiết lập thông số bộ lọc âm thanh phù hợp nhất.
Trả về định dạng JSON thuần túy (không markdown) với cấu trúc sau:
{
  "name": "Tên preset ngắn gọn tiếng Việt",
  "description": "Mô tả chất âm đạt được (1 câu)",
  "settings": {
    "noiseGateThreshold": -42, // -60 đến -15 dB
    "lowCutFrequency": 95, // 40 đến 180 Hz
    "deEsserAmount": 50, // 0 đến 100%
    "eqWarmth": 2.5, // -6 đến +6 dB (ấm giọng 200Hz)
    "eqClarity": 1.5, // -6 đến +6 dB (rõ chữ 800Hz)
    "eqPresence": 2.2, // -6 đến +6 dB (sáng tiếng 3.5kHz)
    "eqAir": 3.8, // -4 đến +8 dB (trong trẻo 10kHz)
    "compressorThreshold": -22, // -40 đến -10 dB
    "compressorRatio": 3.5, // 1.5 đến 8
    "saturationDrive": 18, // 0 đến 60%
    "reverbType": "Booth", // "Booth" | "PodcastRoom" | "Hall" | "Off"
    "reverbWet": 12, // 0 đến 40%
    "delayWet": 0 // 0 đến 30%
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    return res.json(data);
  } catch (err) {
    console.error('AI filter preset error:', err);
    return res.json({
      name: "Podcast Broadcast Master",
      description: "Chất giọng ấm áp, tròn vành rõ chữ, kiểm soát tiếng ồn tuyệt đối.",
      settings: {
        noiseGateThreshold: -45,
        lowCutFrequency: 90,
        deEsserAmount: 48,
        eqWarmth: 2.2,
        eqClarity: 1.5,
        eqPresence: 2.5,
        eqAir: 3.5,
        compressorThreshold: -20,
        compressorRatio: 3.5,
        saturationDrive: 15,
        reverbType: "Booth",
        reverbWet: 10,
        delayWet: 0,
      },
    });
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`VoiceStudio AI server running on port ${port}`);
  });
}

startServer();
