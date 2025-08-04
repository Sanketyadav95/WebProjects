// Settings JavaScript - Admin settings and preferences functionality
class SettingsManager {
    constructor() {
        this.currentTab = 'profile';
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
        
        // Load saved settings
        this.loadSettings();
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

        // Form submissions
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        document.getElementById('notificationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationSettings();
        });

        document.getElementById('systemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystemSettings();
        });

        // Profile picture change
        document.getElementById('profilePicture').addEventListener('change', (e) => {
            this.handleProfilePictureChange(e);
        });

        // Two-factor authentication
        document.getElementById('enable2FA').addEventListener('click', () => {
            this.toggle2FA();
        });

        // Data management buttons
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('backupData').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearAllData();
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
    }

    loadSettings() {
        // Load profile settings
        const profileSettings = JSON.parse(localStorage.getItem('profileSettings') || '{}');
        document.getElementById('fullName').value = profileSettings.fullName || 'Admin User';
        document.getElementById('email').value = profileSettings.email || localStorage.getItem('userEmail') || 'admin@demo.com';
        document.getElementById('phone').value = profileSettings.phone || '+91 9876543210';
        document.getElementById('department').value = profileSettings.department || 'Administration';

        // Load notification settings
        const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
        document.getElementById('paymentNotifications').checked = notificationSettings.paymentNotifications !== false;
        document.getElementById('userNotifications').checked = notificationSettings.userNotifications !== false;
        document.getElementById('requestNotifications').checked = notificationSettings.requestNotifications !== false;
        document.getElementById('dailyReports').checked = notificationSettings.dailyReports || false;

        // Load system settings
        const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
        document.getElementById('timezone').value = systemSettings.timezone || 'Asia/Kolkata';
        document.getElementById('currency').value = systemSettings.currency || 'INR';
        document.getElementById('dateFormat').value = systemSettings.dateFormat || 'DD/MM/YYYY';
        document.getElementById('recordsPerPage').value = systemSettings.recordsPerPage || '25';

        // Load 2FA status
        const twoFactorEnabled = localStorage.getItem('twoFactorEnabled') === 'true';
        const statusElement = document.getElementById('twoFactorStatus');
        const button = document.getElementById('enable2FA');
        
        if (twoFactorEnabled) {
            statusElement.textContent = 'Enabled';
            statusElement.className = 'status-badge status-success';
            button.textContent = 'Disable 2FA';
            button.className = 'btn btn-danger';
        } else {
            statusElement.textContent = 'Disabled';
            statusElement.className = 'status-badge status-pending';
            button.textContent = 'Enable 2FA';
            button.className = 'btn btn-success';
        }
    }

    saveProfile() {
        const profileData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            department: document.getElementById('department').value
        };

        // Validation
        if (!profileData.fullName || !profileData.email || !profileData.phone) {
            alert('Please fill in all required fields');
            return;
        }

        localStorage.setItem('profileSettings', JSON.stringify(profileData));
        alert('Profile updated successfully');
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (currentPassword !== 'admin123') {
            alert('Current password is incorrect');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        // In a real application, you would hash the password
        localStorage.setItem('adminPassword', newPassword);
        document.getElementById('passwordForm').reset();
        alert('Password changed successfully');
    }

    saveNotificationSettings() {
        const notificationData = {
            paymentNotifications: document.getElementById('paymentNotifications').checked,
            userNotifications: document.getElementById('userNotifications').checked,
            requestNotifications: document.getElementById('requestNotifications').checked,
            dailyReports: document.getElementById('dailyReports').checked
        };

        localStorage.setItem('notificationSettings', JSON.stringify(notificationData));
        alert('Notification preferences saved successfully');
    }

    saveSystemSettings() {
        const systemData = {
            timezone: document.getElementById('timezone').value,
            currency: document.getElementById('currency').value,
            dateFormat: document.getElementById('dateFormat').value,
            recordsPerPage: document.getElementById('recordsPerPage').value
        };

        localStorage.setItem('systemSettings', JSON.stringify(systemData));
        alert('System settings saved successfully');
    }

    handleProfilePictureChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size should be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // In a real application, you would upload this to a server
            localStorage.setItem('profilePicture', e.target.result);
            alert('Profile picture updated successfully');
        };
        reader.readAsDataURL(file);
    }

    toggle2FA() {
        const currentStatus = localStorage.getItem('twoFactorEnabled') === 'true';
        
        if (currentStatus) {
            if (confirm('Are you sure you want to disable two-factor authentication?')) {
                localStorage.setItem('twoFactorEnabled', 'false');
                this.loadSettings();
                alert('Two-factor authentication disabled');
            }
        } else {
            // In a real application, you would integrate with an authenticator app
            const code = prompt('Enter the 6-digit verification code from your authenticator app:');
            if (code && code.length === 6) {
                localStorage.setItem('twoFactorEnabled', 'true');
                this.loadSettings();
                alert('Two-factor authentication enabled successfully');
            } else {
                alert('Invalid verification code');
            }
        }
    }

    exportAllData() {
        if (!confirm('This will export all system data. Continue?')) {
            return;
        }

        const allData = {
            paymentsData: JSON.parse(localStorage.getItem('paymentsData') || '[]'),
            usersData: JSON.parse(localStorage.getItem('usersData') || '[]'),
            deletionRequests: JSON.parse(localStorage.getItem('deletionRequests') || '[]'),
            profileSettings: JSON.parse(localStorage.getItem('profileSettings') || '{}'),
            notificationSettings: JSON.parse(localStorage.getItem('notificationSettings') || '{}'),
            systemSettings: JSON.parse(localStorage.getItem('systemSettings') || '{}'),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-panel-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        alert('Data exported successfully');
    }

    createBackup() {
        if (!confirm('This will create a backup of all current data. Continue?')) {
            return;
        }

        const backupData = {
            paymentsData: localStorage.getItem('paymentsData'),
            usersData: localStorage.getItem('usersData'),
            deletionRequests: localStorage.getItem('deletionRequests'),
            profileSettings: localStorage.getItem('profileSettings'),
            notificationSettings: localStorage.getItem('notificationSettings'),
            systemSettings: localStorage.getItem('systemSettings'),
            backupDate: new Date().toISOString()
        };

        localStorage.setItem('systemBackup', JSON.stringify(backupData));
        alert('Backup created successfully');
    }

    clearAllData() {
        const confirmation = prompt('This will permanently delete ALL data. Type "DELETE ALL DATA" to confirm:');
        
        if (confirmation !== 'DELETE ALL DATA') {
            alert('Data clearing cancelled');
            return;
        }

        // Keep login and basic settings, clear operational data
        localStorage.removeItem('paymentsData');
        localStorage.removeItem('usersData');
        localStorage.removeItem('deletionRequests');
        
        // Reinitialize with empty data
        localStorage.setItem('paymentsData', '[]');
        localStorage.setItem('usersData', '[]');
        localStorage.setItem('deletionRequests', '[]');

        alert('All operational data has been cleared');
        
        // Redirect to dashboard to refresh the interface
        window.location.href = 'dashboard.html';
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
    window.settingsManager = new SettingsManager();
});