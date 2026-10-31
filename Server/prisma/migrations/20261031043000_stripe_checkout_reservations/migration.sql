ALTER TABLE "Order"
  ADD COLUMN "paymentProvider" TEXT NOT NULL DEFAULT 'MOCK',
  ADD COLUMN "stripeSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "checkoutUrl" TEXT,
  ADD COLUMN "checkoutOrigin" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "stockReleasedAt" TIMESTAMP(3),
  ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
