-- SwiftTiger Database Column Fix Migration
-- This migration ensures column names match Sequelize expectations

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS action_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS "enum_users_role" CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for user roles
CREATE TYPE "enum_users_role" AS ENUM('admin', 'dispatcher', 'technician');

-- Create users table with correct column names for Sequelize underscored: true
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role "enum_users_role" NOT NULL DEFAULT 'technician',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create action_logs table with correct column names
CREATE TABLE action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE UNIQUE INDEX users_email ON users(email);
CREATE INDEX users_role ON users(role);
CREATE INDEX users_is_active ON users(is_active);
CREATE INDEX users_created_at ON users(created_at);

CREATE INDEX action_logs_user_id ON action_logs(user_id);
CREATE INDEX action_logs_action ON action_logs(action);
CREATE INDEX action_logs_resource ON action_logs(resource);
CREATE INDEX action_logs_timestamp ON action_logs(timestamp);
CREATE INDEX action_logs_user_timestamp ON action_logs(user_id, timestamp);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Note: This should be changed immediately after setup
INSERT INTO users (
    email, 
    password, 
    first_name, 
    last_name, 
    role
) VALUES (
    'admin@swifttiger.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2hFLdX.DnO', -- admin123
    'System',
    'Administrator',
    'admin'
);

-- Log the admin creation
INSERT INTO action_logs (
    user_id,
    action,
    resource,
    details
) 
SELECT 
    id,
    'CREATE',
    'USER',
    '{"initial_setup": true, "default_admin": true}'::jsonb
FROM users 
WHERE email = 'admin@swifttiger.com';