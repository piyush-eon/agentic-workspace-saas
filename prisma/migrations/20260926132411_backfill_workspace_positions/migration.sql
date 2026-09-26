-- Existing workspaces all defaulted to position 0, which leaves no gap to drop a card between.
-- Number them by most recently updated first, so the board opens in the same order the old grid showed.
UPDATE "Workspace" AS w
SET "position" = ordered.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "updatedAt" DESC) AS rn
  FROM "Workspace"
) AS ordered
WHERE w."id" = ordered."id";
