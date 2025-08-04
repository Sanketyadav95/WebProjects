// Payments JavaScript - Payment management functionality
class PaymentsManager {
    constructor() {
        this.paymentsTable = null;
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

        // Initialize DataTable
        this.initializeDataTable();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load payments data
        this.loadPayments();
    }

    isAuthenticated() {
        return localStorage.getItem('isLoggedIn') === 'true' && 
               localStorage.getItem('userRole') === 'admin';
    }

    initializeDataTable() {
        this.paymentsTable = $('#paymentsTable').DataTable({
            responsive: true,
            pageLength: 25,
            order: [[4, 'desc']], // Sort by date descending
            columnDefs: [
                { targets: [3], type: 'num-fmt' }, // Amount column
                { targets: [4], type: 'date' }, // Date column
                { targets: [7], orderable: false } // Actions column
            ],
            language: {
                search: "Search payments:",
                lengthMenu: "Show _MENU_ payments per page",
                info: "Showing _START_ to _END_ of _TOTAL_ payments",
                emptyTable: "No payments found"
            }
        });
    }

    loadPayments() {
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        
        // Clear existing data
        this.paymentsTable.clear();

        // Add payment data to table
        payments.forEach(payment => {
            const statusBadge = `<span class="status-badge status-${payment.status}">${payment.status}</span>`;
            const actions = `
                <button class="btn btn-secondary btn-sm" onclick="paymentsManager.viewPaymentDetails('${payment.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${payment.status === 'success' ? '' : `
                    <button class="btn btn-danger btn-sm" onclick="paymentsManager.deletePayment('${payment.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                `}
            `;

            this.paymentsTable.row.add([
                payment.id,
                payment.sender,
                payment.receiver,
                `₹${payment.amount.toLocaleString()}`,
                this.formatDate(payment.date),
                statusBadge,
                payment.razorpayId,
                actions
            ]);
        });

        this.paymentsTable.draw();
    }

    setupEventListeners() {
        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Filter controls
        document.getElementById('dateFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('roleFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        // Clear filters
        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('dateFilter').value = '';
            document.getElementById('roleFilter').value = '';
            document.getElementById('statusFilter').value = '';
            this.paymentsTable.search('').columns().search('').draw();
        });

        // Export buttons
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcel();
        });

        // Modal close functionality
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.getElementById('paymentModal').style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('paymentModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    applyFilters() {
        const dateFilter = document.getElementById('dateFilter').value;
        const roleFilter = document.getElementById('roleFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        // Apply date filter
        if (dateFilter) {
            this.paymentsTable.column(4).search(dateFilter);
        } else {
            this.paymentsTable.column(4).search('');
        }

        // Apply role filter (search in sender column)
        if (roleFilter) {
            // This is a simplified approach - in a real app, you'd store role info
            this.paymentsTable.column(1).search(roleFilter === 'user' ? 'John|Jane' : 
                                              roleFilter === 'senior' ? 'Senior' : 
                                              roleFilter === 'leader' ? 'Leader' : '');
        } else {
            this.paymentsTable.column(1).search('');
        }

        // Apply status filter
        if (statusFilter) {
            this.paymentsTable.column(5).search(statusFilter);
        } else {
            this.paymentsTable.column(5).search('');
        }

        this.paymentsTable.draw();
    }

    viewPaymentDetails(paymentId) {
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        const payment = payments.find(p => p.id === paymentId);

        if (!payment) {
            alert('Payment not found');
            return;
        }

        const detailsHtml = `
            <div class="payment-details">
                <div class="form-group">
                    <strong>Payment ID:</strong> ${payment.id}
                </div>
                <div class="form-group">
                    <strong>Sender:</strong> ${payment.sender}
                </div>
                <div class="form-group">
                    <strong>Receiver:</strong> ${payment.receiver}
                </div>
                <div class="form-group">
                    <strong>Amount:</strong> ₹${payment.amount.toLocaleString()}
                </div>
                <div class="form-group">
                    <strong>Date & Time:</strong> ${this.formatDate(payment.date)} ${payment.time}
                </div>
                <div class="form-group">
                    <strong>Status:</strong> <span class="status-badge status-${payment.status}">${payment.status}</span>
                </div>
                <div class="form-group">
                    <strong>Razorpay ID:</strong> ${payment.razorpayId}
                </div>
                <div class="form-group">
                    <strong>Payment Method:</strong> ${payment.method}
                </div>
            </div>
        `;

        document.getElementById('paymentDetails').innerHTML = detailsHtml;
        document.getElementById('paymentModal').style.display = 'block';
    }

    deletePayment(paymentId) {
        if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
            return;
        }

        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        const updatedPayments = payments.filter(p => p.id !== paymentId);
        
        localStorage.setItem('paymentsData', JSON.stringify(updatedPayments));
        
        // Reload the table
        this.loadPayments();
        
        alert('Payment deleted successfully');
    }

    exportToCSV() {
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        
        const csvContent = [
            ['Payment ID', 'Sender', 'Receiver', 'Amount', 'Date', 'Status', 'Razorpay ID'],
            ...payments.map(payment => [
                payment.id,
                payment.sender,
                payment.receiver,
                payment.amount,
                payment.date,
                payment.status,
                payment.razorpayId
            ])
        ].map(row => row.join(',')).join('\n');

        this.downloadFile(csvContent, 'payments.csv', 'text/csv');
    }

    exportToPDF() {
        // Using jsPDF (included in HTML)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Payment Report', 20, 20);

        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        let yPosition = 40;

        doc.setFontSize(12);
        payments.forEach(payment => {
            doc.text(`ID: ${payment.id} | ${payment.sender} → ${payment.receiver} | ₹${payment.amount} | ${payment.date}`, 20, yPosition);
            yPosition += 10;
            
            if (yPosition > 280) {
                doc.addPage();
                yPosition = 20;
            }
        });

        doc.save('payments.pdf');
    }

    exportToExcel() {
        // Simple Excel export using CSV format with .xlsx extension
        this.exportToCSV();
        // In a real application, you would use a library like SheetJS for proper Excel export
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
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
    window.paymentsManager = new PaymentsManager();
});