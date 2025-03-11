document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('reservationModal');
    const form = document.getElementById('reservationForm');
    const closeBtn = modal.querySelector('.close');
    const tbody = document.querySelector('tbody');
    const addModal = document.getElementById('addReservationModal');
    const addForm = document.getElementById('addReservationForm');
    
    // Load reservations on page load
    loadReservations();

    function loadReservations() {
        fetch('../admin-php/reservation-management-display.php')
            .then(response => response.json())
            .then(data => {
                tbody.innerHTML = '';
                // Check if data is an array and not empty
                if (Array.isArray(data) && data.length > 0) {
                    data.forEach(reservation => {
                        tbody.innerHTML += `
                            <tr>
                                <td class="status-col">
                                    <span class="status-indicator ${reservation.status}" 
                                          title="Status: ${reservation.status}"></span>
                                </td>
                                <td>${reservation.id}</td>
                                <td>${reservation.customerName}</td>
                                <td>${reservation.carModel}</td>
                                <td>${reservation.employeeName}</td>
                                <td>${reservation.startDate}</td>
                                <td>${reservation.endDate}</td>
                                <td class="actions">
                                    <button class="edit-btn" onclick="editReservation(${reservation.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="delete-btn" onclick="deleteReservation(${reservation.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                } else if (data.error) {
                    // Handle error from PHP
                    console.error('Server Error:', data.error);
                    tbody.innerHTML = `<tr><td colspan="7">Error loading reservations: ${data.error}</td></tr>`;
                } else {
                    // No reservations found
                    tbody.innerHTML = '<tr><td colspan="7">No reservations found</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                tbody.innerHTML = '<tr><td colspan="7">Error loading reservations</td></tr>';
            });
    }

    // Populate customers dropdown
    function populateCustomers() {
        const customerSelect = form.querySelector('select[name="customer"]');
        if (!customerSelect) {
            console.log('Customer select element not found');
            return;
        }

        fetch('../admin-php/get-customers.php')
            .then(response => response.json())
            .then(data => {
                customerSelect.innerHTML = '<option value="">Select Customer</option>';
                if (Array.isArray(data)) {
                    data.forEach(customer => {
                        customerSelect.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
                    });
                }
            })
            .catch(error => {
                console.error('Error loading customers:', error);
            });
    }

    // Populate cars dropdown
    function populateCars() {
        const carSelect = form.querySelector('select[name="car"]');
        if (!carSelect) {
            console.log('Car select element not found');
            return;
        }

        fetch('../admin-php/get-cars.php')
            .then(response => response.json())
            .then(data => {
                carSelect.innerHTML = '<option value="">Select Car</option>';
                if (Array.isArray(data)) {
                    data.forEach(car => {
                        carSelect.innerHTML += `<option value="${car.id}">${car.model}</option>`;
                    });
                }
            })
            .catch(error => {
                console.error('Error loading cars:', error);
            });
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            customerID: form.customer.value,
            carID: form.car.value,
            employeeID: 1, // You might want to get this from a session or another source
            startDate: form.startDate.value,
            endDate: form.endDate.value
        };

        fetch('../admin-php/reservation-management-add.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                closeModal();
                loadReservations();
                alert('Reservation added successfully!');
            } else {
                console('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    });

    // Delete reservation
    window.deleteReservation = function(id) {
        if(confirm('Are you sure you want to delete this reservation?')) {
            fetch('../admin-php/reservation-management-delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id: id})
            })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    loadReservations();
                    alert('Reservation deleted successfully!');
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        }
    };

    window.editReservation = function(id) {
        fetch(`../admin-php/reservation-management-get.php?id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const reservation = data.reservation;
                    const form = document.getElementById('reservationForm');
                    
                    if (!form) {
                        console.error('Form element not found');
                        return;
                    }

                    // Clear any existing submit handlers
                    form.removeEventListener('submit', handleEditSubmit);
                    form.removeEventListener('submit', handleStatusUpdate);
                    
                    // Safely update form fields
                    const fields = {
                        customer: reservation.customerName,
                        car: reservation.carModel,
                        startDate: reservation.startDate.split(' ')[0],
                        endDate: reservation.endDate,
                        totalAmount: reservation.totalAmount,
                        paymentStatus: reservation.paymentStatus,
                        reservationStatus: reservation.status
                    };

                    Object.keys(fields).forEach(key => {
                        if (form[key]) {
                            form[key].value = fields[key];
                        }
                    });
                    
                    // Store reservation ID for update
                    form.dataset.reservationId = id;
                    
                    // Add the status update handler
                    form.addEventListener('submit', handleStatusUpdate);
                    
                    // Show modal
                    openModal();
                }
            })
            .catch(error => {
                console.error('Error loading reservation:', error);
            });
    };

    function handleStatusUpdate(e) {
        e.preventDefault();
        const formData = {
            reservationId: this.dataset.reservationId,
            paymentStatus: this.paymentStatus.value,
            reservationStatus: this.reservationStatus.value,
            totalAmount: this.totalAmount.value.replace(/[^0-9.]/g, '')
        };

        fetch('../admin-php/update-transaction-status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            closeModal();
            loadReservations();
            alert('Status updated successfully!');
        })
        .catch(() => {
            // Silently fail - errors are logged server-side
            closeModal();
            loadReservations();
        });
    }

    // Function to populate dropdowns for edit
    function populateCustomersForEdit(selectedId) {
        return fetch('../admin-php/get-customers.php')
            .then(response => response.json())
            .then(data => {
                const select = form.querySelector('select[name="customer"]');
                select.innerHTML = '<option value="">Select Customer</option>';
                data.forEach(customer => {
                    select.innerHTML += `<option value="${customer.id}" ${customer.id == selectedId ? 'selected' : ''}>${customer.name}</option>`;
                });
            });
    }

    function populateCarsForEdit(selectedId) {
        return fetch('../admin-php/get-cars.php')
            .then(response => response.json())
            .then(data => {
                const select = form.querySelector('select[name="car"]');
                select.innerHTML = '<option value="">Select Car</option>';
                data.forEach(car => {
                    select.innerHTML += `<option value="${car.id}" ${car.id == selectedId ? 'selected' : ''}>${car.model}</option>`;
                });
            });
    }

    // Handle edit form submission
    function handleEditSubmit(e) {
        e.preventDefault();
        const formData = {
            id: this.dataset.reservationId,
            customerID: this.customer.value,
            carID: this.car.value,
            employeeID: 1, // You might want to get this from a session
            startDate: this.startDate.value,
            endDate: this.endDate.value
        };

        fetch('../admin-php/reservation-management-update.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                closeModal();
                loadReservations();
                alert('Reservation updated successfully!');
                // Reset form to normal state
                this.onsubmit = null;
                delete this.dataset.reservationId;
            } else {
                console('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Update modal close functions to reset form
    const originalCloseModal = window.closeModal;
    window.closeModal = function() {
        const form = document.getElementById('reservationForm');
        form.onsubmit = null;
        delete form.dataset.reservationId;
        document.querySelector('.modal-content h2').textContent = 'Add New Reservation';
        originalCloseModal();
    };

    // Modal functions
    window.openModal = function() {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
        populateCustomers();
        populateCars();
    };

    window.closeModal = function() {
        const form = document.getElementById('reservationForm');
        // Remove all event listeners
        form.removeEventListener('submit', handleEditSubmit);
        form.removeEventListener('submit', handleStatusUpdate);
        // Reset form
        form.reset();
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close button functionality
    closeBtn.addEventListener('click', closeModal);

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = tbody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Add new functions
    function openAddModal() {
        addModal.style.display = 'block';
        setTimeout(() => addModal.classList.add('show'), 10);
        populateAddModalSelects();
        setCurrentEmployee(); // Add this line
    }

    function closeAddModal() {
        addForm.reset();
        addModal.classList.remove('show');
        setTimeout(() => {
            addModal.style.display = 'none';
        }, 300);
    }

    function populateAddModalSelects() {
        // Populate customers
        fetch('../admin-php/get-customers.php')
            .then(response => response.json())
            .then(data => {
                const select = addForm.querySelector('select[name="customer"]');
                select.innerHTML = '<option value="">Select Customer</option>';
                if (Array.isArray(data)) {
                    data.forEach(customer => {
                        select.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
                    });
                }
            });

        // Populate cars
        fetch('../admin-php/get-cars.php')
            .then(response => response.json())
            .then(data => {
                const select = addForm.querySelector('select[name="car"]');
                select.innerHTML = '<option value="">Select Car</option>';
                if (Array.isArray(data)) {
                    data.forEach(car => {
                        select.innerHTML += `<option value="${car.id}">${car.model}</option>`;
                    });
                }
            });

        // Add employee fetch
        fetch('../admin-php/get-employees.php')
            .then(response => response.json())
            .then(data => {
                const select = addForm.querySelector('select[name="employee"]');
                select.innerHTML = '<option value="">Select Employee</option>';
                if (Array.isArray(data)) {
                    data.forEach(employee => {
                        select.innerHTML += `<option value="${employee.id}">${employee.name}</option>`;
                    });
                }
            });
    }

    // Add this new function after the populateAddModalSelects function
    function setCurrentEmployee() {
        fetch('../admin-php/get-current-employee.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const employeeInput = addForm.querySelector('input[name="employee"]');
                    const employeeIdInput = addForm.querySelector('input[name="employeeId"]');
                    employeeInput.value = data.name;
                    employeeIdInput.value = data.id;
                }
            })
            .catch(error => console.error('Error loading employee:', error));
    }

    // Add form submission handler
    addForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            customerID: this.customer.value,
            carID: this.car.value,
            employeeID: this.employeeId.value, // Use the hidden input value
            startDate: this.startDate.value,
            endDate: this.endDate.value
        };

        fetch('../admin-php/reservation-management-add.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                closeAddModal();
                loadReservations();
                alert('Reservation added successfully!');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding reservation');
        });
    });

    // Add click handler for add modal close button
    addModal.querySelector('.close').addEventListener('click', closeAddModal);

    // Update the add new reservation button click handler
    document.querySelector('.add-btn').onclick = openAddModal;

    // Add these functions after the existing populateAddModalSelects function
    function updateCostSummary() {
        const carSelect = addForm.querySelector('select[name="car"]');
        const startDate = addForm.querySelector('input[name="startDate"]').value;
        const endDate = addForm.querySelector('input[name="endDate"]').value;
        
        if (carSelect.value && startDate && endDate) {
            // Fetch car details including daily rate
            fetch(`../admin-php/get-car-rate.php?id=${carSelect.value}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const dailyRate = parseFloat(data.daily_rate);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                        
                        if (days > 0) {
                            const total = dailyRate * days;
                            
                            // Update the summary elements
                            document.getElementById('dailyRate').textContent = `₱${dailyRate.toFixed(2)}`;
                            document.getElementById('numDays').textContent = days;
                            document.getElementById('totalAmount').textContent = `₱${total.toFixed(2)}`;
                        }
                    }
                });
        }
    }

    // Add these event listeners in the existing addForm event listeners section
    addForm.querySelector('select[name="car"]').addEventListener('change', updateCostSummary);
    addForm.querySelector('input[name="startDate"]').addEventListener('change', updateCostSummary);
    addForm.querySelector('input[name="endDate"]').addEventListener('change', updateCostSummary);
});
