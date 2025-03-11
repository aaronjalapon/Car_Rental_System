// Add this at the very top of the file, after any existing imports
let modal; // Declare modal variable globally

// Update car data structure
const cars = [
    {
        id: 1,
        name: 'Toyota Camry',
        brand: 'Toyota',
        model: 'Camry',
        year: '2023',
        type: 'Sedan',
        price: 2500,
        image: '/images/camry.jpg',
        seats: 5,
        available: true
    },
    // Add more cars here
];

// Add closeModal function
function closeModal() {
    modal.style.display = 'none';
    const form = modal.querySelector('form');
    if (form) form.reset();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const carGrid = document.querySelector('.car-grid');
    modal = document.getElementById('rentalModal');
    const closeBtn = document.querySelector('.close');
    const searchBtn = document.querySelector('.search-btn');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    const sortSelect = document.getElementById('sortBy');
    const reservationForm = document.getElementById('reservationForm');
    
    // Then initialize and setup event listeners
    setupEventListeners({
        searchBtn,
        priceRange,
        sortSelect,
        modal,
        reservationForm
    });
    loadCars();
});

// Setup Event Listeners
function setupEventListeners(elements) {
    const { searchBtn, priceRange, sortSelect, modal, reservationForm } = elements;
    
    // Add search input event listener with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const filters = getFilters();
            loadCars(filters);
        }, 300));
    }
    
    // Setup all event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    if (priceRange) {
        priceRange.addEventListener('input', handlePriceFilter);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservation);
    }

    // Update modal close handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close') || e.target === modal) {
            closeModal();
        }
    });

    // Add cancel button handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cancel-btn')) {
            closeModal();
        }
    });
}

// Initialize global cars array
let carsData = [];

// Simplified checkAuthentication function
async function checkAuthentication() {
    try {
        const response = await fetch('../client-php/check-auth-status.php');
        const data = await response.json();
        return true; // Always return true temporarily
    } catch (error) {
        console.error('Auth check failed:', error);
        return true; // Always return true temporarily
    }
}

// Function to load cars
async function loadCars(filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            search: filters.search || '',
            type: filters.type || '',
            max_price: filters.maxPrice || '',
            sort: filters.sort || ''
        }).toString();

        const response = await fetch(`../client-php/customer-rental-fetch-cars.php?${queryParams}`);
        const text = await response.text(); // Get the raw response text first
        
        try {
            const data = JSON.parse(text); // Try to parse the JSON
            if (data.success) {
                carsData = data.data.cars;
                displayCars(carsData);
            } else {
                throw new Error(data.message || 'Failed to fetch cars');
            }
        } catch (jsonError) {
            console.error('Raw response:', text);
            throw new Error('Invalid JSON response from server');
        }
    } catch (error) {
        console.error('Error loading cars:', error);
        document.querySelector('.car-grid').innerHTML = 
            `<p class="error-message">Failed to load cars. ${error.message}</p>`;
    }
}

// Function to display cars
function displayCars(cars) {
    if (!Array.isArray(cars)) {
        console.error('Cars data is not an array:', cars);
        return;
    }

    const carGrid = document.querySelector('.car-grid');
    carGrid.innerHTML = cars.map(car => {
        // Debug logging
        console.log(`Car ${car.car_id} image path:`, car.image_url);
        
        const defaultImagePath = '/CSE7-PROJECT/Car_Rental_System(revised3)/CLIENT/client-images/default-car.png';
        const imagePath = car.image_url || defaultImagePath;
        
        return `
            <div class="car-card">
                <div class="car-image-container">
                    <img src="${imagePath}" 
                         alt="${car.brand_name} ${car.model_name}" 
                         class="car-image"
                         onerror="this.onerror=null; this.src='${defaultImagePath}'; console.log('Failed to load image:', this.src)"
                         onload="console.log('Successfully loaded image:', this.src)"/>
                    <div class="car-overlay">
                        <button class="preview-btn" onclick="showCarDetails(${car.car_id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
                <div class="car-info">
                    <div class="car-header">
                        <h3 class="car-title">${car.brand_name || ''} ${car.model_name || ''}</h3>
                        <span class="status-badge ${(car.status || 'unknown').toLowerCase()}">
                            ${car.status || 'Unknown'}
                        </span>
                    </div>
                    <div class="car-model">${car.year} Model</div>
                    <div class="car-details">
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <span>${car.bodyType_name}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-car"></i>
                            <span>${car.plate_number}</span>
                        </div>
                    </div>
                    <div class="car-price">
                        <span class="price-label">Daily Rate:</span>
                        <span class="price-amount">₱${parseFloat(car.daily_rate).toLocaleString()}</span>
                    </div>
                    <div class="car-actions">
                        <button class="rent-btn" onclick="openRentalModal(${car.car_id})" 
                                ${car.status !== 'Available' ? 'disabled' : ''}>
                            <i class="fas fa-key"></i> Rent Now
                        </button>
                        <button class="details-btn" onclick="showCarDetails(${car.car_id})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Add new function to load car types
async function loadCarTypes() {
    try {
        const response = await fetch('../client-php/customer-rental-fetch-types.php');
        const text = await response.text(); // Get the raw response text first
        
        try {
            const data = JSON.parse(text); // Try to parse the JSON
            if (data.success && data.data.types) {
                const carTypeSelect = document.getElementById('carType');
                const types = data.data.types;
                
                carTypeSelect.innerHTML = '<option value="">All Types</option>' +
                    types.map(type => `<option value="${type}">${type}</option>`).join('');
            } else {
                throw new Error(data.message || 'Failed to load car types');
            }
        } catch (jsonError) {
            console.error('Raw response:', text);
            throw new Error('Invalid JSON response from server');
        }
    } catch (error) {
        console.error('Error loading car types:', error);
        const carTypeSelect = document.getElementById('carType');
        carTypeSelect.innerHTML = '<option value="">Error loading types</option>';
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize modal
    modal = document.getElementById('rentalModal');
    
    // Check authentication first
    if (!await checkAuthentication()) {
        return;
    }
    
    // Then proceed with initialization
    loadCarTypes();
    
    // Add filter handling
    const carTypeSelect = document.getElementById('carType');
    const priceRange = document.getElementById('priceRange');
    const sortSelect = document.getElementById('sortBy');

    carTypeSelect.addEventListener('change', updateFilters);
    priceRange.addEventListener('input', updateFilters);
    sortSelect.addEventListener('change', updateFilters);

    // Initial load
    loadCars();
});

// Add new function to get all current filters
function getFilters() {
    return {
        search: document.getElementById('searchInput').value.trim(),
        type: document.getElementById('carType').value,
        maxPrice: document.getElementById('priceRange').value,
        sort: document.getElementById('sortBy').value
    };
}

function updateFilters() {
    const filters = getFilters();
    loadCars(filters);
}

// Handle search functionality
function handleSearch() {
    const searchText = document.getElementById('searchInput').value.trim();
    const carType = document.getElementById('carType').value;
    const maxPrice = document.getElementById('priceRange').value;
    const sort = document.getElementById('sortBy').value;

    const filters = {
        search: searchText,
        type: carType,
        maxPrice: maxPrice,
        sort: sort
    };

    loadCars(filters);
}

// Handle price filter
function handlePriceFilter(e) {
    const maxPrice = e.target.value;
    priceValue.textContent = `₱${maxPrice}`;
    const filteredCars = cars.filter(car => car.price <= maxPrice);
    displayCars(filteredCars);
}

// Handle sorting
function handleSort(e) {
    const sortValue = e.target.value;
    let sortedCars = [...cars];

    switch(sortValue) {
        case 'price-asc':
            sortedCars.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sortedCars.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sortedCars.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    displayCars(sortedCars);
}

// Add this new function to calculate days between dates
function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Update calculatePrice function
function calculatePrice() {
    const pickupDate = document.querySelector('input[name="pickupDate"]').value;
    const returnDate = document.querySelector('input[name="returnDate"]').value;
    
    if (pickupDate && returnDate) {
        const days = calculateDays(pickupDate, returnDate);
        if (days <= 0) {
            alert('Return date must be after pickup date');
            document.querySelector('input[name="returnDate"]').value = '';
            return;
        }
        
        const dailyRate = parseFloat(document.querySelector('.daily-rate').textContent.replace('₱', '').replace(',', ''));
        const total = days * dailyRate;

        document.querySelector('.num-days').textContent = days;
        document.querySelector('.total-amount').textContent = `₱${total.toLocaleString()}`;
    }
}

// Update openRentalModal function
async function openRentalModal(carId) {
    const car = carsData.find(c => c.car_id === carId);
    if (!car) return;

    // Fetch employees with error handling
    let employeeOptions = '<option value="">Select an employee</option>';
    try {
        const response = await fetch('../client-php/customer-rental-fetch-employees.php');
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log('Employee data:', data); // Debug log

            if (data.success && data.data.employees && data.data.employees.length > 0) {
                employeeOptions += data.data.employees.map(emp => 
                    `<option value="${emp.employeeID}">${emp.employee_name} (${emp.position})</option>`
                ).join('');
            } else {
                console.error('No employees found:', data.message);
                throw new Error(data.message || 'No employees available');
            }
        } catch (jsonError) {
            console.error('Raw response:', text);
            throw new Error('Invalid employee data received');
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
        employeeOptions = '<option value="" disabled>Failed to load employees: ' + error.message + '</option>';
    }

    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close" title="Close">&times;</span>
        <h2>Rent ${car.brand_name} ${car.model_name}</h2>
        <div class="rental-flow">
            <div class="rental-step" id="rentalDetails">
                <h3>Rental Details</h3>
                <form id="rentalForm">
                    <input type="hidden" name="car_id" value="${car.car_id}">
                    <div class="form-group">
                        <label>Employee Assignment*</label>
                        <select name="employee_id" required class="employee-select">
                            ${employeeOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Pick-up Date</label>
                        <input type="date" name="pickupDate" required min="${new Date().toISOString().split('T')[0]}" 
                               onchange="calculatePrice()">
                    </div>
                    <div class="form-group">
                        <label>Return Date</label>
                        <input type="date" name="returnDate" required onchange="calculatePrice()">
                    </div>
                    <div class="price-summary">
                        <div class="price-row">
                            <span>Daily Rate:</span>
                            <span class="daily-rate">₱${parseFloat(car.daily_rate).toLocaleString()}</span>
                        </div>
                        <div class="price-row">
                            <span>Number of Days:</span>
                            <span class="num-days">0</span>
                        </div>
                        <div class="price-row total">
                            <span>Total Amount:</span>
                            <span class="total-amount">₱0</span>
                        </div>
                    </div>
                    <div class="payment-notice">
                        <p><i class="fas fa-info-circle"></i> Payment Notice:</p>
                        <p>Please note that payment will be processed in cash at our office during vehicle pick-up. 
                        Bring a valid ID and the total amount shown above.</p>
                    </div>
                    <button type="submit" class="confirm-btn">
                        Confirm Reservation
                    </button>
                </form>
            </div>
        </div>
    `;

    // Set up event listeners
    const rentalForm = document.getElementById('rentalForm');
    rentalForm.addEventListener('submit', handleReservation);
    
    // Set up date constraints
    const pickupDateInput = rentalForm.querySelector('input[name="pickupDate"]');
    const returnDateInput = rentalForm.querySelector('input[name="returnDate"]');
    
    pickupDateInput.addEventListener('change', function() {
        returnDateInput.min = this.value;
        calculatePrice();
    });

    returnDateInput.addEventListener('change', calculatePrice);
    
    modal.style.display = 'block';
}

// Update handleReservation function
async function handleReservation(e) {
    e.preventDefault();
    
    const form = e.target;
    const carId = form.querySelector('input[name="car_id"]').value;
    const employeeId = form.querySelector('select[name="employee_id"]').value;
    const pickupDate = form.querySelector('input[name="pickupDate"]').value;
    const returnDate = form.querySelector('input[name="returnDate"]').value;
    
    // Get daily rate from the form
    const dailyRate = parseFloat(form.querySelector('.daily-rate').textContent.replace('₱', '').replace(',', ''));
    const numDays = parseInt(form.querySelector('.num-days').textContent);
    const totalAmount = parseFloat(form.querySelector('.total-amount').textContent.replace('₱', '').replace(',', ''));

    try {
        const response = await fetch('../client-php/customer-rental-create-reservation.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                car_id: carId,
                employee_id: employeeId,
                pickup_date: pickupDate,
                return_date: returnDate,
                total_amount: totalAmount,
                num_days: numDays
            })
        });

        const data = await response.json();
        console.log('Reservation response:', data); // Debug log
        
        if (data.success) {
            alert('Reservation created successfully! Your reservation ID is: ' + data.data.reservation_id);
            closeModal();
            // Reload cars to update availability
            loadCars();
        } else {
            alert('Error: ' + (data.message || 'Failed to create reservation'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create reservation. Please try again.');
    }
}

// Add new function to show car details
function showCarDetails(carId) {
    const car = carsData.find(c => c.car_id === carId);
    if (!car) return;

    const defaultImagePath = '/CSE7-PROJECT/Car_Rental_System(revised3)/CLIENT/client-images/default-car.png';
    const imagePath = car.image_url || defaultImagePath;
    
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close" title="Close">&times;</span>
        <div class="car-details-modal">
            <div class="car-images">
                <img src="${imagePath}" 
                     alt="${car.brand_name} ${car.model_name}" 
                     class="car-detail-image"
                     onerror="this.src='${defaultImagePath}'; console.log('Detail image load failed:', this.src);"
                     loading="lazy">
            </div>
            <div class="car-info-details">
                <h3>${car.brand_name} ${car.model_name}</h3>
                <p class="car-year">${car.year} Model</p>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="label">Type:</span>
                        <span class="value">${car.bodyType_name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Plate Number:</span>
                        <span class="value">${car.plate_number}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Daily Rate:</span>
                        <span class="value">₱${parseFloat(car.daily_rate).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Status:</span>
                        <span class="value ${car.status.toLowerCase()}">
                            ${car.status}
                        </span>
                    </div>
                </div>
                ${car.status === 'Available' ? `
                    <button class="rent-btn-large" onclick="openRentalModal(${car.car_id})">
                        <i class="fas fa-key"></i> Rent Now
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

// Handle reservation submission
async function handleReservation(e) {
    e.preventDefault();
    
    const form = e.target;
    const carId = form.querySelector('input[name="car_id"]').value;
    const employeeId = form.querySelector('select[name="employee_id"]').value;
    const pickupDate = form.querySelector('input[name="pickupDate"]').value;
    const returnDate = form.querySelector('input[name="returnDate"]').value;
    
    // Get daily rate from the form
    const dailyRate = parseFloat(form.querySelector('.daily-rate').textContent.replace('₱', '').replace(',', ''));
    const numDays = parseInt(form.querySelector('.num-days').textContent);
    const totalAmount = parseFloat(form.querySelector('.total-amount').textContent.replace('₱', '').replace(',', ''));

    try {
        const response = await fetch('../client-php/customer-rental-create-reservation.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                car_id: carId,
                employee_id: employeeId,
                pickup_date: pickupDate,
                return_date: returnDate,
                total_amount: totalAmount,
                num_days: numDays
            })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Reservation created successfully! Your reservation ID is: ' + data.data.reservation_id);
            closeModal();
            // Reload cars to update availability
            loadCars();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create reservation. Please try again.');
    }
}

// Calculate rental duration and total price
function calculatePrice() {
    const pickupDate = new Date(document.querySelector('input[name="pickupDate"]').value);
    const returnDate = new Date(document.querySelector('input[name="returnDate"]').value);
    
    if (pickupDate && returnDate && returnDate >= pickupDate) {
        const days = Math.ceil((returnDate - pickupDate) / (1000 * 60 * 60 * 24));
        const dailyRate = parseFloat(document.querySelector('.daily-rate').textContent.replace('₱', '').replace(',', ''));
        const total = days * dailyRate;

        document.querySelector('.num-days').textContent = days;
        document.querySelector('.total-amount').textContent = `₱${total.toLocaleString()}`;
    }
}

// Add debounce function to prevent too many API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add new function to handle rental submission
function handleRentalSubmission(response) {
    if (response.success) {
        showAlert('Car rental successful! Your reservation has been confirmed.', 'success');
        // Use a proper delay and maintain CSS during transition
        setTimeout(() => {
            // Store success message in sessionStorage
            sessionStorage.setItem('rentalSuccess', 'true');
            // Redirect to my-reservations page
            window.location.href = '../client-html/my-reservations.html';
        }, 2000);
    } else {
        showAlert(response.message || 'Failed to complete rental', 'error');
    }
}
