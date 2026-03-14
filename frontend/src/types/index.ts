export interface User {
  id: number;
  username: string;
  email: string;
  date_joined: string;
}

export interface Choice {
  id: number;
  text: string;
  order: number;
  is_correct?: boolean; // only present in review mode
}

export interface Question {
  id: number;
  text: string;
  explanation?: string;
  choices: Choice[];
  order: number;
}

export interface Quiz {
  id: number;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  num_questions: number;
  question_count: number;
  attempt_count: number;
  best_score: number | null;
  created_at: string;
  questions?: Question[];
}

export interface UserAnswer {
  id: number;
  question: number;
  question_text: string;
  selected_choice: number;
  selected_text: string;
  is_correct: boolean;
}

export interface Attempt {
  id: number;
  quiz: number;
  quiz_title: string;
  quiz_topic: string;
  quiz_difficulty: string;
  started_at: string;
  completed_at: string | null;
  completed: boolean;
  current_question_index: number;
  score: number;
  total_questions: number;
  score_percentage: number;
  time_taken_seconds: number | null;
  answers?: UserAnswer[];
  questions_review?: Question[];
}

export interface UserStats {
  total_quizzes: number;
  total_attempts: number;
  average_score: number;
  best_score: number;
  recent_attempts: Attempt[];
}
