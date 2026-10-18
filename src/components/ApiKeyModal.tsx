import React, { useState, useEffect } from 'react';
import {
  Key,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  ClipboardPaste,
  Trash2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  validateApiKey,
  maskApiKey,
} from '../services/apiKeyStorage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySaved?: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onApiKeySaved }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid?: boolean;
    message?: string;
  } | null>(null);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setApiKeyInput(stored);
      setHasExistingKey(Boolean(stored));
      setValidationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setApiKeyInput(text.trim());
          setValidationResult(null);
        }
      }
    } catch {
      // Ignore clipboard permission denial
    }
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setValidationResult({ valid: false, message: 'Vui lòng nhập API Key trước khi kiểm tra' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await validateApiKey(apiKeyInput.trim());
      setValidationResult({
        valid: res.valid,
        message: res.valid ? res.message : res.error,
      });
    } catch (e: any) {
      setValidationResult({
        valid: false,
        message: e?.message || 'Không thể kiểm tra API Key',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setValidationResult({ valid: false, message: 'Vui lòng nhập API Key trước khi lưu' });
      return;
    }

    setStoredApiKey(trimmed);
    setHasExistingKey(true);
    setValidationResult({
      valid: true,
      message: 'Đã lưu API Key thành công vào bộ nhớ trình duyệt!',
    });

    if (onApiKeySaved) {
      onApiKeySaved(trimmed);
    }

    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKeyInput('');
    setHasExistingKey(false);
    setValidationResult({
      valid: false,
      message: 'Đã xóa API Key khỏi bộ nhớ trình duyệt',
    });
    if (onApiKeySaved) {
      onApiKeySaved('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b101b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Cài Đặt Gemini API Key Cá Nhân
              </h2>
              <p className="text-xs text-slate-400">
                Sử dụng API cá nhân trực tiếp trên web hoặc khi chia sẻ online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-300">
          {/* Current Status banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              hasExistingKey
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {hasExistingKey ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-medium text-xs">
                {hasExistingKey
                  ? `Đang dùng key: ${maskApiKey(apiKeyInput)}`
                  : 'Chưa cài đặt API Key cá nhân'}
              </span>
            </div>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                hasExistingKey
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {hasExistingKey ? 'Đã kích hoạt' : 'Chưa cấu hình'}
            </span>
          </div>

          {/* Key Input Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Google Gemini API Key:
              </label>
              <button
                type="button"
                onClick={handlePaste}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Dán từ Clipboard
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="Dán API Key dạng AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-xl px-3.5 py-2.5 pr-20 text-slate-100 placeholder-slate-500 font-mono text-xs outline-none transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showKey ? 'Ẩn' : 'Hiện'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Validation Feedback */}
          {validationResult && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                validationResult.valid
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{validationResult.message}</span>
            </div>
          )}

          {/* Instructions Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-slate-200 font-medium">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Info className="w-3.5 h-3.5" />
                Cách lấy Gemini API Key miễn phí (trong 30 giây):
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
              >
                Lấy API Key ngay
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1 pl-1">
              <li>
                Truy cập{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 underline font-mono"
                >
                  aistudio.google.com/apikey
                </a>
              </li>
              <li>Bấm nút &ldquo;Create API Key&rdquo; để tạo khóa hoàn toàn miễn phí.</li>
              <li>Dán vào ô ở trên và bấm &ldquo;Lưu &amp; Kích Hoạt&rdquo;.</li>
            </ol>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-sky-950/20 border border-sky-500/20 rounded-xl p-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-sky-300 font-semibold">An toàn &amp; Bảo mật:</strong> Khóa API
              được lưu trực tiếp trong trình duyệt máy tính của bạn (LocalStorage). Bạn có thể thoải
              mái đưa code lên GitHub để chia sẻ online — người khác vào trang web chỉ cần nhập API
              của riêng họ để sử dụng mà không cần file <code className="text-slate-300">.env</code>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-2.5 flex-wrap">
          {hasExistingKey ? (
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestKey}
              disabled={isValidating || !apiKeyInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Kiểm Tra Key
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={!apiKeyInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              Lưu &amp; Kích Hoạt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
