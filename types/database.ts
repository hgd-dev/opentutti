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
  students_can_post_discussion: boolean;
  students_can_see_roster: boolean;
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
  due_at?: string | null;
  settings_json: unknown | null;
  created_at: string;
};

export type AttemptStatus = "in_progress" | "completed";

export type Attempt = {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  details_json: unknown;
  completed_at: string | null;
  started_at?: string | null;
  updated_at?: string | null;
  status?: AttemptStatus | string | null;
};

export type ClassPost = {
  id: string;
  class_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ClassPostComment = {
  id: string;
  post_id: string;
  class_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type AssignmentComment = {
  id: string;
  assignment_id: string;
  student_id: string | null;
  author_id: string;
  body: string;
  comment_type: "comment" | "reassignment" | string;
  created_at: string;
};
