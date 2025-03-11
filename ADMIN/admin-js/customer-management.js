document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    const selectAll = document.getElementById('selectAll');
    const closeBtn = modal?.querySelector('.close');
    const tableBody = document.querySelector('table tbody');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
    const pagination = document.querySelector('.pagination');

    if (!modal || !form || !tableBody) {
        console.error('Required DOM elements are missing:', {
            modal: !!modal,
            form: !!form,
            tableBody: !!tableBody
        });
        return;
    }

    let currentPage = 1;
    let itemsPerPage = 10;

    // Load initial customer data
    loadCustomers();

    async function loadCustomers(search = '', sort = 'id') {
        try {
            const url = `../admin-php/customer-management.php?page=${currentPage}&items_per_page=${itemsPerPage}&search=${search}&sort=${sort}`;
            console.log('Fetching URL:', url);
    
            const response = await fetch(url);
            const responseText = await response.text();
            
            console.log('Raw response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${responseText}`);
            }
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            if (data.success) {
                displayCustomers(data.data.customers);
                updatePagination(data.data.pagination);
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            console.error('Error details:', error.message);
            alert('Failed to load customers: ' + error.message);
        }
    }

    function displayCustomers(customers) {
        tableBody.innerHTML = '';
        customers.forEach(customer => {
            const licenseIcon = getLicenseIcon(customer.license_status);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="row-select"></td>
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.contact}</td>
                <td class="license-status">${licenseIcon}</td>
                <td>${customer.lastRental || 'N/A'}</td>
                <td>
                    <div class="actions">
                        <button class="edit-btn" data-id="${customer.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="view-btn" data-id="${customer.id}" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="delete-btn" data-id="${customer.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function getLicenseIcon(status) {
        switch(status) {
            case 'verified':
                return '<i class="fas fa-check-circle text-success"></i>';
            case 'invalid':
                return '<i class="fas fa-times-circle text-danger"></i>';
            default:
                return '<i class="fas fa-clock text-warning"></i>';
        }
    }

    // Updated view details functionality
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.view-btn')) {
            const button = e.target.closest('.view-btn');
            const customerId = button.dataset.id;
            await showViewModal(customerId);
        }
    });

    // Add these event listeners for edit and delete buttons
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.edit-btn')) {
            const button = e.target.closest('.edit-btn');
            const customerId = button.dataset.id;
            await showEditModal(customerId);
        }
        
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const customerId = button.dataset.id;
            await handleDelete(customerId);
        }
    });

    async function showEditModal(customerId) {
        try {
            const response = await fetch(`../admin-php/get-customer-details.php?id=${customerId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            const customer = data.customer;
            
            // Populate the edit form - removed address field
            document.getElementById('custId').value = customer.id;
            document.getElementById('custName').value = customer.name;
            document.getElementById('custEmail').value = customer.email;
            document.getElementById('custPhone').value = customer.contact;
            document.getElementById('lastRental').value = customer.lastRental || 'N/A';
            
            // Show the modal
            const customerModal = document.getElementById('customerModal');
            customerModal.style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load customer details: ' + error.message);
        }
    }

    async function handleDelete(customerId) {
        if (!confirm('Are you sure you want to delete this customer?')) {
            return;
        }

        try {
            // Update this URL to match your PHP file name
            const response = await fetch('../admin-php/customer-management-delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customerId })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            showAlert('Customer deleted successfully');
            loadCustomers(); // Refresh the list
            
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }

    // Add form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = {
                id: document.getElementById('custId').value,
                name: document.getElementById('custName').value,
                email: document.getElementById('custEmail').value,
                phone: document.getElementById('custPhone').value
            };
            
            const response = await fetch('../admin-php/update-customer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            showAlert('Customer updated successfully');
            closeModal();
            loadCustomers(); // Refresh the list
            
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    });

    function closeModal() {
        modal.style.display = 'none';
        // Clear form fields
        if (form) {
            form.reset();
        }
    }

    // Update this function to make the modal visible
    async function showViewModal(customerId) {
        try {
            const viewModal = document.getElementById('viewDetailsModal');
            const viewName = document.getElementById('viewName');
            const viewEmail = document.getElementById('viewEmail');
            const viewContact = document.getElementById('viewContact');
            const viewLastRental = document.getElementById('viewLastRental');
            const viewLicense = document.getElementById('viewLicense');
            
            // Show loading state
            viewModal.style.display = 'flex'; // Changed from 'block' to 'flex'
            viewModal.style.opacity = '1'; // Make sure modal is visible
            
            // Show loading indicator
            viewLicense.src = '';
            viewLicense.alt = 'Loading...';
            
            // Fetch customer details
            const response = await fetch(`../admin-php/get-customer-details.php?id=${customerId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load customer details');
            }
            
            const customer = data.customer;
            
            // Update modal content
            viewName.textContent = customer.name;
            viewEmail.textContent = customer.email;
            viewContact.textContent = customer.contact;
            viewLastRental.textContent = customer.lastRental || 'N/A';
            
            if (customer.dlpic) {
                viewLicense.src = `data:image/jpeg;base64,${customer.dlpic}`;
                viewLicense.alt = "Driver's License";
            } else {
                viewLicense.src = '';
                viewLicense.alt = "No license image available";
            }
            
            // Update verification buttons with proper event listeners
            const verifyButton = document.getElementById('verifyButton');
            const invalidateButton = document.getElementById('invalidateButton');
            
            // Remove any existing event listeners
            verifyButton.replaceWith(verifyButton.cloneNode(true));
            invalidateButton.replaceWith(invalidateButton.cloneNode(true));
            
            // Get fresh references after cloning
            const newVerifyButton = document.getElementById('verifyButton');
            const newInvalidateButton = document.getElementById('invalidateButton');
            
            // Add new event listeners
            newVerifyButton.addEventListener('click', () => updateLicenseStatus(customerId, 'verified'));
            newInvalidateButton.addEventListener('click', () => updateLicenseStatus(customerId, 'invalid'));
            
            // Update button states
            if (customer.license_status === 'verified') {
                newVerifyButton.disabled = true;
                newInvalidateButton.disabled = false;
            } else if (customer.license_status === 'invalid') {
                newVerifyButton.disabled = false;
                newInvalidateButton.disabled = true;
            } else {
                newVerifyButton.disabled = false;
                newInvalidateButton.disabled = false;
            }
            
        } catch (error) {
            console.error('Error loading customer details:', error);
            alert('Failed to load customer details: ' + error.message);
            document.getElementById('viewDetailsModal').style.display = 'none';
        }
    }

    async function updateLicenseStatus(customerId, status) {
        try {
            const response = await fetch('../admin-php/update-license-status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customerId, status })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to update status');
            }
            
            // Refresh the customer list
            await loadCustomers();
            
            // Close the modal
            const viewModal = document.getElementById('viewDetailsModal');
            viewModal.style.display = 'none';
            
            // Show success message
            showAlert('License status updated successfully');
            
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }

    function updatePagination(paginationData) {
        const { currentPage, totalPages } = paginationData;
        const pageNumbers = document.querySelector('.page-numbers');
        pageNumbers.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageNumbers.appendChild(pageButton);
        }
    }

    // Search input handler
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                loadCustomers(e.target.value, sortSelect?.value || 'id');
            }, 300);
        });
    }

    // Sort select handler
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            loadCustomers(searchInput?.value || '', this.value);
        });
    }

    // Items per page handler
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            loadCustomers(searchInput?.value || '', sortSelect?.value || 'id');
        });
    }

    // Pagination handlers
    if (pagination) {
        pagination.addEventListener('click', function(e) {
            if (e.target.matches('button:not(.btn-prev):not(.btn-next)')) {
                currentPage = parseInt(e.target.textContent);
                loadCustomers(searchInput?.value || '', sortSelect?.value || 'id');
            } else if (e.target.matches('.btn-prev')) {
                if (currentPage > 1) {
                    currentPage--;
                    loadCustomers(searchInput?.value || '', sortSelect?.value || 'id');
                }
            } else if (e.target.matches('.btn-next')) {
                currentPage++;
                loadCustomers(searchInput?.value || '', sortSelect?.value || 'id');
            }
        });
    }

    // Modal handlers
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.row-select');
            checkboxes.forEach(checkbox => checkbox.checked = this.checked);
        });
    }

    // View details modal close handlers
    const viewDetailsModal = document.getElementById('viewDetailsModal');
    const viewDetailsCloseBtn = viewDetailsModal?.querySelector('.close');
    
    if (viewDetailsCloseBtn) {
        viewDetailsCloseBtn.addEventListener('click', () => {
            viewDetailsModal.style.display = 'none';
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target === viewDetailsModal) {
            viewDetailsModal.style.display = 'none';
        }
    });

    function closeModal() {
        modal.style.display = 'none';
    }

    // Add alert function
    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }
});