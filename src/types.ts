export type InteractionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'true_false'
  | 'order_steps';

export interface OptionItem {
  id: string;
  text: string;
  feedback?: string; // Specific feedback explaining why this option is right/wrong
}

export interface MicroLesson {
  title: string;
  norma: string; // e.g. "Art. 1546 Código Civil / Ley 820 de 2003"
  summary: string;
  keyPoints: string[];
  analogyOrTip: string; // Brilliant-style intuitive tip or mental model
}

export interface RemediationExercise {
  prompt: string;
  type: 'true_false' | 'fill_blank' | 'multiple_choice';
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
}

export interface QuestionNode {
  id: string;
  moduleId: string;
  unitId: string;
  title: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  xpReward: number;
  norma: string;
  /** Optional theory card shown BEFORE the question (Brilliant style) */
  lessonCard: MicroLesson;
  /** Case context ("Supuesto de hecho") */
  caseText: string;
  /** Main question stem */
  questionText: string;
  options: OptionItem[];
  correctOptionId: string;
  /** Detailed legal explanation shown after answering */
  legalExplanation: string;
  /** Interactive remediation challenge shown when the user gets the main question wrong! */
  remediation: RemediationExercise;
}

export interface StudyUnit {
  id: string;
  moduleId: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  questionIds: string[];
}

export interface LegalModule {
  id: string;
  code: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentColor: string;
  badgeText: string;
  units: StudyUnit[];
}

export interface MistakeRecord {
  questionId: string;
  timestamp: number;
  selectedOptionId: string;
  remediated: boolean;
  reviewCount: number;
}

export interface UserProgress {
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  completedQuestions: string[];
  masteredQuestions: string[]; // Answered right on first try or cleared from mistakes
  mistakes: Record<string, MistakeRecord>;
  unlockedBadges: string[];
  dailyGoalXp: number;
  todayXp: number;
}
