/*
  Warnings:

  - The values [PATH] on the enum `GenerationType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `correctIndex` to the `QuizAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GenerationType_new" AS ENUM ('GUIDE', 'QUIZ', 'CHAT', 'TOPIC_CREATE');
ALTER TABLE "GenerationLog" ALTER COLUMN "type" TYPE "GenerationType_new" USING ("type"::text::"GenerationType_new");
ALTER TYPE "GenerationType" RENAME TO "GenerationType_old";
ALTER TYPE "GenerationType_new" RENAME TO "GenerationType";
DROP TYPE "public"."GenerationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "QuizAnswer" DROP CONSTRAINT "QuizAnswer_quizResultId_fkey";

-- AlterTable
ALTER TABLE "GenerationLog" ADD COLUMN     "errorMessage" TEXT;

-- AlterTable
ALTER TABLE "QuizAnswer" ADD COLUMN     "correctIndex" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "topicsCreatedToday" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_quizResultId_fkey" FOREIGN KEY ("quizResultId") REFERENCES "QuizResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
