-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "strapline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ledByName" TEXT NOT NULL,
    "ledByRole" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "format" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "selectedGiftId" TEXT,
    "selectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gift_slug_key" ON "Gift"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Client_token_key" ON "Client"("token");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_selectedGiftId_fkey" FOREIGN KEY ("selectedGiftId") REFERENCES "Gift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "strapline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ledByName" TEXT NOT NULL,
    "ledByRole" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "format" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "selectedGiftId" TEXT,
    "selectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gift_slug_key" ON "Gift"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Client_token_key" ON "Client"("token");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_selectedGiftId_fkey" FOREIGN KEY ("selectedGiftId") REFERENCES "Gift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
