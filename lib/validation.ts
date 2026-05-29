export interface PasswordValidationResult {
    isValid: boolean
    errors: string[]
}

export interface ValidationResult {
    isValid: boolean
    error?: string
}

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = []

    if (!password) {
        return {
            isValid: false,
            errors: ['Password tidak boleh kosong'],
        }
    }

    if (password.length < 8) {
        errors.push('Password minimal 8 karakter')
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password harus mengandung minimal 1 huruf besar')
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password harus mengandung minimal 1 huruf kecil')
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password harus mengandung minimal 1 angka')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password harus mengandung minimal 1 simbol (!@#$%^&* dll)')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email) {
        return {
            isValid: false,
            error: 'Email tidak boleh kosong',
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            error: 'Format email tidak valid',
        }
    }

    return { isValid: true }
}


/**
 * Validates login form data
 */
export function validateLoginData(data: {
    email: string
    password: string
}): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {}

    const emailValidation = validateEmail(data.email)
    if (!emailValidation.isValid && emailValidation.error) {
        errors.email = [emailValidation.error]
    }

    if (!data.password) {
        errors.password = ['Password tidak boleh kosong']
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}
