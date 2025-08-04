// Dashboard JavaScript - Main functionality
class AdminDashboard {
    constructor() {
        this.init();
        this.loadDashboardData();
        this.setupEventListeners();
        this.setupRazorpay();
    }

    init() {
        // Check authentication
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Set admin email in sidebar
        const adminEmail = localStorage.getItem('userEmail') || 'admin@demo.com';
        document.getElementById('adminEmail').textContent = adminEmail;

        // Initialize sample data if not exists
        this.initializeSampleData();
    }

    isAuthenticated() {
        return localStorage.getItem('isLoggedIn') === 'true' && 
               localStorage.getItem('userRole') === 'admin';
    }

    initializeSampleData() {
        // Initialize payments data
        if (!localStorage.getItem('paymentsData')) {
            const samplePayments = [
                {
                    id: 'PAY001',
                    sender: 'John Doe',
                    senderRole: 'user',
                    receiver: 'Admin',
                    amount: 5000,
                    date: '2024-01-15',
                    time: '10:30 AM',
                    status: 'success',
                    razorpayId: 'rzp_test_1234567890',
                    method: 'razorpay'
                },
                {
                    id: 'PAY002',
                    sender: 'Jane Smith',
                    senderRole: 'senior',
                    receiver: 'Admin',
                    amount: 7500,
                    date: '2024-01-14',
                    time: '2:15 PM',
                    status: 'success',
                    razorpayId: 'rzp_test_0987654321',
                    method: 'razorpay'
                },
                {
                    id: 'PAY003',
                    sender: 'Mike Johnson',
                    senderRole: 'leader',
                    receiver: 'Admin',
                    amount: 10000,
                    date: '2024-01-13',
                    time: '4:45 PM',
                    status: 'success',
                    razorpayId: 'rzp_test_1122334455',
                    method: 'razorpay'
                }
            ];
            localStorage.setItem('paymentsData', JSON.stringify(samplePayments));
        }

        // Initialize users data
        if (!localStorage.getItem('usersData')) {
            const sampleUsers = [
                {
                    id: 'USR001',
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+91 9876543210',
                    role: 'user',
                    assignedTo: 'Jane Smith',
                    joinDate: '2024-01-10',
                    status: 'active'
                },
                {
                    id: 'USR002',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    phone: '+91 9876543211',
                    role: 'senior',
                    assignedTo: 'Mike Johnson',
                    joinDate: '2024-01-05',
                    status: 'active'
                },
                {
                    id: 'USR003',
                    name: 'Mike Johnson',
                    email: 'mike@example.com',
                    phone: '+91 9876543212',
                    role: 'leader',
                    assignedTo: '',
                    joinDate: '2024-01-01',
                    status: 'active'
                }
            ];
            localStorage.setItem('usersData', JSON.stringify(sampleUsers));
        }

        // Initialize deletion requests
        if (!localStorage.getItem('deletionRequests')) {
            const sampleRequests = [
                {
                    id: 'REQ001',
                    userId: 'USR001',
                    userName: 'John Doe',
                    userRole: 'user',
                    paymentId: 'PAY001',
                    amount: 5000,
                    reason: 'Duplicate payment made by mistake',
                    requestDate: '2024-01-16',
                    status: 'pending'
                }
            ];
            localStorage.setItem('deletionRequests', JSON.stringify(sampleRequests));
        }
    }

    loadDashboardData() {
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        const requests = JSON.parse(localStorage.getItem('deletionRequests') || '[]');

        // Calculate totals
        const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalUsers = users.filter(user => user.role === 'user').length;
        const totalSeniors = users.filter(user => ['senior', 'leader'].includes(user.role)).length;
        const pendingRequests = requests.filter(req => req.status === 'pending').length;

        // Update dashboard cards
        document.getElementById('totalPayments').textContent = `₹${totalPayments.toLocaleString()}`;
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalSeniors').textContent = totalSeniors;
        document.getElementById('pendingRequests').textContent = pendingRequests;

        // Load recent activity
        this.loadRecentActivity(payments);
    }

    loadRecentActivity(payments) {
        const recentPayments = payments
            .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
            .slice(0, 5);

        const tbody = document.getElementById('recentActivity');
        
        if (recentPayments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center" style="padding: 40px; color: #666;">
                        No recent activity
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentPayments.map(payment => `
            <tr>
                <td>${this.formatDateTime(payment.date, payment.time)}</td>
                <td>Payment from ${payment.sender}</td>
                <td>${payment.sender}</td>
                <td>₹${payment.amount.toLocaleString()}</td>
                <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Collect payment button
        document.getElementById('collectPaymentBtn').addEventListener('click', () => {
            this.openRazorpayCheckout();
        });
    }

    setupRazorpay() {
        // Razorpay configuration will be handled in openRazorpayCheckout
    }

    openRazorpayCheckout() {
        const options = {
            key: 'rzp_test_your_key_here', // Replace with your Razorpay key
            amount: 100000, // Amount in paise (₹1000)
            currency: 'INR',
            name: 'Payment Management System',
            description: 'Manual Payment Collection',
            image: 'assets/logo.png',
            prefill: {
                name: 'Customer Name',
                email: 'customer@example.com',
                contact: '9999999999'
            },
            theme: {
                color: '#667eea'
            },
            handler: (response) => {
                this.handlePaymentSuccess(response);
            },
            modal: {
                ondismiss: () => {
                    console.log('Payment cancelled');
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    }

    handlePaymentSuccess(response) {
        // Create new payment record
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        const newPayment = {
            id: 'PAY' + String(payments.length + 1).padStart(3, '0'),
            sender: 'Manual Collection',
            senderRole: 'admin',
            receiver: 'Admin',
            amount: 1000, // Amount from Razorpay
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            }),
            status: 'success',
            razorpayId: response.razorpay_payment_id,
            method: 'razorpay'
        };

        payments.push(newPayment);
        localStorage.setItem('paymentsData', JSON.stringify(payments));

        // Show success message
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);

        // Reload dashboard data
        this.loadDashboardData();
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

    formatDateTime(date, time) {
        const dateObj = new Date(date + ' ' + time);
        return dateObj.toLocaleDateString() + ' ' + time;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});

// Export for use in other modules
window.AdminDashboard = AdminDashboard;