/**
 * Test Setup Configuration
 * Global setup for simple test environment
 */

// Mock Web APIs that might not be available in test environment
global.crypto = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    generateKey: () => Promise.resolve({}),
    importKey: () => Promise.resolve({}),
    exportKey: () => Promise.resolve({}),
    encrypt: () => Promise.resolve(new ArrayBuffer(0)),
    decrypt: () => Promise.resolve(new ArrayBuffer(0)),
    digest: () => Promise.resolve(new ArrayBuffer(0))
  }
};

// Mock File API
global.File = class MockFile {
  constructor(chunks, filename, options = {}) {
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
    this._chunks = chunks;
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  text() {
    return Promise.resolve(this._chunks.join(''));
  }

  stream() {
    return new ReadableStream();
  }
};

// Mock FileReader
global.FileReader = class MockFileReader extends EventTarget {
  constructor() {
    super();
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }

  readAsArrayBuffer(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = new ArrayBuffer(file.size);
      this.dispatchEvent(new Event('load'));
    }, 0);
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = `data:${file.type};base64,dGVzdA==`;
      this.dispatchEvent(new Event('load'));
    }, 0);
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock CustomEvent
global.CustomEvent = class MockCustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.detail = options.detail;
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock PDF-lib
global.PDFLib = {
  PDFDocument: {
    load: vi.fn(),
    create: vi.fn()
  },
  degrees: vi.fn(),
  rgb: vi.fn()
};

// Console setup for tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress expected errors in tests
  if (args[0]?.includes?.('Warning:') || args[0]?.includes?.('Error:')) {
    return;
  }
  originalConsoleError(...args);
};

// Global test utilities
global.createMockFile = (name = 'test.pdf', size = 1024, type = 'application/pdf') => {
  return new File(['test content'], name, { type, size });
};

global.createMockEvent = (type, detail = {}) => {
  return new CustomEvent(type, { detail });
};

// Setup DOM environment
document.body.innerHTML = '';

// Add common test styles
const style = document.createElement('style');
style.textContent = `
  .hidden { display: none !important; }
  .visible { display: block !important; }
`;
document.head.appendChild(style);