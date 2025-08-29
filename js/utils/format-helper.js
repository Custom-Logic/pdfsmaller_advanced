/**
 * Format Helper Utility
 * Provides formatting functions for various data types
 */

export class FormatHelper {
    // File size formatting
    static formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        if (bytes < 0) return 'Invalid size';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // File size formatting with binary units
    static formatFileSizeBinary(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        if (bytes < 0) return 'Invalid size';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Parse file size string back to bytes
    static parseFileSize(sizeString) {
        const units = {
            'B': 1, 'BYTES': 1,
            'KB': 1024, 'KIB': 1024,
            'MB': 1024 * 1024, 'MIB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024, 'GIB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024, 'TIB': 1024 * 1024 * 1024 * 1024
        };
        
        const match = sizeString.trim().match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
        if (!match) return null;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        return units[unit] ? Math.round(value * units[unit]) : null;
    }

    // Time formatting
    static formatDuration(milliseconds) {
        if (milliseconds < 0) return 'Invalid duration';
        if (milliseconds === 0) return '0ms';
        
        const units = [
            { name: 'd', value: 24 * 60 * 60 * 1000 },
            { name: 'h', value: 60 * 60 * 1000 },
            { name: 'm', value: 60 * 1000 },
            { name: 's', value: 1000 },
            { name: 'ms', value: 1 }
        ];
        
        const parts = [];
        let remaining = milliseconds;
        
        for (const unit of units) {
            if (remaining >= unit.value) {
                const count = Math.floor(remaining / unit.value);
                parts.push(`${count}${unit.name}`);
                remaining %= unit.value;
            }
        }
        
        return parts.slice(0, 2).join(' '); // Show only first 2 units
    }

    // Format time in seconds to human readable
    static formatSeconds(seconds) {
        if (seconds < 0) return 'Invalid time';
        if (seconds === 0) return '0s';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        
        return parts.join(' ');
    }

    // Percentage formatting
    static formatPercentage(value, decimals = 1) {
        if (typeof value !== 'number' || isNaN(value)) return '0%';
        return `${value.toFixed(decimals)}%`;
    }

    // Number formatting with thousands separators
    static formatNumber(number, decimals = 0) {
        if (typeof number !== 'number' || isNaN(number)) return '0';
        
        return number.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    // Currency formatting
    static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Date and time formatting
    static formatDate(date, options = {}) {
        if (!(date instanceof Date) && typeof date !== 'string' && typeof date !== 'number') {
            return 'Invalid date';
        }
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid date';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
    }

    static formatDateTime(date, options = {}) {
        if (!(date instanceof Date) && typeof date !== 'string' && typeof date !== 'number') {
            return 'Invalid date';
        }
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid date';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return dateObj.toLocaleString(undefined, { ...defaultOptions, ...options });
    }

    static formatTime(date, options = {}) {
        if (!(date instanceof Date) && typeof date !== 'string' && typeof date !== 'number') {
            return 'Invalid time';
        }
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid time';
        
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        return dateObj.toLocaleTimeString(undefined, { ...defaultOptions, ...options });
    }

    // Relative time formatting (e.g., "2 minutes ago")
    static formatRelativeTime(date) {
        if (!(date instanceof Date) && typeof date !== 'string' && typeof date !== 'number') {
            return 'Invalid date';
        }
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid date';
        
        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) return 'just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return this.formatDate(dateObj);
    }

    // Text formatting
    static truncateText(text, maxLength, suffix = '...') {
        if (typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    static capitalizeFirst(text) {
        if (typeof text !== 'string' || text.length === 0) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    static capitalizeWords(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    static camelToKebab(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    static kebabToCamel(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    // URL formatting
    static formatURL(url) {
        if (typeof url !== 'string') return '';
        
        // Add protocol if missing
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        
        try {
            const urlObj = new URL(url);
            return urlObj.href;
        } catch (error) {
            return url; // Return original if invalid
        }
    }

    // Phone number formatting (basic US format)
    static formatPhoneNumber(phone) {
        if (typeof phone !== 'string') return '';
        
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        
        // Format based on length
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else if (digits.length === 11 && digits[0] === '1') {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        
        return phone; // Return original if can't format
    }

    // Email formatting/validation
    static formatEmail(email) {
        if (typeof email !== 'string') return '';
        return email.toLowerCase().trim();
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Compression ratio formatting
    static formatCompressionRatio(originalSize, compressedSize) {
        if (originalSize <= 0 || compressedSize < 0) return '0%';
        
        const ratio = ((originalSize - compressedSize) / originalSize) * 100;
        return this.formatPercentage(Math.max(0, ratio));
    }

    // File type formatting
    static formatFileType(mimeType) {
        const typeMap = {
            'application/pdf': 'PDF Document',
            'image/jpeg': 'JPEG Image',
            'image/jpg': 'JPEG Image',
            'image/png': 'PNG Image',
            'image/gif': 'GIF Image',
            'image/webp': 'WebP Image',
            'text/plain': 'Text File',
            'application/zip': 'ZIP Archive',
            'application/json': 'JSON File'
        };
        
        return typeMap[mimeType] || mimeType || 'Unknown';
    }

    // Processing status formatting
    static formatProcessingStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'processing': 'Processing',
            'completed': 'Completed',
            'failed': 'Failed',
            'cancelled': 'Cancelled',
            'queued': 'Queued',
            'uploading': 'Uploading',
            'downloading': 'Downloading'
        };
        
        return statusMap[status] || this.capitalizeFirst(status);
    }

    // Utility methods
    static isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    static sanitizeHTML(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Template string formatting
    static template(str, data) {
        return str.replace(/\{(\w+)\}/g, (match, key) => {
            return data.hasOwnProperty(key) ? data[key] : match;
        });
    }

    // Color formatting
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}