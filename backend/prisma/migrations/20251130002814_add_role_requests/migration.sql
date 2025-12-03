-- CreateEnum
CREATE TYPE "public"."RoleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."RoleRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "status" "public"."RoleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "adminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleRequest_status_createdAt_idx" ON "public"."RoleRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RoleRequest_userId_status_idx" ON "public"."RoleRequest"("userId", "status");

-- AddForeignKey
ALTER TABLE "public"."RoleRequest" ADD CONSTRAINT "RoleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleRequest" ADD CONSTRAINT "RoleRequest_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
