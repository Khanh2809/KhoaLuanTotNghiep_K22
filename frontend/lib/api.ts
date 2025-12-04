import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';

// DTO từ backend -> Course type của FE
function mapCourseDto(c: any) {
  return {
    id: c.id,
    title: c.title,
    description: c.description ?? null,
    category: c.category ?? null,
    instructor: c.instructor ?? null,
    ratingAvg: c.ratingAvg ?? 0,
    lessonCount: c.lessonCount ?? 0,
    thumbnail: c.thumbnailUrl ?? null,
  };
}

// List courses cho Home (popular)
export async function fetchCourses(): Promise<import('@/types/course').Course[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES.ROOT}`, {
    // Cache public course list for 60s
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch courses');
  const data = await res.json(); // { items, pagination }
  return (data.items || []).map(mapCourseDto);
}

// Featured: lấy top theo rating (gọi BE sort=rating)
export async function fetchFeatured(): Promise<import('@/types/course').Course[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES.ROOT}?sort=rating&pageSize=6`, {
    // Cache featured for 60s
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch featured courses');
  const data = await res.json();
  return (data.items || []).map(mapCourseDto);
}
export async function fetchCoursesByQuery(params: {
  q?: string | null;
  cat?: string | null;
  level?: string | null;
  sort?: 'recent' | 'rating' | 'popular' | null; // 'popular' sẽ map về 'recent'
  page?: string | number | null;
  pageSize?: string | number | null;
}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set('q', params.q);
  if (params.cat) qs.set('cat', params.cat);
  if (params.level) qs.set('level', params.level);

  // map 'popular' → 'recent' (BE chưa có popular)
  const sort = params.sort === 'rating' ? 'rating' : 'recent';
  qs.set('sort', sort);

  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES.ROOT}?${qs.toString()}`, {
    // Cache query results per URL for 60s
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`fetchCoursesByQuery failed: ${res.status} ${msg}`);
  }
  const data = await res.json(); // { items, pagination }
  return {
    items: (data.items || []).map(mapCourseDto),
    pagination: data.pagination,
  };
}
export async function fetchCourseDetail(
  id: number,
  cookie?: string
): Promise<import('@/types/course').Course & { isOwner?: boolean; status?: string; enrolled?: boolean }> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES.BY_ID(id)}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `fetchCourseDetail failed: ${res.status}`);
  }
  const c = await res.json();

  return {
    id: c.id,
    title: c.title,
    description: c.description ?? null,
    category: c.category ?? null,
    instructor: c.instructor?.name ?? c.instructor ?? null,
    rating: c.ratingAvg ?? c.rating ?? 0,
    thumbnail: c.thumbnailUrl ?? null,
    isOwner: !!c.isOwner,
    status: c.status ?? undefined,
    enrolled: !!c.enrolled,
    lessons: [],
    modules: (c.modules ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      lessons: (m.lessons ?? []).map((ls: any) => ({
        id: ls.id,
        title: ls.title,
        quizId: ls.quiz?.id ?? ls.quizId ?? ls.quizzes?.[0]?.id ?? null,
        materials: [],
      })),
    })),
  };
}


export async function fetchMyEnrollments() {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ENROLLMENTS.ROOT}/me`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch my enrollments');
  // Kỳ vọng BE trả [{ id, course: { id,title }, progressPct? }, ...]
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function enrollCourseApi(courseId: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ENROLLMENTS.ROOT}`, {
    method: 'POST',
    credentials: 'include',              // gửi cookie đăng nhập
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId }),
  });
  if (res.status === 401) throw new Error('UNAUTH'); // chưa đăng nhập
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Enroll failed');
  }
  return res.json(); // { ok: true, enrollment: {...} }
}

export async function fetchLessonDetail(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/lessons/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch lesson');
  return res.json(); // { id,title,contentMd,videoUrl,course{ id,title }, quiz? }
}

export async function fetchCourseOutline(courseId: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES.BY_ID(courseId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch course outline');
  return res.json(); // { modules:[{id,title,order,lessons:[{id,title,order}]}], ... }
}

export async function markLessonProgress(lessonId: number, isCompleted?: boolean) {
  const body: any = { lessonId };
  if (typeof isCompleted === 'boolean') body.isCompleted = isCompleted;

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROGRESS.ROOT}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to update progress');
  return res.json();
}

export async function touchLessonAccess(lessonId: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROGRESS.TOUCH}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId }),
  });
  if (!res.ok) throw new Error('Failed to touch access');
  return res.json();
}

export type QuizSummary = { id: number; title: string; description?: string | null };

export async function fetchCourseQuizzes(courseId: number): Promise<QuizSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/quizzes`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch course quizzes');
  return res.json();
}

export async function deleteQuiz(quizId: number) {
  const res = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete quiz');
}

export async function fetchQuiz(quizId: number) {
  const res = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch quiz');
  return res.json();
}

export type QuizAttempt = {
  id: number;
  attemptNumber?: number; // hoặc không có ? nếu BE đảm bảo luôn có
};

export async function startQuizAttempt(quizId: number): Promise<QuizAttempt> {
  const res = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/start`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(async () => {
      const text = await res.text().catch(() => '');
      return text ? { error: text } : null;
    });
    const message = body?.error || 'Failed to start quiz attempt';
    throw new Error(message);
  }
  return res.json();
}

export async function submitQuiz(
  quizId: number,
  payload: {
    submissionId: number;
    answers: Array<{
      questionId: number;
      selectedOptionIds?: number[];
      textAnswer?: string;
    }>;
  }
): Promise<{ score: number; total: number }> {
  const res = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit quiz');
  return res.json();
}

export async function createQuiz(data: {
  title: string;
  description?: string;
  timeLimit?: number;
  attemptsAllowed?: number;
  lessonId: number;
}) {
  const res = await fetch(`${API_BASE_URL}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create quiz');
  return res.json();
}

export async function updateQuiz(
  quizId: number,
  patch: Partial<{ title: string; description?: string | null; timeLimit?: number | null; attemptsAllowed?: number | null }>
) {
  const res = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update quiz');
  return res.json();
}

export async function fetchQuizSubmission(submissionId: number) {
  const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch submission');
  return res.json();
}

// ===================== Analytics =====================
export async function fetchCourseAnalytics(courseId: number, cookie?: string) {
  const res = await fetch(`${API_BASE_URL}/api/analytics/course/${courseId}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to fetch course analytics');
  }
  return res.json();
}

export async function fetchStudentCourseAnalytics(courseId: number, cookie?: string) {
  const res = await fetch(`${API_BASE_URL}/api/analytics/student/course/${courseId}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to fetch student course analytics');
  }
  return res.json();
}

// ===================== Role Requests =====================
export async function fetchMyRoleRequests() {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROLE_REQUESTS.MINE}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to fetch role requests');
  }
  return res.json();
}

export async function createRoleRequest(note?: string) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROLE_REQUESTS.ROOT}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestedRole: 'instructor', note: note ?? undefined }),
  });
  const payload = await (async () => {
    try { return await res.json(); } catch { return { error: await res.text().catch(() => '') }; }
  })();
  if (!res.ok) {
    const msg = payload?.error || payload?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return payload;
}

export async function adminFetchRoleRequests(status: 'PENDING' | 'APPROVED' | 'REJECTED' | undefined = 'PENDING') {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROLE_REQUESTS.ADMIN_ROOT}?${qs.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to fetch role requests');
  }
  return res.json();
}

export async function adminApproveRoleRequest(id: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROLE_REQUESTS.ADMIN_APPROVE(id)}`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to approve request');
  }
  return res.json();
}

export async function adminRejectRoleRequest(id: number, note?: string) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROLE_REQUESTS.ADMIN_REJECT(id)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: note ?? undefined }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to reject request');
  }
  return res.json();
}

// ===================== Learning Paths =====================
export async function fetchLearningPaths(): Promise<import('@/types/learning-path').LearningPath[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LEARNING_PATHS.ROOT}`, {
    next: { revalidate: 60 },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load learning paths');
  const data = await res.json();
  return Array.isArray(data)
    ? data.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description ?? null,
        isPublished: p.isPublished,
        courseCount: p.courseCount ?? p.items?.length ?? 0,
        enrollmentCount: p.enrollmentCount ?? 0,
        items: (p.items ?? []).map((it: any) => ({
          id: it.id,
          courseId: it.courseId,
          courseTitle: it.course?.title ?? '',
          courseSlug: it.course?.slug ?? null,
          order: it.order,
          status: it.course?.status ?? null,
        })),
      }))
    : [];
}

export async function fetchLearningPathDetail(pathId: number, cookie?: string) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LEARNING_PATHS.BY_ID(pathId)}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to load learning path');
  }
  const p = await res.json();
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description ?? null,
    isPublished: p.isPublished,
    enrolled: !!p.enrolled || !!p.enrollments?.some((e: any) => e?.userId === p?.currentUserId),
    items: (p.items ?? []).map((it: any) => ({
      id: it.id,
      courseId: it.courseId,
      courseTitle: it.course?.title ?? '',
      courseSlug: it.course?.slug ?? null,
      order: it.order,
      status: it.course?.status ?? null,
    })),
    enrollments: p.enrollments ?? [],
  };
}

export async function enrollLearningPath(pathId: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LEARNING_PATHS.ENROLL(pathId)}`, {
    method: 'POST',
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('UNAUTH');
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to enroll path');
  }
  return res.json();
}

// ===================== Certificates =====================
export async function fetchMyCertificates(cookie?: string): Promise<import('@/types/certificate').Certificate[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CERTIFICATES.ROOT}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  if (res.status === 401) throw new Error('UNAUTH');
  if (!res.ok) throw new Error('Failed to load certificates');
  const data = await res.json();
  return Array.isArray(data)
    ? data.map((c: any) => ({
        id: c.id,
        courseId: c.course?.id ?? c.courseId,
        courseTitle: c.course?.title ?? null,
        courseSlug: c.course?.slug ?? null,
        userName: c.user?.name ?? null,
        userEmail: c.user?.email ?? null,
        issueDate: c.issueDate,
        expiresAt: c.expiresAt ?? null,
        score: c.score ?? null,
        templateName: c.templateName ?? null,
        verificationCode: c.verificationCode,
        certificateUrl: c.certificateUrl ?? null,
      }))
    : [];
}

export async function verifyCertificate(code: string) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CERTIFICATES.VERIFY(encodeURIComponent(code))}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Verify failed');
  }
  return res.json();
}

export async function requestCertificate(courseId: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CERTIFICATES.REQUEST}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId }),
  });
  if (res.status === 401) throw new Error('UNAUTH');
  const payload = await (async () => {
    try { return await res.json(); } catch { return { error: await res.text().catch(() => '') }; }
  })();
  if (!res.ok) {
    const msg = payload?.error || payload?.message || 'Request certificate failed';
    throw new Error(msg);
  }
  return payload; // { ok, autoIssued?, pendingApproval?, certificateId?, alreadyIssued? }
}

export async function issueCertificate(params: { userId: number; courseId: number; score?: number | null; templateName?: string | null }) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CERTIFICATES.ROOT}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: params.userId,
      courseId: params.courseId,
      score: params.score ?? undefined,
      templateName: params.templateName ?? undefined,
    }),
  });
  const payload = await (async () => {
    try { return await res.json(); } catch { return { error: await res.text().catch(() => '') }; }
  })();
  if (!res.ok) {
    const msg = payload?.error || payload?.message || 'Issue certificate failed';
    throw new Error(msg);
  }
  return payload;
}

export async function getCertificateStatus(courseId: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CERTIFICATES.STATUS(courseId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (res.status === 401) throw new Error('UNAUTH');
  const payload = await (async () => {
    try { return await res.json(); } catch { return { error: await res.text().catch(() => '') }; }
  })();
  if (!res.ok) {
    const msg = payload?.error || payload?.message || 'Failed to load certificate status';
    throw new Error(msg);
  }
  return payload as { issued: boolean; pending: boolean; certificateId?: number };
}

