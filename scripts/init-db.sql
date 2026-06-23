-- ============================================================
-- ApexFit — PostgreSQL Initialization Script
-- Runs automatically on first container start via
-- /docker-entrypoint-initdb.d/ mount
-- ============================================================

-- apexfit_users is already created via POSTGRES_DB env var
-- Create the remaining two databases:

SELECT 'CREATE DATABASE apexfit_memberships'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'apexfit_memberships'
)\gexec

SELECT 'CREATE DATABASE apexfit_admin'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'apexfit_admin'
)\gexec

-- Confirm creation
\l
