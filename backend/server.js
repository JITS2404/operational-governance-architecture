require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const logger = require('./middleware/logger');
const { httpLogger, suspiciousTrafficDetector, unknownRouteLogger } = require('./middleware/requestLogger');
const { applySecurityMiddleware, getDbSslConfig } = require('./middleware/security');
const {
  botDetection,
  generalLimiter,
  authLimiter,
  accountCreationLimiter,
  ticketCreationLimiter,
  writeMutationLimiter,
  aiLimiter,
  readLimiter,
} = require('./middleware/limiters');

if (!process.env.JWT_SECRET) {
  logger.error('CRITICAL: JWT_SECRET not set. Refusing to start.');
  process.exit(1);
}
if (!process.env.DB_PASSWORD) {
  logger.error('CRITICAL: DB_PASSWORD not set. Refusing to start.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3002;

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || '5433', 10),
  ssl:      getDbSslConfig(),
});

pool.connect((err, client, release) => {
  if (err) { logger.apiError('Database connection error', { error: err.message }); }
  else { logger.info('Connected to PostgreSQL database'); release(); }
});

applySecurityMiddleware(app);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(httpLogger);
app.use(suspiciousTrafficDetector);

// Global: bot detection + general rate limit on all API routes
app.use('/api/', botDetection);
app.use('/api/', generalLimiter);

// ── Auth middleware ───────────────────────────────────────────────────────────

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

const ADMIN_ROLES = ['PLATFORM_ADMIN'];
const MANAGER_ROLES = ['PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_TEAM'];

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    const dummyHash = '$2b$12$invalidhashfortimingprotectiononly000000000000000000000';
    const isValid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !isValid) {
      logger.auth('Login failed — invalid credentials', { success: false, email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.auth('Login successful', { success: true, userId: user.id, email: user.email, role: user.role, ip: req.ip });
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token, expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  } catch (error) {
    logger.apiError('Login endpoint error', { error: error.message, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────

app.get('/api/users', authenticate, readLimiter, async (req, res) => {
  try {
    if (ADMIN_ROLES.includes(req.user.role)) {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role, phone, is_active, created_at FROM users WHERE is_active = true ORDER BY first_name'
      );
      return res.json(result.rows);
    }
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, phone, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.apiError('GET /api/users failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', authenticate, requireRole(...ADMIN_ROLES), accountCreationLimiter, async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, phone, is_active } = req.body;

    if (!email || !password || !first_name || !last_name || !role)
      return res.status(400).json({ error: 'Missing required fields: email, password, first_name, last_name, role' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, role, phone, is_active, created_at',
      [email.toLowerCase().trim(), hashedPassword, first_name, last_name, role, phone || null, is_active !== false]
    );
    logger.info('User created', { createdBy: req.user.id, newUserEmail: email, role });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505')
      return res.status(409).json({ error: 'User with this email already exists' });
    logger.apiError('POST /api/users failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticate, writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = ADMIN_ROLES.includes(req.user.role);

    if (req.user.id !== id && !isAdmin) {
      logger.security('Unauthorized user profile update attempt', { requesterId: req.user.id, targetId: id, ip: req.ip });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { first_name, last_name, phone, password } = req.body;
    const values = [first_name, last_name, phone];
    let query = 'UPDATE users SET first_name = $1, last_name = $2, phone = $3';

    if (password) {
      if (password.length < 8)
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      values.push(await bcrypt.hash(password, 12));
      query += `, password_hash = $${values.length}`;
    }

    if (isAdmin && typeof req.body.is_active === 'boolean') {
      values.push(req.body.is_active);
      query += `, is_active = $${values.length}`;
    }

    values.push(id);
    query += ` WHERE id = $${values.length} RETURNING id, email, first_name, last_name, role, phone, is_active`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    logger.info('User profile updated', { updatedBy: req.user.id, targetId: id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.apiError('PUT /api/users/:id failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authenticate, requireRole(...ADMIN_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id)
      return res.status(400).json({ error: 'Cannot delete your own account' });
    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id', [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });
    logger.info('User deactivated', { deactivatedBy: req.user.id, targetId: id });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    logger.apiError('DELETE /api/users/:id failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Tickets ───────────────────────────────────────────────────────────────────

app.get('/api/tickets', authenticate, readLimiter, async (req, res) => {
  try {
    const { status } = req.query;
    const values = [];
    let ownershipClause;

    if (MANAGER_ROLES.includes(req.user.role)) {
      ownershipClause = '1=1';
    } else if (req.user.role === 'TECHNICIAN') {
      values.push(req.user.id);
      ownershipClause = `t.assigned_technician_id = $${values.length}`;
    } else {
      values.push(req.user.id);
      ownershipClause = `t.reporter_id = $${values.length}`;
    }

    let query = `
      SELECT t.*,
             u.first_name || ' ' || u.last_name as reporter_name,
             c.name as category_name,
             l.name as location_name
      FROM tickets t
      LEFT JOIN users u ON t.reporter_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN locations l ON t.location_id = l.id
      WHERE ${ownershipClause}
    `;

    if (status) {
      values.push(status);
      query += ` AND t.status = $${values.length}`;
    }

    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    logger.apiError('GET /api/tickets failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tickets/:id', authenticate, readLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT t.*,
             u.first_name || ' ' || u.last_name as reporter_name,
             c.name as category_name,
             l.name as location_name
      FROM tickets t
      LEFT JOIN users u ON t.reporter_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN locations l ON t.location_id = l.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Ticket not found' });

    const ticket = result.rows[0];
    const canView =
      MANAGER_ROLES.includes(req.user.role) ||
      ticket.reporter_id === req.user.id ||
      ticket.assigned_technician_id === req.user.id;

    if (!canView) {
      logger.security('Unauthorized ticket access attempt', { requesterId: req.user.id, ticketId: id, ip: req.ip });
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    logger.apiError('GET /api/tickets/:id failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tickets', authenticate, ticketCreationLimiter, async (req, res) => {
  try {
    const { title, description, priority, category_id, location_id, floor_no, room_no } = req.body;

    if (!title || !description || !category_id || !location_id)
      return res.status(400).json({ error: 'Missing required fields: title, description, category_id, location_id' });

    const ticketNumber = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const result = await pool.query(`
      INSERT INTO tickets (ticket_number, title, description, priority, category_id, location_id, reporter_id, floor_no, room_no, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'NEW')
      RETURNING *
    `, [ticketNumber, title, description, priority || 'MEDIUM', category_id, location_id, req.user.id, floor_no, room_no]);

    logger.info('Ticket created', { ticketId: result.rows[0].id, ticketNumber, reporterId: req.user.id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.apiError('POST /api/tickets failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tickets/:id', authenticate, writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const ticketResult = await pool.query('SELECT reporter_id FROM tickets WHERE id = $1', [id]);

    if (ticketResult.rows.length === 0)
      return res.status(404).json({ error: 'Ticket not found' });

    const isOwner = ticketResult.rows[0].reporter_id === req.user.id;
    if (!isOwner && !MANAGER_ROLES.includes(req.user.role)) {
      logger.security('Unauthorized ticket edit attempt', { requesterId: req.user.id, ticketId: id, ip: req.ip });
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, priority, category_id, location_id, floor_no, room_no } = req.body;
    const result = await pool.query(`
      UPDATE tickets
      SET title = $1, description = $2, priority = $3, category_id = $4,
          location_id = $5, floor_no = $6, room_no = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [title, description, priority, category_id, location_id, floor_no, room_no, id]);

    res.json(result.rows[0]);
  } catch (error) {
    logger.apiError('PUT /api/tickets/:id failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tickets/:id/status', authenticate, writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0)
      return res.status(404).json({ error: 'Ticket not found' });

    const ticket = ticketResult.rows[0];
    const canUpdate =
      MANAGER_ROLES.includes(req.user.role) ||
      ticket.reporter_id === req.user.id ||
      ticket.assigned_technician_id === req.user.id;

    if (!canUpdate) {
      logger.security('Unauthorized ticket status update attempt', { requesterId: req.user.id, ticketId: id, ip: req.ip });
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    logger.info('Ticket status updated', { ticketId: id, to: status, changedBy: req.user.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.apiError('PUT /api/tickets/:id/status failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tickets/:id/assign', authenticate, requireRole(...MANAGER_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id)
      return res.status(400).json({ error: 'technician_id is required' });

    const techResult = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'TECHNICIAN' AND is_active = true",
      [technician_id]
    );
    if (techResult.rows.length === 0)
      return res.status(400).json({ error: 'Invalid technician' });

    const result = await pool.query(`
      UPDATE tickets
      SET assigned_technician_id = $1, assigned_by = $2, assigned_at = NOW(),
          status = 'ASSIGNED_TO_TECHNICIAN', updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [technician_id, req.user.id, id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Ticket not found' });

    logger.info('Ticket assigned', { ticketId: id, technicianId: technician_id, assignedBy: req.user.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.apiError('PUT /api/tickets/:id/assign failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/tickets/:id', authenticate, writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const ticketResult = await pool.query('SELECT reporter_id FROM tickets WHERE id = $1', [id]);

    if (ticketResult.rows.length === 0)
      return res.status(404).json({ error: 'Ticket not found' });

    const isOwner = ticketResult.rows[0].reporter_id === req.user.id;
    if (!isOwner && !ADMIN_ROLES.includes(req.user.role)) {
      logger.security('Unauthorized ticket delete attempt', { requesterId: req.user.id, ticketId: id, ip: req.ip });
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM tickets WHERE id = $1', [id]);
    logger.info('Ticket deleted', { ticketId: id, deletedBy: req.user.id });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    logger.apiError('DELETE /api/tickets/:id failed', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Categories ────────────────────────────────────────────────────────────────

app.get('/api/categories', authenticate, readLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    logger.apiError('GET /api/categories failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categories', authenticate, requireRole(...ADMIN_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.apiError('POST /api/categories failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/categories/:id', authenticate, requireRole(...ADMIN_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (error) {
    logger.apiError('PUT /api/categories/:id failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', authenticate, requireRole(...ADMIN_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.apiError('DELETE /api/categories/:id failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Locations ─────────────────────────────────────────────────────────────────

app.get('/api/locations', authenticate, readLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    logger.apiError('GET /api/locations failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/locations', authenticate, requireRole(...ADMIN_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { name, description, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO locations (name, description, address) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', address || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.apiError('POST /api/locations failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/locations/:id', authenticate, requireRole(...ADMIN_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address } = req.body;
    const result = await pool.query(
      'UPDATE locations SET name = $1, description = $2, address = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, description, address, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Location not found' });
    res.json(result.rows[0]);
  } catch (error) {
    logger.apiError('PUT /api/locations/:id failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/locations/:id', authenticate, requireRole(...ADMIN_ROLES), writeMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Location not found' });
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    logger.apiError('DELETE /api/locations/:id failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── AI generation (placeholder — apply aiLimiter when route is implemented) ───

app.post('/api/ai/generate', authenticate, aiLimiter, async (req, res) => {
  // Wire your AI provider here. The limiter is already enforced.
  res.status(501).json({ error: 'AI generation not yet configured' });
});

// ── 404 & global error handler ────────────────────────────────────────────────

app.use(unknownRouteLogger);

app.use((err, req, res, _next) => {
  logger.apiError('Unhandled exception', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip,
  });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  logger.info('Backend server started', { port, env: process.env.NODE_ENV || 'development' });
});
