export type UserRole = "student" | "teacher";

export type Profile = {
  id: string;
  display_name: string;
  role: UserRole;
  school_name: string | null;
  created_at: string;
};

export type ClassRecord = {
  id: string;
  teacher_id: string;
  name: string;
  join_code: string;
  created_at: string;
};

export type ClassMember = {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
};

export type AssignmentType = "ear_training" | "theory";

export type Assignment = {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  assignment_type: AssignmentType;
  mode: string;
  question_count: number;
  due_date: string | null;
  settings_json: unknown | null;
  created_at: string;
};

export type Attempt = {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  details_json: unknown;
  completed_at: string;
};
