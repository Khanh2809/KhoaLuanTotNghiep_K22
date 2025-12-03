-- CreateIndex
CREATE INDEX "activity_logs_courseId_eventType_createdAt_idx" ON "public"."activity_logs"("courseId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_courseId_createdAt_idx" ON "public"."activity_logs"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_createdAt_idx" ON "public"."activity_logs"("userId", "createdAt");
