// Complete Integration Script for PDF Smaller Application
// This script combines all components and ensures proper initialization

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    showNotification('An unexpected error occurred. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('A network error occurred. Please check your connection.', 'error');
});

// Enhanced Authentication Manager with API integration
class EnhancedAuthManager extends AuthManager {
    constructor(appState, apiClient) {
        super(appState, apiClient);
    }

    async validateSession() {
        if (!this.apiClient.token) return false;
        
        try {
            const profile = await this.apiClient.getProfile();
            this.appState.setUser(profile.user);
            this.updateUI();
            return true;
        } catch (error) {
            console.warn('Session validation failed:', error.message);
            this.logout();
            return false;
        }
    }

    async refreshUserData() {
        if (!this.appState.user) return;
        
        try {
            const profile = await this.apiClient.getProfile();
            this.appState.setUser(profile.user);
            this.updateUI();
        } catch (error) {
            console.warn('Failed to refresh user data:', error.message);
        }
    }
}

// Enhanced Compression Manager with better error handling
class EnhancedCompressionManager extends CompressionManager {
    constructor(appState, apiClient) {
        super(appState, apiClient);
    }

    async checkUsageLimits() {
        try {
            const usage = await this.apiClient.getUsageStats();
            const remaining = usage.usage.daily_limit - usage.usage.compressions_today;
            
            if (remaining <= 0) {
                throw new Error('Daily compression limit reached. Upgrade to Pro for unlimited compressions.');
            }
            
            if (remaining <= 2) {
                showNotification(`Only ${remaining} compressions remaining today`, 'warning');
            }
            
            return true;
        } catch (error) {
            if (error.message.includes('Daily compression limit')) {
                throw error;
            }
            // If usage check fails, allow compression for logged-in users
            return !!this.appState.user;
        }
    }

    async compressSingle(file, options = {}) {
        // Check usage limits first
        await this.checkUsageLimits();
        
        return super.compressSingle(file, options);
    }

    async compressBulk(files, options = {}) {
        if (!authManager.isPro()) {
            throw new Error('Bulk compression requires Pro subscription');
        }
        
        await this.checkUsageLimits();
        
        return super.compressBulk(files, options);
    }
}

// Subscription Manager
class SubscriptionManager {
    constructor(appState, apiClient) {
        this.appState = appState;
        this.apiClient = apiClient;
    }

    async getAvailablePlans() {
        try {
            const response = await this.apiClient.getPlans();
            return response.plans;
        } catch (error) {
            console.error('Failed to load plans:', error);
            throw new Error('Unable to load subscription plans');
        }
    }

    async upgradeToPlan(planId) {
        try {
            showNotification('Processing upgrade...', 'info');
            
            // In a real implementation, you would integrate with Stripe or another payment processor
            const paymentMethodId = 'pm_demo_payment_method'; // Demo payment method
            
            await this.apiClient.createSubscription(planId, paymentMethodId);
            
            // Refresh user data to get updated plan
            await authManager.refreshUserData();
            
            showNotification('Successfully upgraded to Pro!', 'success');
            return true;
        } catch (error) {
            showNotification(`Upgrade failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async cancelSubscription() {
        try {
            showNotification('Processing cancellation...', 'info');
            
            await this.apiClient.cancelSubscription();
            
            // Refresh user data to get updated plan
            await authManager.refreshUserData();
            
            showNotification('Subscription cancelled successfully', 'success');
            return true;
        } catch (error) {
            showNotification(`Cancellation failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Enhanced pricing management
function updatePricingUI() {
    const user = appState.user;
    const freePlanBtn = document.getElementById('freePlanBtn');
    const proPlanBtn = document.getElementById('proPlanBtn');
    const businessPlanBtn = document.getElementById('businessPlanBtn');

    // Reset buttons
    [freePlanBtn, proPlanBtn, businessPlanBtn].forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.className = 'btn btn-premium';
            btn.onclick = null;
        }
    });

    if (freePlanBtn) freePlanBtn.textContent = 'Get Started';
    if (proPlanBtn) proPlanBtn.textContent = 'Upgrade Now';
    if (businessPlanBtn) businessPlanBtn.textContent = 'Contact Sales';

    if (user) {
        const currentPlan = user.plan?.toLowerCase();
        
        if (currentPlan === 'free' || !user.plan) {
            if (freePlanBtn) {
                freePlanBtn.textContent = 'Current Plan';
                freePlanBtn.disabled = true;
                freePlanBtn.className = 'btn btn-secondary';
            }
            if (proPlanBtn) {
                proPlanBtn.onclick = () => handlePlanUpgrade('premium');
            }
        } else if (currentPlan === 'premium') {
            if (proPlanBtn) {
                proPlanBtn.textContent = 'Current Plan';
                proPlanBtn.disabled = true;
                proPlanBtn.className = 'btn btn-secondary';
            }
            if (freePlanBtn) {
                freePlanBtn.textContent = 'Downgrade';
                freePlanBtn.onclick = () => handlePlanDowngrade();
            }
        }
    } else {
        // User not logged in
        if (freePlanBtn) {
            freePlanBtn.onclick = () => showAuthModal('register');
        }
        if (proPlanBtn) {
            proPlanBtn.onclick = () => showAuthModal('register');
        }
    }
}

async function handlePlanUpgrade(planId) {
    if (!appState.user) {
        showAuthModal('register');
        return;
    }

    try {
        await subscriptionManager.upgradeToPlan(planId);
        updatePricingUI();
    } catch (error) {
        // Error already handled in SubscriptionManager
    }
}

async function handlePlanDowngrade() {
    if (!confirm('Are you sure you want to downgrade to the Free plan? You will lose access to Pro features.')) {
        return;
    }

    try {
        await subscriptionManager.cancelSubscription();
        updatePricingUI();
    } catch (error) {
        // Error already handled in SubscriptionManager
    }
}

// Enhanced file handling with validation
function validateFile(file, type = 'pdf') {
    const validations = {
        pdf: {
            types: ['application/pdf'],
            maxSize: authManager?.isPro() ? 100 * 1024 * 1024 : 50 * 1024 * 1024,
            errorMessage: 'Please select a valid PDF file'
        },
        image: {
            types: ['image/jpeg', 'image/jpg', 'image/png'],
            maxSize: 25 * 1024 * 1024,
            errorMessage: 'Please select a valid image file (JPG, PNG)'
        }
    };

    const validation = validations[type];
    if (!validation) throw new Error('Invalid file type validation');

    if (!validation.types.includes(file.type)) {
        throw new Error(validation.errorMessage);
    }

    if (file.size > validation.maxSize) {
        const limit = formatFileSize(validation.maxSize);
        throw new Error(`File size exceeds ${limit} limit`);
    }

    return true;
}

function handleFileSelection(file, featureType) {
    try {
        validateFile(file, featureType === 'compress' ? 'pdf' : 'pdf');
        
        appState.files[featureType === 'compress' ? 'single' : featureType] = file;
        updateFileInfo(file, featureType);
        
        // Reset previous results
        const results = document.getElementById(`${featureType === 'compress' ? 'single' : featureType}Results`);
        if (results) results.style.display = 'none';
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Bulk file handling
function handleBulkFiles(files) {
    if (!authManager?.isPro()) {
        showNotification('Bulk processing requires Pro subscription', 'error');
        switchTab('pricing');
        return;
    }

    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
        try {
            validateFile(file, 'pdf');
            
            // Check for duplicates
            const isDuplicate = appState.files.bulk.some(
                existing => existing.name === file.name && existing.size === file.size
            );
            
            if (!isDuplicate) {
                validFiles.push(file);
            }
        } catch (error) {
            errors.push(`${file.name}: ${error.message}`);
        }
    });

    if (errors.length > 0) {
        errors.forEach(error => showNotification(error, 'warning'));
    }

    if (validFiles.length > 0) {
        appState.files.bulk.push(...validFiles);
        updateBulkFileList();
        showNotification(`Added ${validFiles.length} file(s) for bulk processing`, 'success');
    }
}

function updateBulkFileList() {
    const fileList = document.getElementById('bulkFileList');
    const compressBtn = document.getElementById('bulkCompressBtn');
    
    if (!fileList) return;

    if (appState.files.bulk.length === 0) {
        fileList.style.display = 'none';
        if (compressBtn) compressBtn.disabled = true;
        return;
    }

    fileList.style.display = 'block';
    if (compressBtn) compressBtn.disabled = false;

    fileList.innerHTML = appState.files.bulk.map((file, index) => `
        <div class="bulk-file-item">
            <div class="file-info">
                <svg class="file-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <rect x="25" y="25" width="50" height="50" rx="5" fill="#3182ce"/>
                    <path d="M35 40H65V45H35z M35 50H65V55H35z M35 60H65V65H35z" fill="white"/>
                </svg>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button class="remove-file-btn" onclick="removeBulkFile(${index})">&times;</button>
        </div>
    `).join('');
}

function removeBulkFile(index) {
    appState.files.bulk.splice(index, 1);
    updateBulkFileList();
}

// Enhanced initialization with proper error handling
async function initializeApplication() {
    try {
        // Initialize core instances
        window.appState = new AppState();
        window.apiClient = new APIClient();
        window.authManager = new EnhancedAuthManager(appState, apiClient);
        window.compressionManager = new EnhancedCompressionManager(appState, apiClient);
        window.subscriptionManager = new SubscriptionManager(appState, apiClient);
        window.navigationMenu = new NavigationMenu();

        // Validate existing session
        if (apiClient.token) {
            await authManager.validateSession();
        }

        // Setup all event listeners
        setupAllEventListeners();
        
        // Initialize UI
        switchTab('compress');
        updatePricingUI();
        
        console.log('PDF Smaller application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showNotification('Application failed to initialize. Please refresh the page.', 'error');
    }
}

function setupAllEventListeners() {
    setupFileUploadListeners();
    setupCompressionListeners();
    setupAuthListeners();
    setupUIListeners();
}

function setupFileUploadListeners() {
    // Single file upload
    const singleUploadArea = document.getElementById('compressUploadArea');
    const singleFileInput = document.getElementById('singleFileInput');
    
    if (singleUploadArea && singleFileInput) {
        singleUploadArea.addEventListener('click', () => singleFileInput.click());
        
        const handleDragOver = (e) => {
            e.preventDefault();
            singleUploadArea.classList.add('dragover');
        };
        
        const handleDragLeave = () => {
            singleUploadArea.classList.remove('dragover');
        };
        
        const handleDrop = (e) => {
            e.preventDefault();
            singleUploadArea.classList.remove('dragover');
            if (e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0], 'compress');
            }
        };
        
        singleUploadArea.addEventListener('dragover', handleDragOver);
        singleUploadArea.addEventListener('dragleave', handleDragLeave);
        singleUploadArea.addEventListener('drop', handleDrop);
        
        singleFileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                handleFileSelection(e.target.files[0], 'compress');
            }
        });
    }

    // Bulk file upload
    const bulkUploadArea = document.getElementById('bulkUploadArea');
    const bulkFileInput = document.getElementById('bulkFileInput');
    
    if (bulkUploadArea && bulkFileInput) {
        bulkUploadArea.addEventListener('click', () => {
            if (!authManager.isPro()) {
                showNotification('Bulk processing requires Pro subscription', 'error');
                switchTab('pricing');
                return;
            }
            bulkFileInput.click();
        });
        
        bulkUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (authManager.isPro()) {
                bulkUploadArea.classList.add('dragover');
            }
        });
        
        bulkUploadArea.addEventListener('dragleave', () => {
            bulkUploadArea.classList.remove('dragover');
        });
        
        bulkUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            bulkUploadArea.classList.remove('dragover');
            handleBulkFiles(e.dataTransfer.files);
        });
        
        bulkFileInput.addEventListener('change', (e) => {
            handleBulkFiles(e.target.files);
        });
    }

    // Other file uploads
    ['convert', 'ocr', 'ai'].forEach(feature => {
        const uploadArea = document.getElementById(`${feature}UploadArea`);
        const fileInput = document.getElementById(`${feature}FileInput`);
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files[0]) {
                    handleFileSelection(e.dataTransfer.files[0], feature);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    handleFileSelection(e.target.files[0], feature);
                }
            });
        }
    });
}

function setupCompressionListeners() {
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

    // Single compression button
    const compressBtn = document.getElementById('singleCompressBtn');
    if (compressBtn) {
        compressBtn.addEventListener('click', async () => {
            if (!appState.files.single) return;

            const options = {
                compressionLevel: document.getElementById('singleCompressionLevel')?.value || 'medium',
                imageQuality: parseInt(document.getElementById('singleImageQuality')?.value || '80'),
                useServer: document.getElementById('useServerProcessing')?.checked || false
            };

            try {
                compressBtn.disabled = true;
                compressBtn.classList.add('processing');
                
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
                compressBtn.classList.remove('processing');
            }
        });
    }

    // Bulk compression button
    const bulkCompressBtn = document.getElementById('bulkCompressBtn');
    if (bulkCompressBtn) {
        bulkCompressBtn.addEventListener('click', async () => {
            if (appState.files.bulk.length === 0) return;

            const options = {
                compressionLevel: document.getElementById('bulkCompressionLevel')?.value || 'medium',
                imageQuality: parseInt(document.getElementById('bulkImageQuality')?.value || '80')
            };

            try {
                bulkCompressBtn.disabled = true;
                bulkCompressBtn.classList.add('processing');
                
                const result = await compressionManager.compressBulk(appState.files.bulk, options);
                
                // Update results display
                document.getElementById('bulkTotalFiles').textContent = result.fileCount;
                document.getElementById('bulkTotalTime').textContent = `${result.processingTime.toFixed(1)}s`;
                
                document.getElementById('bulkResults').style.display = 'block';
                showNotification(`Compressed ${result.fileCount} files successfully!`, 'success');
                
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                bulkCompressBtn.disabled = false;
                bulkCompressBtn.classList.remove('processing');
            }
        });
    }

    // Download buttons
    const singleDownloadBtn = document.getElementById('singleDownloadBtn');
    if (singleDownloadBtn) {
        singleDownloadBtn.addEventListener('click', () => {
            const result = appState.results.single;
            if (result && result.blob) {
                downloadFile(result.blob, `compressed_${appState.files.single.name}`);
            }
        });
    }

    const bulkDownloadBtn = document.getElementById('bulkDownloadBtn');
    if (bulkDownloadBtn) {
        bulkDownloadBtn.addEventListener('click', () => {
            const result = appState.results.bulk;
            if (result && result.blob) {
                downloadFile(result.blob, 'compressed_files.zip');
            }
        });
    }

    // New file/batch buttons
    const singleNewFileBtn = document.getElementById('singleNewFileBtn');
    if (singleNewFileBtn) {
        singleNewFileBtn.addEventListener('click', resetSingleMode);
    }

    const bulkNewBatchBtn = document.getElementById('bulkNewBatchBtn');
    if (bulkNewBatchBtn) {
        bulkNewBatchBtn.addEventListener('click', resetBulkMode);
    }
}

function setupAuthListeners() {
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
                const submitBtn = document.getElementById('authSubmitBtn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = isLogin ? 'Signing In...' : 'Creating Account...';
                }

                if (isLogin) {
                    await authManager.login(email, password);
                    showNotification('Successfully signed in!', 'success');
                } else {
                    await authManager.register(name, email, password);
                    showNotification('Account created successfully!', 'success');
                }
                
                hideAuthModal();
                updatePricingUI();
                
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                const submitBtn = document.getElementById('authSubmitBtn');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
                }
            }
        });
    }
}

function setupUIListeners() {
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

    // AI tool selection
    const aiToolSelection = document.getElementById('aiToolSelection');
    const translateOptions = document.getElementById('translateOptions');
    if (aiToolSelection && translateOptions) {
        aiToolSelection.addEventListener('change', (e) => {
            translateOptions.style.display = e.target.value === 'translate' ? 'block' : 'none';
        });
    }
}

// Helper functions
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function resetSingleMode() {
    appState.files.single = null;
    appState.results.single = null;
    
    const fileInput = document.getElementById('singleFileInput');
    const fileInfo = document.getElementById('singleFileInfo');
    const results = document.getElementById('singleResults');
    const progress = document.getElementById('singleProgress');
    const btn = document.getElementById('singleCompressBtn');

    if (fileInput) fileInput.value = '';
    if (fileInfo) fileInfo.style.display = 'none';
    if (results) results.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (btn) btn.disabled = true;
}

function resetBulkMode() {
    appState.files.bulk = [];
    appState.results.bulk = null;
    
    const fileInput = document.getElementById('bulkFileInput');
    const fileList = document.getElementById('bulkFileList');
    const results = document.getElementById('bulkResults');
    const progress = document.getElementById('bulkProgress');
    const btn = document.getElementById('bulkCompressBtn');

    if (fileInput) fileInput.value = '';
    if (fileList) {
        fileList.innerHTML = '';
        fileList.style.display = 'none';
    }
    if (results) results.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (btn) btn.disabled = true;
}

// Export global functions for HTML onclick handlers
window.switchTab = switchTab;
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.logout = () => authManager.logout();
window.removeBulkFile = removeBulkFile;
window.handlePlanSelection = (plan) => {
    if (plan === 'free') {
        handlePlanDowngrade();
    } else {
        handlePlanUpgrade(plan);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    initializeApplication();
}

// Periodic session validation
setInterval(async () => {
    if (authManager && authManager.appState.user && apiClient.token) {
        try {
            await authManager.validateSession();
        } catch (error) {
            console.warn('Session validation failed during periodic check');
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes