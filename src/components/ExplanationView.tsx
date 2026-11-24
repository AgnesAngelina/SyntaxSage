import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { MagnifyingBugIllustration } from './WhimsyAccents';
import { StructuredExplanation } from '../types';

interface ExplanationViewProps {
  explanation: StructuredExplanation | string;
}

export function parseExplanationData(raw: StructuredExplanation | string): StructuredExplanation | null {
  if (typeof raw !== 'string') return raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.whatCodeDoes === 'string') {
      return parsed as StructuredExplanation;
    }
    return null;
  } catch {
    return null;
  }
}

function SeverityLabel({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase();
  if (normalized === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#E08A8A]/25 border border-[#E08A8A] text-xs font-semibold text-[#2F3B34]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#8F3D3D]" />
        High Severity
      </span>
    );
  }
  if (normalized === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F6C9A8]/45 border border-[#F6C9A8] text-xs font-semibold text-[#2F3B34]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#8A542B]" />
        Medium Severity
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] border border-[#E7E2DA] text-xs font-semibold text-[#2F3B34]">
      <Info className="w-3.5 h-3.5 shrink-0 text-[#5F7F68]" />
      Low Severity
    </span>
  );
}

export function ExplanationView({ explanation }: ExplanationViewProps) {
  const structured = parseExplanationData(explanation);

  if (!structured) {
    return (
      <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
        <h3 className="font-display text-lg font-semibold text-[#2F3B34] mb-3">
          Code Explanation
        </h3>
        <div className="text-sm leading-relaxed text-[#2F3B34] whitespace-pre-wrap">
          {typeof explanation === 'string' ? explanation : ''}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 01. What the code does */}
      <section className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
        <h3 className="font-display text-lg font-semibold text-[#2F3B34] mb-3">
          01. What the Code Does
        </h3>
        <p className="text-[15px] leading-7 text-[#2F3B34] bg-[#FAF7F2] p-4 rounded-xl border border-[#E7E2DA]">
          {structured.whatCodeDoes}
        </p>
      </section>

      {/* 02. Line-by-line explanation */}
      <section className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
        <h3 className="font-display text-lg font-semibold text-[#2F3B34] mb-4">
          02. Line-by-Line Explanation
        </h3>
        <div className="divide-y divide-[#E7E2DA]">
          {structured.lineByLine.map((item, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#E6E1F5] font-mono text-xs font-semibold text-[#2F3B34] tabular-nums">
                  {item.lines}
                </span>
              </div>
              {item.codeSnippet && (
                <pre className="p-3.5 rounded-xl bg-[#FAF7F2] text-[#2F3B34] font-mono text-xs overflow-x-auto leading-5 border border-[#E7E2DA]">
                  {item.codeSnippet}
                </pre>
              )}
              <p className="text-sm leading-6 text-[#2F3B34]">{item.explanation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 03. Important concepts */}
      <section className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
        <h3 className="font-display text-lg font-semibold text-[#2F3B34] mb-4">
          03. Important Concepts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structured.importantConcepts.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#E6E1F5]/45 border border-[#E7E2DA]"
            >
              <h4 className="text-sm font-semibold text-[#2F3B34] mb-1">
                {item.concept}
              </h4>
              <p className="text-sm leading-6 text-[#6B7280]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 04. Possible bugs or issues */}
      <section className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-display text-lg font-semibold text-[#2F3B34]">
            04. Possible Bugs, Edge Cases & Security Issues
          </h3>
          <MagnifyingBugIllustration className="w-10 h-10 shrink-0" />
        </div>
        {structured.possibleBugs.length === 0 ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#A7D8C5]/35 border border-[#A7D8C5] text-sm text-[#2F3B34]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5F7F68]" />
            No major bugs or security issues detected in this snippet.
          </div>
        ) : (
          <div className="divide-y divide-[#E7E2DA]">
            {structured.possibleBugs.map((bug, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <SeverityLabel severity={bug.severity} />
                <p className="text-sm font-medium text-[#2F3B34]">{bug.issue}</p>
                <p className="text-sm leading-6 text-[#6B7280]">
                  Recommendation: {bug.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 05. Suggested improvements */}
      <section className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_4px_20px_-4px_rgba(47,59,52,0.05)]">
        <h3 className="font-display text-lg font-semibold text-[#2F3B34] mb-4">
          05. Suggested Improvements
        </h3>
        <div className="divide-y divide-[#E7E2DA]">
          {structured.suggestedImprovements.map((imp, idx) => (
            <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
              <h4 className="text-sm font-semibold text-[#2F3B34] mb-1">
                {imp.title}
              </h4>
              <p className="text-sm leading-6 text-[#6B7280]">{imp.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
