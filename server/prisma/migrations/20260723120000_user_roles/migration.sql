-- Rebuild the enum atomically so the migration works inside Prisma's transaction.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "UserRole_new" AS ENUM ('TOURIST', 'MANAGER', 'FARMER');

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole_new"
USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'MANAGER'
    WHEN 'STAFF' THEN 'FARMER'
    ELSE 'TOURIST'
  END
)::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TOURIST';
