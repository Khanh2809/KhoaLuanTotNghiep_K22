-- CreateEnum
CREATE TYPE "public"."CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "status" "public"."CourseStatus" NOT NULL DEFAULT 'DRAFT';
