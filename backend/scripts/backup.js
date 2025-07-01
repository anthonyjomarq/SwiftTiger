/**
 * Database Backup Script for SwiftTiger
 * Creates automated backups of the PostgreSQL database
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { log } = require('../utils/logger');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backup');
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'swifttiger',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch (error) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    log.info(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Generate timestamp for backup files
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
}

/**
 * Create database backup using pg_dump
 * @param {string} type - Type of backup (full, schema, data)
 */
async function createBackup(type = 'full') {
  const timestamp = getTimestamp();
  const filename = `swifttiger_${type}_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  let pgDumpOptions = '';
  switch (type) {
    case 'schema':
      pgDumpOptions = '--schema-only';
      break;
    case 'data':
      pgDumpOptions = '--data-only';
      break;
    case 'full':
    default:
      pgDumpOptions = '--verbose';
      break;
  }
  
  const command = `PGPASSWORD="${DB_CONFIG.password}" pg_dump ` +
    `-h ${DB_CONFIG.host} ` +
    `-p ${DB_CONFIG.port} ` +
    `-U ${DB_CONFIG.username} ` +
    `-d ${DB_CONFIG.database} ` +
    `${pgDumpOptions} ` +
    `--file="${filepath}"`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error(`Backup failed: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('WARNING')) {
        log.warn(`Backup warnings: ${stderr}`);
      }
      
      log.info(`Backup created successfully: ${filename}`);
      resolve(filepath);
    });
  });
}

/**
 * Compress backup file
 * @param {string} filepath - Path to backup file
 */
async function compressBackup(filepath) {
  const compressedPath = `${filepath}.gz`;
  
  return new Promise((resolve, reject) => {
    exec(`gzip "${filepath}"`, (error) => {
      if (error) {
        log.error(`Compression failed: ${error.message}`);
        reject(error);
        return;
      }
      
      log.info(`Backup compressed: ${path.basename(compressedPath)}`);
      resolve(compressedPath);
    });
  });
}

/**
 * Clean old backup files (keep last N backups)
 * @param {number} keepCount - Number of backups to keep
 */
async function cleanOldBackups(keepCount = 7) {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('swifttiger_') && file.endsWith('.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.stat(path.join(BACKUP_DIR, file)).then(stats => stats.mtime)
      }));
    
    // Resolve all stat promises
    for (let file of backupFiles) {
      file.mtime = await file.mtime;
    }
    
    // Sort by modification time (newest first)
    backupFiles.sort((a, b) => b.mtime - a.mtime);
    
    // Remove old backups
    const filesToDelete = backupFiles.slice(keepCount);
    for (let file of filesToDelete) {
      await fs.unlink(file.path);
      log.info(`Deleted old backup: ${file.name}`);
    }
    
    log.info(`Cleanup completed. Kept ${Math.min(backupFiles.length, keepCount)} backups.`);
  } catch (error) {
    log.error(`Cleanup failed: ${error.message}`);
  }
}

/**
 * Restore database from backup
 * @param {string} backupPath - Path to backup file
 */
async function restoreBackup(backupPath) {
  // Check if file is compressed
  let actualPath = backupPath;
  if (backupPath.endsWith('.gz')) {
    log.info('Decompressing backup file...');
    await new Promise((resolve, reject) => {
      exec(`gunzip -c "${backupPath}"`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        actualPath = backupPath.replace('.gz', '');
        fs.writeFile(actualPath, stdout).then(resolve).catch(reject);
      });
    });
  }
  
  const command = `PGPASSWORD="${DB_CONFIG.password}" psql ` +
    `-h ${DB_CONFIG.host} ` +
    `-p ${DB_CONFIG.port} ` +
    `-U ${DB_CONFIG.username} ` +
    `-d ${DB_CONFIG.database} ` +
    `-f "${actualPath}"`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error(`Restore failed: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        log.warn(`Restore warnings: ${stderr}`);
      }
      
      log.info('Database restored successfully');
      resolve();
    });
  });
}

/**
 * Main backup function
 * @param {Object} options - Backup options
 */
async function performBackup(options = {}) {
  const {
    type = 'full',
    compress = true,
    cleanup = true,
    keepCount = 7
  } = options;
  
  try {
    log.info(`Starting ${type} backup...`);
    
    await ensureBackupDir();
    const backupPath = await createBackup(type);
    
    let finalPath = backupPath;
    if (compress) {
      finalPath = await compressBackup(backupPath);
    }
    
    if (cleanup) {
      await cleanOldBackups(keepCount);
    }
    
    log.info(`Backup completed successfully: ${path.basename(finalPath)}`);
    return finalPath;
  } catch (error) {
    log.error(`Backup process failed: ${error.message}`);
    throw error;
  }
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';
  
  switch (command) {
    case 'backup':
      performBackup({
        type: args[1] || 'full',
        compress: true,
        cleanup: true
      }).catch(console.error);
      break;
      
    case 'restore':
      if (!args[1]) {
        console.error('Usage: node backup.js restore <backup-file-path>');
        process.exit(1);
      }
      restoreBackup(args[1]).catch(console.error);
      break;
      
    case 'cleanup':
      cleanOldBackups(parseInt(args[1]) || 7).catch(console.error);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node backup.js backup [full|schema|data]');
      console.log('  node backup.js restore <backup-file-path>');
      console.log('  node backup.js cleanup [keep-count]');
      break;
  }
}

module.exports = {
  performBackup,
  restoreBackup,
  cleanOldBackups
};