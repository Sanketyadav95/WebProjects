// Users JavaScript - User management functionality
class UsersManager {
    constructor() {
        this.currentTab = 'users';
        this.editingUserId = null;
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
        
        // Load users data
        this.loadUsers();
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

        // Add user button
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.openUserModal();
        });

        // User form submission
        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        // Role change handler
        document.getElementById('userRole').addEventListener('change', () => {
            this.toggleAssignmentField();
        });

        // Modal close functionality
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Cancel buttons
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModals();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const userModal = document.getElementById('userModal');
            const assignModal = document.getElementById('assignModal');
            if (event.target === userModal) {
                userModal.style.display = 'none';
            }
            if (event.target === assignModal) {
                assignModal.style.display = 'none';
            }
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
        this.loadUsers();
    }

    loadUsers() {
        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        
        switch(this.currentTab) {
            case 'users':
                this.loadUsersTable(users.filter(user => user.role === 'user'));
                break;
            case 'seniors':
                this.loadSeniorsTable(users.filter(user => user.role === 'senior'));
                break;
            case 'leaders':
                this.loadLeadersTable(users.filter(user => user.role === 'leader'));
                break;
        }
    }

    loadUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 40px; color: #666;">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.assignedTo || 'Not Assigned'}</td>
                <td>${this.formatDate(user.joinDate)}</td>
                <td><span class="status-badge status-${user.status === 'active' ? 'success' : 'pending'}">${user.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="usersManager.editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="usersManager.deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadSeniorsTable(seniors) {
        const tbody = document.getElementById('seniorsTableBody');
        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        
        if (seniors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 40px; color: #666;">
                        No seniors found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = seniors.map(senior => {
            const assignedUsers = users.filter(user => user.assignedTo === senior.name).length;
            return `
                <tr>
                    <td>${senior.id}</td>
                    <td>${senior.name}</td>
                    <td>${senior.email}</td>
                    <td>${senior.phone}</td>
                    <td>
                        <span class="badge">${assignedUsers} users</span>
                        <button class="btn btn-secondary btn-sm" onclick="usersManager.assignUsers('${senior.id}')">
                            <i class="fas fa-users"></i>
                        </button>
                    </td>
                    <td>${this.formatDate(senior.joinDate)}</td>
                    <td><span class="status-badge status-${senior.status === 'active' ? 'success' : 'pending'}">${senior.status}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="usersManager.editUser('${senior.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="usersManager.deleteUser('${senior.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadLeadersTable(leaders) {
        const tbody = document.getElementById('leadersTableBody');
        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        
        if (leaders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 40px; color: #666;">
                        No leaders found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = leaders.map(leader => {
            const teamSize = users.filter(user => user.assignedTo === leader.name).length;
            return `
                <tr>
                    <td>${leader.id}</td>
                    <td>${leader.name}</td>
                    <td>${leader.email}</td>
                    <td>${leader.phone}</td>
                    <td>
                        <span class="badge">${teamSize} members</span>
                        <button class="btn btn-secondary btn-sm" onclick="usersManager.assignUsers('${leader.id}')">
                            <i class="fas fa-users"></i>
                        </button>
                    </td>
                    <td>${this.formatDate(leader.joinDate)}</td>
                    <td><span class="status-badge status-${leader.status === 'active' ? 'success' : 'pending'}">${leader.status}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="usersManager.editUser('${leader.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="usersManager.deleteUser('${leader.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openUserModal(userId = null) {
        this.editingUserId = userId;
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        
        if (userId) {
            // Edit mode
            title.textContent = 'Edit User';
            const users = JSON.parse(localStorage.getItem('usersData') || '[]');
            const user = users.find(u => u.id === userId);
            
            if (user) {
                document.getElementById('userId').value = user.id;
                document.getElementById('userName').value = user.name;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userPhone').value = user.phone;
                document.getElementById('userRole').value = user.role;
                document.getElementById('userStatus').value = user.status;
                document.getElementById('assignTo').value = user.assignedTo || '';
                this.toggleAssignmentField();
            }
        } else {
            // Add mode
            title.textContent = 'Add New User';
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            this.toggleAssignmentField();
        }

        this.populateAssignmentOptions();
        modal.style.display = 'block';
    }

    toggleAssignmentField() {
        const role = document.getElementById('userRole').value;
        const assignToGroup = document.getElementById('assignToGroup');
        
        if (role === 'user') {
            assignToGroup.style.display = 'block';
        } else {
            assignToGroup.style.display = 'none';
        }
    }

    populateAssignmentOptions() {
        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        const assignToSelect = document.getElementById('assignTo');
        
        // Clear existing options except the first one
        assignToSelect.innerHTML = '<option value="">Select Leader/Senior</option>';
        
        // Add seniors and leaders as options
        users.filter(user => ['senior', 'leader'].includes(user.role))
             .forEach(user => {
                 const option = document.createElement('option');
                 option.value = user.name;
                 option.textContent = `${user.name} (${user.role})`;
                 assignToSelect.appendChild(option);
             });
    }

    saveUser() {
        const formData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            phone: document.getElementById('userPhone').value,
            role: document.getElementById('userRole').value,
            status: document.getElementById('userStatus').value,
            assignedTo: document.getElementById('assignTo').value || ''
        };

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.role) {
            alert('Please fill in all required fields');
            return;
        }

        const users = JSON.parse(localStorage.getItem('usersData') || '[]');

        if (this.editingUserId) {
            // Update existing user
            const userIndex = users.findIndex(u => u.id === this.editingUserId);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...formData };
            }
        } else {
            // Add new user
            const newUser = {
                id: 'USR' + String(users.length + 1).padStart(3, '0'),
                ...formData,
                joinDate: new Date().toISOString().split('T')[0]
            };
            users.push(newUser);
        }

        localStorage.setItem('usersData', JSON.stringify(users));
        this.closeModals();
        this.loadUsers();
        
        alert(this.editingUserId ? 'User updated successfully' : 'User added successfully');
    }

    editUser(userId) {
        this.openUserModal(userId);
    }

    deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        const updatedUsers = users.filter(u => u.id !== userId);
        
        localStorage.setItem('usersData', JSON.stringify(updatedUsers));
        this.loadUsers();
        
        alert('User deleted successfully');
    }

    assignUsers(userId) {
        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        const assignee = users.find(u => u.id === userId);
        
        if (!assignee) {
            alert('User not found');
            return;
        }

        const assignableUsers = users.filter(u => u.role === 'user');
        const currentlyAssigned = users.filter(u => u.assignedTo === assignee.name);

        const content = `
            <h4>Assign Users to ${assignee.name}</h4>
            <div class="form-group">
                <label class="form-label">Available Users:</label>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
                    ${assignableUsers.map(user => `
                        <div class="form-check">
                            <input type="checkbox" id="assign_${user.id}" value="${user.id}" 
                                   ${user.assignedTo === assignee.name ? 'checked' : ''}>
                            <label for="assign_${user.id}">${user.name} (${user.email})</label>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="flex gap-10 justify-between">
                <button class="btn btn-secondary" onclick="usersManager.closeModals()">Cancel</button>
                <button class="btn btn-primary" onclick="usersManager.saveAssignments('${assignee.name}')">Save Assignments</button>
            </div>
        `;

        document.getElementById('assignContent').innerHTML = content;
        document.getElementById('assignModal').style.display = 'block';
    }

    saveAssignments(assigneeName) {
        const users = JSON.parse(localStorage.getItem('usersData') || '[]');
        const checkboxes = document.querySelectorAll('#assignContent input[type="checkbox"]');
        
        // First, remove all assignments to this assignee
        users.forEach(user => {
            if (user.assignedTo === assigneeName) {
                user.assignedTo = '';
            }
        });

        // Then, assign selected users
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const userId = checkbox.value;
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.assignedTo = assigneeName;
                }
            }
        });

        localStorage.setItem('usersData', JSON.stringify(users));
        this.closeModals();
        this.loadUsers();
        
        alert('Assignments updated successfully');
    }

    closeModals() {
        document.getElementById('userModal').style.display = 'none';
        document.getElementById('assignModal').style.display = 'none';
        this.editingUserId = null;
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
    window.usersManager = new UsersManager();
});