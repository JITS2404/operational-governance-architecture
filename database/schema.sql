-- Complete PostgreSQL Database Schema for Plum Flow Desk
-- Connect to PostgreSQL on port 5433

-- 1. Users table with all roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash only, never plaintext
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_TEAM', 'TECHNICIAN',
        'REPORTER', 'FINANCE_TEAM'
    )),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verify_token VARCHAR(255),
    email_verify_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    building VARCHAR(50),
    floor_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tickets table (main workflow table)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN (
        'NEW', 'HELP_DESK_REVIEW', 'REJECTED_BY_HELP_DESK',
        'ASSIGNED_TO_TECHNICIAN', 'TECHNICIAN_REVIEW', 'REJECTED_BY_TECHNICIAN',
        'TECHNICIAN_INSPECTION', 'WORK_ANALYSIS', 'RCA_REPORT_ADDED',
        'ESTIMATION_CREATED', 'ESTIMATION_SUBMITTED', 'PENDING_ESTIMATION_APPROVAL',
        'ESTIMATION_APPROVED', 'ESTIMATION_REJECTED', 'PENDING_FINANCE_APPROVAL',
        'INVOICE_GENERATED', 'INVOICE_SENT', 'WORK_STARTED', 'WORK_IN_PROGRESS',
        'WORK_COMPLETED', 'COMPLETION_REPORT_UPLOADED', 'PENDING_CUSTOMER_APPROVAL',
        'CUSTOMER_SATISFIED', 'CLOSED'
    )),
    category_id UUID REFERENCES categories(id),
    location_id UUID REFERENCES locations(id),
    reporter_id UUID REFERENCES users(id),
    assigned_technician_id UUID REFERENCES users(id),
    floor_no VARCHAR(20),
    room_no VARCHAR(20),
    assigned_at TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Demo users: run migrate_passwords.js or insert via the API after hashing passwords with bcrypt (cost 12).
-- NEVER insert plaintext passwords into this table.
-- Example (run from Node.js, not SQL):
--   const hash = await bcrypt.hash('YourSecurePassword!', 12);
--   INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
--   VALUES ('admin@maintenance.com', '<hash>', 'Platform', 'Admin', 'PLATFORM_ADMIN', true);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('HVAC', 'Heating, Ventilation, and Air Conditioning'),
('Electrical', 'Electrical systems and fixtures'),
('Plumbing', 'Water and drainage systems'),
('IT Support', 'Computer and network issues');

-- Insert sample locations
INSERT INTO locations (name, address, building, floor_count) VALUES
('Building A', '123 Main Street', 'A', 5),
('Building B', '456 Oak Avenue', 'B', 3);