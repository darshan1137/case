// Validation utilities for user data

export const validators = {
  // Email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (Indian format: +91XXXXXXXXXX)
  isValidPhone(phone) {
    const phoneRegex = /^\+91[0-9]{10}$/;
    return phoneRegex.test(phone);
  },

  // Check if all required fields are present
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  },

  // Validate user creation data
  validateUserData(userData) {
    const errors = [];
    
    // Check required fields
    const requiredFields = ['name', 'role', 'department', 'ward_id', 'zone', 'phone', 'email', 'password'];
    const { isValid, missingFields } = this.validateRequiredFields(userData, requiredFields);
    
    if (!isValid) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate email
    if (userData.email && !this.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone
    if (userData.phone && !this.isValidPhone(userData.phone)) {
      errors.push('Phone number must be in format +91XXXXXXXXXX');
    }

    // Validate password (minimum 6 characters)
    if (userData.password && userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Validate role (optional - add your specific roles here)
    const validRoles = ['WARD_AMC', 'ADMIN', 'SUPERVISOR', 'FIELD_OFFICER'];
    if (userData.role && !validRoles.includes(userData.role)) {
      errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate user update data
  validateUpdateData(updateData) {
    const errors = [];

    // Validate email if provided
    if (updateData.email && !this.isValidEmail(updateData.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone if provided
    if (updateData.phone && !this.isValidPhone(updateData.phone)) {
      errors.push('Phone number must be in format +91XXXXXXXXXX');
    }

    // Validate role if provided
    const validRoles = ['WARD_AMC', 'ADMIN', 'SUPERVISOR', 'FIELD_OFFICER'];
    if (updateData.role && !validRoles.includes(updateData.role)) {
      errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check for forbidden fields
    const forbiddenFields = ['uid', 'created_at', 'password'];
    const hasForbiddenFields = forbiddenFields.some(field => field in updateData);
    if (hasForbiddenFields) {
      errors.push(`Cannot update the following fields: ${forbiddenFields.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Sanitize input data
  sanitizeInput(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
};
