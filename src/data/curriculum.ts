import { QuestionNode } from '../types';
import questionsData from './questions.json';

export const ALL_QUESTIONS: QuestionNode[] = questionsData as QuestionNode[];

const SEEN_STORAGE_KEY = 'ticio_seen_question_ids_v1';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>): void {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage quota or private mode issues
  }
}

const LETTERS = ['A', 'B', 'C', 'D'];

function randomizeQuestionOptions(q: QuestionNode): QuestionNode {
  const shuffledOpts = shuffleArray(q.options);
  let newCorrectId = q.correctOptionId;

  const relabeledOpts = shuffledOpts.map((opt, idx) => {
    const letter = LETTERS[idx] || opt.id;
    if (opt.id === q.correctOptionId) {
      newCorrectId = letter;
    }
    return {
      ...opt,
      id: letter,
    };
  });

  return {
    ...q,
    options: relabeledOpts,
    correctOptionId: newCorrectId,
    remediation: {
      ...q.remediation,
      options: shuffleArray(q.remediation.options),
    },
  };
}

/**
 * Picks `count` questions for a given moduleId, prioritizing questions the user
 * hasn't seen recently across games. Once a module's unseen questions run below
 * `count`, its seen history is cycled so all questions remain fresh.
 */
function pickModuleQuestions(
  moduleQuestions: QuestionNode[],
  count: number,
  seenIds: Set<string>
): QuestionNode[] {
  const unseen = shuffleArray(moduleQuestions.filter((q) => !seenIds.has(q.id)));
  if (unseen.length >= count) {
    const selected = unseen.slice(0, count);
    selected.forEach((q) => seenIds.add(q.id));
    return selected;
  }

  // Not enough unseen questions left in this module: take remaining unseen,
  // reset this module's seen IDs, and fill the rest from the freshly shuffled pool.
  const seenInModule = shuffleArray(
    moduleQuestions.filter((q) => seenIds.has(q.id))
  );
  moduleQuestions.forEach((q) => seenIds.delete(q.id));

  const needed = count - unseen.length;
  const selectedFromSeen = seenInModule.slice(0, needed);
  const combined = [...unseen, ...selectedFromSeen];
  combined.forEach((q) => seenIds.add(q.id));
  return combined;
}

/**
 * Generates a 20-question balanced quiz taking 4 random questions from each of the 5 areas,
 * prioritizing unseen questions from `src/data/questions.json`, shuffling all 20 questions
 * together without sections, and randomizing option positions (A/B/C/D).
 */
export function generateBalanced20Quiz(): QuestionNode[] {
  const modules = ['constitucional', 'civil', 'comercial', 'negocio', 'guia'];
  const seenIds = getSeenIds();

  const pools = modules.map((mod) => {
    const modQuestions = ALL_QUESTIONS.filter((q) => q.moduleId === mod);
    return pickModuleQuestions(modQuestions, 4, seenIds);
  });

  saveSeenIds(seenIds);

  const combined = pools.flat().map(randomizeQuestionOptions);
  return shuffleArray(combined);
}

export const AREA_LABELS: Record<string, string> = {
  constitucional: 'Derecho Constitucional',
  civil: 'Derecho Civil y Familia',
  comercial: 'Derecho Comercial',
  negocio: 'Negocio Jurídico y Resp. Civil',
  guia: 'Procesal, Penal, Laboral y Ética',
};
