export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ModuleAjarGenParams {
  subjectName: string;
  gradeLevel: string;
  phase: string;
  topic: string;
  duration?: string;
  learningModel?: string;
  curriculumStandard?: string;
  kbcThemes?: string[];
  kbcPrinciples?: string[];
  p5ppra?: string[];
  targetStudents?: string;
  specificNotes?: string;
}

export interface QuizGenParams {
  subjectName: string;
  gradeLevel: string;
  topic: string;
  questionType: string;
  count: number;
  cognitiveLevels?: string;
  withAnswerKey?: boolean;
  withGridTable?: boolean;
  kbcIntegration?: boolean;
  curriculumStandard?: string;
}

export interface RubricGenParams {
  subjectName: string;
  gradeLevel: string;
  tpDescription: string;
  rubricType?: string;
  includeKBCP5?: boolean;
  curriculumStandard?: string;
}

export interface RaporNarrativeGenParams {
  studentName: string;
  subjectName: string;
  highestTp: string;
  lowestTp: string;
  score?: number | string;
  characterNotes?: string;
  kbcThemeNote?: string;
  kbcCharacterValues?: string[];
  curriculumStandard?: string;
}

export interface IceBreakingGenParams {
  gradeLevel: string;
  classroomVibe: string;
  duration?: string;
  p5ppraTheme?: string;
  kbcTheme?: string;
}

export interface KBCActivityGenParams {
  primaryTheme: string;
  secondaryTheme?: string;
  targetAudience: string;
  activityType: string;
  duration?: string;
  principles9K?: string[];
  specificGoals?: string;
  subjectName?: string;
  gradeLevel?: string;
  kbcTheme?: string;
  topic?: string;
  p5ppraValues?: string[];
  specificGoal?: string;
}

export interface SavedAIItem {
  id: string;
  category: 'chat' | 'module_ajar' | 'quiz' | 'rubric' | 'rapor' | 'ice_breaking' | 'kbc_activity' | 'custom';
  title: string;
  content: string;
  subjectName?: string;
  gradeLevel?: string;
  createdAt: string;
}
