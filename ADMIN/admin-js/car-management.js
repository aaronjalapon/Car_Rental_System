document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements
    const addCarModal = document.getElementById('addCarModal');
    const editCarModal = document.getElementById('editCarModal');
    const addCarForm = document.getElementById('addCarForm');
    const editCarForm = document.getElementById('editCarForm');
    const searchInput = document.querySelector('.search-box input');
    const tableBody = document.querySelector('table tbody');
    const addCarBtn = document.querySelector('.add-car-btn');

    // Verify required elements exist
    if (!tableBody) {
        console.error('Required element missing: table tbody');
        return;
    }

    // Modal functions
    window.openAddModal = function() {
        if (addCarModal) {
            addCarModal.style.display = 'block';
            setTimeout(() => addCarModal.classList.add('show'), 10);
        }
    };

    window.closeAddModal = function() {
        if (addCarModal) {
            addCarModal.classList.remove('show');
            setTimeout(() => {
                addCarModal.style.display = 'none';
                if (addCarForm) {
                    addCarForm.reset();
                    const modelSelect = addCarForm.querySelector('select[name="model"]');
                    const bodyTypeSelect = addCarForm.querySelector('select[name="bodyType"]');
                    
                    // Reset select elements
                    modelSelect.innerHTML = '<option value="">Select Model</option>';
                    bodyTypeSelect.innerHTML = '<option value="">Select Body Type</option>';
                    modelSelect.disabled = true;
                    bodyTypeSelect.disabled = true;
                }
            }, 300);
        }
    };

    window.openEditModal = function() {
        if (editCarModal) {
            editCarModal.style.display = 'block';
            setTimeout(() => editCarModal.classList.add('show'), 10);
        }
    };

    window.closeEditModal = function() {
        if (editCarModal) {
            editCarModal.classList.remove('show');
            setTimeout(() => {
                editCarModal.style.display = 'none';
                if (editCarForm) editCarForm.reset();
            }, 300);
        }
    };

    // Add car button click handler
    if (addCarBtn) {
        addCarBtn.onclick = openAddModal;
    }

    // Initialize close buttons for both modals
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'addCarModal') {
                closeAddModal();
            } else if (modal.id === 'editCarModal') {
                closeEditModal();
            }
        });
    });

    // Alert function
    window.showAlert = function(message, type = 'success') {
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

    // Load cars on page load
    loadCars();

    // Load cars function
    async function loadCars() {
        try {
            console.log('Fetching cars...');
            const response = await fetch('../admin-php/car-management.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log('Raw response:', text); // Debug line
            
            let data;
            try {
                data = JSON.parse(text);
                console.log('Parsed data:', data); // Debug line
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.error('Raw text:', text);
                throw new Error('Invalid JSON response from server');
            }

            if (!data || typeof data.success === 'undefined') {
                throw new Error('Invalid response structure from server');
            }

            if (!data.success) {
                throw new Error(data.message || 'Failed to load cars');
            }

            const cars = data.cars || [];
            if (cars.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No cars available</td>
                    </tr>`;
                return;
            }

            updateCarTable(cars);
            updateFilterOptions(cars); // Add this line
        } catch (error) {
            console.error('LoadCars Error:', error);
            showAlert(error.message, 'error');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Error loading cars: ${error.message}</td>
                </tr>`;
        }
    }

    function updateCarTable(cars) {
        if (!tableBody) return;
        
        tableBody.innerHTML = cars.map(car => {
            const statusClass = car.status.toLowerCase();
            return `
                <tr data-car-id="${car.car_id}">
                    <td class="text-center">#CR${String(car.car_id).padStart(3, '0')}</td>
                    <td class="text-center">
                        <div class="car-info">
                            <div class="car-details">
                                <strong class="brand-model">${car.brand} ${car.model}</strong>
                                <span class="year-model">${car.year} Model</span>
                            </div>
                        </div>
                    </td>
                    <td class="text-center">${car.bodyType}</td>
                    <td class="text-center">${car.plate_number}</td>
                    <td class="text-center"><span class="status ${statusClass}">${car.status}</span></td>
                    <td class="text-right">₱${parseFloat(car.daily_rate).toLocaleString()}/day</td>
                    <td class="text-center actions">
                        <button class="edit-btn" onclick="editCar(${car.car_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteCar(${car.car_id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Form submission
    addCarForm?.addEventListener('submit', handleAddCar);
    editCarForm?.addEventListener('submit', handleEditCar);

    async function handleAddCar(e) {
        e.preventDefault();
        
        const carData = {
            brand: addCarForm.querySelector('[name="brand"]').value,
            model: addCarForm.querySelector('[name="model"]').value,
            bodyType: addCarForm.querySelector('[name="bodyType"]').value,
            plate_number: addCarForm.querySelector('[name="plate_number"]').value,
            year: addCarForm.querySelector('[name="year"]').value,
            daily_rate: addCarForm.querySelector('[name="price"]').value
        };

        const imageFile = addCarForm.querySelector('[name="carImage"]').files[0];
        if (!imageFile) {
            showAlert('Please select an image', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(e) {
            carData.image = e.target.result.split(',')[1];
            await submitCarData(carData);
        };
        reader.readAsDataURL(imageFile);
    }

    async function handleEditCar(e) {
        e.preventDefault();
        
        const status = editCarForm.querySelector('[name="status"]').value;
        if (!['Available', 'Unavailable'].includes(status)) {
            showAlert('Invalid status value', 'error');
            return;
        }

        const carData = {
            car_id: editCarForm.dataset.carId,
            plate_number: editCarForm.querySelector('[name="plate_number"]').value,
            year: editCarForm.querySelector('[name="year"]').value,
            daily_rate: editCarForm.querySelector('[name="price"]').value,
            status: status
        };

        try {
            const response = await fetch('../admin-php/car-management-update.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(carData)
            });

            if (!response.ok) {
                throw new Error('Failed to update car');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to update car');
            }

            showAlert('Car updated successfully');
            closeEditModal();
            loadCars();
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }

    async function submitCarData(carData) {
        try {
            console.log('Submitting data:', carData);
            
            const response = await fetch('../admin-php/car-management-add.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(carData)
            });

            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            // Try to parse JSON response
            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.error('JSON Parse Error:', e);
                throw new Error('Invalid response from server');
            }

            // Check response structure
            if (!data || typeof data.success === 'undefined') {
                throw new Error('Invalid response structure from server');
            }

            // Handle error response
            if (!data.success) {
                throw new Error(data.message || 'Failed to add car');
            }

            // Success
            showAlert('Car added successfully');
            closeAddModal();
            await loadCars();

        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message || 'Error adding car', 'error');
        }
    }

    // Delete car function
    window.deleteCar = async function(carId) {
        if (!confirm('Are you sure you want to delete this car?')) {
            return;
        }

        try {
            const response = await fetch('../admin-php/car-management-delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ car_id: carId })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to delete car');
            }

            showAlert('Car deleted successfully', 'success');
            
            // Update the table by removing the deleted row
            const row = document.querySelector(`tr[data-car-id="${carId}"]`);
            if (row) {
                row.remove();
            } else {
                // If we can't find the specific row, reload the entire table
                await loadCars();
            }
        } catch (error) {
            console.error('Delete error:', error);
            showAlert(error.message || 'Error deleting car', 'error');
        }
    };

    // Edit car function
    window.editCar = async function(carId) {
        try {
            if (!carId) {
                throw new Error('Car ID is required');
            }

            const response = await fetch(`../admin-php/car-management-get.php?id=${encodeURIComponent(carId)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load car details');
            }

            const car = data.car;
            
            // Populate edit form
            const setFormValue = (name, value) => {
                const element = editCarForm.querySelector(`[name="${name}"]`);
                if (element) {
                    if (element.tagName === 'SELECT') {
                        element.value = value || element.options[0].value;
                    } else {
                        element.value = value || '';
                    }
                }
            };

            setFormValue('brand', car.brand);
            setFormValue('model', car.model);
            setFormValue('bodyType', car.bodyType);
            setFormValue('plate_number', car.plate_number);
            setFormValue('year', car.year);
            setFormValue('price', car.daily_rate);
            setFormValue('status', car.status);

            // Store car ID in form dataset
            editCarForm.dataset.carId = carId;

            openEditModal();
        } catch (error) {
            console.error('Error in editCar:', error);
            showAlert(error.message, 'error');
        }
    };

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            applyFilters();
        });
    }

    // Enhanced filter handling
    function applyFilters() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const brandFilter = document.getElementById('brandFilter')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('typeFilter')?.value.toLowerCase() || '';
        const rows = tableBody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            // Get text content from specific cells
            const brandModelCell = row.querySelector('.brand-model')?.textContent.toLowerCase() || '';
            const bodyTypeCell = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase().trim() || '';
            const plateCell = row.querySelector('td:nth-child(4)')?.textContent.toLowerCase() || '';
            const statusCell = row.querySelector('.status')?.textContent.toLowerCase() || '';
            
            // Check if the row matches all active filters
            const matchesSearch = 
                brandModelCell.includes(searchTerm) || 
                bodyTypeCell.includes(searchTerm) || 
                plateCell.includes(searchTerm) ||
                statusCell.includes(searchTerm);
                
            const matchesBrand = !brandFilter || brandModelCell.includes(brandFilter);
            const matchesType = !typeFilter || bodyTypeCell === typeFilter;

            // Debug logging
            console.log({
                row: row,
                bodyTypeCell: bodyTypeCell,
                typeFilter: typeFilter,
                matches: bodyTypeCell === typeFilter
            });

            // Show/hide row based on filter results
            row.style.display = (matchesSearch && matchesBrand && matchesType) ? '' : 'none';
        });
    }

    // Update filter options population
    function updateFilterOptions(cars) {
        const brandFilter = document.getElementById('brandFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (brandFilter && typeFilter) {
            // Get unique brands and types, ensure they're trimmed and sorted
            const brands = [...new Set(cars.map(car => car.brand.trim()))].sort();
            const types = [...new Set(cars.map(car => car.bodyType.trim()))].sort();
            
            // Update brand filter options
            brandFilter.innerHTML = '<option value="">All Brands</option>' +
                brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
            
            // Update type filter options
            typeFilter.innerHTML = '<option value="">All Types</option>' +
                types.map(type => `<option value="${type}">${type}</option>`).join('');
        }
    }

    // Update event listeners
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    document.getElementById('brandFilter')?.addEventListener('change', applyFilters);
    document.getElementById('typeFilter')?.addEventListener('change', applyFilters);
});

// Initialize form elements
const initializeFormElements = () => {
    if (addCarForm) {
        const brandSelect = addCarForm.querySelector('select[name="brand"]');
        const modelSelect = addCarForm.querySelector('select[name="model"]');
        const bodyTypeSelect = addCarForm.querySelector('select[name="bodyType"]');

        // Initially disable dependent selects
        modelSelect.disabled = true;
        bodyTypeSelect.disabled = true;

        // Brand change handler
        brandSelect.addEventListener('change', async (e) => {
            modelSelect.disabled = !e.target.value;
            bodyTypeSelect.disabled = true;
            
            modelSelect.innerHTML = '<option value="">Select Model</option>';
            bodyTypeSelect.innerHTML = '<option value="">Select Body Type</option>';

            if (!e.target.value) return;

            try {
                const response = await fetch(`../admin-php/get-models.php?brand_id=${e.target.value}`);
                const data = await response.json();

                if (data.success && data.models.length > 0) {
                    data.models.forEach(model => {
                        modelSelect.innerHTML += `
                            <option value="${model.model_id}" 
                                data-bodytype-id="${model.bodyType_id}"
                                data-bodytype-name="${model.bodyType_name}">
                                ${model.model_name}
                            </option>
                        `;
                    });
                }
            } catch (error) {
                console.error('Error fetching models:', error);
                showAlert('Failed to load models', 'error');
            }
        });

        // Model change handler
        modelSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            bodyTypeSelect.disabled = !e.target.value;
            bodyTypeSelect.innerHTML = '<option value="">Select Body Type</option>';

            if (e.target.value && selectedOption.dataset.bodytypeId) {
                bodyTypeSelect.innerHTML = `
                    <option value="${selectedOption.dataset.bodytypeId}" selected>
                        ${selectedOption.dataset.bodytypeName}
                    </option>
                `;
                bodyTypeSelect.disabled = true;
            }
        });
    }
};

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFormElements();
    // ...rest of your existing DOMContentLoaded code...
});

// Update modal reset handler
window.closeAddModal = function() {
    if (addCarModal) {
        addCarModal.classList.remove('show');
        setTimeout(() => {
            addCarModal.style.display = 'none';
            if (addCarForm) {
                addCarForm.reset();
                const modelSelect = addCarForm.querySelector('select[name="model"]');
                const bodyTypeSelect = addCarForm.querySelector('select[name="bodyType"]');
                
                // Reset select elements
                modelSelect.innerHTML = '<option value="">Select Model</option>';
                bodyTypeSelect.innerHTML = '<option value="">Select Body Type</option>';
                modelSelect.disabled = true;
                bodyTypeSelect.disabled = true;
            }
        }, 300);
    }
};