const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { pool } = require("../database");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-refresh-secret-key-change-in-production";

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

class AuthService {
  constructor() {
    this.activeSessions = new Map(); // userId -> Set of session tokens
  }

  // Generate JWT tokens
  generateTokens(userId, email, role) {
    const accessToken = jwt.sign(
      { id: userId, email, role },
      JWT_SECRET,
      { expiresIn: "15m" } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      { id: userId, email, role },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // Longer-lived refresh token
    );

    return { accessToken, refreshToken };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);

      // Check if refresh token is in database (optional security measure)
      const result = await pool.query(
        "SELECT id, email, role FROM users WHERE id = $1",
        [decoded.id]
      );

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = result.rows[0];
      const { accessToken } = this.generateTokens(
        user.id,
        user.email,
        user.role
      );

      return { accessToken, user };
    } catch (error) {
      throw new Error("Token refresh failed");
    }
  }

  // Create user session
  async createSession(userId, refreshToken) {
    try {
      const sessionId = crypto.randomBytes(32).toString("hex");

      await pool.query(
        `INSERT INTO user_sessions (user_id, session_id, refresh_token, created_at, expires_at)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '7 days')`,
        [userId, sessionId, refreshToken]
      );

      // Track active session
      if (!this.activeSessions.has(userId)) {
        this.activeSessions.set(userId, new Set());
      }
      this.activeSessions.get(userId).add(sessionId);

      return sessionId;
    } catch (error) {
      console.error("Session creation error:", error);
      throw new Error("Failed to create session");
    }
  }

  // Validate session
  async validateSession(sessionId) {
    try {
      const result = await pool.query(
        `SELECT user_id, refresh_token, expires_at 
         FROM user_sessions 
         WHERE session_id = $1 AND expires_at > NOW()`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  }

  // Invalidate session
  async invalidateSession(sessionId) {
    try {
      await pool.query("DELETE FROM user_sessions WHERE session_id = $1", [
        sessionId,
      ]);

      // Remove from active sessions
      for (const [userId, sessions] of this.activeSessions.entries()) {
        if (sessions.has(sessionId)) {
          sessions.delete(sessionId);
          if (sessions.size === 0) {
            this.activeSessions.delete(userId);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Session invalidation error:", error);
    }
  }

  // Invalidate all user sessions
  async invalidateAllUserSessions(userId) {
    try {
      await pool.query("DELETE FROM user_sessions WHERE user_id = $1", [
        userId,
      ]);

      this.activeSessions.delete(userId);
    } catch (error) {
      console.error("Session invalidation error:", error);
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(email) {
    try {
      const result = await pool.query(
        "SELECT id, email FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = result.rows[0];
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(resetToken, 10);

      // Store reset token
      await pool.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')
         ON CONFLICT (user_id) 
         DO UPDATE SET token_hash = $2, expires_at = NOW() + INTERVAL '1 hour'`,
        [user.id, hashedToken]
      );

      return { resetToken, user };
    } catch (error) {
      console.error("Password reset token generation error:", error);
      throw error;
    }
  }

  // Verify password reset token
  async verifyPasswordResetToken(email, resetToken) {
    try {
      const result = await pool.query(
        `SELECT pr.user_id, pr.token_hash, pr.expires_at
         FROM password_resets pr
         JOIN users u ON u.id = pr.user_id
         WHERE u.email = $1 AND pr.expires_at > NOW()`,
        [email]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const isValid = await bcrypt.compare(
        resetToken,
        result.rows[0].token_hash
      );
      return isValid ? result.rows[0].user_id : false;
    } catch (error) {
      console.error("Password reset token verification error:", error);
      return false;
    }
  }

  // Reset password
  async resetPassword(email, resetToken, newPassword) {
    try {
      const result = await pool.query("SELECT id FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      const userId = result.rows[0].id;

      // Get stored reset token
      const resetResult = await pool.query(
        "SELECT token_hash FROM password_resets WHERE user_id = $1 AND expires_at > NOW() AND used_at IS NULL",
        [userId]
      );

      if (resetResult.rows.length === 0) {
        throw new Error("Invalid or expired reset token");
      }

      const storedHash = resetResult.rows[0].token_hash;
      const isValid = await bcrypt.compare(resetToken, storedHash);

      if (!isValid) {
        throw new Error("Invalid reset token");
      }

      // Hash new password and update user
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        userId,
      ]);

      // Mark reset token as used
      await pool.query(
        "UPDATE password_resets SET used_at = NOW() WHERE user_id = $1",
        [userId]
      );

      // Invalidate all user sessions
      await this.invalidateAllUserSessions(userId);

      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  // Generate email verification token
  async generateEmailVerificationToken(userId) {
    try {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(verificationToken, 10);

      // Store verification token
      await pool.query(
        `INSERT INTO email_verifications (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')
         ON CONFLICT (user_id) 
         DO UPDATE SET token_hash = $2, expires_at = NOW() + INTERVAL '24 hours'`,
        [userId, hashedToken]
      );

      return verificationToken;
    } catch (error) {
      console.error("Email verification token generation error:", error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(userId, verificationToken) {
    try {
      // Get stored verification token
      const result = await pool.query(
        "SELECT token_hash FROM email_verifications WHERE user_id = $1 AND expires_at > NOW() AND verified_at IS NULL",
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Invalid or expired verification token");
      }

      const storedHash = result.rows[0].token_hash;
      const isValid = await bcrypt.compare(verificationToken, storedHash);

      if (!isValid) {
        throw new Error("Invalid verification token");
      }

      // Mark email as verified
      await pool.query("UPDATE users SET email_verified = TRUE WHERE id = $1", [
        userId,
      ]);

      // Mark verification token as used
      await pool.query(
        "UPDATE email_verifications SET verified_at = NOW() WHERE user_id = $1",
        [userId]
      );

      return true;
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  }

  // Send email
  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@swifttiger.com",
        to,
        subject,
        html,
        text,
      };

      await emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
      throw new Error("Failed to send email");
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "Password Reset Request - SwiftTiger",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00809d;">Password Reset Request</h2>
            <p>You requested a password reset for your SwiftTiger account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #00809d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              SwiftTiger - Job Management System
            </p>
          </div>
        `,
      };

      await emailTransporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error("Failed to send password reset email");
    }
  }

  // Send email verification
  async sendEmailVerification(email, verificationToken) {
    try {
      const verificationUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "Verify Your Email - SwiftTiger",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00809d;">Verify Your Email</h2>
            <p>Please verify your email address to complete your SwiftTiger account setup.</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #00809d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Verify Email
            </a>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              SwiftTiger - Job Management System
            </p>
          </div>
        `,
      };

      await emailTransporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error("Failed to send verification email");
    }
  }

  // Check session activity and auto-logout
  async checkSessionActivity(userId, sessionId) {
    try {
      const result = await pool.query(
        `SELECT last_activity, expires_at 
         FROM user_sessions 
         WHERE user_id = $1 AND session_id = $2`,
        [userId, sessionId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const session = result.rows[0];
      const now = new Date();
      const lastActivity = new Date(session.last_activity);
      const expiresAt = new Date(session.expires_at);

      // Check if session has expired
      if (now > expiresAt) {
        await this.invalidateSession(sessionId);
        return false;
      }

      // Update last activity
      await pool.query(
        "UPDATE user_sessions SET last_activity = NOW() WHERE session_id = $1",
        [sessionId]
      );

      return true;
    } catch (error) {
      console.error("Session activity check error:", error);
      return false;
    }
  }

  // Get user sessions
  async getUserSessions(userId) {
    try {
      const result = await pool.query(
        `SELECT session_id, created_at, last_activity, expires_at
         FROM user_sessions 
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY last_activity DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error("Get user sessions error:", error);
      return [];
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId) {
    try {
      await pool.query(
        "UPDATE user_sessions SET last_activity = NOW() WHERE session_id = $1",
        [sessionId]
      );
    } catch (error) {
      // Don't throw error for activity updates
      console.error("Failed to update session activity:", error);
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      await pool.query("DELETE FROM user_sessions WHERE expires_at < NOW()");

      await pool.query("DELETE FROM password_resets WHERE expires_at < NOW()");

      await pool.query(
        "DELETE FROM email_verifications WHERE expires_at < NOW()"
      );
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
    }
  }
}

module.exports = new AuthService();
