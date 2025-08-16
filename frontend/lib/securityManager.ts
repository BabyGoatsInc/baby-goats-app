import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { errorMonitoring } from './errorMonitoring';

/**
 * Comprehensive Security Management System for Baby Goats App
 * Provides input validation, data encryption, security auditing, and authentication hardening
 */

export interface SecurityPolicy {
  maxLoginAttempts: number;
  sessionTimeout: number; // in milliseconds
  passwordMinLength: number;
  requireSpecialCharacters: boolean;
  enableBiometric: boolean;
  dataSanitization: boolean;
  auditLogging: boolean;
}

export interface SecurityViolation {
  id: string;
  type: 'authentication' | 'input_validation' | 'data_access' | 'rate_limiting' | 'injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  userContext?: string;
  remoteAddress?: string;
  metadata?: Record<string, any>;
}

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastActivity: number;
  isValid: boolean;
  deviceFingerprint?: string;
}

export interface ValidationRule {
  name: string;
  pattern?: RegExp;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  customValidator?: (value: any) => boolean;
  sanitizer?: (value: any) => any;
}

class SecurityManager {
  private securityPolicy: SecurityPolicy = {
    maxLoginAttempts: 5,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    passwordMinLength: 8,
    requireSpecialCharacters: true,
    enableBiometric: true,
    dataSanitization: true,
    auditLogging: true,
  };

  private loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private activeSessions = new Map<string, SessionInfo>();
  private securityViolations: SecurityViolation[] = [];
  private readonly STORAGE_KEY = 'babygoats_security_data';
  private readonly MAX_VIOLATIONS = 1000;

  /**
   * Initialize security manager
   */
  async initialize(): Promise<void> {
    console.log('🔒 Initializing Security Manager...');

    try {
      await this.loadSecurityData();
      this.startSessionCleanup();
      this.startSecurityAudit();
      
      console.log('✅ Security Manager initialized');
      await this.logSecurityEvent('info', 'Security manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Security Manager:', error);
      await errorMonitoring.logError(error as Error, 'high', 'error', {
        component: 'SecurityManager',
        phase: 'initialization'
      });
    }
  }

  /**
   * Validate and sanitize user input
   */
  validateInput(value: any, rules: ValidationRule[]): {
    isValid: boolean;
    sanitizedValue: any;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitizedValue = value;

    try {
      for (const rule of rules) {
        // Required check
        if (rule.required && (value === null || value === undefined || value === '')) {
          errors.push(`${rule.name} is required`);
          continue;
        }

        // Skip further validation if value is empty and not required
        if (!rule.required && (value === null || value === undefined || value === '')) {
          continue;
        }

        // Length validation
        if (rule.minLength && String(value).length < rule.minLength) {
          errors.push(`${rule.name} must be at least ${rule.minLength} characters`);
        }

        if (rule.maxLength && String(value).length > rule.maxLength) {
          errors.push(`${rule.name} must not exceed ${rule.maxLength} characters`);
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(String(value))) {
          errors.push(`${rule.name} format is invalid`);
        }

        // Custom validation
        if (rule.customValidator && !rule.customValidator(value)) {
          errors.push(`${rule.name} validation failed`);
        }

        // Sanitization
        if (rule.sanitizer) {
          sanitizedValue = rule.sanitizer(sanitizedValue);
        }
      }

      // Default sanitization for security
      if (this.securityPolicy.dataSanitization && typeof sanitizedValue === 'string') {
        sanitizedValue = this.sanitizeString(sanitizedValue);
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue,
        errors,
      };

    } catch (error) {
      this.logSecurityViolation('input_validation', 'high', 'Input validation error', {
        originalValue: String(value).substring(0, 100), // Limit for security
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['Validation error occurred'],
      };
    }
  }

  /**
   * Sanitize string input against XSS and injection attacks
   */
  private sanitizeString(input: string): string {
    if (typeof input !== 'string') return String(input);

    return input
      // Remove HTML tags
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      // Escape special characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      // Remove potential SQL injection patterns
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/gi, '')
      // Remove JavaScript event handlers
      .replace(/on\w+\s*=/gi, '')
      // Limit length to prevent buffer overflow
      .substring(0, 10000);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
  } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (!password || password.length < this.securityPolicy.passwordMinLength) {
      errors.push(`Password must be at least ${this.securityPolicy.passwordMinLength} characters long`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.securityPolicy.requireSpecialCharacters && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password contains common patterns and is easily guessable');
    }

    // Calculate strength
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (password.length >= 16) score++;

    if (score >= 6) strength = 'strong';
    else if (score >= 4) strength = 'medium';

    return {
      isValid: errors.length === 0,
      strength,
      errors,
    };
  }

  /**
   * Track and limit login attempts
   */
  trackLoginAttempt(identifier: string, success: boolean): {
    allowed: boolean;
    remainingAttempts: number;
    lockoutTime?: number;
  } {
    const now = Date.now();
    const attemptData = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };

    if (success) {
      // Reset on successful login
      this.loginAttempts.delete(identifier);
      return { allowed: true, remainingAttempts: this.securityPolicy.maxLoginAttempts };
    }

    // Check if lockout period has expired (1 hour)
    const lockoutDuration = 60 * 60 * 1000; // 1 hour
    if (attemptData.count >= this.securityPolicy.maxLoginAttempts) {
      const timeSinceLastAttempt = now - attemptData.lastAttempt;
      if (timeSinceLastAttempt < lockoutDuration) {
        const lockoutTime = attemptData.lastAttempt + lockoutDuration;
        this.logSecurityViolation('authentication', 'high', 'Login attempt during lockout', {
          identifier,
          attemptCount: attemptData.count,
          lockoutTime,
        });
        return { allowed: false, remainingAttempts: 0, lockoutTime };
      } else {
        // Reset after lockout period
        attemptData.count = 0;
      }
    }

    // Increment attempt count
    attemptData.count++;
    attemptData.lastAttempt = now;
    this.loginAttempts.set(identifier, attemptData);

    const remainingAttempts = Math.max(0, this.securityPolicy.maxLoginAttempts - attemptData.count);

    if (attemptData.count >= this.securityPolicy.maxLoginAttempts) {
      this.logSecurityViolation('authentication', 'high', 'Maximum login attempts exceeded', {
        identifier,
        attemptCount: attemptData.count,
      });
    }

    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
    };
  }

  /**
   * Create and manage secure sessions
   */
  async createSession(userId: string): Promise<SessionInfo> {
    const sessionId = await this.generateSecureId();
    const deviceFingerprint = await this.generateDeviceFingerprint();
    
    const session: SessionInfo = {
      sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isValid: true,
      deviceFingerprint,
    };

    this.activeSessions.set(sessionId, session);
    await this.saveSecurityData();

    await this.logSecurityEvent('info', 'Session created', {
      sessionId,
      userId,
      deviceFingerprint,
    });

    return session;
  }

  /**
   * Validate session and check for timeout
   */
  validateSession(sessionId: string): { isValid: boolean; session?: SessionInfo } {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return { isValid: false };
    }

    const now = Date.now();
    const timeSinceLastActivity = now - session.lastActivity;

    if (timeSinceLastActivity > this.securityPolicy.sessionTimeout) {
      this.invalidateSession(sessionId);
      this.logSecurityViolation('authentication', 'medium', 'Session timeout', {
        sessionId,
        userId: session.userId,
        inactiveTime: timeSinceLastActivity,
      });
      return { isValid: false };
    }

    // Update last activity
    session.lastActivity = now;
    this.activeSessions.set(sessionId, session);

    return { isValid: true, session };
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    this.activeSessions.delete(sessionId);
    await this.saveSecurityData();

    await this.logSecurityEvent('info', 'Session invalidated', {
      sessionId,
      userId: session?.userId,
    });
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, key?: string): Promise<string> {
    try {
      // Simple encryption for demo - in production, use proper encryption library
      const encryptionKey = key || await this.getEncryptionKey();
      const encrypted = this.simpleEncrypt(data, encryptionKey);
      
      return encrypted;
    } catch (error) {
      await this.logSecurityViolation('data_access', 'high', 'Encryption failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string, key?: string): Promise<string> {
    try {
      const encryptionKey = key || await this.getEncryptionKey();
      const decrypted = this.simpleDecrypt(encryptedData, encryptionKey);
      
      return decrypted;
    } catch (error) {
      await this.logSecurityViolation('data_access', 'high', 'Decryption failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Rate limiting for API calls
   */
  checkRateLimit(identifier: string, limit: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    // Get or create rate limit data
    const rateLimitData = this.getRateLimitData(key) || {
      count: 0,
      windowStart: now,
    };

    // Check if window has expired
    if (now - rateLimitData.windowStart > windowMs) {
      rateLimitData.count = 0;
      rateLimitData.windowStart = now;
    }

    const remaining = Math.max(0, limit - rateLimitData.count);
    const resetTime = rateLimitData.windowStart + windowMs;

    if (rateLimitData.count >= limit) {
      this.logSecurityViolation('rate_limiting', 'medium', 'Rate limit exceeded', {
        identifier,
        limit,
        windowMs,
        currentCount: rateLimitData.count,
      });
      
      return { allowed: false, remaining: 0, resetTime };
    }

    // Increment count
    rateLimitData.count++;
    this.setRateLimitData(key, rateLimitData);

    return { allowed: true, remaining: remaining - 1, resetTime };
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    activeViolations: number;
    violationsBySeverity: Record<string, number>;
    violationsByType: Record<string, number>;
    activeSessions: number;
    blockedLoginAttempts: number;
  } {
    const violationsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    const violationsByType = { 
      authentication: 0, 
      input_validation: 0, 
      data_access: 0, 
      rate_limiting: 0, 
      injection: 0 
    };

    this.securityViolations.forEach(violation => {
      violationsBySeverity[violation.severity]++;
      violationsByType[violation.type]++;
    });

    const blockedLoginAttempts = Array.from(this.loginAttempts.values())
      .reduce((total, attempt) => total + attempt.count, 0);

    return {
      activeViolations: this.securityViolations.length,
      violationsBySeverity,
      violationsByType,
      activeSessions: this.activeSessions.size,
      blockedLoginAttempts,
    };
  }

  /**
   * Export security report
   */
  exportSecurityReport(): {
    violations: SecurityViolation[];
    sessions: SessionInfo[];
    stats: ReturnType<typeof this.getSecurityStats>;
    policy: SecurityPolicy;
  } {
    return {
      violations: [...this.securityViolations],
      sessions: Array.from(this.activeSessions.values()),
      stats: this.getSecurityStats(),
      policy: this.securityPolicy,
    };
  }

  // Private methods

  private async logSecurityViolation(
    type: SecurityViolation['type'],
    severity: SecurityViolation['severity'],
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const violation: SecurityViolation = {
      id: await this.generateSecureId(),
      type,
      severity,
      description,
      timestamp: Date.now(),
      metadata,
    };

    this.securityViolations.push(violation);

    // Manage violations list size
    if (this.securityViolations.length > this.MAX_VIOLATIONS) {
      this.securityViolations.shift();
    }

    await this.saveSecurityData();

    // Log to error monitoring system
    await errorMonitoring.logError(
      `Security violation: ${description}`,
      severity,
      'error',
      { securityViolation: violation }
    );

    if (__DEV__) {
      console.warn(`🚨 Security Violation [${severity.toUpperCase()}]: ${description}`, metadata);
    }
  }

  private async logSecurityEvent(
    level: 'info' | 'warning',
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.securityPolicy.auditLogging) {
      await errorMonitoring.logEvent(level, `Security: ${message}`, metadata);
    }
  }

  private async generateSecureId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 15);
    return `${timestamp}${random}`;
  }

  private async generateDeviceFingerprint(): Promise<string> {
    // Simple device fingerprinting - in production, use more sophisticated methods
    const components = [
      Platform.OS,
      Platform.Version,
      await this.getDeviceId(),
    ];
    
    return btoa(components.join('|'));
  }

  private async getDeviceId(): Promise<string> {
    try {
      // In production, would use proper device ID library
      return 'device_' + Math.random().toString(36).substr(2, 15);
    } catch {
      return 'unknown_device';
    }
  }

  private async getEncryptionKey(): Promise<string> {
    // In production, use secure key storage
    return 'baby_goats_encryption_key_2025';
  }

  private simpleEncrypt(text: string, key: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  private simpleDecrypt(encryptedText: string, key: string): string {
    try {
      const text = atob(encryptedText);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      throw new Error('Invalid encrypted data');
    }
  }

  private rateLimitStorage = new Map<string, { count: number; windowStart: number }>();

  private getRateLimitData(key: string) {
    return this.rateLimitStorage.get(key);
  }

  private setRateLimitData(key: string, data: { count: number; windowStart: number }) {
    this.rateLimitStorage.set(key, data);
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 10 minutes
    setInterval(() => {
      const now = Date.now();
      const expiredSessions: string[] = [];

      this.activeSessions.forEach((session, sessionId) => {
        if (now - session.lastActivity > this.securityPolicy.sessionTimeout) {
          expiredSessions.push(sessionId);
        }
      });

      expiredSessions.forEach(sessionId => {
        this.invalidateSession(sessionId);
      });

      if (expiredSessions.length > 0) {
        console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  private startSecurityAudit(): void {
    // Run security audit every hour
    setInterval(async () => {
      const stats = this.getSecurityStats();
      
      if (stats.violationsBySeverity.critical > 0) {
        await this.logSecurityEvent('warning', 'Critical security violations detected', stats);
      }

      if (stats.blockedLoginAttempts > 10) {
        await this.logSecurityEvent('warning', 'High number of blocked login attempts', stats);
      }

      console.log('🔍 Security audit completed', stats);
    }, 60 * 60 * 1000); // 1 hour
  }

  private async loadSecurityData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.securityViolations = data.violations || [];
        // Don't restore sessions for security - require re-authentication
        console.log(`🔒 Loaded ${this.securityViolations.length} security violations`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load security data:', error);
    }
  }

  private async saveSecurityData(): Promise<void> {
    try {
      const data = {
        violations: this.securityViolations,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save security data:', error);
    }
  }
}

// Create singleton instance
export const securityManager = new SecurityManager();

/**
 * Common validation rules
 */
export const ValidationRules = {
  email: {
    name: 'Email',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true,
    maxLength: 255,
  },
  
  username: {
    name: 'Username',
    pattern: /^[a-zA-Z0-9_]{3,20}$/,
    required: true,
    minLength: 3,
    maxLength: 20,
  },
  
  displayName: {
    name: 'Display Name',
    required: true,
    minLength: 1,
    maxLength: 50,
    sanitizer: (value: string) => value.trim(),
  },
  
  age: {
    name: 'Age',
    customValidator: (value: any) => {
      const age = parseInt(value);
      return age >= 8 && age <= 16; // Baby Goats age range
    },
    required: true,
  },
  
  sportName: {
    name: 'Sport',
    required: true,
    maxLength: 30,
    sanitizer: (value: string) => value.trim(),
  },
} as const;

/**
 * Security utilities
 */
export class SecurityUtils {
  /**
   * Validate user input with common rules
   */
  static validateUserInput(data: Record<string, any>): {
    isValid: boolean;
    errors: Record<string, string[]>;
    sanitizedData: Record<string, any>;
  } {
    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [field, value] of Object.entries(data)) {
      const rule = ValidationRules[field as keyof typeof ValidationRules];
      if (rule) {
        const result = securityManager.validateInput(value, [rule]);
        if (!result.isValid) {
          errors[field] = result.errors;
        }
        sanitizedData[field] = result.sanitizedValue;
      } else {
        // Default sanitization for unknown fields
        sanitizedData[field] = typeof value === 'string' 
          ? value.substring(0, 1000).trim() 
          : value;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData,
    };
  }

  /**
   * Generate secure random token
   */
  static async generateSecureToken(length: number = 32): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Check if data contains potentially malicious content
   */
  static containsMaliciousContent(data: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /(select|insert|update|delete|drop|union|alter)\s+/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
    ];

    return maliciousPatterns.some(pattern => pattern.test(data));
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}