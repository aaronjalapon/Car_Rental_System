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

// DOM Elements
const carGrid = document.querySelector('.car-grid');
const modal = document.getElementById('rentalModal');
const closeBtn = document.querySelector('.close');
const searchBtn = document.querySelector('.search-btn');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const sortSelect = document.getElementById('sortBy');
const reservationForm = document.getElementById('reservationForm');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    displayCars(cars);
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    priceRange.addEventListener('input', handlePriceFilter);
    sortSelect.addEventListener('change', handleSort);
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    reservationForm.addEventListener('submit', handleReservation);

    // Add this: Update close button listener to work with dynamic content
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close')) {
            modal.style.display = 'none';
        }
    });
}

// Update displayCars function
function displayCars(carsToShow) {
    carGrid.innerHTML = carsToShow.map(car => `
        <div class="car-card">
            <div class="car-image-container">
                <img src="${car.image}" alt="${car.name}" class="car-image">
                <div class="car-overlay">
                    <button class="preview-btn" onclick="showCarDetails(${car.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
            <div class="car-info">
                <div class="car-header">
                    <h3 class="car-title">${car.brand} ${car.model}</h3>
                    <span class="status-badge ${car.available ? 'available' : 'rented'}">
                        ${car.available ? 'Available' : 'Rented'}
                    </span>
                </div>
                <div class="car-model">${car.year} Model</div>
                <div class="car-details">
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>${car.seats} Seats</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-car"></i>
                        <span>${car.type}</span>
                    </div>
                </div>
                <div class="car-price">
                    <span class="price-label">Daily Rate:</span>
                    <span class="price-amount">₱${car.price}/day</span>
                </div>
                <div class="car-actions">
                    <button class="rent-btn" onclick="openRentalModal(${car.id})" ${!car.available ? 'disabled' : ''}>
                        <i class="fas fa-key"></i> Rent Now
                    </button>
                    <button class="details-btn" onclick="showCarDetails(${car.id})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle search functionality
function handleSearch() {
    const pickupDate = document.getElementById('pickupDate').value;
    const returnDate = document.getElementById('returnDate').value;
    const carType = document.getElementById('carType').value;

    let filteredCars = cars;
    if (carType) {
        filteredCars = filteredCars.filter(car => car.type === carType);
    }

    // Add date availability check here
    displayCars(filteredCars);
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

// Update openRentalModal function
function openRentalModal(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;

    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close" title="Close">&times;</span>
        <h2>Rent ${car.brand} ${car.model}</h2>
        <div class="rental-flow">
            <div class="rental-step" id="rentalDetails">
                <h3>Rental Details</h3>
                <form id="rentalForm">
                    <div class="form-group">
                        <label>Pick-up Date</label>
                        <input type="date" name="pickupDate" required>
                    </div>
                    <div class="form-group">
                        <label>Return Date</label>
                        <input type="date" name="returnDate" required onchange="calculatePrice()">
                    </div>
                    <div class="price-summary">
                        <div class="price-row">
                            <span>Daily Rate:</span>
                            <span class="daily-rate">₱${car.price}</span>
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
    
    // Update form listener
    document.getElementById('rentalForm').addEventListener('submit', handleReservation);
    
    modal.style.display = 'block';
}

// Remove these functions as they're no longer needed:
// - showPaymentStep()
// - showRentalStep()
// - setupPaymentFormListeners()
// - handlePaymentSubmission()

// Update handleReservation function
function handleReservation(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(e.target);
    const reservationData = {
        pickupDate: formData.get('pickupDate'),
        returnDate: formData.get('returnDate')
    };

    // Here you would typically send this data to your backend
    console.log('Reservation data:', reservationData);
    
    // Show success message
    alert('Reservation submitted successfully! Please visit our office for payment and vehicle pick-up.');
    modal.style.display = 'none';
}

// Add new function to show car details
function showCarDetails(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;

    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close" title="Close">&times;</span>
        <div class="car-details-modal">
            <div class="car-images">
                <img src="${car.image}" alt="${car.name}" class="car-detail-image">
            </div>
            <div class="car-info-details">
                <h3>${car.brand} ${car.model}</h3>
                <p class="car-year">${car.year} Model</p>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="label">Type:</span>
                        <span class="value">${car.type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Seats:</span>
                        <span class="value">${car.seats}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Daily Rate:</span>
                        <span class="value">₱${car.price}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Status:</span>
                        <span class="value ${car.available ? 'available' : 'rented'}">
                            ${car.available ? 'Available' : 'Currently Rented'}
                        </span>
                    </div>
                </div>
                ${car.available ? `
                    <button class="rent-btn-large" onclick="openRentalModal(${car.id})">
                        <i class="fas fa-key"></i> Rent Now
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

// Handle reservation submission
function handleReservation(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(e.target);
    const reservationData = {
        pickupDate: formData.get('pickupDate'),
        returnDate: formData.get('returnDate'),
        notes: formData.get('notes')
    };

    // Here you would typically send this data to your backend
    console.log('Reservation data:', reservationData);
    
    // Show success message
    alert('Reservation submitted successfully! Please visit our office for payment and vehicle pick-up.');
    modal.style.display = 'none';
}

// Calculate rental duration and total price
function calculatePrice() {
    const pickupDate = new Date(document.querySelector('input[name="pickupDate"]').value);
    const returnDate = new Date(document.querySelector('input[name="returnDate"]').value);
    const dailyRate = parseFloat(document.querySelector('.daily-rate').textContent.replace('₱', ''));

    const days = Math.ceil((returnDate - pickupDate) / (1000 * 60 * 60 * 24));
    const total = days * dailyRate;

    document.querySelector('.num-days').textContent = days;
    document.querySelector('.total-amount').textContent = `₱${total}`;
}
