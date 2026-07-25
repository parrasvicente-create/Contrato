-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "contractTypeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "answers" TEXT,
    "sourceText" TEXT,
    "sourceFilename" TEXT,
    "detectedType" TEXT,
    "freeSummary" TEXT,
    "fullReport" TEXT,
    "amountClp" INTEGER,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Operation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'simulado',
    "providerRef" TEXT,
    "amountClp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Operation_kind_idx" ON "Operation"("kind");

-- CreateIndex
CREATE INDEX "Operation_status_idx" ON "Operation"("status");

-- CreateIndex
CREATE INDEX "Operation_contractTypeId_idx" ON "Operation"("contractTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_operationId_key" ON "Order"("operationId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
