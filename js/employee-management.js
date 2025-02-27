document.addEventListener('DOMContentLoaded', function() {
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
            const response = await fetch(`../php/employee-management.php?page=${page}&items_per_page=${itemsPerPage}&search=${search}`);
            const data = await response.json();
            
            if (data.success) {
                renderEmployees(data.data.employees);
                updatePagination(data.data.pagination);
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
            const response = await fetch(`../php/employee-management-view.php?id=${employeeId}`);
            const data = await response.json();
            
            if (data.success) {
                const employee = data.employee;
                document.querySelector('.modal-title').textContent = 'View Employee';
                // Populate modal with employee data
                document.getElementById('empName').value = employee.name;
                document.getElementById('empPosition').value = employee.position;
                document.getElementById('empEmail').value = employee.email;
                document.getElementById('empPhone').value = employee.phone;
                document.getElementById('empStatus').value = employee.status;
                
                modal.style.display = 'block';
                setTimeout(() => modal.classList.add('show'), 10);
            }
        } catch (error) {
            console.error('Error viewing employee:', error);
            alert('Failed to load employee details');
        }
    };

    // Edit employee
    window.editEmployee = async function(employeeId) {
        try {
            const response = await fetch(`../php/employee-management-view.php?id=${employeeId}`);
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
                const response = await fetch('../php/employee-management-delete.php', {
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

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        
        try {
            const response = await fetch('../php/employee-management-edit.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Employee updated successfully');
                closeModal();
                loadEmployees(currentPage);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Failed to update employee');
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadEmployees(1, this.value);
        }, 500);
    });

    // Initial load
    loadEmployees();
});
