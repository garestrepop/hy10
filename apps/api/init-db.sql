-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'America/Bogota';

-- Create audit_log table will be handled by migrations
-- This file is for any additional setup needed

-- Grant permissions (adjust as needed for production)
GRANT ALL PRIVILEGES ON DATABASE hy10 TO postgres;
