// Razorpay Configuration and Integration
class RazorpayManager {
    constructor() {
        this.razorpayKey = 'rzp_test_your_key_here'; // Replace with your actual Razorpay key
        this.companyName = 'Payment Management System';
        this.companyLogo = 'assets/logo.png';
        this.init();
    }

    init() {
        // Verify Razorpay script is loaded
        if (typeof Razorpay === 'undefined') {
            console.error('Razorpay script not loaded. Please include the Razorpay checkout script.');
            return;
        }
    }

    /**
     * Open Razorpay checkout with custom options
     * @param {Object} options - Payment options
     * @param {number} options.amount - Amount in rupees (will be converted to paise)
     * @param {string} options.description - Payment description
     * @param {Object} options.prefill - Customer prefill data
     * @param {Function} options.onSuccess - Success callback
     * @param {Function} options.onFailure - Failure callback
     */
    openCheckout(options = {}) {
        const defaultOptions = {
            amount: 1000, // Default ₹1000
            description: 'Payment Collection',
            prefill: {
                name: 'Customer Name',
                email: 'customer@example.com',
                contact: '9999999999'
            },
            onSuccess: this.defaultSuccessHandler,
            onFailure: this.defaultFailureHandler
        };

        const mergedOptions = { ...defaultOptions, ...options };

        const razorpayOptions = {
            key: this.razorpayKey,
            amount: mergedOptions.amount * 100, // Convert to paise
            currency: 'INR',
            name: this.companyName,
            description: mergedOptions.description,
            image: this.companyLogo,
            prefill: mergedOptions.prefill,
            theme: {
                color: '#667eea'
            },
            handler: (response) => {
                this.handlePaymentSuccess(response, mergedOptions.onSuccess);
            },
            modal: {
                ondismiss: () => {
                    this.handlePaymentDismiss(mergedOptions.onFailure);
                }
            }
        };

        const rzp = new Razorpay(razorpayOptions);
        rzp.on('payment.failed', (response) => {
            this.handlePaymentFailure(response, mergedOptions.onFailure);
        });

        rzp.open();
    }

    /**
     * Handle successful payment
     */
    handlePaymentSuccess(response, successCallback) {
        const paymentData = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || null,
            signature: response.razorpay_signature || null,
            timestamp: new Date().toISOString()
        };

        console.log('Payment successful:', paymentData);

        // Store payment data
        this.storePaymentData(paymentData);

        // Call success callback
        if (typeof successCallback === 'function') {
            successCallback(paymentData);
        } else {
            this.defaultSuccessHandler(paymentData);
        }
    }

    /**
     * Handle payment failure
     */
    handlePaymentFailure(response, failureCallback) {
        const errorData = {
            code: response.error.code,
            description: response.error.description,
            source: response.error.source,
            step: response.error.step,
            reason: response.error.reason,
            metadata: response.error.metadata,
            timestamp: new Date().toISOString()
        };

        console.error('Payment failed:', errorData);

        // Call failure callback
        if (typeof failureCallback === 'function') {
            failureCallback(errorData);
        } else {
            this.defaultFailureHandler(errorData);
        }
    }

    /**
     * Handle payment modal dismiss
     */
    handlePaymentDismiss(dismissCallback) {
        console.log('Payment cancelled by user');
        
        if (typeof dismissCallback === 'function') {
            dismissCallback({ reason: 'cancelled', timestamp: new Date().toISOString() });
        }
    }

    /**
     * Store payment data in localStorage
     */
    storePaymentData(paymentData) {
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        
        const newPayment = {
            id: 'PAY' + String(payments.length + 1).padStart(3, '0'),
            sender: 'Manual Collection',
            senderRole: 'admin',
            receiver: 'Admin',
            amount: paymentData.amount || 1000, // This should come from the original request
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            }),
            status: 'success',
            razorpayId: paymentData.paymentId,
            method: 'razorpay'
        };

        payments.push(newPayment);
        localStorage.setItem('paymentsData', JSON.stringify(payments));
    }

    /**
     * Default success handler
     */
    defaultSuccessHandler(paymentData) {
        alert(`Payment successful!\nPayment ID: ${paymentData.paymentId}`);
        
        // Reload page data if dashboard exists
        if (window.AdminDashboard && typeof window.AdminDashboard.prototype.loadDashboardData === 'function') {
            const dashboard = new window.AdminDashboard();
            dashboard.loadDashboardData();
        }
    }

    /**
     * Default failure handler
     */
    defaultFailureHandler(errorData) {
        alert(`Payment failed!\nReason: ${errorData.description || errorData.reason || 'Unknown error'}`);
    }

    /**
     * Verify payment on server (placeholder)
     * In a real application, you would verify the payment signature on your server
     */
    verifyPayment(paymentId, orderId, signature) {
        // This is a placeholder for server-side verification
        console.log('Verifying payment:', { paymentId, orderId, signature });
        
        // In production, make an API call to your server:
        // return fetch('/api/verify-payment', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ paymentId, orderId, signature })
        // });
        
        return Promise.resolve({ verified: true });
    }

    /**
     * Get payment status from Razorpay (requires server-side implementation)
     */
    getPaymentStatus(paymentId) {
        // This would typically be done on the server side
        console.log('Getting payment status for:', paymentId);
        
        // Placeholder return
        return Promise.resolve({
            id: paymentId,
            status: 'captured',
            amount: 100000, // in paise
            currency: 'INR'
        });
    }

    /**
     * Create a custom payment button
     */
    createPaymentButton(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        const button = document.createElement('button');
        button.className = 'btn btn-primary razorpay-payment-button';
        button.innerHTML = `
            <i class="fas fa-credit-card"></i> 
            ${options.buttonText || 'Pay Now'}
        `;
        
        button.addEventListener('click', () => {
            this.openCheckout(options);
        });

        container.appendChild(button);
    }

    /**
     * Update Razorpay configuration
     */
    updateConfig(config) {
        if (config.key) this.razorpayKey = config.key;
        if (config.companyName) this.companyName = config.companyName;
        if (config.companyLogo) this.companyLogo = config.companyLogo;
    }
}

// Create global instance
window.razorpayManager = new RazorpayManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RazorpayManager;
}