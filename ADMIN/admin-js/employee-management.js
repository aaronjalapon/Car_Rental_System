document.addEventListener('DOMContentLoaded', function() {
    // Remove or comment out the employee authentication check temporarily
    /*
    const employeeData = JSON.parse(localStorage.getItem('employeeData'));
    if (!employeeData || !employeeData.id) {
        window.location.href = '../../MAIN/main-html/login.html';
        return;
    }
    */

    // Initialize page
    initializePage();
});

function initializePage() {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const addBtn = document.querySelector('.add-btn');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');

    // Open modal
    addBtn.addEventListener('click', function() {
        console.log('Opening modal'); // Debug line
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
        document.querySelector('.modal-title').textContent = 'Add New Employee';
    });

    // Close modal handlers
    function closeModal() {
        console.log('Closing modal'); // Debug line
        modal.classList.remove('show');
        // Remove any existing error messages
        const errorMessages = modal.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
        
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);

    cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Stop propagation on modal content
    modal.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    let currentPage = 1;
    let itemsPerPage = 10;
    
    // Function to load employees
    async function loadEmployees(page = 1, search = '') {
        try {
            const response = await fetch(`../admin-php/fetch-employees.php?search=${encodeURIComponent(search)}`);
            const data = await response.json();
            
            if (data.success) {
                renderEmployees(data.data.employees);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            alert('Failed to load employees');
        }
    }

    // Function to render employees
    function renderEmployees(employees) {
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '';
        
        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.id}</td>
                <td>${employee.name}</td>
                <td>${employee.position}</td>
                <td>${employee.email}</td>
                <td>${employee.phone}</td>
                <td><span class="status ${employee.status.toLowerCase()}">${employee.status}</span></td>
                <td class="actions">
                    <button onclick="viewEmployee(${employee.id})" class="view-btn"><i class="fas fa-eye"></i></button>
                    <button onclick="editEmployee(${employee.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteEmployee(${employee.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // View employee details
    window.viewEmployee = async function(employeeId) {
        try {
            const response = await fetch(`../admin-php/employee-management-view.php?id=${employeeId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            if (data.success) {
                const employee = data.employee;
                // Update the view modal content
                document.getElementById('viewEmpId').textContent = employee.id;
                document.getElementById('viewEmpName').textContent = employee.name;
                document.getElementById('viewEmpPosition').textContent = employee.position;
                document.getElementById('viewEmpEmail').textContent = employee.email;
                document.getElementById('viewEmpPhone').textContent = employee.phone;
                document.getElementById('viewEmpStatus').textContent = employee.status;

                // Show the view modal
                const viewEmployeeModal = document.getElementById('viewEmployeeModal');
                viewEmployeeModal.style.display = 'block';
                setTimeout(() => viewEmployeeModal.classList.add('show'), 10);
            } else {
                throw new Error(data.message || 'Failed to load employee details');
            }
        } catch (error) {
            console.error('Error viewing employee:', error);
            alert('Failed to load employee details');
        }
    };

    // Edit employee
    window.editEmployee = async function(employeeId) {
        try {
            const response = await fetch(`../admin-php/employee-management-view.php?id=${employeeId}`);
            const data = await response.json();
            
            if (data.success) {
                const employee = data.employee;
                document.querySelector('.modal-title').textContent = 'Edit Employee';
                // Populate form with employee data
                document.getElementById('empId').value = employee.id;
                document.getElementById('empName').value = employee.name;
                document.getElementById('empPosition').value = employee.position;
                document.getElementById('empEmail').value = employee.email;
                document.getElementById('empPhone').value = employee.phone;
                document.getElementById('empStatus').value = employee.status;
                
                modal.style.display = 'block';
                setTimeout(() => modal.classList.add('show'), 10);
            }
        } catch (error) {
            console.error('Error editing employee:', error);
            alert('Failed to load employee details');
        }
    };

    // Delete employee
    window.deleteEmployee = async function(employeeId) {
        if (confirm('Are you sure you want to delete this employee?')) {
            try {
                const response = await fetch('../admin-php/employee-management-delete.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ employeeId: employeeId })
                });
                
                const data = await response.json();
                if (data.success) {
                    alert('Employee deleted successfully');
                    loadEmployees(currentPage);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
                alert('Failed to delete employee');
            }
        }
    };

    // Update the form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        try {
            const formData = new FormData(this);
            const employeeId = formData.get('id');
            const requiredFields = ['name', 'position', 'email', 'phone', 'status'];
            
            // Add password to required fields for new employees
            if (!employeeId) {
                requiredFields.push('password');
            }

            const missingFields = [];

            // Check for missing fields
            requiredFields.forEach(field => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
                }
            });

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Email validation
            const email = formData.get('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Phone validation
            const phone = formData.get('phone');
            const phoneRegex = /^\d{11}$/;
            if (!phoneRegex.test(phone)) {
                throw new Error('Phone number must be 11 digits');
            }

            // Password validation
            const password = formData.get('password');
            if (!employeeId && (!password || password.length < 6)) {
                // New employee - password required
                throw new Error('Password must be at least 6 characters long');
            } else if (employeeId && password && password.length > 0 && password.length < 6) {
                // Existing employee - validate only if password is provided
                throw new Error('Password must be at least 6 characters long or left empty');
            }

            const response = await fetch('../admin-php/employee-management-edit.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error occurred');
            }

            const data = await response.json();
            
            if (data.success) {
                showNotification('Success', 'Employee updated successfully', 'success');
                modal.style.display = 'none';
                form.reset();
                await loadEmployees();
            } else {
                throw new Error(data.message || 'Failed to update employee');
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            showFormError(error.message, this);
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            loadEmployees(1, searchTerm);
        }, 300); // Reduced timeout to 300ms for better responsiveness
    });

    // Clear search
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            loadEmployees(1, '');
        }
    });

    // Initial load
    loadEmployees();
}

// Add these functions to your existing JavaScript file

// View employee modal functionality
const viewEmployeeModal = document.getElementById('viewEmployeeModal');
const viewModalClose = viewEmployeeModal.querySelector('.close');
const closeButton = viewEmployeeModal.querySelector('.close-btn');

// Function to view employee details
async function viewEmployee(id) {
    try {
        const response = await fetch(`../admin-php/get-employee.php?id=${id}`);
        const data = await response.json();

        if (data.success) {
            const employee = data.data;
            document.getElementById('viewEmpId').textContent = employee.id;
            document.getElementById('viewEmpName').textContent = employee.name;
            document.getElementById('viewEmpPosition').textContent = employee.position;
            document.getElementById('viewEmpEmail').textContent = employee.email;
            document.getElementById('viewEmpPhone').textContent = employee.phone;
            document.getElementById('viewEmpStatus').textContent = employee.status;

            viewEmployeeModal.style.display = 'block';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load employee details');
    }
}

// Close modal events
viewModalClose.onclick = () => viewEmployeeModal.style.display = 'none';
closeButton.onclick = () => viewEmployeeModal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === viewEmployeeModal) {
        viewEmployeeModal.style.display = 'none';
    }
};

// Modify your existing table row creation to add the view button
function createEmployeeRow(employee) {
    // ...existing row creation code...
    const viewBtn = document.createElement('button');
    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
    viewBtn.className = 'view-btn';
    viewBtn.onclick = () => viewEmployee(employee.id);
    actionsCell.appendChild(viewBtn);
    // ...rest of your row creation code...
}

// Add these new functions to your existing JavaScript file

const addEmployeeModal = document.getElementById('addEmployeeModal');
const addEmployeeForm = document.getElementById('addEmployeeForm');
const addBtn = document.querySelector('.add-btn');

// Show add employee modal
addBtn.onclick = function() {
    addEmployeeModal.style.display = 'block';
};

// Close modal when clicking the X or cancel button
addEmployeeModal.querySelector('.close').onclick = function() {
    addEmployeeModal.style.display = 'none';
};

addEmployeeModal.querySelector('.cancel-btn').onclick = function() {
    addEmployeeModal.style.display = 'none';
};

// Update the add employee form submission handler
addEmployeeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        // Validate form data before submission
        const formData = new FormData(this);
        const requiredFields = ['name', 'position', 'email', 'phone', 'password', 'status'];
        const missingFields = [];

        requiredFields.forEach(field => {
            if (!formData.get(field)) {
                missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
            }
        });

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const response = await fetch('../admin-php/employee-management-add.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Success', data.message, 'success');
            addEmployeeModal.style.display = 'none';
            addEmployeeForm.reset();
            await loadEmployees(); // Refresh the employee list
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Add Employee Error:', error);
        showNotification('Error', error.message, 'error');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === addEmployeeModal) {
        addEmployeeModal.style.display = 'none';
    }
};

// Add a notification function for better user feedback
function showNotification(title, message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    notificationDiv.innerHTML = `
        <strong>${title}:</strong> ${message}
        <span class="close-notification">&times;</span>
    `;
    
    document.body.appendChild(notificationDiv);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notificationDiv.remove();
    }, 5000);

    // Allow manual close
    notificationDiv.querySelector('.close-notification').onclick = () => {
        notificationDiv.remove();
    };
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        min-width: 300px;
        max-width: 600px;
        animation: slideIn 0.5s ease;
    }

    .notification.success {
        background-color: #4CAF50;
        color: white;
    }

    .notification.error {
        background-color: #f44336;
        color: white;
    }

    .notification.info {
        background-color: #2196F3;
        color: white;
    }

    .close-notification {
        float: right;
        cursor: pointer;
        margin-left: 10px;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Add this helper function to show form-specific errors
function showFormError(message) {
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        color: #f44336;
        margin-bottom: 15px;
        padding: 10px;
        background-color: rgba(244, 67, 54, 0.1);
        border-radius: 4px;
        font-size: 14px;
    `;
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
}

// Add this function to show form errors
function showFormError(message, formElement) {
    const existingError = formElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formElement.insertBefore(errorDiv, formElement.firstChild);
}

// Update the function that populates the form with employee data
function populateForm(employee) {
    const form = document.getElementById('employeeForm');
    const passwordField = document.getElementById('empPassword');
    
    // Reset form and clear any error messages
    form.reset();
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    // Populate form fields
    document.getElementById('empId').value = employee.id;
    document.getElementById('empName').value = employee.name;
    document.getElementById('empPosition').value = employee.position;
    document.getElementById('empEmail').value = employee.email;
    document.getElementById('empPhone').value = employee.phone;
    document.getElementById('empStatus').value = employee.status;
    
    // Handle password field
    if (employee.id) {
        // Editing existing employee
        passwordField.required = false;
        passwordField.value = '';
        passwordField.placeholder = 'Leave empty to keep current password';
    } else {
        // New employee
        passwordField.required = true;
        passwordField.value = '';
        passwordField.placeholder = 'Enter password (minimum 6 characters)';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const employeeModal = document.getElementById('employeeModal');
    const addEmployeeModal = document.getElementById('addEmployeeModal');
    const employeeForm = document.getElementById('employeeForm');
    const addEmployeeForm = document.getElementById('addEmployeeForm');

    // Add Employee Form Handler
    addEmployeeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Add Employee Form submitted');
        
        try {
            const formData = new FormData(this);
            const requiredFields = ['name', 'position', 'email', 'phone', 'password', 'status'];
            const missingFields = [];

            requiredFields.forEach(field => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
                }
            });

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate password
            const password = formData.get('password');
            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const response = await fetch('../admin-php/employee-management-add.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                showNotification('Success', 'Employee added successfully', 'success');
                addEmployeeModal.style.display = 'none';
                addEmployeeForm.reset();
                await loadEmployees();
            } else {
                throw new Error(data.message || 'Failed to add employee');
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            showFormError(error.message, this);
        }
    });

    // Edit Employee Form Handler
    employeeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Edit Employee Form submitted');
        
        try {
            const formData = new FormData(this);
            const employeeId = formData.get('id');
            
            // Log form data for debugging
            console.log('Form Data:', Object.fromEntries(formData));

            // Validate required fields
            const requiredFields = ['name', 'position', 'email', 'phone', 'status'];
            const missingFields = [];

            requiredFields.forEach(field => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
                }
            });

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Email validation
            const email = formData.get('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Phone validation
            const phone = formData.get('phone');
            const phoneRegex = /^\d{11}$/;
            if (!phoneRegex.test(phone)) {
                throw new Error('Phone number must be 11 digits');
            }

            // Password validation only if provided
            const password = formData.get('password');
            if (password && password.length > 0 && password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const response = await fetch('../admin-php/employee-management-edit.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Server error occurred');
            }

            if (data.success) {
                showNotification('Success', 'Employee updated successfully', 'success');
                modal.style.display = 'none';
                this.reset();
                await loadEmployees();
            } else {
                throw new Error(data.message || 'Failed to update employee');
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            showFormError(error.message, this);
        }
    });

    // Helper function to show form errors
    function showFormError(message, form) {
        const existingError = form.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        form.insertBefore(errorDiv, form.firstChild);
    }

    // Helper function to show notifications
    function showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <strong>${title}:</strong> ${message}
            <span class="close-notification">&times;</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
});

document.getElementById('addEmployeeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Add Employee Form submitted');
    
    try {
        const formData = new FormData(this);
        
        // Log form data for debugging
        console.log('Form Data:', Object.fromEntries(formData));

        // Required fields based on database schema
        const requiredFields = ['name', 'position', 'email', 'phone', 'password', 'status'];
        const missingFields = [];

        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                missingFields.push(field.charAt(0).toUpperCase() + field.slice(1));
            }
        });

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate enum values
        const validPositions = ['CRSS manager', 'Transporter', 'Agent'];
        if (!validPositions.includes(formData.get('position'))) {
            throw new Error('Invalid position selected');
        }

        const validStatuses = ['Active', 'Inactive', 'On leave'];
        if (!validStatuses.includes(formData.get('status'))) {
            throw new Error('Invalid status selected');
        }

        // Send request to add employee
        const response = await fetch('../admin-php/employee-management-add.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Server error occurred');
        }

        if (data.success) {
            showNotification('Success', 'Employee added successfully', 'success');
            document.getElementById('addEmployeeModal').style.display = 'none';
            this.reset();
            await loadEmployees();
        } else {
            throw new Error(data.message || 'Failed to add employee');
        }
    } catch (error) {
        console.error('Error adding employee:', error);
        showFormError(error.message, this);
    }
});
