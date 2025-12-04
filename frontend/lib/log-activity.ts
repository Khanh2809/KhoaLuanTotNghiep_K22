// lib/log-activity.ts
export type ActivityEventType =
  | 'LOGIN'
  | 'LESSON_OPEN'
  | 'QUIZ_START'
  | 'QUIZ_SUBMIT'
  | 'TAB_OUT'
  | 'IDLE';

interface LogPayload {
  eventType: ActivityEventType;
  courseId?: number;
  lessonId?: number;
  metadata?: Record<string, any>;
}

export async function logActivity(payload: LogPayload) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs`, {
      method: 'POST',
      credentials: 'include', // gửi cookie JWT
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // log fail thì bỏ qua, không chặn luồng chính
    console.error('Failed to log activity', e);
  }
}
