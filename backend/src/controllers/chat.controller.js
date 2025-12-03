import { openrouterChat } from '../lib/llm/openrouter.client.js';
import { prisma } from '../lib/db.js';

// POST /api/chat
// body: { lessonId, message }
export async function chatInLesson(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { lessonId, message } = req.body || {};
    if (!userId || !lessonId || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // 1) Tải bài + xác thực quyền xem (owner hoặc đã ghi danh)
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(lessonId) },
      include: {
        module: { include: { course: true } },
        blocks: { orderBy: { displayOrder: 'asc' } },
      },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const course = lesson.module.course;
    const isOwner =
      role === 'admin' || (role === 'instructor' && course.instructorId === req.user.id);

    if (!isOwner) {
      const enrolled = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
        select: { id: true },
      });
      if (!enrolled) return res.status(403).json({ error: 'Not enrolled' });
    }

    // 2) Context bài học (v1: lấy TEXT blocks)
    let contextText = lesson.blocks
      .filter((b) => b.blockType === 'TEXT' && b.textMarkdown)
      .map((b) => b.textMarkdown)
      .join('\n\n');

    // cắt gọn ~12k ký tự để tránh prompt quá dài
    const MAX_CHARS = 12000;
    if (contextText.length > MAX_CHARS) {
      contextText = contextText.slice(0, MAX_CHARS) + '\n\n...[truncated]';
    }

    // 3) Lịch sử chat gần nhất
    const recent = await prisma.chatLog.findMany({
      where: { userId, lessonId: Number(lessonId) },
      orderBy: { createdAt: 'asc' },
      take: 16,
    });

    const history = recent.flatMap((r) => [
      { role: 'user', content: r.userMessage },
      { role: 'assistant', content: r.aiResponse },
    ]);

    // 4) Gọi LLM với phạm vi theo khóa học; cho phép hỏi từ vựng/ngữ pháp đúng chủ đề
    const system = [
      'Bạn là gia sư hỗ trợ cho toàn bộ khóa học hiện tại, không chỉ riêng bài học này.',
      'Ưu tiên trả lời dựa trên nội dung bài học và thông tin khóa học ở dưới.',
      'Bạn được phép dùng kiến thức nền tảng miễn là đúng với chủ đề của khóa học. Với các khóa TOEIC/tiếng Anh, hãy luôn coi những câu hỏi về từ vựng, ngữ pháp, cách dùng câu tiếng Anh là nằm trong phạm vi khóa học và hãy giải thích chi tiết, dễ hiểu.',
      'Chỉ từ chối khi câu hỏi rõ ràng không liên quan đến chủ đề khóa học (ví dụ: hỏi về chứng khoán hoặc nấu ăn trong khóa TOEIC). Khi từ chối, hãy nói rõ rằng bạn chỉ hỗ trợ các câu hỏi trong phạm vi khóa học.',
      'Luôn trả lời bằng tiếng Việt, rõ ràng, ngắn gọn, kèm ví dụ minh họa nếu phù hợp.',
    ].join(' ');

    const messages = [
      { role: 'system', content: system },
      { role: 'system', content: `COURSE TITLE: ${course.title}` },
      { role: 'system', content: `LESSON TITLE: ${lesson.title}` },
      { role: 'system', content: `LESSON CONTEXT:\n${contextText}` },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];

    const completion = await openrouterChat({
      messages,
      // model: 'anthropic/claude-3.5-sonnet', // override nếu muốn
      temperature: 0.2,
      stream: false,
    });

    const aiText = completion?.choices?.[0]?.message?.content?.trim?.() || '(no response)';

    // 5) Lưu log
    await prisma.chatLog.create({
      data: {
        userId,
        lessonId: Number(lessonId),
        userMessage: message,
        aiResponse: aiText,
      },
    });

    res.json({ ok: true, reply: aiText });
  } catch (e) {
    console.error('chatInLesson error', e);
    res.status(500).json({ error: 'Chat failed' });
  }
}

