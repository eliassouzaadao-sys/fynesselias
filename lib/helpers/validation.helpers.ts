/**
 * Validation Helper Utilities
 * Common validation functions
 */

/**
 * Validate CPF (Brazilian individual tax ID)
 * @param cpf - CPF string
 * @returns True if valid
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove formatting
  const cleaned = cpf.replace(/[^\d]/g, '');

  if (cleaned.length !== 11) return false;

  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Validate CNPJ (Brazilian company tax ID)
 * @param cnpj - CNPJ string
 * @returns True if valid
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove formatting
  const cleaned = cnpj.replace(/[^\d]/g, '');

  if (cleaned.length !== 14) return false;

  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Validate check digits
  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Validate email
 * @param email - Email string
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Brazilian format)
 * @param phone - Phone string
 * @returns True if valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Validate CEP (Brazilian postal code)
 * @param cep - CEP string
 * @returns True if valid
 */
export function isValidCEP(cep: string): boolean {
  if (!cep) return false;
  const cleaned = cep.replace(/[^\d]/g, '');
  return cleaned.length === 8;
}

/**
 * Validate currency value
 * @param value - Value to validate
 * @returns True if valid
 */
export function isValidCurrency(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate date string
 * @param date - Date string
 * @returns True if valid
 */
export function isValidDate(date: string): boolean {
  if (!date) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Check if string is empty or whitespace
 * @param str - String to check
 * @returns True if empty
 */
export function isEmpty(str: any): boolean {
  return !str || (typeof str === 'string' && str.trim().length === 0);
}

/**
 * Check if value is numeric
 * @param value - Value to check
 * @returns True if numeric
 */
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Sanitize string (remove dangerous characters)
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  return str.replace(/[<>\"']/g, '');
}

/**
 * Validate required fields in object
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Object with validation result
 */
export function validateRequiredFields(
  obj: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter((field) => isEmpty(obj[field]));

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
