// progress-tracker-component.js
import { BaseComponent } from './base-component.js';

export class ProgressTracker extends BaseComponent {
  constructor() {
    super();
    this.progress = 0;
    this.status = 'idle';
    this.jobInfo = {};
    this.operation = '';
  }

  async init() {
    this.setupEventListeners();
    this.reset();
    return this;
  }

  getTemplate() {
    return `
      <div class="progress-tracker">
        <div class="progress-header">
          <h3 data-operation-title>Processing</h3>
          <span class="status-badge" data-status>${this.status}</span>
        </div>
        
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" data-progress-fill style="width: ${this.progress}%"></div>
          </div>
          <div class="progress-text" data-progress-text>${this.progress}%</div>
        </div>
        
        <div class="job-info" data-job-info>
          <div class="file-count" data-file-count></div>
          <div class="current-file" data-current-file></div>
          <div class="time-info" data-time-info></div>
          <div class="status-message" data-status-message></div>
        </div>
        
        <div class="progress-actions" data-actions>
          <button class="btn-secondary" data-action="cancel">Cancel</button>
        </div>
      </div>
    `;
  }

  getStyles() {
    return `
      :host {
        display: block;
        padding: 1.5rem;
        background: var(--bg-secondary, #f8f9fa);
        border-radius: 12px;
        margin: 1rem 0;
        border: 1px solid var(--border-color, #dee2e6);
      }
      
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .progress-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #212529);
      }
      
      .status-badge {
        padding: 0.375rem 0.75rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: capitalize;
      }
      
      .status-badge.idle { 
        background: var(--gray-200, #e9ecef); 
        color: var(--gray-700, #495057); 
      }
      .status-badge.processing { 
        background: var(--blue-100, #cfe2ff); 
        color: var(--blue-800, #052c65); 
      }
      .status-badge.completed { 
        background: var(--green-100, #d1e7dd); 
        color: var(--green-800, #0f5132); 
      }
      .status-badge.error { 
        background: var(--red-100, #f8d7da); 
        color: var(--red-800, #58151c); 
      }
      .status-badge.cancelled { 
        background: var(--orange-100, #fff3cd); 
        color: var(--orange-800, #664d03); 
      }
      
      .progress-container {
        margin-bottom: 1.5rem;
      }
      
      .progress-bar {
        width: 100%;
        height: 12px;
        background: var(--gray-200, #e9ecef);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 0.75rem;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary, #0d6efd), var(--primary-dark, #0a58ca));
        border-radius: 6px;
        transition: width 0.3s ease;
        position: relative;
      }
      
      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .progress-text {
        text-align: center;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary, #212529);
      }
      
      .job-info {
        margin-bottom: 1.5rem;
      }
      
      .job-info > div {
        margin-bottom: 0.5rem;
        font-size: 0.9375rem;
        line-height: 1.4;
      }
      
      .file-count {
        font-weight: 500;
        color: var(--text-primary, #212529);
      }
      
      .current-file {
        color: var(--text-secondary, #6c757d);
        font-style: italic;
      }
      
      .time-info {
        color: var(--text-secondary, #6c757d);
      }
      
      .status-message {
        color: var(--text-primary, #212529);
        font-weight: 500;
        margin-top: 0.5rem;
      }
      
      .progress-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      
      .btn-secondary {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color, #dee2e6);
        background: var(--bg-primary, #fff);
        color: var(--text-secondary, #6c757d);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }
      
      .btn-secondary:hover {
        background: var(--gray-100, #f8f9fa);
        color: var(--text-primary, #212529);
      }
      
      .btn-secondary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        :host {
          padding: 1rem;
          margin: 0.75rem 0;
        }
        
        .progress-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .progress-header h3 {
          font-size: 1.125rem;
        }
        
        .job-info > div {
          font-size: 0.875rem;
        }
        
        .progress-actions {
          justify-content: center;
        }
      }
    `;
  }

  setupEventListeners() {
    this.addEventListener('[data-action="cancel"]', 'click', (e) => {
      e.preventDefault();
      this.cancel();
    });
  }

  setProgress(percentage, message = '') {
    this.progress = Math.max(0, Math.min(100, percentage));
    if (message) this.status = 'processing';
    this.scheduleRender();
    return this;
  }

  updateJobInfo(info) {
    this.jobInfo = { ...this.jobInfo, ...info };
    this.scheduleRender();
    return this;
  }

  setOperation(operation) {
    this.operation = operation;
    this.scheduleRender();
    return this;
  }

  setStatus(status, message = '') {
    this.status = status;
    if (message) {
      this.jobInfo.statusMessage = message;
    }
    this.scheduleRender();
    return this;
  }

  reset() {
    this.progress = 0;
    this.status = 'idle';
    this.jobInfo = {};
    this.operation = '';
    this.scheduleRender();
    return this;
  }

  cancel() {
    this.setStatus('cancelled', 'Operation cancelled by user');
    this.emit('progress-cancelled', { 
      jobId: this.jobInfo.jobId,
      operation: this.operation 
    });
    
    // Hide cancel button after cancellation
    setTimeout(() => {
      const actions = this.$('[data-actions]');
      if (actions) actions.style.display = 'none';
    }, 1000);
    
    return this;
  }

  onRendered() {
    // Update dynamic elements after render
    this.updateProgressBar();
    this.updateStatusBadge();
    this.updateJobInfoDisplay();
    this.updateOperationTitle();
  }

  updateProgressBar() {
    const progressFill = this.$('[data-progress-fill]');
    const progressText = this.$('[data-progress-text]');
    
    if (progressFill) {
      progressFill.style.width = `${this.progress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${this.progress}%`;
    }
  }

  updateStatusBadge() {
    const badge = this.$('[data-status]');
    if (badge) {
      badge.textContent = this.status;
      badge.className = 'status-badge ' + this.status.toLowerCase();
    }
  }

  updateOperationTitle() {
    const title = this.$('[data-operation-title]');
    if (title) {
      const operationMap = {
        'compress': 'PDF Compression',
        'convert': 'Document Conversion',
        'ocr': 'OCR Processing',
        'ai': 'AI Processing',
        '': 'Processing'
      };
      title.textContent = operationMap[this.operation] || this.operation;
    }
  }

  updateJobInfoDisplay() {
    const fileCount = this.$('[data-file-count]');
    const currentFile = this.$('[data-current-file]');
    const timeInfo = this.$('[data-time-info]');
    const statusMessage = this.$('[data-status-message]');

    if (fileCount && this.jobInfo.filesProcessed !== undefined && this.jobInfo.totalFiles !== undefined) {
      fileCount.textContent = `Processing file ${this.jobInfo.filesProcessed} of ${this.jobInfo.totalFiles}`;
      fileCount.style.display = 'block';
    } else if (fileCount) {
      fileCount.style.display = 'none';
    }

    if (currentFile && this.jobInfo.currentFile) {
      currentFile.textContent = `Current: ${this.jobInfo.currentFile}`;
      currentFile.style.display = 'block';
    } else if (currentFile) {
      currentFile.style.display = 'none';
    }

    if (timeInfo && this.jobInfo.elapsedTime) {
      const elapsed = this.formatTime(this.jobInfo.elapsedTime);
      const remaining = this.jobInfo.estimatedTime ? this.formatTime(this.jobInfo.estimatedTime) : 'Calculating...';
      timeInfo.textContent = `Elapsed: ${elapsed} | Remaining: ${remaining}`;
      timeInfo.style.display = 'block';
    } else if (timeInfo) {
      timeInfo.style.display = 'none';
    }

    if (statusMessage && this.jobInfo.statusMessage) {
      statusMessage.textContent = this.jobInfo.statusMessage;
      statusMessage.style.display = 'block';
    } else if (statusMessage) {
      statusMessage.style.display = 'none';
    }

    // Show/hide cancel button based on status
    const actions = this.$('[data-actions]');
    if (actions) {
      actions.style.display = ['idle', 'processing'].includes(this.status) ? 'flex' : 'none';
    }
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Public API methods for service integration
  start(operation, initialMessage = 'Starting...') {
    this.setOperation(operation);
    this.setStatus('processing', initialMessage);
    this.setProgress(0);
    return this;
  }

  complete(message = 'Process completed successfully!') {
    this.setProgress(100);
    this.setStatus('completed', message);
    return this;
  }

  error(errorMessage) {
    this.setStatus('error', errorMessage);
    return this;
  }
}

// Register the component
customElements.define('progress-tracker', ProgressTracker);