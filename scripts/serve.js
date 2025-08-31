#!/usr/bin/env node

/**
 * Production Serve Script
 * Serves the built production files
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mimeTypes from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = resolve(__dirname, '..', 'dist');
const PORT = process.env.PORT || 3001;

class ProductionServer {
  async handleRequest(req, res) {
    try {
      let filePath = req.url === '/' ? '/index.html' : req.url;
      
      // Remove query parameters
      filePath = filePath.split('?')[0];
      
      // Security: prevent directory traversal
      if (filePath.includes('..')) {
        this.sendError(res, 403, 'Forbidden');
        return;
      }

      const fullPath = join(DIST_DIR, filePath);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          this.sendError(res, 404, 'Not Found');
          return;
        }

        const content = await readFile(fullPath);
        const ext = extname(filePath);
        const mimeType = mimeTypes.lookup(ext) || 'application/octet-stream';

        // Set appropriate headers for production
        const headers = {
          'Content-Type': mimeType,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        };

        // Set cache headers based on file type
        if (ext === '.html') {
          headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          headers['Pragma'] = 'no-cache';
          headers['Expires'] = '0';
        } else if (['.js', '.css'].includes(ext)) {
          headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year
        } else {
          headers['Cache-Control'] = 'public, max-age=86400'; // 1 day
        }

        res.writeHead(200, headers);
        res.end(content);

      } catch (error) {
        if (error.code === 'ENOENT') {
          // For SPA routing, serve index.html for unknown routes
          if (!filePath.includes('.')) {
            try {
              const indexContent = await readFile(join(DIST_DIR, 'index.html'));
              res.writeHead(200, {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
              });
              res.end(indexContent);
              return;
            } catch (indexError) {
              this.sendError(res, 404, 'Not Found');
              return;
            }
          }
          this.sendError(res, 404, 'Not Found');
        } else {
          this.sendError(res, 500, 'Internal Server Error');
        }
      }

    } catch (error) {
      console.error('Request handling error:', error);
      this.sendError(res, 500, 'Internal Server Error');
    }
  }

  sendError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
    res.end(message);
  }

  start() {
    const server = createServer((req, res) => {
      // Security headers
      res.setHeader('X-Powered-By', 'PDFSmaller');
      
      this.handleRequest(req, res);
    });

    server.listen(PORT, () => {
      console.log('\n🚀 PDFSmaller Production Server Started!');
      console.log(`📱 Local:   http://localhost:${PORT}`);
      console.log(`📦 Serving: ${DIST_DIR}`);
      console.log('\n📝 Features:');
      console.log('  ✅ Production Optimized');
      console.log('  ✅ Security Headers');
      console.log('  ✅ Proper Caching');
      console.log('  ✅ SPA Routing Support');
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    console.log('\n🛑 Shutting down production server...');
    process.exit(0);
  }
}

// Check if dist directory exists
(async () => {
  try {
    await stat(DIST_DIR);
    const server = new ProductionServer();
    server.start();
  } catch (error) {
    console.error('❌ Dist directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
})();