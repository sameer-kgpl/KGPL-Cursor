// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// API base URL
const API_BASE = '';

// Utility functions
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    // Add new message
    const container = document.querySelector('.section.active') || document.querySelector('.auth-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showLoading(element) {
    element.innerHTML = '<div class="loading"></div>';
}

function hideLoading(element, originalText) {
    element.innerHTML = originalText;
}

// Authentication functions
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide forms
    document.querySelectorAll('.auth-form').forEach(form => form.style.display = 'none');
    document.getElementById(`${tabName}-form`).style.display = 'block';
}

// Login functionality
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            showMainApp();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, originalText);
    }
});

// Register functionality
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            // Switch to login tab
            showTab('login');
            document.getElementById('login-email').value = email;
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Registration failed. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, originalText);
    }
});

// Show main application
function showMainApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';
    
    // Update user info
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = currentUser.role;
    
    // Show/hide navigation based on role
    setupNavigation();
    
    // Load initial data
    loadInitialData();
}

// Setup navigation based on user role
function setupNavigation() {
    const navButtons = {
        'profile': document.getElementById('profile-nav'),
        'search': document.getElementById('search-nav'),
        'bulk-upload': document.getElementById('upload-nav'),
        'users': document.getElementById('users-nav')
    };
    
    // Hide all nav buttons first
    Object.values(navButtons).forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
    
    // Show buttons based on role
    if (currentUser.role === 'candidate') {
        navButtons.profile.style.display = 'inline-flex';
    } else if (currentUser.role === 'recruiter' || currentUser.role === 'admin') {
        navButtons.search.style.display = 'inline-flex';
        navButtons['bulk-upload'].style.display = 'inline-flex';
    }
    
    if (currentUser.role === 'admin') {
        navButtons.users.style.display = 'inline-flex';
    }
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load section-specific data
    loadSectionData(sectionName);
}

function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'profile':
            loadProfile();
            break;
        case 'search':
            // Search section is loaded when user clicks search
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// Load initial data
function loadInitialData() {
    // Load profile if user is candidate
    if (currentUser.role === 'candidate') {
        loadProfile();
    }
}

// Profile functions
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/api/candidate/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const profile = await response.json();
            populateProfileForm(profile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function populateProfileForm(profile) {
    if (profile) {
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('location').value = profile.location || '';
        document.getElementById('experience').value = profile.experience_years || '';
        document.getElementById('current-company').value = profile.current_company || '';
        document.getElementById('skills').value = profile.skills || '';
        document.getElementById('education').value = profile.education || '';
        document.getElementById('expected-salary').value = profile.expected_salary || '';
    }
}

// Profile form submission
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('phone', document.getElementById('phone').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('experience_years', document.getElementById('experience').value);
    formData.append('current_company', document.getElementById('current-company').value);
    formData.append('skills', document.getElementById('skills').value);
    formData.append('education', document.getElementById('education').value);
    formData.append('expected_salary', document.getElementById('expected-salary').value);
    
    const resumeFile = document.getElementById('resume').files[0];
    if (resumeFile) {
        formData.append('resume', resumeFile);
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/api/candidate/profile`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Profile updated successfully!', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to update profile. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, originalText);
    }
});

// Search functions
async function searchCandidates() {
    const keyword = document.getElementById('search-keyword').value;
    const location = document.getElementById('search-location').value;
    const experience = document.getElementById('search-experience').value;
    const skills = document.getElementById('search-skills').value;
    
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    if (experience) params.append('experience', experience);
    if (skills) params.append('skills', skills);
    
    try {
        const response = await fetch(`${API_BASE}/api/candidates/search?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const candidates = await response.json();
            displaySearchResults(candidates);
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Search failed. Please try again.', 'error');
    }
}

function displaySearchResults(candidates) {
    const resultsContainer = document.getElementById('search-results');
    
    if (candidates.length === 0) {
        resultsContainer.innerHTML = '<div class="message info">No candidates found matching your criteria.</div>';
        return;
    }
    
    resultsContainer.innerHTML = candidates.map(candidate => `
        <div class="candidate-card">
            <div class="candidate-header">
                <div>
                    <div class="candidate-name">${candidate.name}</div>
                    <div class="candidate-email">${candidate.email}</div>
                </div>
            </div>
            <div class="candidate-details">
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${candidate.phone || 'Not provided'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${candidate.location || 'Not provided'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Experience</div>
                    <div class="detail-value">${candidate.experience_years || 0} years</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Current Company</div>
                    <div class="detail-value">${candidate.current_company || 'Not provided'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Skills</div>
                    <div class="detail-value">${candidate.skills || 'Not provided'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Expected Salary</div>
                    <div class="detail-value">$${candidate.expected_salary || 'Not specified'}</div>
                </div>
            </div>
            <div class="candidate-actions">
                <button onclick="viewCandidateDetails(${candidate.user_id})" class="btn btn-primary">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${candidate.resume_path ? `<button onclick="downloadResume(${candidate.user_id})" class="btn btn-outline">
                    <i class="fas fa-download"></i> Download Resume
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

async function viewCandidateDetails(userId) {
    try {
        const response = await fetch(`${API_BASE}/api/candidates/${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const candidate = await response.json();
            showCandidateModal(candidate);
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to load candidate details.', 'error');
    }
}

function showCandidateModal(candidate) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = `Candidate Details - ${candidate.name}`;
    modalContent.innerHTML = `
        <div class="candidate-details">
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${candidate.email}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${candidate.phone || 'Not provided'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Location</div>
                <div class="detail-value">${candidate.location || 'Not provided'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Experience</div>
                <div class="detail-value">${candidate.experience_years || 0} years</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Current Company</div>
                <div class="detail-value">${candidate.current_company || 'Not provided'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Skills</div>
                <div class="detail-value">${candidate.skills || 'Not provided'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Education</div>
                <div class="detail-value">${candidate.education || 'Not provided'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Expected Salary</div>
                <div class="detail-value">$${candidate.expected_salary || 'Not specified'}</div>
            </div>
        </div>
        <div class="candidate-actions" style="margin-top: 20px;">
            ${candidate.resume_path ? `<button onclick="downloadResume(${candidate.user_id})" class="btn btn-primary">
                <i class="fas fa-download"></i> Download Resume
            </button>` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

async function downloadResume(userId) {
    try {
        const response = await fetch(`${API_BASE}/api/candidates/${userId}/resume`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resume_${userId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to download resume.', 'error');
    }
}

// Bulk upload functions
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('upload-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Please select a file to upload.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/api/candidates/bulk-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const resultDiv = document.getElementById('upload-result');
            resultDiv.innerHTML = `
                <div class="message success">
                    ${data.message}<br>
                    Successfully uploaded: ${data.successCount} candidates<br>
                    Failed uploads: ${data.errorCount} candidates
                </div>
            `;
            fileInput.value = '';
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Upload failed. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, originalText);
    }
});

// Users management functions (Admin only)
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to load users.', 'error');
    }
}

function displayUsers(users) {
    const usersContainer = document.getElementById('users-list');
    
    usersContainer.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info-details">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
            </div>
            <div class="user-status">
                <span class="status-badge ${user.email_verified ? 'verified' : 'unverified'}">
                    ${user.email_verified ? 'Verified' : 'Unverified'}
                </span>
                <span class="role-badge">${user.role}</span>
            </div>
        </div>
    `).join('');
}

// Modal functions
function showCreateRecruiterModal() {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = 'Create Recruiter Account';
    modalContent.innerHTML = `
        <form id="create-recruiter-form">
            <div class="form-group">
                <label for="recruiter-name">Full Name</label>
                <input type="text" id="recruiter-name" required>
            </div>
            <div class="form-group">
                <label for="recruiter-email">Email</label>
                <input type="email" id="recruiter-email" required>
            </div>
            <div class="form-group">
                <label for="recruiter-password">Password</label>
                <input type="password" id="recruiter-password" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Recruiter</button>
                <button type="button" onclick="closeModal()" class="btn btn-outline">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.add('active');
    
    // Add form submission handler
    document.getElementById('create-recruiter-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('recruiter-name').value;
        const email = document.getElementById('recruiter-email').value;
        const password = document.getElementById('recruiter-password').value;
        
        try {
            const response = await fetch(`${API_BASE}/api/auth/create-recruiter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage(data.message, 'success');
                closeModal();
                loadUsers(); // Refresh users list
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('Failed to create recruiter account.', 'error');
        }
    });
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    currentUser = null;
    authToken = null;
    
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'flex';
    
    // Clear forms
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
}

// Check if user is already logged in
if (authToken && localStorage.getItem('user')) {
    currentUser = JSON.parse(localStorage.getItem('user'));
    showMainApp();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Show login tab by default
    showTab('login');
});