-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" DATETIME,
    "bannedBy" TEXT,
    "banReason" TEXT,
    "stripeAccountId" TEXT,
    "stripeCustomerId" TEXT,
    "hasPaymentMethod" BOOLEAN NOT NULL DEFAULT false,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "stripePaymentMethodId" TEXT,
    "hasDepositMethod" BOOLEAN NOT NULL DEFAULT false,
    "bankAccountLast4" TEXT,
    "bankRoutingLast4" TEXT,
    "bankName" TEXT,
    "paymentFailureCount" INTEGER NOT NULL DEFAULT 0,
    "lastPaymentFailure" DATETIME,
    "isPaymentSuspended" BOOLEAN NOT NULL DEFAULT false,
    "paymentSuspendedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("banReason", "bankAccountLast4", "bankName", "bankRoutingLast4", "bannedAt", "bannedBy", "cardBrand", "cardExpMonth", "cardExpYear", "cardLast4", "createdAt", "email", "emailVerified", "hasDepositMethod", "hasPaymentMethod", "id", "image", "isBanned", "name", "password", "role", "stripeAccountId", "stripeCustomerId", "stripePaymentMethodId", "updatedAt") SELECT "banReason", "bankAccountLast4", "bankName", "bankRoutingLast4", "bannedAt", "bannedBy", "cardBrand", "cardExpMonth", "cardExpYear", "cardLast4", "createdAt", "email", "emailVerified", "hasDepositMethod", "hasPaymentMethod", "id", "image", "isBanned", "name", "password", "role", "stripeAccountId", "stripeCustomerId", "stripePaymentMethodId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
