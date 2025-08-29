#!/usr/bin/env node

/**
 * Simple Development Server for Vanilla JavaScript
 * Provides live reload and module hot swapping without frameworks
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { watch } from 'chokidar';
import { WebSocketServer } from 'ws';
import mimeTypes from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const PORT = 3000;
const WS_PORT = 3001;

class DevServer {
  constructor() {
    this.clients = new Set();
    this.setupWebSocketServer();
    this.setupFileWatcher();
  }

  setupWebSocketServer() {
    this.wss = new WebSocketServer({ port: WS_PORT });
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('🔌 Client connected for live reload');
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('🔌 Client disconnected');
      });
    });
  }

  setupFileWatcher() {
    const watcher = watch([
      join(ROOT_DIR, 'js/**/*.js'),
      join(ROOT_DIR, 'static/**/*.css'),
      join(ROOT_DIR, '*.html')
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', (path) => {
      console.log(`📝 File changed: ${path}`);
      this.notifyClients('reload', { path });
    });

    watcher.on('add', (path) => {
      console.log(`➕ File added: ${path}`);
      this.notifyClients('reload', { path });
    });
  }

  notifyClients(type, data) {
    const message = JSON.stringify({ type, data });
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

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

      const fullPath = join(ROOT_DIR, filePath);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          this.sendError(res, 404, 'Not Found');
          return;
        }

        const content = await readFile(fullPath);
        const ext = extname(filePath);
        const mimeType = mimeTypes.lookup(ext) || 'application/octet-stream';

        // Inject live reload script for HTML files
        if (ext === '.html') {
          const htmlContent = content.toString();
          const liveReloadScript = this.getLiveReloadScript();
          const modifiedContent = htmlContent.replace(
            '</body>',
            `${liveReloadScript}</body>`
          );
          
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
          });
          res.end(modifiedContent);
        } else {
          res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': ext === '.js' ? 'no-cache' : 'public, max-age=3600'
          });
          res.end(content);
        }

      } catch (error) {
        if (error.code === 'ENOENT') {
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

  getLiveReloadScript() {
    return `
    <script>
      (function() {
        const ws = new WebSocket('ws://localhost:${WS_PORT}');
        
        ws.onmessage = function(event) {
          const message = JSON.parse(event.data);
          
          if (message.type === 'reload') {
            console.log('🔄 Live reload triggered by:', message.data.path);
            
            // For CSS files, try to reload stylesheets without full page reload
            if (message.data.path.endsWith('.css')) {
              const links = document.querySelectorAll('link[rel="stylesheet"]');
              links.forEach(link => {
                const href = link.href;
                link.href = href.includes('?') 
                  ? href.replace(/\\?.*/, '?t=' + Date.now())
                  : href + '?t=' + Date.now();
              });
            } else {
              // For JS and HTML files, reload the page
              window.location.reload();
            }
          }
        };
        
        ws.onopen = function() {
          console.log('🔌 Live reload connected');
        };
        
        ws.onclose = function() {
          console.log('🔌 Live reload disconnected');
          // Try to reconnect after 1 second
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        };
        
        ws.onerror = function(error) {
          console.error('Live reload error:', error);
        };
      })();
    </script>`;
  }

  sendError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
    res.end(message);
  }

  start() {
    const server = createServer((req, res) => {
      // Add CORS headers for development
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      this.handleRequest(req, res);
    });

    server.listen(PORT, () => {
      console.log('\n🚀 PDFSmaller Development Server Started!');
      console.log(`📱 Local:   http://localhost:${PORT}`);
      console.log(`🌐 Network: http://${this.getLocalIP()}:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
      console.log('\n📝 Features:');
      console.log('  ✅ Live Reload');
      console.log('  ✅ ES6 Module Support');
      console.log('  ✅ Hot CSS Reload');
      console.log('  ✅ File Watching');
      console.log('\n🔧 Development Commands:');
      console.log('  npm run build     - Build for production');
      console.log('  npm run serve     - Serve production build');
      console.log('  npm run test      - Run tests');
      console.log('  npm run lint      - Lint code');
      console.log('\n👀 Watching files in:');
      console.log('  - js/**/*.js');
      console.log('  - static/**/*.css');
      console.log('  - *.html');
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    console.log('\n🛑 Shutting down development server...');
    this.wss.close();
    process.exit(0);
  }

  getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    
    return 'localhost';
  }
}

// Start the development server
const devServer = new DevServer();
devServer.start();