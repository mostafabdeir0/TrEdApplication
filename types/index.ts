export type Role = "student" | "professor";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "meeting_invited"
  | "meeting_done"
  | "accepted"
  | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  aub_email: string;
  role: Role;
  email_verified: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  why_join: string;
  experience: string;
  goals: string;
  availability: string;
  year_of_study: string | null;
  major: string | null;
  cv_url: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  application_id: string;
  scheduled_at: string;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  completed: boolean;
}
