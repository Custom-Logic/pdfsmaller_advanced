#!/usr/bin/env node

/**
 * Production Build Script for Vanilla JavaScript
 * Minifies and optimizes files for production deployment
 */

import { readFile, writeFile, mkdir, copyFile, readdir, stat } from 'fs/promises';
import { join, resolve, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');

class BuildSystem {
  constructor() {
    this.processedFiles = new Set();
    this.moduleMap = new Map();
  }

  async build() {
    console.log('🏗️  Starting production build...\n');
    
    try {
      // Clean and create dist directory
      await this.cleanDist();
      await mkdir(DIST_DIR, { recursive: true });
      
      // Copy and process HTML files
      await this.processHTML();
      
      // Process JavaScript modules
      await this.processJavaScript();
      
      // Copy static assets
      await this.copyStaticAssets();
      
      // Generate build manifest
      await this.generateManifest();
      
      console.log('\n✅ Build completed successfully!');
      console.log(`📦 Output directory: ${DIST_DIR}`);
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async cleanDist() {
    try {
      const { rm } = await import('fs/promises');
      await rm(DIST_DIR, { recursive: true, force: true });
      console.log('🧹 Cleaned dist directory');
    } catch (error) {
      // Directory might not exist, that's okay
    }
  }

  async processHTML() {
    console.log('📄 Processing HTML files...');
    
    const htmlFiles = await this.findFiles(ROOT_DIR, '.html');
    
    for (const htmlFile of htmlFiles) {
      const content = await readFile(htmlFile, 'utf-8');
      const optimizedContent = this.optimizeHTML(content);
      
      const relativePath = htmlFile.replace(ROOT_DIR, '');
      const outputPath = join(DIST_DIR, relativePath);
      
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, optimizedContent);
      
      console.log(`  ✅ ${relativePath}`);
    }
  }

  optimizeHTML(content) {
    // Remove comments
    content = content.replace(/<!--[\s\S]*?-->/g, '');
    
    // Minify whitespace (preserve structure)
    content = content.replace(/>\s+</g, '><');
    content = content.replace(/\s{2,}/g, ' ');
    
    // Add production meta tags
    const productionMeta = `
    <meta name="build-time" content="${new Date().toISOString()}">
    <meta name="build-version" content="${this.getBuildVersion()}">`;
    
    content = content.replace('<head>', `<head>${productionMeta}`);
    
    return content;
  }

  async processJavaScript() {
    console.log('📜 Processing JavaScript modules...');
    
    const jsFiles = await this.findFiles(join(ROOT_DIR, 'js'), '.js');
    
    for (const jsFile of jsFiles) {
      await this.processJSFile(jsFile);
    }
  }

  async processJSFile(filePath) {
    const content = await readFile(filePath, 'utf-8');
    const relativePath = filePath.replace(ROOT_DIR, '');
    
    try {
      // Minify JavaScript
      const minified = await minify(content, {
        ecma: 2020,
        module: true,
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          reserved: ['PDFLib', 'gtag', 'dataLayer']
        },
        format: {
          comments: false
        }
      });

      if (minified.error) {
        throw minified.error;
      }

      const outputPath = join(DIST_DIR, relativePath);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, minified.code);
      
      console.log(`  ✅ ${relativePath} (${this.getCompressionRatio(content, minified.code)}% smaller)`);
      
    } catch (error) {
      console.warn(`  ⚠️  ${relativePath} - Minification failed, copying original:`, error.message);
      
      // Fallback: copy original file
      const outputPath = join(DIST_DIR, relativePath);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, content);
    }
  }

  async copyStaticAssets() {
    console.log('📁 Copying static assets...');
    
    const staticDir = join(ROOT_DIR, 'static');
    
    try {
      await this.copyDirectory(staticDir, join(DIST_DIR, 'static'));
      console.log('  ✅ Static assets copied');
    } catch (error) {
      console.log('  ℹ️  No static directory found, skipping');
    }
  }

  async copyDirectory(src, dest) {
    await mkdir(dest, { recursive: true });
    
    const entries = await readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }

  async generateManifest() {
    console.log('📋 Generating build manifest...');
    
    const manifest = {
      buildTime: new Date().toISOString(),
      version: this.getBuildVersion(),
      files: await this.getFileList(DIST_DIR),
      modules: Array.from(this.moduleMap.entries()).map(([path, info]) => ({
        path,
        ...info
      }))
    };
    
    await writeFile(
      join(DIST_DIR, 'build-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('  ✅ Build manifest generated');
  }

  async findFiles(dir, extension) {
    const files = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, extension);
          files.push(...subFiles);
        } else if (entry.isFile() && extname(entry.name) === extension) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }

  async getFileList(dir, basePath = '') {
    const files = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getFileList(fullPath, relativePath);
          files.push(...subFiles);
        } else {
          const stats = await stat(fullPath);
          files.push({
            path: relativePath,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }

  getCompressionRatio(original, compressed) {
    const ratio = ((original.length - compressed.length) / original.length) * 100;
    return Math.round(ratio);
  }

  getBuildVersion() {
    return process.env.BUILD_VERSION || `build-${Date.now()}`;
  }
}

// Run the build
const buildSystem = new BuildSystem();
buildSystem.build();