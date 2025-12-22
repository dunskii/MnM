-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "registrationFee" DECIMAL(10,2),
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeAccountStatus" TEXT,
ADD COLUMN     "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RegistrationPayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "meetAndGreetId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE',
    "stripePaymentIntentId" TEXT,
    "stripeSessionId" TEXT,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationPayment_stripePaymentIntentId_key" ON "RegistrationPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationPayment_stripeSessionId_key" ON "RegistrationPayment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "RegistrationPayment_schoolId_idx" ON "RegistrationPayment"("schoolId");

-- CreateIndex
CREATE INDEX "RegistrationPayment_meetAndGreetId_idx" ON "RegistrationPayment"("meetAndGreetId");

-- CreateIndex
CREATE INDEX "RegistrationPayment_stripePaymentIntentId_idx" ON "RegistrationPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "School_stripeAccountId_idx" ON "School"("stripeAccountId");

-- AddForeignKey
ALTER TABLE "RegistrationPayment" ADD CONSTRAINT "RegistrationPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationPayment" ADD CONSTRAINT "RegistrationPayment_meetAndGreetId_fkey" FOREIGN KEY ("meetAndGreetId") REFERENCES "MeetAndGreet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
