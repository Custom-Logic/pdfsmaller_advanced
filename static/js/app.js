// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://api.pdfsmaller.site',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            REFRESH: '/api/auth/refresh',
            PROFILE: '/api/auth/profile'
        },
        COMPRESS: {
            SINGLE: '/api/compress',
            BULK: '/api/compress/bulk',
            INFO: '/api/compress/info',
            USAGE: '/api/compress/usage'
        },
        SUBSCRIPTIONS: {
            PLANS: '/api/subscriptions/plans',
            CREATE: '/api/subscriptions/create',
            CANCEL: '/api/subscriptions/cancel',
            INFO: '/api/subscriptions'
        }
    }
};

// Application State Management
class AppState {
    constructor() {
        this.user = null;
        this.currentTab = 'compress';
        this.files = {
            single: null,
            bulk: [],
            convert: null,
            ocr: null,
            ai: null
        };
        this.results = {
            single: null,
            bulk: null
        };
        this.processing = {
            isActive: false,
            jobId: null,
            type: null
        };
    }

    reset() {
        this.files = { single: null, bulk: [], convert: null, ocr: null, ai: null };
        this.results = { single: null, bulk: null };
        this.processing = { isActive: false, jobId: null, type: null };
    }

    setUser(userData) {
        this.user = userData;
        localStorage.setItem('pdfsmaller_user', JSON.stringify(userData));
    }

    clearUser() {
        this.user = null;
        localStorage.removeItem('pdfsmaller_user');
        localStorage.removeItem('pdfsmaller_token');
        localStorage.removeItem('pdfsmaller_refresh_token');
    }

    loadUserFromStorage() {
        const userData = localStorage.getItem('pdfsmaller_user');
        if (userData) {
            try {
                this.user = JSON.parse(userData);
                return true;
            } catch (e) {
                this.clearUser();
            }
        }
        return false;
    }
}

// HTTP Client for API Communication
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('pdfsmaller_token');
        this.refreshToken = localStorage.getItem('pdfsmaller_refresh_token');
    }

    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('pdfsmaller_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('pdfsmaller_refresh_token', refreshToken);
        }
    }

    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('pdfsmaller_token');
        localStorage.removeItem('pdfsmaller_refresh_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                ...options,
                headers
            });

            // Handle token refresh for 401 errors
            if (response.status === 401 && this.refreshToken && !options.skipRefresh) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${this.token}`;
                    const retryResponse = await fetch(url, {
                        ...options,
                        headers: { ...headers, ...options.headers }
                    });
                    return await this.handleResponse(retryResponse);
                }
            }

            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request failed:', error);
            throw new Error(error.message || 'Network request failed');
        }
    }

    async handleResponse(response) {
        const contentType = response.headers.get('Content-Type');
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { error: { message: response.statusText } };
            }
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return response;
        }
    }

    async refreshAccessToken() {
        try {
            const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
                method: 'POST',
                body: JSON.stringify({ refresh_token: this.refreshToken }),
                skipAuth: true,
                skipRefresh: true
            });

            this.setTokens(response.tokens.access_token, response.tokens.refresh_token);
            return true;
        } catch (error) {
            this.clearTokens();
            return false;
        }
    }

    // Authentication methods
    async login(email, password) {
        const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            skipAuth: true
        });

        this.setTokens(response.tokens.access_token, response.tokens.refresh_token);
        return response;
    }

    async register(name, email, password) {
        const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
            skipAuth: true
        });

        this.setTokens(response.tokens.access_token, response.tokens.refresh_token);
        return response;
    }

    async getProfile() {
        return await this.request(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
    }

    // Compression methods
    async compressSingle(file, options = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('compressionLevel', options.compressionLevel || 'medium');
        formData.append('imageQuality', options.imageQuality || 80);

        const response = await this.request(API_CONFIG.ENDPOINTS.COMPRESS.SINGLE, {
            method: 'POST',
            body: formData
        });

        return response; // This will be the blob response for download
    }

    async startBulkCompression(files, options = {}) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('compressionLevel', options.compressionLevel || 'medium');
        formData.append('imageQuality', options.imageQuality || 80);

        return await this.request(API_CONFIG.ENDPOINTS.COMPRESS.BULK, {
            method: 'POST',
            body: formData
        });
    }

    async getBulkJobStatus(jobId) {
        return await this.request(`${API_CONFIG.ENDPOINTS.COMPRESS.BULK}/jobs/${jobId}/status`);
    }

    async downloadBulkResult(jobId) {
        const response = await this.request(`${API_CONFIG.ENDPOINTS.COMPRESS.BULK}/jobs/${jobId}/download`);
        return response; // This will be the blob response
    }

    async getUsageStats() {
        return await this.request(API_CONFIG.ENDPOINTS.COMPRESS.USAGE);
    }

    // Subscription methods
    async getPlans() {
        return await this.request(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.PLANS, { skipAuth: true });
    }

    async createSubscription(planId, paymentMethodId) {
        return await this.request(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CREATE, {
            method: 'POST',
            body: JSON.stringify({ plan_id: planId, payment_method_id: paymentMethodId })
        });
    }

    async cancelSubscription() {
        return await this.request(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CANCEL, {
            method: 'POST'
        });
    }

    async getSubscriptionInfo() {
        return await this.request(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.INFO);
    }
}

// Authentication Manager
class AuthManager {
    constructor(appState, apiClient) {
        this.appState = appState;
        this.apiClient = apiClient;
        this.init();
    }

    init() {
        this.appState.loadUserFromStorage();
        this.updateUI();
    }

    async login(email, password) {
        try {
            const response = await this.apiClient.login(email, password);
            this.appState.setUser(response.user);
            this.updateUI();
            return response.user;
        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    async register(name, email, password) {
        try {
            const response = await this.apiClient.register(name, email, password);
            this.appState.setUser(response.user);
            this.updateUI();
            return response.user;
        } catch (error) {
            throw new Error(`Registration failed: ${error.message}`);
        }
    }

    logout() {
        this.apiClient.clearTokens();
        this.appState.clearUser();
        this.appState.reset();
        this.updateUI();
        showNotification('Signed out successfully', 'success');
    }

    updateUI() {
        const isLoggedIn = !!this.appState.user;
        
        // Update navigation auth sections
        const guestSection = document.getElementById('guestAuthSection');
        const userSection = document.getElementById('userAuthSection');
        
        if (guestSection && userSection) {
            guestSection.style.display = isLoggedIn ? 'none' : 'block';
            userSection.style.display = isLoggedIn ? 'block' : 'none';
            
            if (isLoggedIn) {
                const user = this.appState.user;
                const userInitials = document.getElementById('userInitialsNav');
                const userName = document.getElementById('userNameNav');
                const userPlan = document.getElementById('userPlanNav');
                
                if (userInitials) userInitials.textContent = user.name.charAt(0).toUpperCase();
                if (userName) userName.textContent = user.name;
                if (userPlan) userPlan.textContent = `${user.plan || 'Free'} Plan`;
            }
        }

        // Update feature access based on plan
        this.updateFeatureAccess();
    }

    updateFeatureAccess() {
        const user = this.appState.user;
        const isPro = user && (user.plan === 'premium' || user.plan === 'Pro');
        
        // Update mode switches
        document.querySelectorAll('.mode-switch').forEach(toggle => {
            const isChecked = toggle.checked;
            if (isChecked && !isPro) {
                toggle.checked = false;
            }
        });

        // Update server processing checkbox
        const serverCheckbox = document.getElementById('useServerProcessing');
        if (serverCheckbox) {
            serverCheckbox.disabled = !isPro;
            if (!isPro) serverCheckbox.checked = false;
        }
    }

    isPro() {
        return this.appState.user && 
               (this.appState.user.plan === 'premium' || this.appState.user.plan === 'Pro');
    }
}

// PDF Compression Manager
class CompressionManager {
    constructor(appState, apiClient) {
        this.appState = appState;
        this.apiClient = apiClient;
    }

    async compressSingle(file, options = {}) {
        try {
            this.appState.processing.isActive = true;
            this.appState.processing.type = 'single';

            updateProgress('single', 10, 'Starting compression...');

            const startTime = Date.now();
            const response = await this.apiClient.compressSingle(file, options);
            const endTime = Date.now();

            // Convert response to blob if needed
            const compressedBlob = response instanceof Blob ? response : await response.blob();

            const result = {
                originalSize: file.size,
                compressedSize: compressedBlob.size,
                processingTime: (endTime - startTime) / 1000,
                blob: compressedBlob,
                reductionPercent: ((file.size - compressedBlob.size) / file.size * 100).toFixed(1)
            };

            this.appState.results.single = result;
            updateProgress('single', 100, 'Compression complete!');
            
            return result;
        } catch (error) {
            this.appState.processing.isActive = false;
            throw error;
        } finally {
            this.appState.processing.isActive = false;
        }
    }

    async compressBulk(files, options = {}) {
        try {
            this.appState.processing.isActive = true;
            this.appState.processing.type = 'bulk';

            updateProgress('bulk', 10, 'Starting bulk compression...');

            const jobResponse = await this.apiClient.startBulkCompression(files, options);
            this.appState.processing.jobId = jobResponse.job_id;

            updateProgress('bulk', 20, 'Job queued, processing files...');

            // Monitor job progress
            const result = await this.monitorBulkJob(jobResponse.job_id);
            
            this.appState.results.bulk = result;
            return result;
        } catch (error) {
            this.appState.processing.isActive = false;
            throw error;
        } finally {
            this.appState.processing.isActive = false;
            this.appState.processing.jobId = null;
        }
    }

    async monitorBulkJob(jobId) {
        return new Promise((resolve, reject) => {
            const checkStatus = async () => {
                try {
                    const status = await this.apiClient.getBulkJobStatus(jobId);
                    
                    updateProgress('bulk', status.progress_percentage, 
                        `Processing ${status.completed_count}/${status.file_count} files...`);

                    if (status.is_completed) {
                        if (status.is_successful) {
                            const downloadResponse = await this.apiClient.downloadBulkResult(jobId);
                            const blob = downloadResponse instanceof Blob ? 
                                downloadResponse : await downloadResponse.blob();
                            
                            resolve({
                                fileCount: status.file_count,
                                blob: blob,
                                processingTime: (Date.now() - new Date(status.created_at).getTime()) / 1000
                            });
                        } else {
                            reject(new Error(status.error_message || 'Bulk compression failed'));
                        }
                        return;
                    }

                    setTimeout(checkStatus, 5000); // Check again in 5 seconds
                } catch (error) {
                    reject(error);
                }
            };

            checkStatus();
        });
    }
}

// UI Helper Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateProgress(type, percent, text) {
    const progressContainer = document.getElementById(`${type}Progress`);
    const progressBar = document.getElementById(`${type}ProgressBar`);
    const progressPercentage = document.getElementById(`${type}ProgressPercentage`);
    const progressText = progressContainer?.querySelector('.progress-label span:first-child');

    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressPercentage) progressPercentage.textContent = Math.round(percent) + '%';
    if (progressText) progressText.textContent = text;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
}

// Tab Management
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => 
        btn.onclick?.toString().includes(tabName) || btn.getAttribute('onclick')?.includes(tabName)
    );
    if (activeButton) activeButton.classList.add('active');

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const activePanel = document.getElementById(`${tabName}Tab`);
    if (activePanel) activePanel.classList.add('active');

    appState.currentTab = tabName;
}

// File Handling
function handleFileSelection(file, type) {
    if (!file) return;
    
    // Validation
    if (type === 'compress' && file.type !== 'application/pdf') {
        showNotification('Please select a valid PDF file', 'error');
        return;
    }

    const maxSize = authManager.isPro() ? 100 * 1024 * 1024 : 50 * 1024 * 1024; // 100MB Pro, 50MB Free
    if (file.size > maxSize) {
        const limit = formatFileSize(maxSize);
        showNotification(`File size exceeds ${limit} limit`, 'error');
        return;
    }

    // Store file and update UI
    appState.files[type] = file;
    updateFileInfo(file, type);
}

function updateFileInfo(file, type) {
    const fileName = document.getElementById(`${type === 'compress' ? 'single' : type}FileName`);
    const fileSize = document.getElementById(`${type === 'compress' ? 'single' : type}FileSize`);
    const fileInfo = document.getElementById(`${type === 'compress' ? 'single' : type}FileInfo`);
    const actionBtn = document.getElementById(`${type === 'compress' ? 'single' : type}CompressBtn`) ||
                     document.querySelector(`#${type}Tab .btn-large`);

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
    if (fileInfo) fileInfo.style.display = 'flex';
    if (actionBtn) actionBtn.disabled = false;

    // Hide previous results
    const results = document.getElementById(`${type === 'compress' ? 'single' : type}Results`);
    if (results) results.style.display = 'none';
}

// Modal Management
function showAuthModal(mode) {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authModalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const nameGroup = document.getElementById('authNameGroup');
    const switchText = document.getElementById('authSwitchText');
    const switchLink = document.getElementById('authSwitchLink');

    if (mode === 'login') {
        if (title) title.textContent = 'Sign In';
        if (submitBtn) submitBtn.textContent = 'Sign In';
        if (nameGroup) nameGroup.classList.add('hidden');
        if (switchText) switchText.textContent = "Don't have an account?";
        if (switchLink) switchLink.textContent = 'Sign up';
    } else {
        if (title) title.textContent = 'Create Account';
        if (submitBtn) submitBtn.textContent = 'Create Account';
        if (nameGroup) nameGroup.classList.remove('hidden');
        if (switchText) switchText.textContent = "Already have an account?";
        if (switchLink) switchLink.textContent = 'Sign in';
    }

    if (modal) modal.style.display = 'flex';
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    const form = document.getElementById('authForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

function toggleAuthMode() {
    const title = document.getElementById('authModalTitle');
    if (title) {
        const isLogin = title.textContent === 'Sign In';
        showAuthModal(isLogin ? 'register' : 'login');
    }
}

// Global instances
let appState, apiClient, authManager, compressionManager;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core instances
    appState = new AppState();
    apiClient = new APIClient();
    authManager = new AuthManager(appState, apiClient);
    compressionManager = new CompressionManager(appState, apiClient);

    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    switchTab('compress');
});

function setupEventListeners() {
    // File upload handlers
    const singleUploadArea = document.getElementById('compressUploadArea');
    const singleFileInput = document.getElementById('singleFileInput');
    
    if (singleUploadArea && singleFileInput) {
        singleUploadArea.addEventListener('click', () => singleFileInput.click());
        singleUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            singleUploadArea.classList.add('dragover');
        });
        singleUploadArea.addEventListener('dragleave', () => {
            singleUploadArea.classList.remove('dragover');
        });
        singleUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            singleUploadArea.classList.remove('dragover');
            if (e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0], 'compress');
            }
        });
        
        singleFileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                handleFileSelection(e.target.files[0], 'compress');
            }
        });
    }

    // Quality slider
    const qualitySlider = document.getElementById('singleImageQuality');
    const qualityValue = document.getElementById('singleQualityValue');
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value + '%';
        });
    }

    // Server processing checkbox
    const serverCheckbox = document.getElementById('useServerProcessing');
    if (serverCheckbox) {
        serverCheckbox.addEventListener('change', (e) => {
            if (e.target.checked && !authManager.isPro()) {
                e.target.checked = false;
                showNotification('Server processing requires Pro subscription', 'error');
                switchTab('pricing');
            }
        });
    }

    // Auth form
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const name = document.getElementById('authName').value;
            const isLogin = document.getElementById('authModalTitle').textContent === 'Sign In';

            try {
                if (isLogin) {
                    await authManager.login(email, password);
                    showNotification('Successfully signed in!', 'success');
                } else {
                    await authManager.register(name, email, password);
                    showNotification('Account created successfully!', 'success');
                }
                hideAuthModal();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // Compression button
    const compressBtn = document.getElementById('singleCompressBtn');
    if (compressBtn) {
        compressBtn.addEventListener('click', async () => {
            if (!appState.files.single) return;

            const options = {
                compressionLevel: document.getElementById('singleCompressionLevel').value,
                imageQuality: parseInt(document.getElementById('singleImageQuality').value),
                useServer: document.getElementById('useServerProcessing').checked
            };

            try {
                compressBtn.disabled = true;
                const result = await compressionManager.compressSingle(appState.files.single, options);
                
                // Update results display
                document.getElementById('singleOriginalSize').textContent = formatFileSize(result.originalSize);
                document.getElementById('singleCompressedSize').textContent = formatFileSize(result.compressedSize);
                document.getElementById('singleReductionPercent').textContent = `${result.reductionPercent}%`;
                document.getElementById('singleProcessingTime').textContent = `${result.processingTime.toFixed(1)}s`;
                
                document.getElementById('singleResults').style.display = 'block';
                showNotification('PDF compressed successfully!', 'success');
                
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                compressBtn.disabled = false;
            }
        });
    }

    // Download button
    const downloadBtn = document.getElementById('singleDownloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const result = appState.results.single;
            if (result && result.blob) {
                const url = URL.createObjectURL(result.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `compressed_${appState.files.single.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }

    // New file button
    const newFileBtn = document.getElementById('singleNewFileBtn');
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            appState.reset();
            resetUI();
        });
    }

    // Mode switches
    document.querySelectorAll('.mode-switch').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked && !authManager.isPro()) {
                e.target.checked = false;
                showNotification('Bulk processing is a Pro feature', 'error');
                switchTab('pricing');
            }
        });
    });

    // Modal close handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            hideAuthModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideAuthModal();
        }
    });
}

function resetUI() {
    // Reset file inputs and displays
    ['single', 'convert', 'ocr', 'ai'].forEach(type => {
        const fileInput = document.getElementById(`${type}FileInput`);
        const fileInfo = document.getElementById(`${type}FileInfo`);
        const results = document.getElementById(`${type}Results`);
        const progress = document.getElementById(`${type}Progress`);
        const btn = document.querySelector(`#${type}Tab .btn-large`);

        if (fileInput) fileInput.value = '';
        if (fileInfo) fileInfo.style.display = 'none';
        if (results) results.style.display = 'none';
        if (progress) progress.style.display = 'none';
        if (btn) btn.disabled = true;
    });

    // Special handling for compress tab
    const compressBtn = document.getElementById('singleCompressBtn');
    if (compressBtn) compressBtn.disabled = true;
}

// Export global functions for HTML onclick handlers
window.switchTab = switchTab;
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.logout = () => authManager.logout();