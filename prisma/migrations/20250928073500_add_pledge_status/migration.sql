-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    CONSTRAINT "Pledge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pledge_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pledge" ("amount", "createdAt", "id", "serverId", "userId") SELECT "amount", "createdAt", "id", "serverId", "userId" FROM "Pledge";
DROP TABLE "Pledge";
ALTER TABLE "new_Pledge" RENAME TO "Pledge";
CREATE UNIQUE INDEX "Pledge_userId_serverId_key" ON "Pledge"("userId", "serverId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
