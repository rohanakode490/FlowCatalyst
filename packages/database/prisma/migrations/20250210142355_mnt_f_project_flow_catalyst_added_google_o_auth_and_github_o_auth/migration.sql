-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "googleId" TEXT NOT NULL DEFAULT '';
