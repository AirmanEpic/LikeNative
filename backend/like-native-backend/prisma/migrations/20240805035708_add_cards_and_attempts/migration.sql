-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "nativeLanguageMessage" TEXT NOT NULL,
    "foreignLanguageMessage" TEXT NOT NULL,
    "notesNativeLanguage" TEXT NOT NULL,
    "notesForeignLanguage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EnglishCommonality" INTEGER NOT NULL,
    "unmasks" INTEGER NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardAttempt" (
    "id" SERIAL NOT NULL,
    "cardId" INTEGER NOT NULL,
    "relativeStrength" INTEGER NOT NULL,
    "foreignLanguageAttempt" BOOLEAN NOT NULL,

    CONSTRAINT "CardAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CardAttempt" ADD CONSTRAINT "CardAttempt_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
