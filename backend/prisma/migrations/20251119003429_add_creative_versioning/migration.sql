-- CreateTable
CREATE TABLE "creative_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creative_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "creative_versions_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "creatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "creative_versions_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creative_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feedback_text" TEXT,
    "feedback_provided_at" DATETIME,
    "reviewed_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "approvals_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "creatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_approvals" ("created_at", "creative_id", "feedback_provided_at", "feedback_text", "id", "status", "updated_at") SELECT "created_at", "creative_id", "feedback_provided_at", "feedback_text", "id", "status", "updated_at" FROM "approvals";
DROP TABLE "approvals";
ALTER TABLE "new_approvals" RENAME TO "approvals";
CREATE UNIQUE INDEX "approvals_creative_id_key" ON "approvals"("creative_id");
CREATE TABLE "new_creatives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "creatives_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_creatives" ("batch_id", "created_at", "file_type", "file_url", "id", "name", "order", "updated_at") SELECT "batch_id", "created_at", "file_type", "file_url", "id", "name", "order", "updated_at" FROM "creatives";
DROP TABLE "creatives";
ALTER TABLE "new_creatives" RENAME TO "creatives";
CREATE INDEX "creatives_batch_id_idx" ON "creatives"("batch_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "creative_versions_creative_id_idx" ON "creative_versions"("creative_id");

-- CreateIndex
CREATE UNIQUE INDEX "creative_versions_creative_id_version_key" ON "creative_versions"("creative_id", "version");
