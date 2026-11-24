import { GoogleGenAI, Type } from '@google/genai';

export interface StructuredExplanation {
  whatCodeDoes: string;
  lineByLine: Array<{
    lines: string;
    codeSnippet: string;
    explanation: string;
  }>;
  importantConcepts: Array<{
    concept: string;
    description: string;
  }>;
  possibleBugs: Array<{
    severity: string;
    issue: string;
    recommendation: string;
  }>;
  suggestedImprovements: Array<{
    title: string;
    detail: string;
  }>;
}

export class AiServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode;
  }
}

const FREE_TEXT_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUpstreamErrorPayload(rawMessage: string): {
  code?: number;
  status?: string;
  message?: string;
} | null {
  const trimmed = rawMessage.trim();
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart === -1) return null;

  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart)) as {
      error?: { code?: number; status?: string; message?: string };
      code?: number;
      status?: string;
      message?: string;
    };
    const inner = parsed.error ?? parsed;
    return {
      code: typeof inner.code === 'number' ? inner.code : undefined,
      status: typeof inner.status === 'string' ? inner.status : undefined,
      message: typeof inner.message === 'string' ? inner.message : undefined,
    };
  } catch {
    return null;
  }
}

export function toAiServiceError(err: unknown): AiServiceError {
  if (err instanceof AiServiceError) {
    return err;
  }

  const errObj = err as { status?: number; code?: number | string; message?: string };
  const rawMessage =
    typeof errObj?.message === 'string'
      ? errObj.message
      : err instanceof Error
      ? err.message
      : '';
  const parsed = parseUpstreamErrorPayload(rawMessage);

  const numericCode =
    typeof errObj?.status === 'number'
      ? errObj.status
      : typeof errObj?.code === 'number'
      ? errObj.code
      : parsed?.code;
  const upstreamStatus = (parsed?.status || '').toUpperCase();
  const detailText = `${parsed?.message || ''} ${rawMessage}`.toLowerCase();

  if (
    numericCode === 503 ||
    upstreamStatus === 'UNAVAILABLE' ||
    detailText.includes('high demand') ||
    detailText.includes('overloaded') ||
    detailText.includes('temporarily unavailable')
  ) {
    return new AiServiceError(
      'The AI service is temporarily experiencing high demand. Please wait a moment and try again.',
      503
    );
  }

  if (
    numericCode === 429 ||
    upstreamStatus === 'RESOURCE_EXHAUSTED' ||
    detailText.includes('quota') ||
    detailText.includes('rate limit')
  ) {
    return new AiServiceError(
      'AI request quota has been reached right now. Please wait a moment and try again, or select a billing-enabled API key in Settings > Secrets.',
      429
    );
  }

  if (
    numericCode === 403 ||
    upstreamStatus === 'PERMISSION_DENIED' ||
    upstreamStatus === 'API_KEY_INVALID' ||
    detailText.includes('api key') ||
    detailText.includes('api_key_invalid')
  ) {
    return new AiServiceError(
      'Your Gemini API key could not be verified. Please check GEMINI_API_KEY in Settings > Secrets.',
      403
    );
  }

  if (numericCode === 404 || upstreamStatus === 'NOT_FOUND') {
    return new AiServiceError(
      'The requested AI model is currently unavailable. Please try again.',
      404
    );
  }

  if (
    (numericCode !== undefined && numericCode >= 500) ||
    detailText.includes('fetch failed') ||
    detailText.includes('econnreset') ||
    detailText.includes('etimedout') ||
    detailText.includes('network')
  ) {
    return new AiServiceError(
      'Temporary connection issue reaching the AI service. Please try again in a moment.',
      503
    );
  }

  if (parsed?.message && !parsed.message.trim().startsWith('{')) {
    return new AiServiceError(parsed.message, numericCode && numericCode >= 400 ? numericCode : 500);
  }

  return new AiServiceError(
    'Unable to complete the AI request right now. Please try again.',
    500
  );
}

function isRetryableAiError(aiErr: AiServiceError): boolean {
  return aiErr.statusCode === 503 || aiErr.statusCode === 429 || aiErr.statusCode >= 500;
}

async function runWithModelRetryAndFallback<T>(
  operationName: string,
  executor: (model: string) => Promise<T>
): Promise<T> {
  let lastError: AiServiceError | null = null;

  for (const model of FREE_TEXT_MODELS) {
    const maxAttemptsForModel = 2;

    for (let attempt = 1; attempt <= maxAttemptsForModel; attempt++) {
      try {
        return await executor(model);
      } catch (err) {
        const aiErr = toAiServiceError(err);
        lastError = aiErr;
        console.warn(
          `[${operationName}] model=${model} attempt=${attempt} failed (${aiErr.statusCode}): ${aiErr.message}`
        );

        if (!isRetryableAiError(aiErr)) {
          throw aiErr;
        }

        if (attempt < maxAttemptsForModel) {
          const backoffMs = 700 * attempt + Math.floor(Math.random() * 250);
          await sleep(backoffMs);
        }
      }
    }
  }

  throw (
    lastError ??
    new AiServiceError(
      'The AI service is temporarily busy. Please wait a few seconds and try again.',
      503
    )
  );
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiServiceError(
      'AI service is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
      500
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildAudienceInstruction(level: string, explanationLanguage: string): string {
  const normalizedLevel = level.toLowerCase();
  let audienceGuide =
    'Write in simple, approachable English for a student or beginner developer. Avoid unexplained jargon.';
  if (normalizedLevel === 'developer') {
    audienceGuide =
      'Write for a working software developer. Cover execution semantics, complexity, edge cases, and maintainability cleanly.';
  } else if (normalizedLevel === 'manager') {
    audienceGuide =
      'Write for an engineering manager or technical lead. Emphasize business purpose, risk surface, reliability, and architectural impact without overly dense syntax minutiae.';
  }

  const languageNote =
    explanationLanguage && explanationLanguage.toLowerCase() !== 'english'
      ? `Respond entirely in ${explanationLanguage} (keep code identifiers in their original form).`
      : 'Respond in clear, simple English.';

  return `${audienceGuide} ${languageNote}`;
}

function parseStructuredExplanation(rawText: string): StructuredExplanation {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as StructuredExplanation;
}

export async function generateCodeExplanation(params: {
  code: string;
  programmingLanguage: string;
  explanationLevel: string;
  explanationLanguage?: string;
}): Promise<StructuredExplanation> {
  const ai = getAiClient();
  const level = params.explanationLevel || 'beginner';
  const explanationLang = params.explanationLanguage || 'English';

  const corePrompt = `Explain the following code in simple English for a beginner. First explain what the code does in 2–3 sentences. Then explain it line by line or block by block. Explain important programming concepts. Identify possible bugs, edge cases, and security issues. Suggest simple improvements. Do not rewrite the full code unless requested.`;

  const prompt = `${corePrompt}

Audience & Language Adaptation:
${buildAudienceInstruction(level, explanationLang)}

Programming Language: ${params.programmingLanguage}

Source Code:
\`\`\`${params.programmingLanguage}
${params.code}
\`\`\``;

  return runWithModelRetryAndFallback('generateCodeExplanation', async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a patient, accurate computer science tutor and senior code reviewer. Never invent lines that do not exist in the snippet. Do not rewrite the entire code.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whatCodeDoes: {
              type: Type.STRING,
              description: '2-3 concise sentences summarizing what the code does.',
            },
            lineByLine: {
              type: Type.ARRAY,
              description: 'Sequential line-by-line or block-by-block walkthrough.',
              items: {
                type: Type.OBJECT,
                properties: {
                  lines: {
                    type: Type.STRING,
                    description: 'Line range label such as "Lines 1-3" or "Line 5".',
                  },
                  codeSnippet: {
                    type: Type.STRING,
                    description: 'Exact short code line or block being explained.',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Clear explanation of what this line or block does.',
                  },
                },
                required: ['lines', 'codeSnippet', 'explanation'],
              },
            },
            importantConcepts: {
              type: Type.ARRAY,
              description: 'Key programming concepts used in this code.',
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: {
                    type: Type.STRING,
                    description: 'Name of the programming concept.',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Beginner-friendly explanation of how it works here.',
                  },
                },
                required: ['concept', 'description'],
              },
            },
            possibleBugs: {
              type: Type.ARRAY,
              description: 'Possible bugs, edge cases, or security issues.',
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: {
                    type: Type.STRING,
                    description: 'Low, Medium, or High.',
                  },
                  issue: {
                    type: Type.STRING,
                    description: 'Clear description of the bug, edge case, or security issue.',
                  },
                  recommendation: {
                    type: Type.STRING,
                    description: 'How to avoid or fix the issue.',
                  },
                },
                required: ['severity', 'issue', 'recommendation'],
              },
            },
            suggestedImprovements: {
              type: Type.ARRAY,
              description: 'Simple, practical improvements without rewriting the whole file.',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Short title of the improvement.',
                  },
                  detail: {
                    type: Type.STRING,
                    description: 'Concrete explanation of why and how to improve it.',
                  },
                },
                required: ['title', 'detail'],
              },
            },
          },
          required: [
            'whatCodeDoes',
            'lineByLine',
            'importantConcepts',
            'possibleBugs',
            'suggestedImprovements',
          ],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new AiServiceError('The AI model returned an empty response. Please try again.', 503);
    }

    return parseStructuredExplanation(rawText);
  });
}

export async function generateFollowUpChatReply(params: {
  fileName: string;
  programmingLanguage: string;
  codeContent: string;
  history: Array<{ sender: 'user' | 'ai'; message: string }>;
  question: string;
  explanationLanguage?: string;
}): Promise<string> {
  const ai = getAiClient();
  const lang = params.explanationLanguage || 'English';

  const historyTranscript =
    params.history.length > 0
      ? params.history
          .slice(-12)
          .map((m) => `${m.sender === 'user' ? 'Student' : 'Tutor'}: ${m.message}`)
          .join('\n\n')
      : 'No prior messages.';

  const prompt = `File: ${params.fileName} (${params.programmingLanguage})

Source Code:
\`\`\`${params.programmingLanguage}
${params.codeContent}
\`\`\`

Previous Conversation:
${historyTranscript}

Student's New Question:
${params.question}`;

  return runWithModelRetryAndFallback('generateFollowUpChatReply', async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `You are a helpful programming tutor answering follow-up questions about the provided source code. Answer in ${lang}. Keep explanations clear, concise, and grounded strictly in the code shown. Use small inline code examples only when helpful.`,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      throw new AiServiceError('Unable to generate a follow-up answer right now.', 503);
    }
    return reply;
  });
}
