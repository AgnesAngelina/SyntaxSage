import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Code2,
  History,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { PageRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  BookmarkRibbonIllustration,
  ChooseDepthIllustration,
  CodeTeacupIllustration,
  MagnifyingBugIllustration,
  MeadowSparkleCluster,
  PaperPlaneChatIllustration,
  PasteCodeIllustration,
  SageLogoMark,
} from '../components/WhimsyAccents';

interface HomePageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectLanguageQuickstart: (language: string) => void;
}

interface Specimen {
  id: string;
  label: string;
  language: string;
  fileName: string;
  summary: string;
  analogy: string;
  lines: Array<{
    num: number;
    code: string;
    note: string;
  }>;
}

const SPECIMENS: Specimen[] = [
  {
    id: 'py',
    label: 'Python · Search',
    language: 'Python',
    fileName: 'binary_search.py',
    summary: 'Divides a sorted list in half repeatedly until the target index is found.',
    analogy: 'Like opening a dictionary straight to the middle instead of checking page 1, 2, 3...',
    lines: [
      {
        num: 1,
        code: 'def binary_search(nums, target):',
        note: 'Accepts a sorted list nums and the value target to locate.',
      },
      {
        num: 2,
        code: '    left, right = 0, len(nums) - 1',
        note: 'Tracks the active search window from the first index to the last.',
      },
      {
        num: 3,
        code: '    while left <= right:',
        note: 'Stops only after the search window shrinks past a single element.',
      },
      {
        num: 4,
        code: '        mid = (left + right) // 2',
        note: 'Integer division picks the middle index without decimals.',
      },
      {
        num: 5,
        code: '        if nums[mid] == target: return mid',
        note: 'Found an exact match—return its position right away.',
      },
      {
        num: 6,
        code: '        left = mid + 1 if nums[mid] < target else left',
        note: 'Discards the left half whenever the middle value is too small.',
      },
      {
        num: 7,
        code: '        right = mid - 1 if nums[mid] > target else right',
        note: 'Discards the right half whenever the middle value is too large.',
      },
    ],
  },
  {
    id: 'sql',
    label: 'SQL · Reporting',
    language: 'SQL',
    fileName: 'top_students.sql',
    summary: 'Ranks students by how many lessons they completed after 2024.',
    analogy: 'Like sorting attendance cards into neat stacks by student, then picking the top 10.',
    lines: [
      {
        num: 1,
        code: 'SELECT s.name, COUNT(e.id) AS lessons',
        note: 'Returns each student name alongside their total enrollment count.',
      },
      {
        num: 2,
        code: 'FROM students s',
        note: 'Starts from the students table using the short alias s.',
      },
      {
        num: 3,
        code: 'LEFT JOIN enrollments e ON e.student_id = s.id',
        note: 'Keeps students even if they have zero matching rows in enrollments.',
      },
      {
        num: 4,
        code: 'WHERE s.enrolled_year >= 2024',
        note: 'Filters out older cohorts before grouping begins.',
      },
      {
        num: 5,
        code: 'GROUP BY s.id, s.name',
        note: 'Collapses multiple enrollment rows into one summary row per student.',
      },
      {
        num: 6,
        code: 'ORDER BY lessons DESC LIMIT 10;',
        note: 'Sorts highest counts first and keeps only the top ten.',
      },
    ],
  },
  {
    id: 'js',
    label: 'JavaScript · Async',
    language: 'JavaScript',
    fileName: 'debounce.js',
    summary: 'Waits for a pause in rapid events before running a function once.',
    analogy: 'Like an elevator door waiting a moment after the last person steps in before closing.',
    lines: [
      {
        num: 1,
        code: 'function debounce(fn, delayMs) {',
        note: 'Wraps any callback fn so it fires only after delayMs of quiet time.',
      },
      {
        num: 2,
        code: '  let timerId = null;',
        note: 'Closure variable remembered across every subsequent call.',
      },
      {
        num: 3,
        code: '  return (...args) => {',
        note: 'Returns a wrapper function accepting any number of arguments.',
      },
      {
        num: 4,
        code: '    clearTimeout(timerId);',
        note: 'Cancels the previous scheduled timer if the user types again.',
      },
      {
        num: 5,
        code: '    timerId = setTimeout(() => fn(...args), delayMs);',
        note: 'Schedules a fresh countdown; runs fn only if nothing interrupts.',
      },
      {
        num: 6,
        code: '  };',
        note: 'Useful for search bars so you do not fire an API request per keystroke.',
      },
    ],
  },
];

const JARGON_TRANSLATOR = [
  {
    term: 'Recursion',
    badge: 'Function calling itself',
    analogy: 'Russian nesting dolls—each doll opens a smaller one inside until you reach the tiny solid doll at the center.',
    tint: 'bg-[#E6E1F5]/55',
  },
  {
    term: 'Closure',
    badge: 'Remembered scope',
    analogy: 'A little backpack a function carries around, holding the snacks (variables) it packed from where it was created.',
    tint: 'bg-[#A7D8C5]/35',
  },
  {
    term: 'Async / Await',
    badge: 'Non-blocking pause',
    analogy: 'Ordering coffee and getting a buzzer—you can chat with friends instead of staring frozen at the espresso machine.',
    tint: 'bg-[#F6C9A8]/40',
  },
  {
    term: 'Pointer (*ptr)',
    badge: 'Memory address',
    analogy: 'Instead of carrying the whole house in your pocket, you just keep a sticky note with the street address written down.',
    tint: 'bg-[#E6E1F5]/55',
  },
];

const FEATURES = [
  {
    title: 'Plain-English Summaries',
    description:
      'Start with a clear 2–3 sentence overview of what any function or script accomplishes before diving into syntax.',
    icon: BookOpen,
    badgeBg: 'bg-[#E6E1F5]',
    iconColor: 'text-[#5F7F68]',
    spot: 'teacup' as const,
  },
  {
    title: 'Line-by-Line Walkthroughs',
    description:
      'Every statement is paired with calm, beginner-friendly margin notes so unfamiliar syntax makes immediate sense.',
    icon: Code2,
    badgeBg: 'bg-[#A7D8C5]/45',
    iconColor: 'text-[#2F3B34]',
    spot: 'paste' as const,
  },
  {
    title: '3 Explanation Levels',
    description:
      'Switch seamlessly between Beginner, Developer, and Manager perspectives depending on how deep you want to go.',
    icon: Layers,
    badgeBg: 'bg-[#F6C9A8]/50',
    iconColor: 'text-[#2F3B34]',
    spot: 'depth' as const,
  },
  {
    title: 'Early Bug & Edge-Case Checks',
    description:
      'Spot off-by-one loops, unhandled null values, and security pitfalls with gentle recommendations.',
    icon: ShieldCheck,
    badgeBg: 'bg-[#E6E1F5]',
    iconColor: 'text-[#5F7F68]',
    spot: 'bug' as const,
  },
  {
    title: 'Follow-Up AI Chat',
    description:
      'Still curious about a specific line? Ask natural follow-up questions in context and keep every answer saved.',
    icon: MessageSquare,
    badgeBg: 'bg-[#A7D8C5]/45',
    iconColor: 'text-[#2F3B34]',
    spot: 'plane' as const,
  },
  {
    title: 'Projects & Study History',
    description:
      'Upload source files into organized folders and revisit saved explanations anytime before exams or code reviews.',
    icon: History,
    badgeBg: 'bg-[#F6C9A8]/50',
    iconColor: 'text-[#2F3B34]',
    spot: 'bookmark' as const,
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Paste or upload your code',
    description:
      'Drop in a class assignment, snippet from documentation, or upload any source file directly from your computer.',
    icon: Upload,
  },
  {
    step: '02',
    title: 'Choose language & depth',
    description:
      'Select from 12+ programming languages and pick Beginner, Developer, or Manager explanation style.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Read, save & ask follow-ups',
    description:
      'Review the structured breakdown, save it to your study history, and chat with AI about any tricky line.',
    icon: MessageSquare,
  },
];

const AUDIENCE_PERSPECTIVES = {
  beginner: {
    label: 'Beginner',
    heading: 'Plain-language reading for students',
    excerpt:
      'This loop tries a network request up to three times before giving up. Each time it fails, it waits slightly longer—1 second, then 2 seconds—so the server has breathing room to recover instead of being flooded.',
    takeaway: 'Key concept highlighted: Exponential backoff & try/catch error handling.',
  },
  developer: {
    label: 'Developer',
    heading: 'Technical semantics & edge cases',
    excerpt:
      'Retries transient fetch failures with exponential delay (2^attempt * 500ms). Note that non-2xx HTTP statuses do not reject fetch() automatically—you must check response.ok inside the loop, and avoid retrying 4xx client errors.',
    takeaway: 'Edge case flagged: Missing AbortController timeout & 4xx vs 5xx distinction.',
  },
  manager: {
    label: 'Manager',
    heading: 'Reliability & operational summary',
    excerpt:
      'Adds resilience against brief third-party API hiccups during checkout or data sync. Without jitter or a circuit breaker, simultaneous user retries during an outage could amplify load on downstream services.',
    takeaway: 'Risk note: Add bounded jitter and cap max retry budget before production.',
  },
};

const LANGUAGES_LEDGER = [
  { name: 'Python', ext: '.py', focus: 'Comprehensions, decorators, generators & data scripts' },
  { name: 'JavaScript', ext: '.js', focus: 'Closures, promises, async/await & event handling' },
  { name: 'TypeScript', ext: '.ts', focus: 'Generics, union narrowing & strict interfaces' },
  { name: 'Java', ext: '.java', focus: 'Classes, collections, streams & exception flows' },
  { name: 'C++', ext: '.cpp', focus: 'References, STL containers & memory ownership' },
  { name: 'C', ext: '.c', focus: 'Pointers, structs, buffers & stack vs heap' },
  { name: 'HTML', ext: '.html', focus: 'Landmark semantics, forms & accessibility attributes' },
  { name: 'CSS', ext: '.css', focus: 'Grid tracks, flexbox alignment & cascade specificity' },
  { name: 'SQL', ext: '.sql', focus: 'Joins, aggregations, subqueries & index behavior' },
  { name: 'Go', ext: '.go', focus: 'Slices, error returns, goroutines & channels' },
  { name: 'Rust', ext: '.rs', focus: 'Borrow checker, lifetimes, Option & Result types' },
  { name: 'PHP', ext: '.php', focus: 'Request handling, array helpers & input escaping' },
];

const TESTIMONIALS = [
  {
    quote:
      'Pointer syntax in C used to intimidate me during lab hours. SyntaxSage walks through each line calmly without making me feel behind.',
    name: 'Maya Patel',
    role: '2nd Year Computer Science Student',
    initials: 'MP',
    avatarBg: 'bg-[#E6E1F5]',
  },
  {
    quote:
      'When I inherit an unfamiliar SQL report or Python script at work, switching to Developer mode flags subtle edge cases in seconds.',
    name: 'Daniel Brooks',
    role: 'Junior Backend Developer',
    initials: 'DB',
    avatarBg: 'bg-[#A7D8C5]/60',
  },
  {
    quote:
      'Having my saved explanations and follow-up chat side by side turned messy study notes into a clean revision library before finals.',
    name: 'Sofia Alvarez',
    role: 'Software Engineering Bootcamp Grad',
    initials: 'SA',
    avatarBg: 'bg-[#F6C9A8]/65',
  },
];

export function HomePage({ onNavigate, onSelectLanguageQuickstart }: HomePageProps) {
  const { isAuthenticated } = useAuth();
  const [activeSpecimenId, setActiveSpecimenId] = useState<string>('py');
  const [activeLineNum, setActiveLineNum] = useState<number>(2);
  const [perspective, setPerspective] = useState<'beginner' | 'developer' | 'manager'>('beginner');
  const [activeJargonIndex, setActiveJargonIndex] = useState<number>(0);

  const activeSpecimen =
    SPECIMENS.find((s) => s.id === activeSpecimenId) || SPECIMENS[0];
  const activeAnnotation =
    activeSpecimen.lines.find((l) => l.num === activeLineNum) || activeSpecimen.lines[0];
  const activePerspective = AUDIENCE_PERSPECTIVES[perspective];

  const handleSelectSpecimen = (id: string) => {
    setActiveSpecimenId(id);
    const next = SPECIMENS.find((s) => s.id === id);
    if (next && next.lines[0]) {
      setActiveLineNum(next.lines[0].num);
    }
  };

  const handleNextLine = () => {
    const idx = activeSpecimen.lines.findIndex((l) => l.num === activeAnnotation.num);
    const nextLine = activeSpecimen.lines[(idx + 1) % activeSpecimen.lines.length];
    if (nextLine) {
      setActiveLineNum(nextLine.num);
    }
  };

  return (
    <div className="pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-20 bg-gradient-to-br from-[#FAF7F2] via-[#FAF7F2] to-[#E6E1F5]/50 border-b border-[#E7E2DA]">
        {/* Gentle Whimsical Ambient Botanical Doodles */}
        <MeadowSparkleCluster className="hidden lg:block w-36 h-24 absolute top-8 right-10 opacity-75 animate-float-slow pointer-events-none" />
        <MeadowSparkleCluster className="hidden lg:block w-28 h-20 absolute bottom-6 left-8 opacity-60 rotate-12 animate-float-gentle pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#E6E1F5] border border-[#E7E2DA] text-xs font-semibold text-[#2F3B34] shadow-[0_2px_10px_-4px_rgba(47,59,52,0.08)]">
                  <SageLogoMark className="w-4 h-4" />
                  Your gentle, plain-English code guide
                </span>
                <CodeTeacupIllustration className="w-11 h-11 animate-float-gentle shrink-0" />
              </div>

              <h1
                className="font-display font-bold tracking-tight text-[#2F3B34] leading-[1.08]"
                style={{ fontSize: 'clamp(2.4rem, 4.2vw, 3.65rem)', textWrap: 'balance' }}
              >
                Understand any code, instantly.
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-[#6B7280]">
                Paste your code and let AI explain it in simple language.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0 shadow-[0_6px_18px_-4px_rgba(95,127,104,0.35)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9A83]"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('explainer')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-[#E6E1F5] text-[#2F3B34] border border-[#E7E2DA] hover:bg-[#DCD5F0] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Try Code Explainer
                </button>
              </div>

              <div className="pt-2 text-xs text-[#6B7280] flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A7D8C5]" aria-hidden="true" />
                  12+ languages
                </span>
                <span aria-hidden="true">·</span>
                <span>Friendly analogies</span>
                <span aria-hidden="true">·</span>
                <span>Follow-up AI chat</span>
              </div>
            </div>

            {/* Right Column: Interactive Code Field-Guide Notebook */}
            <div className="lg:col-span-7 flex flex-col rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] overflow-hidden shadow-[0_14px_40px_-10px_rgba(47,59,52,0.09)]">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#E7E2DA] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {SPECIMENS.map((spec) => {
                    const active = spec.id === activeSpecimen.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => handleSelectSpecimen(spec.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#5F7F68] text-[#FFFFFF]'
                            : 'text-[#6B7280] hover:bg-[#E6E1F5]/70 hover:text-[#2F3B34]'
                        }`}
                      >
                        {spec.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleNextLine}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E6E1F5] hover:bg-[#DCD5F0] text-xs font-semibold text-[#2F3B34] transition-colors cursor-pointer"
                >
                  Next line →
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-7 bg-[#FAF7F2]/65 text-[#2F3B34] p-4 font-mono text-xs leading-6 overflow-x-auto">
                  <div className="pb-2.5 mb-2.5 border-b border-[#E7E2DA] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span className="font-semibold text-[#2F3B34]">{activeSpecimen.fileName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#E6E1F5] text-[#2F3B34] font-medium">
                      {activeSpecimen.language}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {activeSpecimen.lines.map((line) => {
                      const selected = line.num === activeAnnotation.num;
                      return (
                        <button
                          key={line.num}
                          type="button"
                          onClick={() => setActiveLineNum(line.num)}
                          className={`w-full text-left flex items-start gap-3 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#E6E1F5] text-[#2F3B34] font-medium ring-1 ring-[#7C9A83]/50 shadow-xs'
                              : 'text-[#2F3B34]/85 hover:bg-[#FFFFFF]'
                          }`}
                        >
                          <span className="select-none text-[#6B7280] tabular-nums w-4 text-right shrink-0">
                            {line.num}
                          </span>
                          <span className="whitespace-pre">{line.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-5 p-5 flex flex-col justify-between bg-[#FFFFFF] border-t md:border-t-0 md:border-l border-[#E7E2DA]">
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-xl bg-[#A7D8C5]/28 border border-[#A7D8C5]">
                      <div className="text-xs font-semibold text-[#2F3B34] mb-1">
                        In plain English
                      </div>
                      <p className="text-sm leading-relaxed text-[#2F3B34]">
                        {activeSpecimen.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E7E2DA]">
                      <div className="font-mono text-xs font-semibold text-[#5F7F68] tabular-nums mb-1.5">
                        Line {activeAnnotation.num} note
                      </div>
                      <p className="text-sm leading-6 text-[#2F3B34] bg-[#E6E1F5]/55 p-3.5 rounded-xl border border-[#E7E2DA]">
                        {activeAnnotation.note}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F6C9A8]/30 border border-[#F6C9A8] text-xs leading-relaxed text-[#2F3B34]">
                      <span className="font-semibold">Sage analogy: </span>
                      {activeSpecimen.analogy}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E7E2DA]">
                    <button
                      type="button"
                      onClick={() => onSelectLanguageQuickstart(activeSpecimen.language)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5F7F68] hover:text-[#2F3B34] hover:underline cursor-pointer"
                    >
                      Open {activeSpecimen.language} in full Explainer
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive "Decode the Jargon" Playful Analogy Deck */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-[#E7E2DA]">
        <div className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 sm:p-8 shadow-[0_8px_30px_-8px_rgba(47,59,52,0.06)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F6C9A8]/45 text-xs font-semibold text-[#2F3B34]">
                <Sparkles className="w-3.5 h-3.5 text-[#5F7F68]" />
                Jargon-Free Zone
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2F3B34]">
                Scary coding words, translated into real life.
              </h2>
            </div>
            <p className="text-xs text-[#6B7280]">
              Tap any card below to see how SyntaxSage makes tricky ideas click.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {JARGON_TRANSLATOR.map((item, idx) => {
              const active = idx === activeJargonIndex;
              return (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => setActiveJargonIndex(idx)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-[#5F7F68] bg-[#E6E1F5]/75 -translate-y-0.5 shadow-[0_6px_18px_-6px_rgba(47,59,52,0.1)]'
                      : 'border-[#E7E2DA] bg-[#FAF7F2]/60 hover:bg-[#FFFFFF] hover:border-[#7C9A83]'
                  }`}
                >
                  <div className="font-mono text-sm font-semibold text-[#2F3B34]">
                    {item.term}
                  </div>
                  <div className="mt-1 text-xs text-[#6B7280]">{item.badge}</div>
                </button>
              );
            })}
          </div>

          <div
            className={`p-5 rounded-xl border border-[#E7E2DA] ${JARGON_TRANSLATOR[activeJargonIndex].tint} transition-colors`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFFFFF] border border-[#E7E2DA] flex items-center justify-center shrink-0 mt-0.5">
                <SageLogoMark className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#5F7F68] uppercase tracking-wide mb-1">
                  Think of {JARGON_TRANSLATOR[activeJargonIndex].term} like this
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-[#2F3B34]">
                  {JARGON_TRANSLATOR[activeJargonIndex].analogy}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-[#E7E2DA]">
        <div className="max-w-2xl mb-12 space-y-3">
          <span className="inline-block px-3 py-1 rounded-lg bg-[#E6E1F5] text-xs font-semibold text-[#2F3B34]">
            Thoughtful Features
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#2F3B34]">
            Everything you need to read code with confidence.
          </h2>
          <p className="text-base text-[#6B7280] leading-relaxed">
            Built to feel like a calm study desk—gentle for beginners and genuinely useful when
            unraveling unfamiliar files.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)] hover:border-[#7C9A83] hover:-translate-y-0.5 transition-all space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${feature.badgeBg} border border-[#E7E2DA]`}
                  >
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  {feature.spot === 'teacup' && <CodeTeacupIllustration className="w-11 h-11" />}
                  {feature.spot === 'paste' && <PasteCodeIllustration className="w-12 h-10" />}
                  {feature.spot === 'depth' && <ChooseDepthIllustration className="w-12 h-10" />}
                  {feature.spot === 'bug' && <MagnifyingBugIllustration className="w-11 h-11" />}
                  {feature.spot === 'plane' && <PaperPlaneChatIllustration className="w-11 h-11" />}
                  {feature.spot === 'bookmark' && <BookmarkRibbonIllustration className="w-11 h-11" />}
                </div>
                <h3 className="font-display text-lg font-semibold text-[#2F3B34]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. How It Works + Level Switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-[#E7E2DA]">
        <div className="max-w-2xl mb-12 space-y-3">
          <span className="inline-block px-3 py-1 rounded-lg bg-[#A7D8C5]/45 text-xs font-semibold text-[#2F3B34]">
            How It Works
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#2F3B34]">
            From confusing snippet to clear understanding in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)] hover:-translate-y-0.5 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6E1F5] font-mono text-xs font-semibold text-[#2F3B34] tabular-nums">
                    <Icon className="w-3.5 h-3.5 text-[#5F7F68]" />
                    Step {item.step}
                  </span>
                  {item.step === '01' && <PasteCodeIllustration className="w-12 h-10" />}
                  {item.step === '02' && <ChooseDepthIllustration className="w-12 h-10" />}
                  {item.step === '03' && <PaperPlaneChatIllustration className="w-11 h-11" />}
                </div>
                <h3 className="font-display text-lg font-semibold text-[#2F3B34]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Interactive Three-Level Perspective Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 sm:p-8 shadow-[0_8px_30px_-8px_rgba(47,59,52,0.06)]">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#2F3B34]">
              One file, three ways to read it.
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-[#6B7280]">
              Switch explanation depth before you generate—from gentle beginner language to deeper
              engineering edge cases.
            </p>
            <div className="inline-flex p-1 rounded-xl bg-[#FAF7F2] border border-[#E7E2DA]">
              {(['beginner', 'developer', 'manager'] as const).map((lvl) => {
                const active = perspective === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPerspective(lvl)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#5F7F68] text-[#FFFFFF]'
                        : 'text-[#6B7280] hover:text-[#2F3B34]'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-[#E7E2DA] bg-[#FAF7F2]/65 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#E7E2DA]">
              <span className="font-display text-lg font-semibold text-[#2F3B34]">
                {activePerspective.heading}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#E6E1F5] font-mono text-xs font-semibold text-[#2F3B34]">
                {activePerspective.label}
              </span>
            </div>
            <p className="text-[15px] leading-7 text-[#2F3B34]">
              {activePerspective.excerpt}
            </p>
            <p className="text-xs font-medium text-[#2F3B34] bg-[#F6C9A8]/35 px-3.5 py-2.5 rounded-xl border border-[#F6C9A8]">
              {activePerspective.takeaway}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Supported Languages Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-[#E7E2DA]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-lg bg-[#E6E1F5] text-xs font-semibold text-[#2F3B34]">
              Supported Languages
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#2F3B34]">
              Explore starter snippets across 12+ languages.
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280]">
              Pick any language card to open the Code Explainer with a ready-to-read example.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E7E2DA] text-xs font-mono text-[#6B7280] tabular-nums">
            <BookOpen className="w-3.5 h-3.5 text-[#7C9A83]" />
            12 core languages
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANGUAGES_LEDGER.map((lang) => (
            <button
              key={lang.name}
              type="button"
              onClick={() => onSelectLanguageQuickstart(lang.name)}
              className="group rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-5 text-left shadow-[0_4px_16px_-6px_rgba(47,59,52,0.05)] hover:border-[#7C9A83] hover:-translate-y-0.5 hover:bg-[#FAF7F2]/60 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-display text-base font-semibold text-[#2F3B34] group-hover:text-[#5F7F68] transition-colors">
                  {lang.name}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-[#E6E1F5] font-mono text-xs font-medium text-[#2F3B34]">
                  {lang.ext}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#6B7280] mb-3">{lang.focus}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5F7F68]">
                Try sample
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-2xl mb-12 space-y-3">
          <span className="inline-block px-3 py-1 rounded-lg bg-[#A7D8C5]/45 text-xs font-semibold text-[#2F3B34]">
            Student & Developer Stories
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#2F3B34]">
            Designed to feel calm, approachable, and genuinely helpful.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-[#E7E2DA] bg-[#FFFFFF] p-6 shadow-[0_6px_24px_-6px_rgba(47,59,52,0.05)] hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-6"
            >
              <p className="text-sm leading-relaxed text-[#2F3B34]">“{item.quote}”</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#E7E2DA]">
                <div
                  className={`w-10 h-10 rounded-full ${item.avatarBg} border border-[#E7E2DA] flex items-center justify-center font-display text-xs font-bold text-[#2F3B34] shrink-0`}
                >
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#2F3B34] truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-[#6B7280] truncate">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
