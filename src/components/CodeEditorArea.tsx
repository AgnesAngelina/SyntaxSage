import React, { useRef, useState } from 'react';
import { Check, Copy, Upload } from 'lucide-react';

interface CodeEditorAreaProps {
  value: string;
  onChange?: (next: string) => void;
  language: string;
  fileName?: string;
  readOnly?: boolean;
  placeholder?: string;
  onFileLoaded?: (payload: { fileName: string; content: string }) => void;
  minHeightClass?: string;
}

export function CodeEditorArea({
  value,
  onChange,
  language,
  fileName,
  readOnly = false,
  placeholder = 'Paste your source code here or upload a file...',
  onFileLoaded,
  minHeightClass = 'min-h-[340px]',
}: CodeEditorAreaProps) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lines = value ? value.split('\n') : [''];
  const lineCount = Math.max(lines.length, 12);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileLoaded) return;
    const text = await file.text();
    onFileLoaded({ fileName: file.name, content: text });
    e.target.value = '';
  };

  return (
    <div className="rounded-2xl border border-[#E7E2DA] overflow-hidden bg-[#FFFFFF] text-[#2F3B34] shadow-[0_6px_24px_-6px_rgba(47,59,52,0.06)]">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#FAF7F2] border-b border-[#E7E2DA]">
        <div className="flex items-center gap-2 text-xs text-[#6B7280] font-mono truncate">
          <span className="text-[#2F3B34] font-semibold truncate">
            {fileName || 'untitled_snippet'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="px-2 py-0.5 rounded-md bg-[#E6E1F5] text-[#2F3B34] font-medium">
            {language}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onFileLoaded && !readOnly && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.js,.jsx,.ts,.tsx,.java,.cpp,.cc,.c,.h,.html,.css,.sql,.go,.rs,.php,.rb,.cs,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2F3B34] bg-[#FFFFFF] hover:bg-[#E6E1F5]/60 border border-[#E7E2DA] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#5F7F68]" />
                Upload File
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2F3B34] bg-[#FFFFFF] hover:bg-[#FAF7F2] border border-[#E7E2DA] disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#5F7F68]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Gutter + Code Area */}
      <div className={`flex ${minHeightClass} max-h-[520px] overflow-auto bg-[#FFFFFF]`}>
        <div
          aria-hidden="true"
          className="select-none py-4 px-3.5 text-right font-mono text-xs leading-6 text-[#6B7280] bg-[#FAF7F2]/75 border-r border-[#E7E2DA] tabular-nums shrink-0"
        >
          {Array.from({ length: lineCount }, (_, idx) => (
            <div key={idx + 1}>{idx + 1}</div>
          ))}
        </div>

        {readOnly ? (
          <pre className="flex-1 p-4 font-mono text-[13px] leading-6 text-[#2F3B34] whitespace-pre overflow-x-auto">
            {value}
          </pre>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="code-editor flex-1 w-full p-4 bg-transparent font-mono text-[13px] leading-6 text-[#2F3B34] placeholder:text-[#6B7280]/70 focus:outline-none resize-none"
            rows={Math.max(lines.length, 14)}
          />
        )}
      </div>
    </div>
  );
}
