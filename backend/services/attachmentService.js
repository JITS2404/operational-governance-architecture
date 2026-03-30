const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Allowed file types
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', req.params.ticketId || 'temp');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Max 5 files per upload
  }
});

// Attachment service
class AttachmentService {
  static async saveAttachment(ticketId, file, uploadedBy) {
    const pool = require('../server').pool; // Get pool from server
    
    const result = await pool.query(`
      INSERT INTO attachments (ticket_id, file_name, file_path, file_size, mime_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      ticketId,
      file.originalname,
      file.path,
      file.size,
      file.mimetype,
      uploadedBy
    ]);

    return result.rows[0];
  }

  static async getAttachments(ticketId) {
    const pool = require('../server').pool;
    
    const result = await pool.query(`
      SELECT a.*, u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.ticket_id = $1
      ORDER BY a.created_at DESC
    `, [ticketId]);

    return result.rows;
  }

  static async deleteAttachment(attachmentId, userId) {
    const pool = require('../server').pool;
    
    // Get file path
    const result = await pool.query('SELECT file_path FROM attachments WHERE id = $1', [attachmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Attachment not found');
    }

    const filePath = result.rows[0].file_path;

    // Delete from database
    await pool.query('DELETE FROM attachments WHERE id = $1', [attachmentId]);

    // Delete file
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    return { success: true };
  }

  static async getAttachmentStream(attachmentId) {
    const pool = require('../server').pool;
    
    const result = await pool.query('SELECT * FROM attachments WHERE id = $1', [attachmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Attachment not found');
    }

    return result.rows[0];
  }
}

module.exports = { upload, AttachmentService, ALLOWED_TYPES, MAX_FILE_SIZE };
