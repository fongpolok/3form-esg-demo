-- Belt-and-braces alongside the --character-set-server/--collation-server
-- flags in docker-compose.yml: makes the utf8mb4 requirement (mandatory for
-- Traditional Chinese, plan §3) explicit even if those flags are ever
-- dropped from the compose command.
ALTER DATABASE `esg_platform` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
