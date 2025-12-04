export type Certificate = {
  id: number;
  courseId: number;
  courseTitle?: string;
  courseSlug?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  issueDate?: string;
  expiresAt?: string | null;
  score?: number | null;
  templateName?: string | null;
  verificationCode: string;
  certificateUrl?: string | null;
};
