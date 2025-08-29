#!/usr/bin/env node

/**
 * Simple Test Runner for Vanilla JavaScript
 * Runs tests without heavy frameworks
 */

import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

class SimpleTestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.watchMode = process.argv.includes('--watch');
  }

  async run() {
    console.log('🧪 Running tests...\n');
    
    try {
      await this.loadTests();
      await this.executeTests();
      this.printResults();
      
      if (this.watchMode) {
        await this.startWatchMode();
      } else {
        process.exit(this.results.failed > 0 ? 1 : 0);
      }
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  async loadTests() {
    const testFiles = await this.findTestFiles();
    
    for (const testFile of testFiles) {
      try {
        const module = await import(pathToFileURL(testFile).href);
        
        if (module.default && typeof module.default === 'function') {
          this.tests.push({
            name: testFile.replace(ROOT_DIR, ''),
            testFn: module.default
          });
        }
        
        // Also look for named exports that are test functions
        for (const [name, fn] of Object.entries(module)) {
          if (name.startsWith('test') && typeof fn === 'function') {
            this.tests.push({
              name: `${testFile.replace(ROOT_DIR, '')}:${name}`,
              testFn: fn
            });
          }
        }
        
      } catch (error) {
        console.warn(`⚠️  Failed to load test file ${testFile}:`, error.message);
      }
    }
    
    console.log(`📋 Found ${this.tests.length} tests\n`);
  }

  async executeTests() {
    for (const test of this.tests) {
      try {
        await this.runSingleTest(test);
      } catch (error) {
        this.results.failed++;
        console.error(`❌ ${test.name}: ${error.message}`);
      }
      this.results.total++;
    }
  }

  async runSingleTest(test) {
    const startTime = performance.now();
    
    try {
      // Create test context
      const context = this.createTestContext();
      
      // Run the test
      await test.testFn(context);
      
      const duration = performance.now() - startTime;
      this.results.passed++;
      
      console.log(`✅ ${test.name} (${duration.toFixed(2)}ms)`);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ ${test.name} (${duration.toFixed(2)}ms): ${error.message}`);
      throw error;
    }
  }

  createTestContext() {
    return {
      // Simple assertion functions
      assert: (condition, message = 'Assertion failed') => {
        if (!condition) {
          throw new Error(message);
        }
      },
      
      assertEqual: (actual, expected, message) => {
        if (actual !== expected) {
          throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
      },
      
      assertNotEqual: (actual, expected, message) => {
        if (actual === expected) {
          throw new Error(message || `Expected not to equal ${expected}`);
        }
      },
      
      assertThrows: async (fn, message) => {
        try {
          await fn();
          throw new Error(message || 'Expected function to throw');
        } catch (error) {
          // Expected to throw
        }
      },
      
      // Mock utilities
      createMock: () => {
        const calls = [];
        const mock = (...args) => {
          calls.push(args);
          return mock.returnValue;
        };
        mock.calls = calls;
        mock.returnValue = undefined;
        mock.returns = (value) => { mock.returnValue = value; return mock; };
        return mock;
      },
      
      // DOM utilities for testing
      createMockElement: (tagName = 'div') => {
        const element = {
          tagName: tagName.toUpperCase(),
          innerHTML: '',
          textContent: '',
          classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
          },
          addEventListener: () => {},
          removeEventListener: () => {},
          setAttribute: () => {},
          getAttribute: () => null,
          dispatchEvent: () => {}
        };
        return element;
      }
    };
  }

  async findTestFiles() {
    const testFiles = [];
    
    // Look for test files in js directory
    const jsDir = join(ROOT_DIR, 'js');
    await this.findTestFilesInDir(jsDir, testFiles);
    
    // Look for test files in test directory
    const testDir = join(ROOT_DIR, 'test');
    await this.findTestFilesInDir(testDir, testFiles);
    
    return testFiles;
  }

  async findTestFilesInDir(dir, testFiles) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await this.findTestFilesInDir(fullPath, testFiles);
        } else if (entry.isFile() && 
                  (entry.name.endsWith('.test.js') || entry.name.endsWith('.spec.js'))) {
          testFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  printResults() {
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📋 Total:  ${this.results.total}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n💥 ${this.results.failed} test(s) failed`);
    }
  }

  async startWatchMode() {
    console.log('\n👀 Watching for changes... (Press Ctrl+C to exit)');
    
    const { watch } = await import('chokidar');
    
    const watcher = watch([
      join(ROOT_DIR, 'js/**/*.js'),
      join(ROOT_DIR, 'test/**/*.js')
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', async () => {
      console.log('\n🔄 Files changed, re-running tests...\n');
      
      // Reset results
      this.tests = [];
      this.results = { passed: 0, failed: 0, total: 0 };
      
      // Re-run tests
      await this.loadTests();
      await this.executeTests();
      this.printResults();
      
      console.log('\n👀 Watching for changes...');
    });
  }
}

// Run the test runner
const testRunner = new SimpleTestRunner();
testRunner.run();