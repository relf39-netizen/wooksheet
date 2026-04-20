export interface User {
  id: number;
  role: 'teacher' | 'admin';
  name: string;
  ai_key?: string;
  school?: string;
}

export interface Teacher {
  id: number;
  citizen_id: string;
  name: string;
  surname: string;
  school: string;
  position: string;
  status: 'pending' | 'active' | 'rejected';
}

export interface Exercise {
  id: number;
  teacher_id: number;
  title: string;
  course: string;
  grade: string;
  indicators: string;
  content: string; // JSON string
  created_at: string;
}

export type ExerciseType = 'multiple_choice' | 'subjective' | 'matching' | 'fill_blank' | 'essay' | 'image_sentence';
