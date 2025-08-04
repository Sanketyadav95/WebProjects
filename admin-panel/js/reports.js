// Reports JavaScript - Reports and analytics functionality
class ReportsManager {
    constructor() {
        this.charts = {};
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
        this.generateReport();
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

        // Generate report button
        document.getElementById('generateReport').addEventListener('click', () => {
            this.generateReport();
        });

        // Report period change
        document.getElementById('reportPeriod').addEventListener('change', () => {
            this.setDateRange();
        });

        // Export buttons
        document.getElementById('exportReportCSV').addEventListener('click', () => {
            this.exportReportCSV();
        });

        document.getElementById('exportReportPDF').addEventListener('click', () => {
            this.exportReportPDF();
        });

        document.getElementById('exportReportExcel').addEventListener('click', () => {
            this.exportReportExcel();
        });

        document.getElementById('printReport').addEventListener('click', () => {
            this.printReport();
        });

        // Set initial date range
        this.setDateRange();
    }

    setDateRange() {
        const period = parseInt(document.getElementById('reportPeriod').value);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - period);

        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    }

    generateReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        const payments = this.getFilteredPayments(startDate, endDate);
        
        // Update summary cards
        this.updateSummaryCards(payments);
        
        // Generate charts
        this.generateCharts(payments);
        
        // Load detailed report table
        this.loadDetailedReport(payments);
    }

    getFilteredPayments(startDate, endDate) {
        const payments = JSON.parse(localStorage.getItem('paymentsData') || '[]');
        
        return payments.filter(payment => {
            const paymentDate = new Date(payment.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return paymentDate >= start && paymentDate <= end;
        });
    }

    updateSummaryCards(payments) {
        const totalRevenue = payments
            .filter(p => p.status === 'success')
            .reduce((sum, payment) => sum + payment.amount, 0);
        
        const avgPayment = payments.length > 0 ? totalRevenue / payments.length : 0;
        
        const successfulPayments = payments.filter(p => p.status === 'success').length;
        const successRate = payments.length > 0 ? (successfulPayments / payments.length) * 100 : 0;
        
        // Calculate growth rate (simplified - comparing with previous period)
        const growthRate = this.calculateGrowthRate(payments);

        document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
        document.getElementById('avgPayment').textContent = `₹${Math.round(avgPayment).toLocaleString()}`;
        document.getElementById('successRate').textContent = `${Math.round(successRate)}%`;
        document.getElementById('growthRate').textContent = `${growthRate >= 0 ? '+' : ''}${Math.round(growthRate)}%`;
    }

    calculateGrowthRate(currentPeriodPayments) {
        // Simplified growth calculation
        const currentTotal = currentPeriodPayments
            .filter(p => p.status === 'success')
            .reduce((sum, payment) => sum + payment.amount, 0);
        
        // For demo purposes, return a random growth rate
        return Math.random() * 20 - 10; // Random between -10% and +10%
    }

    generateCharts(payments) {
        this.generateRoleChart(payments);
        this.generateTrendChart(payments);
        this.generateStatusChart(payments);
        this.generatePerformersChart(payments);
    }

    generateRoleChart(payments) {
        const ctx = document.getElementById('roleChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.roleChart) {
            this.charts.roleChart.destroy();
        }

        const roleData = this.aggregateByRole(payments);

        this.charts.roleChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(roleData),
                datasets: [{
                    data: Object.values(roleData),
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe',
                        '#00f2fe'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generateTrendChart(payments) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.trendChart) {
            this.charts.trendChart.destroy();
        }

        const trendData = this.aggregateByMonth(payments);

        this.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(trendData),
                datasets: [{
                    label: 'Payment Amount (₹)',
                    data: Object.values(trendData),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    generateStatusChart(payments) {
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }

        const statusData = this.aggregateByStatus(payments);

        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    data: Object.values(statusData),
                    backgroundColor: [
                        '#43e97b',
                        '#ffecd2',
                        '#fa709a'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generatePerformersChart(payments) {
        const ctx = document.getElementById('performersChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.performersChart) {
            this.charts.performersChart.destroy();
        }

        const performersData = this.getTopPerformers(payments);

        this.charts.performersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: performersData.labels,
                datasets: [{
                    label: 'Payment Amount (₹)',
                    data: performersData.data,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    aggregateByRole(payments) {
        const roleData = {};
        
        payments.forEach(payment => {
            const role = payment.senderRole || 'unknown';
            roleData[role] = (roleData[role] || 0) + payment.amount;
        });
        
        return roleData;
    }

    aggregateByMonth(payments) {
        const monthData = {};
        
        payments.forEach(payment => {
            const date = new Date(payment.date);
            const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthData[monthKey] = (monthData[monthKey] || 0) + payment.amount;
        });
        
        return monthData;
    }

    aggregateByStatus(payments) {
        const statusData = {};
        
        payments.forEach(payment => {
            const status = payment.status;
            statusData[status] = (statusData[status] || 0) + 1;
        });
        
        return statusData;
    }

    getTopPerformers(payments) {
        const performersData = {};
        
        payments.forEach(payment => {
            const sender = payment.sender;
            performersData[sender] = (performersData[sender] || 0) + payment.amount;
        });
        
        // Sort and get top 5
        const sorted = Object.entries(performersData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        return {
            labels: sorted.map(([name]) => name),
            data: sorted.map(([, amount]) => amount)
        };
    }

    loadDetailedReport(payments) {
        const tbody = document.getElementById('detailedReportTable');
        
        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 40px; color: #666;">
                        No payments found for the selected period
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${this.formatDate(payment.date)}</td>
                <td>${payment.sender}</td>
                <td>${payment.senderRole || 'N/A'}</td>
                <td>₹${payment.amount.toLocaleString()}</td>
                <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                <td>${payment.method}</td>
            </tr>
        `).join('');
    }

    exportReportCSV() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const payments = this.getFilteredPayments(startDate, endDate);

        const csvContent = [
            ['Date', 'User', 'Role', 'Amount', 'Status', 'Payment Method'],
            ...payments.map(payment => [
                payment.date,
                payment.sender,
                payment.senderRole || 'N/A',
                payment.amount,
                payment.status,
                payment.method
            ])
        ].map(row => row.join(',')).join('\n');

        this.downloadFile(csvContent, `payment-report-${startDate}-to-${endDate}.csv`, 'text/csv');
    }

    exportReportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const payments = this.getFilteredPayments(startDate, endDate);

        // Header
        doc.setFontSize(18);
        doc.text('Payment Report', 20, 20);
        doc.setFontSize(12);
        doc.text(`Period: ${startDate} to ${endDate}`, 20, 30);

        // Summary
        const totalRevenue = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
        doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 20, 45);
        doc.text(`Total Transactions: ${payments.length}`, 20, 55);

        // Detailed data
        let yPosition = 75;
        doc.setFontSize(10);
        
        payments.forEach(payment => {
            if (yPosition > 280) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(`${payment.date} | ${payment.sender} | ₹${payment.amount} | ${payment.status}`, 20, yPosition);
            yPosition += 8;
        });

        doc.save(`payment-report-${startDate}-to-${endDate}.pdf`);
    }

    exportReportExcel() {
        // For simplicity, export as CSV with .xlsx extension
        this.exportReportCSV();
    }

    printReport() {
        window.print();
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
    window.reportsManager = new ReportsManager();
});