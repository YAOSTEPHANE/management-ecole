import type { ElearningQuestionKind, ElearningQuizQuestion } from '@prisma/client';

export type QuizAnswerMap = Record<string, string>;

function normalizeAnswer(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function gradeQuizAttempt(
  questions: Pick<
    ElearningQuizQuestion,
    'id' | 'kind' | 'correctAnswer' | 'points'
  >[],
  answers: QuizAnswerMap,
  passingScorePercent: number,
): { score: number; maxScore: number; passed: boolean } {
  let score = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += q.points;
    const raw = answers[q.id];
    if (raw == null || raw === '') continue;

    if (q.kind === 'MCQ' || q.kind === 'TRUE_FALSE') {
      if (normalizeAnswer(raw) === normalizeAnswer(q.correctAnswer)) {
        score += q.points;
      }
    } else if (q.kind === 'SHORT_TEXT') {
      if (normalizeAnswer(raw) === normalizeAnswer(q.correctAnswer)) {
        score += q.points;
      }
    }
  }

  const ratio = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const passed = ratio >= passingScorePercent;
  return { score, maxScore, passed };
}

export function isAutoGradableKind(kind: ElearningQuestionKind): boolean {
  return kind === 'MCQ' || kind === 'TRUE_FALSE' || kind === 'SHORT_TEXT';
}
