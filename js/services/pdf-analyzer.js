/**
 * PDF Analyzer Service
 * Analyzes PDF files for compression potential and provides intelligent recommendations
 */

export class PDFAnalyzer {
    constructor() {
        this.pdfLib = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Load PDF-lib dynamically
            if (typeof PDFLib !== 'undefined') {
                this.pdfLib = PDFLib;
                this.initialized = true;
            } else {
                // Fallback: try to load from CDN
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
                script.onload = () => {
                    this.pdfLib = PDFLib;
                    this.initialized = true;
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            console.error('Failed to initialize PDF analyzer:', error);
            throw new Error('PDF analyzer initialization failed');
        }
    }

    async analyze(file) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await this.pdfLib.PDFDocument.load(arrayBuffer);
            
            const analysis = {
                pageCount: pdfDoc.getPageCount(),
                fileSize: file.size,
                compressionPotential: await this.calculateCompressionPotential(pdfDoc, arrayBuffer),
                documentType: await this.classifyDocument(pdfDoc),
                metadata: await this.extractMetadata(pdfDoc),
                imageCount: await this.countImages(pdfDoc),
                fontCount: await this.countFonts(pdfDoc),
                textDensity: await this.analyzeTextDensity(pdfDoc),
                colorProfile: await this.analyzeColorProfile(pdfDoc)
            };

            return analysis;
        } catch (error) {
            console.error('PDF analysis failed:', error);
            // Return basic analysis if detailed analysis fails
            return {
                pageCount: 0,
                fileSize: file.size,
                compressionPotential: 0.5,
                documentType: 'unknown',
                metadata: {},
                imageCount: 0,
                fontCount: 0,
                textDensity: 'unknown',
                colorProfile: 'unknown'
            };
        }
    }

    async calculateCompressionPotential(pdfDoc, arrayBuffer) {
        try {
            let score = 0.5; // Base score
            const pageCount = pdfDoc.getPageCount();
            
            // Analyze images
            const imageCount = await this.countImages(pdfDoc);
            if (imageCount > 0) {
                score += 0.2; // Images provide good compression opportunity
            }
            
            // Analyze fonts
            const fontCount = await this.countFonts(pdfDoc);
            if (fontCount > 5) {
                score += 0.1; // Many fonts can be optimized
            }
            
            // Analyze file size vs page count ratio
            const sizePerPage = arrayBuffer.byteLength / pageCount;
            if (sizePerPage > 100000) { // > 100KB per page
                score += 0.2; // Large pages likely have compressible content
            }
            
            // Analyze color profile
            const colorProfile = await this.analyzeColorProfile(pdfDoc);
            if (colorProfile === 'cmyk') {
                score += 0.1; // CMYK can be converted to RGB for compression
            }
            
            return Math.min(score, 1.0); // Cap at 1.0
        } catch (error) {
            console.warn('Compression potential calculation failed:', error);
            return 0.5; // Default score
        }
    }

    async classifyDocument(pdfDoc) {
        try {
            const pageCount = pdfDoc.getPageCount();
            const pages = pdfDoc.getPages();
            
            let hasImages = false;
            let hasText = false;
            let hasForms = false;
            
            // Sample first few pages for classification
            const samplePages = Math.min(3, pageCount);
            
            for (let i = 0; i < samplePages; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                
                // Check if page has images (simplified check)
                if (width > 0 && height > 0) {
                    hasImages = true;
                }
                
                // Check if page has text (simplified check)
                if (page.getTextContent) {
                    hasText = true;
                }
            }
            
            // Classify based on characteristics
            if (pageCount === 1 && hasImages) return 'single_image';
            if (pageCount === 1 && hasText) return 'single_page_document';
            if (pageCount > 10) return 'long_document';
            if (hasForms) return 'form_document';
            if (hasImages && hasText) return 'mixed_content';
            if (hasImages) return 'image_heavy';
            if (hasText) return 'text_heavy';
            
            return 'general_document';
        } catch (error) {
            console.warn('Document classification failed:', error);
            return 'unknown';
        }
    }

    async extractMetadata(pdfDoc) {
        try {
            const metadata = {};
            
            // Extract basic metadata
            if (pdfDoc.getTitle) {
                metadata.title = pdfDoc.getTitle();
            }
            if (pdfDoc.getAuthor) {
                metadata.author = pdfDoc.getAuthor();
            }
            if (pdfDoc.getSubject) {
                metadata.subject = pdfDoc.getSubject();
            }
            if (pdfDoc.getCreator) {
                metadata.creator = pdfDoc.getCreator();
            }
            if (pdfDoc.getProducer) {
                metadata.producer = pdfDoc.getProducer();
            }
            if (pdfDoc.getCreationDate) {
                metadata.creationDate = pdfDoc.getCreationDate();
            }
            if (pdfDoc.getModificationDate) {
                metadata.modificationDate = pdfDoc.getModificationDate();
            }
            
            return metadata;
        } catch (error) {
            console.warn('Metadata extraction failed:', error);
            return {};
        }
    }

    async countImages(pdfDoc) {
        try {
            // This is a simplified image count - in a real implementation,
            // you'd need to parse the PDF content stream to count actual images
            const pages = pdfDoc.getPages();
            let imageCount = 0;
            
            // Estimate based on page content (simplified approach)
            for (const page of pages) {
                const { width, height } = page.getSize();
                // Rough estimate: larger pages might have more images
                if (width * height > 1000000) { // > 1M pixels
                    imageCount += 2;
                } else if (width * height > 500000) { // > 500K pixels
                    imageCount += 1;
                }
            }
            
            return imageCount;
        } catch (error) {
            console.warn('Image counting failed:', error);
            return 0;
        }
    }

    async countFonts(pdfDoc) {
        try {
            // This is a simplified font count
            // In a real implementation, you'd need to access the font resources
            const pages = pdfDoc.getPages();
            let fontCount = 0;
            
            // Estimate based on page count (simplified approach)
            if (pages.length > 0) {
                fontCount = Math.min(pages.length * 2, 10); // Estimate 2 fonts per page, max 10
            }
            
            return fontCount;
        } catch (error) {
            console.warn('Font counting failed:', error);
            return 0;
        }
    }

    async analyzeTextDensity(pdfDoc) {
        try {
            const pages = pdfDoc.getPages();
            if (pages.length === 0) return 'unknown';
            
            // Simplified text density analysis
            const totalArea = pages.reduce((sum, page) => {
                const { width, height } = page.getSize();
                return sum + (width * height);
            }, 0);
            
            const avgPageArea = totalArea / pages.length;
            
            if (avgPageArea > 1000000) return 'high'; // Large pages
            if (avgPageArea > 500000) return 'medium';
            return 'low';
        } catch (error) {
            console.warn('Text density analysis failed:', error);
            return 'unknown';
        }
    }

    async analyzeColorProfile(pdfDoc) {
        try {
            // Simplified color profile detection
            // In a real implementation, you'd analyze the PDF's color space
            const pages = pdfDoc.getPages();
            
            // Check if any page has CMYK colors (simplified)
            for (const page of pages) {
                const { width, height } = page.getSize();
                // This is a very simplified check - real implementation would be more complex
                if (width > 800 && height > 600) {
                    return 'cmyk'; // Assume large pages might be CMYK
                }
            }
            
            return 'rgb';
        } catch (error) {
            console.warn('Color profile analysis failed:', error);
            return 'unknown';
        }
    }

    getRecommendedSettings(analysis) {
        const recommendations = {
            compressionLevel: 'medium',
            imageQuality: 80,
            targetSize: 'auto',
            optimizationStrategy: 'balanced'
        };

        try {
            // Adjust compression level based on analysis
            if (analysis.compressionPotential > 0.8) {
                recommendations.compressionLevel = 'high';
                recommendations.imageQuality = 70;
                recommendations.optimizationStrategy = 'aggressive';
            } else if (analysis.compressionPotential > 0.6) {
                recommendations.compressionLevel = 'medium';
                recommendations.imageQuality = 80;
                recommendations.optimizationStrategy = 'balanced';
            } else {
                recommendations.compressionLevel = 'low';
                recommendations.imageQuality = 90;
                recommendations.optimizationStrategy = 'conservative';
            }

            // Adjust based on document type
            switch (analysis.documentType) {
                case 'image_heavy':
                    recommendations.imageQuality = 75;
                    recommendations.optimizationStrategy = 'image_optimized';
                    break;
                case 'text_heavy':
                    recommendations.compressionLevel = 'high';
                    recommendations.imageQuality = 90;
                    recommendations.optimizationStrategy = 'text_optimized';
                    break;
                case 'long_document':
                    recommendations.compressionLevel = 'medium';
                    recommendations.optimizationStrategy = 'batch_optimized';
                    break;
            }

            // Adjust based on file size
            if (analysis.fileSize > 10 * 1024 * 1024) { // > 10MB
                recommendations.compressionLevel = 'high';
                recommendations.targetSize = '50%';
            } else if (analysis.fileSize > 5 * 1024 * 1024) { // > 5MB
                recommendations.compressionLevel = 'medium';
                recommendations.targetSize = '70%';
            }

            return recommendations;
        } catch (error) {
            console.warn('Recommendation generation failed:', error);
            return recommendations;
        }
    }
}
