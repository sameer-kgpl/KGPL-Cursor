// Main JavaScript for Recruitment Portal

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Add loading states to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="loading"></span> Processing...';
                submitBtn.disabled = true;
                
                // Re-enable after 10 seconds as fallback
                setTimeout(function() {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 10000);
            }
        });
    });

    // File upload drag and drop
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(function(input) {
        const container = input.closest('.card-body') || input.parentElement;
        
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            container.classList.add('dragover');
        });
        
        container.addEventListener('dragleave', function(e) {
            e.preventDefault();
            container.classList.remove('dragover');
        });
        
        container.addEventListener('drop', function(e) {
            e.preventDefault();
            container.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        });
        
        // Show file name when selected
        input.addEventListener('change', function() {
            const fileName = this.files[0]?.name;
            if (fileName) {
                let fileInfo = container.querySelector('.file-info');
                if (!fileInfo) {
                    fileInfo = document.createElement('div');
                    fileInfo.className = 'file-info mt-2 text-muted small';
                    input.parentElement.appendChild(fileInfo);
                }
                fileInfo.innerHTML = `<i class="fas fa-file"></i> Selected: ${fileName}`;
            }
        });
    });

    // Skills input enhancement
    const skillsInput = document.getElementById('skills');
    if (skillsInput) {
        skillsInput.addEventListener('input', function() {
            const skills = this.value.split(',').map(s => s.trim()).filter(s => s);
            
            // Create preview if doesn't exist
            let preview = document.getElementById('skills-preview');
            if (!preview) {
                preview = document.createElement('div');
                preview.id = 'skills-preview';
                preview.className = 'mt-2';
                skillsInput.parentElement.appendChild(preview);
            }
            
            // Update preview
            preview.innerHTML = skills.map(skill => 
                `<span class="badge bg-primary me-1 mb-1">${skill}</span>`
            ).join('');
        });
        
        // Trigger initial preview
        skillsInput.dispatchEvent(new Event('input'));
    }

    // Search form enhancements
    const searchForm = document.querySelector('form[action*="search"]');
    if (searchForm) {
        const inputs = searchForm.querySelectorAll('input, select');
        inputs.forEach(function(input) {
            input.addEventListener('change', function() {
                // Auto-submit on filter change (with debounce)
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(function() {
                    if (input.value || document.querySelector('input[name="q"]').value) {
                        // Only auto-submit if there's some filter value
                        // searchForm.submit();
                    }
                }, 500);
            });
        });
    }

    // Table enhancements
    const tables = document.querySelectorAll('.table');
    tables.forEach(function(table) {
        // Add hover effects to table rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row) {
            row.addEventListener('click', function(e) {
                // If clicking on a link or button, don't trigger row click
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a, button')) {
                    return;
                }
                
                // Find view link in the row and navigate
                const viewLink = row.querySelector('a[href*="/candidate/"]');
                if (viewLink) {
                    window.location.href = viewLink.href;
                }
            });
            
            // Add cursor pointer to clickable rows
            if (row.querySelector('a[href*="/candidate/"]')) {
                row.style.cursor = 'pointer';
            }
        });
    });

    // Profile completeness animation
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(function(bar) {
        const width = bar.style.width || bar.getAttribute('style')?.match(/width:\s*(\d+)%/)?.[1];
        if (width) {
            bar.style.width = '0%';
            setTimeout(function() {
                bar.style.transition = 'width 1s ease-in-out';
                bar.style.width = width + '%';
            }, 100);
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(function(card) {
        observer.observe(card);
    });

    // Copy to clipboard functionality
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'position-fixed top-0 end-0 m-3 alert alert-success';
            toast.innerHTML = '<i class="fas fa-check"></i> Copied to clipboard!';
            document.body.appendChild(toast);
            
            setTimeout(function() {
                toast.remove();
            }, 2000);
        });
    }

    // Add copy functionality to email addresses
    document.querySelectorAll('a[href^="mailto:"]').forEach(function(link) {
        link.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            const email = this.href.replace('mailto:', '');
            copyToClipboard(email);
        });
    });

    // Form validation enhancements
    const forms_validation = document.querySelectorAll('form');
    forms_validation.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(function(field) {
                if (!field.value.trim()) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Scroll to first invalid field
                const firstInvalid = form.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus();
                }
            }
        });
        
        // Remove invalid class on input
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            input.addEventListener('input', function() {
                this.classList.remove('is-invalid');
            });
        });
    });
});

// Utility functions
window.RecruitmentPortal = {
    // Format phone numbers
    formatPhone: function(phone) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },
    
    // Validate email
    isValidEmail: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // Show loading state
    showLoading: function(element) {
        const original = element.innerHTML;
        element.innerHTML = '<span class="loading"></span> Loading...';
        element.disabled = true;
        return function() {
            element.innerHTML = original;
            element.disabled = false;
        };
    },
    
    // Show toast message
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `position-fixed top-0 end-0 m-3 alert alert-${type} alert-dismissible fade show`;
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(toast);
        
        setTimeout(function() {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
};