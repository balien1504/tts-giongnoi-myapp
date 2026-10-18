import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'voicestudio_gemini_api_key';

/**
 * Retrieve user's personal Gemini API key from browser localStorage
 */
export function getStoredApiKey(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

/**
 * Save user's personal Gemini API key to browser localStorage
 */
export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } catch (err) {
    console.error('Failed to save API key to localStorage', err);
  }
}

/**
 * Remove user's Gemini API key from browser localStorage
 */
export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear API key from localStorage', err);
  }
}

/**
 * Check if the user has an API key configured
 */
export function hasStoredApiKey(): boolean {
  const key = getStoredApiKey();
  return Boolean(key && key.length > 5);
}

/**
 * Mask API key for secure display (e.g., AIzaSy...7e8Q)
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 10) return '••••••••';
  return `${trimmed.slice(0, 6)}••••••••${trimmed.slice(-4)}`;
}

/**
 * Test & validate a Gemini API key
 * Checks both server-side validation endpoint and client-side fallback
 */
export async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; message?: string; error?: string }> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return { valid: false, error: 'Vui lòng nhập API Key' };
  }

  // 1. First attempt verification through local backend if available
  try {
    const res = await fetch('/api/verify-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': trimmedKey,
      },
      body: JSON.stringify({ apiKey: trimmedKey }),
    });

    if (res.ok) {
      const data = await res.json();
      return { valid: true, message: data.message || 'API Key hợp lệ và sẵn sàng sử dụng!' };
    }
  } catch (backendErr) {
    // Backend may not exist (e.g. running on GitHub Pages or static host)
    console.info('Backend verify not available, testing directly in browser:', backendErr);
  }

  // 2. Direct browser test using @google/genai (ideal for GitHub Pages / static host)
  try {
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
    });

    if (response && response.text) {
      return { valid: true, message: 'API Key hợp lệ! Đã kết nối thành công với Google AI Studio.' };
    } else {
      return { valid: true, message: 'API Key đã được xác thực thành công!' };
    }
  } catch (clientErr: any) {
    console.error('API Key validation error:', clientErr);
    const msg = clientErr?.message || '';
    if (msg.includes('API_KEY_INVALID') || msg.includes('400') || msg.includes('unregistered')) {
      return { valid: false, error: 'API Key không hợp lệ. Vui lòng kiểm tra lại chuỗi khóa.' };
    }
    if (msg.includes('QUOTA') || msg.includes('429')) {
      return {
        valid: false,
        error: 'API Key đã hết hạn mức (Quota Exceeded). Vui lòng đổi key khác.',
      };
    }
    return {
      valid: false,
      error: `Không thể kết nối với Google AI Studio: ${msg || 'Vui lòng kiểm tra kết nối mạng'}`,
    };
  }
}
