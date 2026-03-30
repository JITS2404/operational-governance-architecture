-- ============================================
-- PLUM FLOW DESK - ENTERPRISE DATABASE SCHEMA
-- Version: 2.0 - Production Ready
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_TEAM', 'TECHNICIAN', 
        'REPORTER', 'FINANCE_TEAM'
    )),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- 3. LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    building VARCHAR(50),
    floor_count INTEGER DEFAULT 1,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- 4. TICKETS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
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
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    floor_no VARCHAR(20),
    room_no VARCHAR(20),
    assigned_at TIMESTAMP,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    sla_due_date TIMESTAMP,
    estimated_completion TIMESTAMP,
    actual_completion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- 5. RCA REPORTS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS rca_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    root_cause TEXT NOT NULL,
    analysis TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. QUOTATIONS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISED'
    )),
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. QUOTATION ITEMS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    labor_cost DECIMAL(12, 2) DEFAULT 0,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. INVOICES TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'
    )),
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. ATTACHMENTS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. COMMENTS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- 11. WORKFLOW HISTORY TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 12. NOTIFICATIONS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 13. AUDIT LOGS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_workflow_history_ticket ON workflow_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_quotations_ticket ON quotations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_invoices_ticket ON invoices(ticket_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Use bcrypt hashed passwords in production)
-- ============================================
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@maintenance.com', '$2b$10$placeholder_hash_admin', 'Platform', 'Admin', 'PLATFORM_ADMIN'),
('supervisor@maintenance.com', '$2b$10$placeholder_hash_super', 'Head', 'Supervisor', 'HEAD'),
('manager@maintenance.com', '$2b$10$placeholder_hash_manager', 'Maintenance', 'Manager', 'MAINTENANCE_TEAM'),
('tech@maintenance.com', '$2b$10$placeholder_hash_tech', 'John', 'Technician', 'TECHNICIAN'),
('reporter@maintenance.com', '$2b$10$placeholder_hash_reporter', 'Jane', 'Reporter', 'REPORTER'),
('finance@maintenance.com', '$2b$10$placeholder_hash_finance', 'Finance', 'Team', 'FINANCE_TEAM')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, description, icon, color) VALUES
('HVAC', 'Heating, Ventilation, and Air Conditioning', 'wind', '#3B82F6'),
('Electrical', 'Electrical systems and fixtures', 'zap', '#F59E0B'),
('Plumbing', 'Water and drainage systems', 'droplet', '#06B6D4'),
('IT Support', 'Computer and network issues', 'laptop', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

INSERT INTO locations (name, address, building, floor_count) VALUES
('Building A', '123 Main Street', 'A', 5),
('Building B', '456 Oak Avenue', 'B', 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================
CREATE OR REPLACE VIEW ticket_summary AS
SELECT 
    t.id,
    t.ticket_number,
    t.title,
    t.status,
    t.priority,
    t.created_at,
    c.name as category_name,
    l.name as location_name,
    u1.first_name || ' ' || u1.last_name as reporter_name,
    u2.first_name || ' ' || u2.last_name as technician_name
FROM tickets t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN locations l ON t.location_id = l.id
LEFT JOIN users u1 ON t.reporter_id = u1.id
LEFT JOIN users u2 ON t.assigned_technician_id = u2.id
WHERE t.deleted_at IS NULL;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Enterprise Database Schema Created Successfully!';
    RAISE NOTICE '📊 Tables: 13 core tables + views';
    RAISE NOTICE '🔍 Indexes: Optimized for performance';
    RAISE NOTICE '⚡ Triggers: Auto-update timestamps';
    RAISE NOTICE '🔒 Constraints: Data integrity enforced';
END $$;
