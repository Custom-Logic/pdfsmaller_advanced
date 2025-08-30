/**
 * Architecture Validation Script
 * Validates that the codebase follows the new event-driven, service-centric architecture
 */

import fs from 'fs';
import path from 'path';

class ArchitectureValidator {
    constructor() {
        this.violations = [];
        this.warnings = [];
        this.successes = [];
    }

    async validate() {
        console.log('🔍 Validating Architecture Compliance...\n');

        // Check service compliance
        await this.validateServices();
        
        // Check component compliance
        await this.validateComponents();
        
        // Check controller compliance
        await this.validateController();
        
        // Print results
        this.printResults();
    }

    async validateServices() {
        console.log('📋 Validating Services...');
        
        const serviceFiles = [
            'js/services/storage-service.js',
            'js/services/compression-service.js',
            'js/services/conversion-service.js',
            'js/services/ai-service.js',
            'js/services/ocr-service.js',
            'js/services/cloud-integration-service.js'
        ];

        for (const serviceFile of serviceFiles) {
            await this.validateService(serviceFile);
        }
    }

    async validateService(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const serviceName = path.basename(filePath, '.js');

            // Check if extends StandardService
            if (content.includes('extends StandardService')) {
                this.successes.push(`✅ ${serviceName}: Extends StandardService`);
            } else {
                this.violations.push(`❌ ${serviceName}: Does not extend StandardService`);
            }

            // Check for event emission methods
            const requiredMethods = ['emitProgress', 'emitComplete', 'emitError'];
            for (const method of requiredMethods) {
                if (content.includes(method)) {
                    this.successes.push(`✅ ${serviceName}: Uses ${method}`);
                } else {
                    this.violations.push(`❌ ${serviceName}: Missing ${method} usage`);
                }
            }

            // Check for direct DOM manipulation (should not exist)
            if (content.includes('document.querySelector') || content.includes('document.getElementById')) {
                this.violations.push(`❌ ${serviceName}: Contains direct DOM manipulation`);
            } else {
                this.successes.push(`✅ ${serviceName}: No direct DOM manipulation`);
            }

        } catch (error) {
            this.violations.push(`❌ ${filePath}: File not found or unreadable`);
        }
    }

    async validateComponents() {
        console.log('📋 Validating Components...');
        
        const componentFiles = [
            'js/components/file-uploader.js',
            'js/components/ai-panel.js',
            'js/components/ocr-panel.js',
            'js/components/file-manager.js'
        ];

        for (const componentFile of componentFiles) {
            await this.validateComponent(componentFile);
        }
    }

    async validateComponent(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const componentName = path.basename(filePath, '.js');

            // Check for direct service instantiation (should not exist)
            const servicePatterns = [
                'new CompressionService',
                'new ConversionService', 
                'new AIService',
                'new OCRService',
                'new StorageService'
            ];

            let hasDirectServiceCalls = false;
            for (const pattern of servicePatterns) {
                if (content.includes(pattern)) {
                    this.violations.push(`❌ ${componentName}: Direct service instantiation: ${pattern}`);
                    hasDirectServiceCalls = true;
                }
            }

            if (!hasDirectServiceCalls) {
                this.successes.push(`✅ ${componentName}: No direct service instantiation`);
            }

            // Check for event emission
            if (content.includes('dispatchEvent') || content.includes('CustomEvent')) {
                this.successes.push(`✅ ${componentName}: Uses event emission`);
            } else {
                this.warnings.push(`⚠️ ${componentName}: No event emission found`);
            }

            // Check for business logic (should be minimal)
            const businessLogicPatterns = [
                'compress(',
                'convert(',
                'summarize(',
                'translate(',
                'performOCR('
            ];

            let hasBusinessLogic = false;
            for (const pattern of businessLogicPatterns) {
                if (content.includes(pattern)) {
                    this.warnings.push(`⚠️ ${componentName}: Possible business logic: ${pattern}`);
                    hasBusinessLogic = true;
                }
            }

            if (!hasBusinessLogic) {
                this.successes.push(`✅ ${componentName}: No business logic detected`);
            }

        } catch (error) {
            this.violations.push(`❌ ${filePath}: File not found or unreadable`);
        }
    }

    async validateController() {
        console.log('📋 Validating Controller...');
        
        try {
            const content = fs.readFileSync('js/controllers/main-controller.js', 'utf8');

            // Check for service registration
            const requiredServices = ['storage', 'compression', 'conversion', 'ai', 'ocr', 'cloud'];
            for (const service of requiredServices) {
                if (content.includes(`'${service}'`)) {
                    this.successes.push(`✅ MainController: Registers ${service} service`);
                } else {
                    this.violations.push(`❌ MainController: Missing ${service} service registration`);
                }
            }

            // Check for event listeners
            const requiredEventListeners = [
                'fileUploaded',
                'compressionRequested',
                'conversionRequested',
                'aiProcessingRequested',
                'ocrProcessingRequested'
            ];

            for (const event of requiredEventListeners) {
                if (content.includes(event)) {
                    this.successes.push(`✅ MainController: Listens for ${event}`);
                } else {
                    this.violations.push(`❌ MainController: Missing ${event} listener`);
                }
            }

        } catch (error) {
            this.violations.push(`❌ MainController: File not found or unreadable`);
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 ARCHITECTURE VALIDATION RESULTS');
        console.log('='.repeat(60));

        if (this.successes.length > 0) {
            console.log('\n✅ SUCCESSES:');
            this.successes.forEach(success => console.log(`  ${success}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }

        if (this.violations.length > 0) {
            console.log('\n❌ VIOLATIONS:');
            this.violations.forEach(violation => console.log(`  ${violation}`));
        }

        console.log('\n' + '='.repeat(60));
        console.log('📈 SUMMARY:');
        console.log(`  ✅ Successes: ${this.successes.length}`);
        console.log(`  ⚠️ Warnings: ${this.warnings.length}`);
        console.log(`  ❌ Violations: ${this.violations.length}`);
        
        const totalChecks = this.successes.length + this.warnings.length + this.violations.length;
        const complianceRate = ((this.successes.length / totalChecks) * 100).toFixed(1);
        console.log(`  📊 Compliance Rate: ${complianceRate}%`);

        if (this.violations.length === 0) {
            console.log('\n🎉 ARCHITECTURE VALIDATION PASSED!');
            console.log('   The codebase follows the event-driven, service-centric architecture.');
        } else {
            console.log('\n🚨 ARCHITECTURE VALIDATION FAILED!');
            console.log('   Please fix the violations before proceeding.');
        }
        
        console.log('='.repeat(60));
    }
}

// Run validation
const validator = new ArchitectureValidator();
validator.validate().catch(console.error);