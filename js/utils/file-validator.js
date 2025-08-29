/**
 * File Validator Utility
 * Handles file validation and security checks
 */

export class FileValidator {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB default
        this.allowedTypes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg'
        ];
        this.allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
        
        // PDF magic bytes for validation
        this.pdfMagicBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF
        
        // Image magic bytes
        this.imageMagicBytes = {
            png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            jpeg: [0xFF, 0xD8, 0xFF],
            jpg: [0xFF, 0xD8, 0xFF]
        };
    }

    async validateFile(file, options = {}) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }
        };

        try {
            // Basic validation
            this.validateBasicProperties(file, validation, options);
            
            // File size validation
            this.validateFileSize(file, validation, options);
            
            // File type validation
            this.validateFileType(file, validation, options);
            
            // File extension validation
            this.validateFileExtension(file, validation, options);
            
            // Magic bytes validation (async)
            await this.validateMagicBytes(file, validation);
            
            // Security validation
            await this.validateSecurity(file, validation);
            
            // PDF-specific validation
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                await this.validatePDF(file, validation);
            }
            
        } catch (error) {
            validation.isValid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }

        return validation;
    }

    validateBasicProperties(file, validation, options) {
        // Check if file exists
        if (!file) {
            validation.isValid = false;
            validation.errors.push('No file provided');
            return;
        }

        // Check file name
        if (!file.name || file.name.trim() === '') {
            validation.isValid = false;
            validation.errors.push('File name is required');
        }

        // Check for suspicious file names
        if (this.hasSuspiciousFileName(file.name)) {
            validation.isValid = false;
            validation.errors.push('File name contains suspicious characters');
        }

        // Check file name length
        if (file.name.length > 255) {
            validation.isValid = false;
            validation.errors.push('File name is too long (maximum 255 characters)');
        }
    }

    validateFileSize(file, validation, options) {
        const maxSize = options.maxSize || this.maxFileSize;
        const minSize = options.minSize || 1; // 1 byte minimum

        if (file.size > maxSize) {
            validation.isValid = false;
            validation.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`);
        }

        if (file.size < minSize) {
            validation.isValid = false;
            validation.errors.push(`File size (${this.formatFileSize(file.size)}) is below minimum required size (${this.formatFileSize(minSize)})`);
        }

        // Warn about very large files
        if (file.size > 10 * 1024 * 1024) { // 10MB
            validation.warnings.push('Large file detected. Processing may take longer.');
        }
    }

    validateFileType(file, validation, options) {
        const allowedTypes = options.acceptedTypes || this.allowedTypes;
        
        if (!allowedTypes.includes(file.type)) {
            validation.isValid = false;
            validation.errors.push(`File type '${file.type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        // Check for empty or suspicious MIME types
        if (!file.type || file.type.trim() === '') {
            validation.warnings.push('File type could not be determined');
        }
    }

    validateFileExtension(file, validation, options) {
        const allowedExtensions = options.acceptedExtensions || this.allowedExtensions;
        const fileExtension = this.getFileExtension(file.name);
        
        if (!allowedExtensions.includes(fileExtension)) {
            validation.isValid = false;
            validation.errors.push(`File extension '${fileExtension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
        }

        // Check for double extensions (potential security risk)
        if (this.hasDoubleExtension(file.name)) {
            validation.warnings.push('File has multiple extensions, which may indicate a security risk');
        }
    }

    async validateMagicBytes(file, validation) {
        try {
            const buffer = await this.readFileHeader(file, 16);
            const bytes = new Uint8Array(buffer);
            
            // Validate based on file type
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                if (!this.validatePDFMagicBytes(bytes)) {
                    validation.isValid = false;
                    validation.errors.push('File does not appear to be a valid PDF (invalid file signature)');
                }
            } else if (file.type.startsWith('image/')) {
                if (!this.validateImageMagicBytes(bytes, file.type)) {
                    validation.warnings.push('File signature does not match declared image type');
                }
            }
        } catch (error) {
            validation.warnings.push('Could not validate file signature');
        }
    }

    async validateSecurity(file, validation) {
        // Check for potentially malicious file names
        if (this.hasMaliciousPatterns(file.name)) {
            validation.isValid = false;
            validation.errors.push('File name contains potentially malicious patterns');
        }

        // Check for executable extensions disguised as documents
        if (this.hasExecutableExtension(file.name)) {
            validation.isValid = false;
            validation.errors.push('File appears to be an executable disguised as a document');
        }

        // Check file content for suspicious patterns (basic check)
        try {
            const header = await this.readFileHeader(file, 1024);
            if (this.hasSuspiciousContent(header)) {
                validation.warnings.push('File content may contain suspicious patterns');
            }
        } catch (error) {
            // Ignore errors in content scanning
        }
    }

    async validatePDF(file, validation) {
        try {
            // Read PDF header
            const header = await this.readFileHeader(file, 1024);
            const headerText = new TextDecoder().decode(header);
            
            // Check PDF version
            const versionMatch = headerText.match(/%PDF-(\d+\.\d+)/);
            if (versionMatch) {
                const version = parseFloat(versionMatch[1]);
                validation.fileInfo.pdfVersion = version;
                
                if (version > 2.0) {
                    validation.warnings.push('PDF version is very new and may not be fully supported');
                } else if (version < 1.3) {
                    validation.warnings.push('PDF version is very old and may have compatibility issues');
                }
            }
            
            // Check for encrypted PDFs
            if (headerText.includes('/Encrypt')) {
                validation.warnings.push('PDF appears to be encrypted or password-protected');
            }
            
            // Check for forms
            if (headerText.includes('/AcroForm') || headerText.includes('/XFA')) {
                validation.warnings.push('PDF contains interactive forms');
            }
            
            // Check for JavaScript
            if (headerText.includes('/JavaScript') || headerText.includes('/JS')) {
                validation.warnings.push('PDF contains JavaScript code');
            }
            
        } catch (error) {
            validation.warnings.push('Could not fully validate PDF structure');
        }
    }

    // Helper methods
    readFileHeader(file, bytes = 16) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file.slice(0, bytes));
        });
    }

    validatePDFMagicBytes(bytes) {
        return this.pdfMagicBytes.every((byte, index) => bytes[index] === byte);
    }

    validateImageMagicBytes(bytes, mimeType) {
        switch (mimeType) {
            case 'image/png':
                return this.imageMagicBytes.png.every((byte, index) => bytes[index] === byte);
            case 'image/jpeg':
            case 'image/jpg':
                return this.imageMagicBytes.jpeg.every((byte, index) => bytes[index] === byte);
            default:
                return true; // Unknown type, skip validation
        }
    }

    getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
    }

    hasDoubleExtension(fileName) {
        const parts = fileName.split('.');
        return parts.length > 2;
    }

    hasSuspiciousFileName(fileName) {
        // Check for null bytes, control characters, and path traversal
        const suspiciousPatterns = [
            /\x00/, // Null byte
            /[\x01-\x1f\x7f]/, // Control characters
            /\.\.\//, // Path traversal
            /\.\.\\/,  // Windows path traversal
            /<script/i, // Script tags
            /javascript:/i, // JavaScript protocol
            /data:/i, // Data URLs
            /vbscript:/i // VBScript
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(fileName));
    }

    hasMaliciousPatterns(fileName) {
        const maliciousPatterns = [
            /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|pkg|dmg)$/i,
            /\.(php|asp|jsp|cgi|pl|py|rb)$/i,
            /\.(sh|bash|zsh|fish)$/i
        ];
        
        return maliciousPatterns.some(pattern => pattern.test(fileName));
    }

    hasExecutableExtension(fileName) {
        const executableExtensions = [
            '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
            '.jar', '.app', '.deb', '.pkg', '.dmg', '.msi', '.run'
        ];
        
        const extension = this.getFileExtension(fileName);
        return executableExtensions.includes(extension);
    }

    hasSuspiciousContent(buffer) {
        const content = new Uint8Array(buffer);
        
        // Check for executable signatures
        const executableSignatures = [
            [0x4D, 0x5A], // PE executable (MZ)
            [0x7F, 0x45, 0x4C, 0x46], // ELF executable
            [0xCF, 0xFA, 0xED, 0xFE], // Mach-O executable
            [0xFE, 0xED, 0xFA, 0xCE], // Mach-O executable (reverse)
        ];
        
        return executableSignatures.some(signature => 
            signature.every((byte, index) => content[index] === byte)
        );
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Public utility methods
    isValidFileType(file, allowedTypes = null) {
        const types = allowedTypes || this.allowedTypes;
        return types.includes(file.type);
    }

    isValidFileSize(file, maxSize = null) {
        const max = maxSize || this.maxFileSize;
        return file.size <= max && file.size > 0;
    }

    getValidationSummary(validation) {
        return {
            isValid: validation.isValid,
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
            hasSecurityIssues: validation.errors.some(error => 
                error.includes('suspicious') || error.includes('malicious') || error.includes('security')
            )
        };
    }

    // Configuration methods
    setMaxFileSize(size) {
        this.maxFileSize = size;
    }

    setAllowedTypes(types) {
        this.allowedTypes = types;
    }

    setAllowedExtensions(extensions) {
        this.allowedExtensions = extensions;
    }
}