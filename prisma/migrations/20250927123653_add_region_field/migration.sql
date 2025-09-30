-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" REAL NOT NULL,
    "targetPledges" INTEGER NOT NULL DEFAULT 0,
    "currentPledges" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "withdrawalDay" INTEGER NOT NULL DEFAULT 1,
    "gameType" TEXT NOT NULL DEFAULT 'minecraft',
    "region" TEXT NOT NULL DEFAULT 'US-East',
    "tags" TEXT NOT NULL DEFAULT '',
    "bannerUrl" TEXT,
    "serverIp" TEXT,
    "serverPort" INTEGER,
    "discordChannel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Server_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Server" ("bannerUrl", "cost", "createdAt", "currentPledges", "description", "discordChannel", "gameType", "id", "isActive", "name", "ownerId", "serverIp", "serverPort", "tags", "targetPledges", "updatedAt", "withdrawalDay") SELECT "bannerUrl", "cost", "createdAt", "currentPledges", "description", "discordChannel", "gameType", "id", "isActive", "name", "ownerId", "serverIp", "serverPort", "tags", "targetPledges", "updatedAt", "withdrawalDay" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
