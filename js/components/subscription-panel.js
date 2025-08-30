/**
 * Subscription Panel Component
 * Handles subscription plans, billing, and plan management
 */

import { BaseComponent } from './base-component.js';

export class SubscriptionPanel extends BaseComponent {
  constructor() {
    super();
    this.plans = [];
    this.currentSubscription = null;
    this.usageStats = null;
    this.isLoading = false;
    this.onPlanChange = null;
  }

  static get observedAttributes() {
    return ['plans', 'subscription', 'usage'];
  }

  init() {
    this.setState({
      plans: this.getProp('plans', []),
      currentSubscription: this.getProp('subscription', null),
      usageStats: this.getProp('usage', null),
      isLoading: false
    });
  }

  getTemplate() {
    if (this.getState('isLoading')) {
      return this.getLoadingTemplate();
    }

    return `
            <div class="subscription-panel">
                <div class="subscription-header">
                    <h2>Subscription Management</h2>
                    <p>Choose the plan that best fits your needs</p>
                </div>
                
                ${this.getCurrentPlanSection()}
                
                <div class="plans-section">
                    <h3>Available Plans</h3>
                    <div class="plans-grid">
                        ${this.getPlansTemplate()}
                    </div>
                </div>
                
                ${this.getUsageSection()}
                
                <div class="billing-section">
                    <h3>Billing Information</h3>
                    ${this.getBillingTemplate()}
                </div>
            </div>
        `;
  }

  getLoadingTemplate() {
    return `
            <div class="subscription-panel loading">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>Loading subscription information...</p>
                </div>
            </div>
        `;
  }

  getCurrentPlanSection() {
    const subscription = this.getState('currentSubscription');
    if (!subscription) {
      return `
                <div class="current-plan-section no-subscription">
                    <h3>Current Plan</h3>
                    <div class="no-plan-info">
                        <p>You're currently on the Free Plan</p>
                        <button class="btn btn-primary" data-action="upgrade-plan">
                            Upgrade to Pro
                        </button>
                    </div>
                </div>
            `;
    }

    return `
            <div class="current-plan-section">
                <h3>Current Plan</h3>
                <div class="current-plan-card">
                    <div class="plan-info">
                        <h4>${this.getPlanDisplayName(subscription.plan)}</h4>
                        <p>${this.getPlanDescription(subscription.plan)}</p>
                        <div class="plan-details">
                            <span class="billing-cycle">${subscription.billing_cycle} billing</span>
                            <span class="plan-status status-${subscription.status}">${subscription.status}</span>
                        </div>
                    </div>
                    <div class="plan-actions">
                        <button class="btn btn-secondary" data-action="change-plan">
                            Change Plan
                        </button>
                        <button class="btn btn-outline" data-action="cancel-subscription">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  getPlansTemplate() {
    const plans = this.getState('plans');
    const currentPlan = this.getState('currentSubscription')?.plan;
        
    return plans.map(plan => {
      const isCurrentPlan = currentPlan === plan.name;
      const isPopular = plan.name === 'premium';
            
      return `
                <div class="plan-card ${isCurrentPlan ? 'current' : ''} ${isPopular ? 'popular' : ''}">
                    ${isPopular ? '<div class="popular-badge">Most Popular</div>' : ''}
                    <div class="plan-header">
                        <h4 class="plan-name">${plan.display_name}</h4>
                        <div class="plan-price">
                            <span class="price-amount">$${plan.price_monthly}</span>
                            <span class="price-period">/month</span>
                        </div>
                        ${plan.price_yearly ? `
                            <div class="yearly-price">
                                <span class="price-amount">$${plan.price_yearly}</span>
                                <span class="price-period">/year</span>
                                <span class="yearly-savings">Save ${this.calculateYearlySavings(plan)}%</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="plan-features">
                        <ul class="feature-list">
                            <li class="feature-item">
                                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M20 7L10 17l-5-5"/>
                                </svg>
                                Up to ${plan.max_file_size_mb}MB files
                            </li>
                            <li class="feature-item">
                                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M20 7L10 17l-5-5"/>
                                </svg>
                                ${plan.daily_compression_limit} compressions/day
                            </li>
                            ${plan.bulk_processing ? `
                                <li class="feature-item">
                                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M20 7L10 17l-5-5"/>
                                    </svg>
                                    Bulk processing
                                </li>
                            ` : ''}
                            ${plan.priority_processing ? `
                                <li class="feature-item">
                                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M20 7L10 17l-5-5"/>
                                    </svg>
                                    Priority processing
                                </li>
                            ` : ''}
                            ${plan.api_access ? `
                                <li class="feature-item">
                                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M20 7L10 17l-5-5"/>
                                    </svg>
                                    API access
                                </li>
                            ` : ''}
                        </ul>
                    </div>
                    
                    <div class="plan-actions">
                        ${isCurrentPlan ? `
                            <button class="btn btn-secondary" disabled>Current Plan</button>
                        ` : `
                            <button class="btn btn-primary" data-action="select-plan" data-plan-id="${plan.id}">
                                ${currentPlan ? 'Switch to This Plan' : 'Get Started'}
                            </button>
                        `}
                    </div>
                </div>
            `;
    }).join('');
  }

  getUsageSection() {
    const usage = this.getState('usageStats');
    if (!usage) return '';

    return `
            <div class="usage-section">
                <h3>Usage This Month</h3>
                <div class="usage-grid">
                    <div class="usage-item">
                        <span class="usage-value">${usage.daily_usage_count || 0}</span>
                        <span class="usage-label">Today's Compressions</span>
                    </div>
                    <div class="usage-item">
                        <span class="usage-value">${usage.monthly_usage_count || 0}</span>
                        <span class="usage-label">This Month</span>
                    </div>
                    <div class="usage-item">
                        <span class="usage-value">${usage.total_compressions || 0}</span>
                        <span class="usage-label">Total All Time</span>
                    </div>
                </div>
                
                ${this.getUsageProgressBar(usage)}
            </div>
        `;
  }

  getUsageProgressBar(usage) {
    const currentPlan = this.getState('currentSubscription')?.plan;
    const plan = this.getState('plans').find(p => p.name === currentPlan);
    const limit = plan?.daily_compression_limit || 5;
    const used = usage.daily_usage_count || 0;
    const percentage = Math.min((used / limit) * 100, 100);

    return `
            <div class="usage-progress">
                <div class="progress-header">
                    <span>Daily Limit: ${used}/${limit}</span>
                    <span>${percentage.toFixed(0)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                ${used >= limit ? `
                    <p class="usage-warning">Daily limit reached. Upgrade your plan for more compressions.</p>
                ` : ''}
            </div>
        `;
  }

  getBillingTemplate() {
    const subscription = this.getState('currentSubscription');
    if (!subscription) {
      return `
                <div class="no-billing-info">
                    <p>No active subscription found.</p>
                </div>
            `;
    }

    return `
            <div class="billing-info">
                <div class="billing-details">
                    <div class="billing-item">
                        <span class="billing-label">Next Billing Date</span>
                        <span class="billing-value">${this.formatDate(subscription.current_period_end)}</span>
                    </div>
                    <div class="billing-item">
                        <span class="billing-label">Billing Cycle</span>
                        <span class="billing-value">${subscription.billing_cycle}</span>
                    </div>
                    <div class="billing-item">
                        <span class="billing-label">Status</span>
                        <span class="billing-value status-${subscription.status}">${subscription.status}</span>
                    </div>
                </div>
                
                <div class="billing-actions">
                    <button class="btn btn-secondary" data-action="update-payment">
                        Update Payment Method
                    </button>
                    <button class="btn btn-outline" data-action="download-invoice">
                        Download Invoice
                    </button>
                </div>
            </div>
        `;
  }

  getStyles() {
    return `
            :host {
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .subscription-panel {
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                padding: 32px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .subscription-header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .subscription-header h2 {
                font-size: 32px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 12px 0;
            }
            
            .subscription-header p {
                font-size: 18px;
                color: #6b7280;
                margin: 0;
            }
            
            .current-plan-section {
                margin-bottom: 40px;
                padding: 24px;
                background: #f9fafb;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
            }
            
            .current-plan-section h3 {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 20px 0;
            }
            
            .current-plan-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
            }
            
            .plan-info h4 {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 8px 0;
            }
            
            .plan-info p {
                font-size: 16px;
                color: #6b7280;
                margin: 0 0 16px 0;
            }
            
            .plan-details {
                display: flex;
                gap: 16px;
                align-items: center;
            }
            
            .billing-cycle {
                font-size: 14px;
                color: #6b7280;
                background: #e5e7eb;
                padding: 4px 12px;
                border-radius: 16px;
            }
            
            .plan-status {
                font-size: 14px;
                font-weight: 500;
                padding: 4px 12px;
                border-radius: 16px;
            }
            
            .status-active {
                background: #d1fae5;
                color: #065f46;
            }
            
            .status-canceled {
                background: #fee2e2;
                color: #991b1b;
            }
            
            .status-past_due {
                background: #fef3c7;
                color: #92400e;
            }
            
            .plan-actions {
                display: flex;
                gap: 12px;
            }
            
            .no-subscription .no-plan-info {
                text-align: center;
                padding: 40px 20px;
            }
            
            .no-plan-info p {
                font-size: 18px;
                color: #6b7280;
                margin: 0 0 20px 0;
            }
            
            .plans-section {
                margin-bottom: 40px;
            }
            
            .plans-section h3 {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 24px 0;
                text-align: center;
            }
            
            .plans-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
            }
            
            .plan-card {
                background: #ffffff;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .plan-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            .plan-card.current {
                border-color: #3b82f6;
                background: #eff6ff;
            }
            
            .plan-card.popular {
                border-color: #10b981;
                background: #f0fdf4;
            }
            
            .popular-badge {
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: #10b981;
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .plan-header {
                text-align: center;
                margin-bottom: 24px;
            }
            
            .plan-name {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 16px 0;
            }
            
            .plan-price {
                margin-bottom: 12px;
            }
            
            .price-amount {
                font-size: 36px;
                font-weight: 700;
                color: #3b82f6;
            }
            
            .price-period {
                font-size: 16px;
                color: #6b7280;
            }
            
            .yearly-price {
                margin-top: 8px;
            }
            
            .yearly-price .price-amount {
                font-size: 24px;
                color: #10b981;
            }
            
            .yearly-savings {
                display: block;
                font-size: 12px;
                color: #10b981;
                font-weight: 500;
                margin-top: 4px;
            }
            
            .plan-features {
                margin-bottom: 24px;
            }
            
            .feature-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .feature-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 0;
                font-size: 14px;
                color: #374151;
            }
            
            .feature-icon {
                width: 18px;
                height: 18px;
                color: #10b981;
                flex-shrink: 0;
            }
            
            .plan-actions {
                text-align: center;
            }
            
            .usage-section {
                margin-bottom: 40px;
                padding: 24px;
                background: #f9fafb;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
            }
            
            .usage-section h3 {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 20px 0;
            }
            
            .usage-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
                margin-bottom: 24px;
            }
            
            .usage-item {
                text-align: center;
                padding: 20px;
                background: #ffffff;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }
            
            .usage-value {
                display: block;
                font-size: 28px;
                font-weight: 700;
                color: #3b82f6;
                margin-bottom: 8px;
            }
            
            .usage-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .usage-progress {
                margin-top: 20px;
            }
            
            .progress-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
                color: #6b7280;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #10b981, #3b82f6);
                transition: width 0.3s ease;
            }
            
            .usage-warning {
                margin-top: 12px;
                padding: 12px;
                background: #fef3c7;
                color: #92400e;
                border-radius: 6px;
                font-size: 14px;
                text-align: center;
            }
            
            .billing-section h3 {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 20px 0;
            }
            
            .billing-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                padding: 24px;
                background: #f9fafb;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
            }
            
            .billing-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
            }
            
            .billing-item {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .billing-label {
                font-size: 14px;
                font-weight: 500;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .billing-value {
                font-size: 16px;
                color: #1f2937;
                font-weight: 500;
            }
            
            .billing-actions {
                display: flex;
                gap: 12px;
            }
            
            .no-billing-info {
                text-align: center;
                padding: 40px 20px;
                color: #6b7280;
            }
            
            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            
            .btn-primary {
                background: #3b82f6;
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: #2563eb;
                transform: translateY(-1px);
            }
            
            .btn-secondary {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .btn-secondary:hover:not(:disabled) {
                background: #e5e7eb;
            }
            
            .btn-outline {
                background: transparent;
                color: #374151;
                border: 2px solid #d1d5db;
            }
            
            .btn-outline:hover {
                background: #f9fafb;
                border-color: #9ca3af;
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            /* Loading Styles */
            .loading {
                text-align: center;
                padding: 60px 32px;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading p {
                color: #6b7280;
                font-size: 16px;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .subscription-panel {
                    padding: 24px;
                    margin: 16px;
                }
                
                .subscription-header h2 {
                    font-size: 24px;
                }
                
                .current-plan-card {
                    flex-direction: column;
                    text-align: center;
                }
                
                .plans-grid {
                    grid-template-columns: 1fr;
                }
                
                .billing-info {
                    flex-direction: column;
                    text-align: center;
                }
                
                .billing-details {
                    grid-template-columns: 1fr;
                }
                
                .plan-actions {
                    flex-direction: column;
                }
                
                .billing-actions {
                    flex-direction: column;
                }
            }
        `;
  }

  setupEventListeners() {
    this.addEventListener(this.shadowRoot, 'click', (event) => {
      if (event.target.matches('[data-action="upgrade-plan"]')) {
        this.handleUpgradePlan();
      } else if (event.target.matches('[data-action="change-plan"]')) {
        this.handleChangePlan();
      } else if (event.target.matches('[data-action="cancel-subscription"]')) {
        this.handleCancelSubscription();
      } else if (event.target.matches('[data-action="select-plan"]')) {
        const planId = event.target.getAttribute('data-plan-id');
        this.handleSelectPlan(planId);
      } else if (event.target.matches('[data-action="update-payment"]')) {
        this.handleUpdatePayment();
      } else if (event.target.matches('[data-action="download-invoice"]')) {
        this.handleDownloadInvoice();
      }
    });
  }

  // Event handlers
  handleUpgradePlan() {
    this.emit('subscription:upgrade');
  }

  handleChangePlan() {
    this.emit('subscription:change-plan');
  }

  handleCancelSubscription() {
    this.emit('subscription:cancel');
  }

  handleSelectPlan(planId) {
    this.emit('subscription:select-plan', { planId });
  }

  handleUpdatePayment() {
    this.emit('subscription:update-payment');
  }

  handleDownloadInvoice() {
    this.emit('subscription:download-invoice');
  }

  // Public methods
  setPlans(plans) {
    this.setState({ plans });
    this.scheduleRender();
  }

  setSubscription(subscription) {
    this.setState({ currentSubscription: subscription });
    this.scheduleRender();
  }

  setUsageStats(usage) {
    this.setState({ usageStats: usage });
    this.scheduleRender();
  }

  setLoading(isLoading) {
    this.setState({ isLoading });
    this.scheduleRender();
  }

  // Utility methods
  getPlanDisplayName(planName) {
    const planMap = {
      'free': 'Free Plan',
      'basic': 'Basic Plan',
      'premium': 'Premium Plan',
      'pro': 'Pro Plan'
    };
    return planMap[planName] || 'Free Plan';
  }

  getPlanDescription(planName) {
    const planDescriptions = {
      'free': 'Basic PDF compression features',
      'basic': 'Enhanced compression with priority processing',
      'premium': 'Advanced features including bulk processing and OCR',
      'pro': 'Full access to all features with API access'
    };
    return planDescriptions[planName] || 'Basic PDF compression features';
  }

  calculateYearlySavings(plan) {
    if (!plan.price_yearly || !plan.price_monthly) return 0;
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyPrice = plan.price_yearly;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  showError(message) {
    this.emit('subscription:error', { message });
  }

  showSuccess(message) {
    this.emit('subscription:success', { message });
  }
}

// Register the component
customElements.define('subscription-panel', SubscriptionPanel);
