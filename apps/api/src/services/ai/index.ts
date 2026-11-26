import { getAIService } from './providers.js';
import type { AIMessage } from './types.js';

export * from './types.js';
export { getAIService } from './providers.js';

// The apps show AI text as plain text, so Markdown would appear as literal ** and #.
const PLAIN = 'Write plain text only: no Markdown (no **, #, or backticks). Use "•" for bullet points.';

const TUTOR_SYSTEM = `You are Learnova AI Tutor, a patient, encouraging teacher.
Explain clearly, use short paragraphs and concrete examples, and adapt to the
student's level. When given lesson context, ground your answer in it.
${PLAIN}`;

interface TutorArgs {
  question: string;
  courseTitle?: string;
  lessonTitle?: string;
  transcript?: string;
  history?: AIMessage[];
}

export async function askTutor(args: TutorArgs): Promise<string> {
  const context: string[] = [];
  if (args.courseTitle) context.push(`Course: ${args.courseTitle}`);
  if (args.lessonTitle) context.push(`Lesson: ${args.lessonTitle}`);
  if (args.transcript) context.push(`Lesson transcript:\n${args.transcript.slice(0, 4000)}`);

  const messages: AIMessage[] = [
    { role: 'system', content: TUTOR_SYSTEM },
    ...(context.length ? [{ role: 'system' as const, content: context.join('\n') }] : []),
    ...(args.history ?? []),
    { role: 'user', content: args.question },
  ];
  return getAIService().chat(messages, { temperature: 0.5 });
}

export async function summarizeLesson(title: string, transcript: string): Promise<string> {
  return getAIService().chat(
    [
      { role: 'system', content: `Summarise the lesson into 4-6 crisp bullet points. ${PLAIN}` },
      { role: 'user', content: `Lesson: ${title}\n\nTranscript:\n${transcript.slice(0, 6000)}` },
    ],
    { temperature: 0.3 },
  );
}

export async function generateCourseDescription(title: string, topics: string[]): Promise<string> {
  return getAIService().chat(
    [
      {
        role: 'system',
        content:
          `Write a compelling, professional course description (120-180 words) for a course landing page. ${PLAIN}`,
      },
      { role: 'user', content: `Title: ${title}\nTopics: ${topics.join(', ')}` },
    ],
    { temperature: 0.7 },
  );
}

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export async function generateQuiz(
  lessonTitle: string,
  transcript: string,
  count = 5,
): Promise<GeneratedQuizQuestion[]> {
  const raw = await getAIService().chat(
    [
      {
        role: 'system',
        content: `Generate ${count} multiple-choice questions as strict JSON:
[{"question":"...","options":["a","b","c","d"],"answerIndex":0,"explanation":"..."}].
Return ONLY the JSON array, no prose.`,
      },
      { role: 'user', content: `Lesson: ${lessonTitle}\n\nContent:\n${transcript.slice(0, 5000)}` },
    ],
    { temperature: 0.6, maxTokens: 1200 },
  );

  try {
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']');
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as GeneratedQuizQuestion[];
    return parsed.filter((q) => q.question && Array.isArray(q.options));
  } catch {
    return [
      {
        question: `What is the core focus of "${lessonTitle}"?`,
        options: ['The main concept taught', 'An unrelated topic', 'Nothing specific', 'A tangent'],
        answerIndex: 0,
        explanation: 'The lesson centres on its stated topic.',
      },
    ];
  }
}
