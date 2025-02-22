document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('carModal');
    const form = document.getElementById('carForm');
    const searchInput = document.querySelector('.search-box input');
    const closeBtn = modal.querySelector('.close');
    const tableBody = document.querySelector('table tbody');

    // Define modal functions globally
    window.openModal = function() {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
    };

    window.closeModal = function() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
        }, 300);
    };

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
            // Update this path to match your PHP file location
            const response = await fetch('../php/car-management.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load cars');
            }

            if (data.cars.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center;">No cars available in the database</td>
                    </tr>`;
                return;
            }

            updateCarTable(data.cars);
        } catch (error) {
            console.error('Error:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: red;">
                        Error loading cars: ${error.message}
                    </td>
                </tr>`;
        }
    }

    function updateCarTable(cars) {
        tableBody.innerHTML = cars.map(car => `
            <tr>
                <td class="text-center">#CR${String(car.car_id).padStart(3, '0')}</td>
                <td class="text-left">
                    <div class="car-info">
                        <strong>${car.brand} ${car.model}</strong>
                        <span>${car.year} Model</span>
                    </div>
                </td>
                <td class="text-center">${car.bodyType}</td>
                <td class="text-center">${car.plate_number}</td>
                <td class="text-center"><span class="status ${car.status.toLowerCase()}">${car.status}</span></td>
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
        `).join('');
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const carData = {
            brand: form.querySelector('[name="brand"]').value,
            model: form.querySelector('[name="model"]').value,
            bodyType: form.querySelector('[name="bodyType"]').value,
            plate_number: form.querySelector('[name="plate_number"]').value,
            year: form.querySelector('[name="year"]').value,
            daily_rate: form.querySelector('[name="price"]').value
        };

        const imageFile = form.querySelector('[name="carImage"]').files[0];
        
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                carData.image = e.target.result.split(',')[1];
                await submitCarData(carData);
            };
            reader.readAsDataURL(imageFile);
        } else {
            showAlert('Please select an image', 'error');
        }
    });

    async function submitCarData(carData) {
        try {
            console.log('Submitting data:', carData);
            const response = await fetch('../php/car-management-add.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(carData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add car');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to add car');
            }

            showAlert('Car added successfully');
            closeModal();
            loadCars();
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }

    // Delete car function
    window.deleteCar = async function(carId) {
        if (!confirm('Are you sure you want to delete this car?')) {
            return;
        }

        try {
            const response = await fetch('../php/car-management-delete.php', {
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

            showAlert('Car deleted successfully');
            loadCars();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    // Edit car function
    window.editCar = async function(carId) {
        try {
            const response = await fetch(`car-management-get.php?id=${carId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load car details');
            }

            // Populate form with car details
            Object.keys(data.car).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = data.car[key];
                }
            });

            // Update modal title
            modal.querySelector('h3').textContent = 'Edit Car';
            form.dataset.carId = carId;
            openModal();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    // Search functionality
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = tableBody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Filter handling
    function applyFilters() {
        const brandFilter = document.getElementById('brandFilter').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value.toLowerCase();
        const rows = tableBody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const brand = row.querySelector('.car-info strong').textContent.toLowerCase();
            const type = row.children[3].textContent.toLowerCase();
            const matchesBrand = !brandFilter || brand.includes(brandFilter);
            const matchesType = !typeFilter || type === typeFilter;
            row.style.display = matchesBrand && matchesType ? '' : 'none';
        });
    }

    document.getElementById('brandFilter').addEventListener('change', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
});