// Requests JavaScript - Deletion request management functionality
class RequestsManager {
    constructor() {
        this.currentTab = 'pending';
        this.currentRequestId = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Set admin email
        const adminEmail = localStorage.getItem('userEmail') || 'admin@demo.com';
        document.getElementById('adminEmail').textContent = adminEmail;

        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadRequests();
        this.updateSummaryCards();
    }

    isAuthenticated() {
        return localStorage.getItem('isLoggedIn') === 'true' && 
               localStorage.getItem('userRole') === 'admin';
    }

    setupEventListeners() {
        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Modal close functionality
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Approval modal buttons
        document.getElementById('cancelApproval').addEventListener('click', () => {
            this.closeModals();
        });

        document.getElementById('confirmApproval').addEventListener('click', () => {
            this.processApproval();
        });

        // Rejection modal buttons
        document.getElementById('cancelRejection').addEventListener('click', () => {
            this.closeModals();
        });

        document.getElementById('confirmRejection').addEventListener('click', () => {
            this.processRejection();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modals = ['requestModal', 'approvalModal', 'rejectionModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.loadRequests();
    }

    loadRequests() {
        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');
        
        switch(this.currentTab) {
            case 'pending':
                this.loadPendingRequests(requests.filter(req => req.status === 'pending'));
                break;
            case 'approved':
                this.loadApprovedRequests(requests.filter(req => req.status === 'approved'));
                break;
            case 'rejected':
                this.loadRejectedRequests(requests.filter(req => req.status === 'rejected'));
                break;
        }
    }

    loadPendingRequests(requests) {
        const tbody = document.getElementById('pendingRequestsTable');
        
        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 40px; color: #666;">
                        No pending requests
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.id}</td>
                <td>${request.userName}</td>
                <td><span class="status-badge status-${request.userRole === 'user' ? 'pending' : 'success'}">${request.userRole}</span></td>
                <td>${request.paymentId}</td>
                <td>₹${request.amount.toLocaleString()}</td>
                <td title="${request.reason}">${this.truncateText(request.reason, 30)}</td>
                <td>${this.formatDate(request.requestDate)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="requestsManager.viewRequestDetails('${request.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-success btn-sm" onclick="requestsManager.approveRequest('${request.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="requestsManager.rejectRequest('${request.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadApprovedRequests(requests) {
        const tbody = document.getElementById('approvedRequestsTable');
        
        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 40px; color: #666;">
                        No approved requests
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.id}</td>
                <td>${request.userName}</td>
                <td><span class="status-badge status-${request.userRole === 'user' ? 'pending' : 'success'}">${request.userRole}</span></td>
                <td>${request.paymentId}</td>
                <td>₹${request.amount.toLocaleString()}</td>
                <td title="${request.reason}">${this.truncateText(request.reason, 30)}</td>
                <td>${this.formatDate(request.approvedDate)}</td>
                <td>${request.approvedBy || 'Admin'}</td>
            </tr>
        `).join('');
    }

    loadRejectedRequests(requests) {
        const tbody = document.getElementById('rejectedRequestsTable');
        
        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 40px; color: #666;">
                        No rejected requests
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.id}</td>
                <td>${request.userName}</td>
                <td><span class="status-badge status-${request.userRole === 'user' ? 'pending' : 'success'}">${request.userRole}</span></td>
                <td>${request.paymentId}</td>
                <td>₹${request.amount.toLocaleString()}</td>
                <td title="${request.reason}">${this.truncateText(request.reason, 30)}</td>
                <td>${this.formatDate(request.rejectedDate)}</td>
                <td>${request.rejectedBy || 'Admin'}</td>
            </tr>
        `).join('');
    }

    updateSummaryCards() {
        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');
        const today = new Date().toISOString().split('T')[0];
        
        const pendingCount = requests.filter(req => req.status === 'pending').length;
        const approvedToday = requests.filter(req => req.status === 'approved' && req.approvedDate === today).length;
        const rejectedToday = requests.filter(req => req.status === 'rejected' && req.rejectedDate === today).length;
        const amountAtRisk = requests
            .filter(req => req.status === 'pending')
            .reduce((sum, req) => sum + req.amount, 0);

        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('approvedToday').textContent = approvedToday;
        document.getElementById('rejectedToday').textContent = rejectedToday;
        document.getElementById('amountAtRisk').textContent = `₹${amountAtRisk.toLocaleString()}`;
    }

    viewRequestDetails(requestId) {
        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');
        const request = requests.find(req => req.id === requestId);

        if (!request) {
            alert('Request not found');
            return;
        }

        const detailsHtml = `
            <div class="request-details">
                <div class="form-group">
                    <strong>Request ID:</strong> ${request.id}
                </div>
                <div class="form-group">
                    <strong>User:</strong> ${request.userName} (${request.userRole})
                </div>
                <div class="form-group">
                    <strong>Payment ID:</strong> ${request.paymentId}
                </div>
                <div class="form-group">
                    <strong>Amount:</strong> ₹${request.amount.toLocaleString()}
                </div>
                <div class="form-group">
                    <strong>Request Date:</strong> ${this.formatDate(request.requestDate)}
                </div>
                <div class="form-group">
                    <strong>Status:</strong> <span class="status-badge status-${request.status === 'pending' ? 'pending' : request.status === 'approved' ? 'success' : 'failed'}">${request.status}</span>
                </div>
                <div class="form-group">
                    <strong>Reason:</strong>
                    <p style="margin-top: 5px; padding: 10px; background: #f8f9fa; border-radius: 5px;">${request.reason}</p>
                </div>
                ${request.adminNotes ? `
                    <div class="form-group">
                        <strong>Admin Notes:</strong>
                        <p style="margin-top: 5px; padding: 10px; background: #f8f9fa; border-radius: 5px;">${request.adminNotes}</p>
                    </div>
                ` : ''}
                ${request.rejectionReason ? `
                    <div class="form-group">
                        <strong>Rejection Reason:</strong>
                        <p style="margin-top: 5px; padding: 10px; background: #f8f9fa; border-radius: 5px;">${request.rejectionReason}</p>
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('requestDetails').innerHTML = detailsHtml;
        document.getElementById('requestModal').style.display = 'block';
    }

    approveRequest(requestId) {
        this.currentRequestId = requestId;
        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');
        const request = requests.find(req => req.id === requestId);

        if (!request) {
            alert('Request not found');
            return;
        }

        document.getElementById('approvalMessage').textContent = 
            `Are you sure you want to approve the deletion request for Payment ID: ${request.paymentId} (₹${request.amount.toLocaleString()})?`;
        document.getElementById('approvalNotes').value = '';
        document.getElementById('approvalModal').style.display = 'block';
    }

    rejectRequest(requestId) {
        this.currentRequestId = requestId;
        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');
        const request = requests.find(req => req.id === requestId);

        if (!request) {
            alert('Request not found');
            return;
        }

        document.getElementById('rejectionMessage').textContent = 
            `Are you sure you want to reject the deletion request for Payment ID: ${request.paymentId} (₹${request.amount.toLocaleString()})?`;
        document.getElementById('rejectionReason').value = '';
        document.getElementById('rejectionModal').style.display = 'block';
    }

    processApproval() {
        if (!this.currentRequestId) return;

        const adminNotes = document.getElementById('approvalNotes').value;
        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');
        const requestIndex = requests.findIndex(req => req.id === this.currentRequestId);

        if (requestIndex === -1) {
            alert('Request not found');
            return;
        }

        // Update request status
        requests[requestIndex].status = 'approved';
        requests[requestIndex].approvedDate = new Date().toISOString().split('T')[0];
        requests[requestIndex].approvedBy = localStorage.getItem('userEmail') || 'Admin';
        if (adminNotes) {
            requests[requestIndex].adminNotes = adminNotes;
        }

        // Also remove the payment from payments data
        this.removePaymentFromData(requests[requestIndex].paymentId);

        localStorage.setItem('deletionRequests', JSON.stringify(requests));

        this.closeModals();
        this.loadRequests();
        this.updateSummaryCards();

        alert('Request approved successfully. Payment has been removed from the system.');
    }

    processRejection() {
        if (!this.currentRequestId) return;

        const rejectionReason = document.getElementById('rejectionReason').value.trim();
        
        if (!rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
        }

        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');
        const requestIndex = requests.findIndex(req => req.id === this.currentRequestId);

        if (requestIndex === -1) {
            alert('Request not found');
            return;
        }

        // Update request status
        requests[requestIndex].status = 'rejected';
        requests[requestIndex].rejectedDate = new Date().toISOString().split('T')[0];
        requests[requestIndex].rejectedBy = localStorage.getItem('userEmail') || 'Admin';
        requests[requestIndex].rejectionReason = rejectionReason;

        localStorage.setItem('deletionRequests', JSON.stringify(requests));

        this.closeModals();
        this.loadRequests();
        this.updateSummaryCards();

        alert('Request rejected successfully.');
    }

    removePaymentFromData(paymentId) {
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        const updatedPayments = payments.filter(payment => payment.id !== paymentId);
        localStorage.setItem('paymentsData', JSON.stringify(updatedPayments));
    }

    closeModals() {
        document.getElementById('requestModal').style.display = 'none';
        document.getElementById('approvalModal').style.display = 'none';
        document.getElementById('rejectionModal').style.display = 'none';
        this.currentRequestId = null;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('loginTime');
            window.location.href = 'index.html';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.requestsManager = new RequestsManager();
});