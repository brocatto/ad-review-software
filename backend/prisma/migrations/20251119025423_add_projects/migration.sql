/*
  Warnings:

  - You are about to drop the column `client_id` on the `batches` table. All the data in the column will be lost.
  - Added the required column `project_id` to the `batches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "client_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "access_token" TEXT NOT NULL,
    "total_creatives" INTEGER NOT NULL DEFAULT 0,
    "approved_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "pending_count" INTEGER NOT NULL DEFAULT 0,
    "last_interaction_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "batches_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_batches" ("access_token", "approved_count", "created_at", "created_by_user_id", "id", "last_interaction_at", "name", "pending_count", "rejected_count", "status", "total_creatives", "updated_at") SELECT "access_token", "approved_count", "created_at", "created_by_user_id", "id", "last_interaction_at", "name", "pending_count", "rejected_count", "status", "total_creatives", "updated_at" FROM "batches";
DROP TABLE "batches";
ALTER TABLE "new_batches" RENAME TO "batches";
CREATE UNIQUE INDEX "batches_access_token_key" ON "batches"("access_token");
CREATE INDEX "batches_project_id_idx" ON "batches"("project_id");
CREATE INDEX "batches_access_token_idx" ON "batches"("access_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "projects_client_id_idx" ON "projects"("client_id");
