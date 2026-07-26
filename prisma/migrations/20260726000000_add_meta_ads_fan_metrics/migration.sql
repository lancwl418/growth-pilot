-- Add campaign objective and fan-growth metrics to Meta Ads daily facts
ALTER TABLE "fact_meta_ads_daily" ADD COLUMN "objective" TEXT;
ALTER TABLE "fact_meta_ads_daily" ADD COLUMN "follows" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "fact_meta_ads_daily" ADD COLUMN "page_likes" INTEGER NOT NULL DEFAULT 0;
