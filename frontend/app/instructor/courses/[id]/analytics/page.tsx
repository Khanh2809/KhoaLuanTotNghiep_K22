import { cookies } from "next/headers";
import { fetchCourseAnalytics } from "@/lib/api";
import AnalyticsDashboard from "./AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function InstructorAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);
  const cookie = (await cookies()).toString();

  let data: any = null;
  try {
    data = await fetchCourseAnalytics(courseId, cookie);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Không tải được dữ liệu analytics. Vui lòng thử lại hoặc kiểm tra quyền.
        </div>
      </div>
    );
  }

  return <AnalyticsDashboard data={data} courseId={courseId} />;
}
