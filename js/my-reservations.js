async function fetchUserReservations() {
    try {
        const response = await fetch('api/get-reservations.php');
        const data = await response.json();
        console.log('Fetched reservations:', data); // Debug log
        return data;
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return [];
    }
}

async function fetchReservationDetails(reservationId) {
    try {
        const response = await fetch(`/api/get-reservations.php?action=details&id=${reservationId}`);
        if (!response.ok) throw new Error('Failed to fetch reservation details');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// DOM Elements
const reservationsGrid = document.querySelector('.reservations-grid');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchReservation');
const modal = document.getElementById('reservationModal');
const closeBtn = document.querySelector('.close');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const reservations = await fetchUserReservations();
    displayReservations(reservations);
    setupEventListeners();
});

function setupEventListeners() {
    statusFilter.addEventListener('change', handleFilters);
    searchInput.addEventListener('input', handleFilters);
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

function displayReservations(reservationsToShow) {
    console.log('Displaying reservations:', reservationsToShow); // Debug log
    
    if (!reservationsToShow || reservationsToShow.length === 0) {
        reservationsGrid.innerHTML = `
            <div class="no-reservations">
                <p>No reservations found.</p>
            </div>
        `;
        return;
    }

    reservationsGrid.innerHTML = reservationsToShow.map(reservation => `
        <div class="reservation-card">
            <span class="reservation-status status-${reservation.reservation_status}">
                ${reservation.reservation_status.charAt(0).toUpperCase() + reservation.reservation_status.slice(1)}
            </span>
            <div class="car-details">
                <img src="${reservation.car_image}" alt="${reservation.car_model}">
                <div>
                    <h3>${reservation.car_model}</h3>
                    <p>Reservation ID: ${reservation.reservation_id}</p>
                </div>
            </div>
            <div class="reservation-dates">
                <div>
                    <small>Pick-up</small>
                    <p>${formatDate(reservation.pickup_date)}</p>
                </div>
                <div>
                    <small>Return</small>
                    <p>${formatDate(reservation.return_date)}</p>
                </div>
            </div>
            <button class="view-details-btn" onclick="showReservationDetails('${reservation.reservation_id}')">
                View Details
            </button>
        </div>
    `).join('');
}

function handleFilters() {
    const statusValue = statusFilter.value;
    const searchValue = searchInput.value.toLowerCase();

    const filteredReservations = reservations.filter(reservation => {
        const matchesStatus = statusValue === 'all' || reservation.status === statusValue;
        const matchesSearch = 
            reservation.id.toLowerCase().includes(searchValue) ||
            reservation.carName.toLowerCase().includes(searchValue);
        return matchesStatus && matchesSearch;
    });

    displayReservations(filteredReservations);
}

async function showReservationDetails(reservationId) {
    const reservation = await fetchReservationDetails(reservationId);
    if (!reservation) return;

    const modalContent = document.getElementById('reservationDetails');
    modalContent.innerHTML = `
        <h2>Reservation Details</h2>
        <div class="reservation-info">
            <div class="car-details">
                <img src="${reservation.carImage}" alt="${reservation.carName}">
                <div>
                    <h3>${reservation.carName}</h3>
                    <p>Reservation ID: ${reservation.id}</p>
                    <p>Status: ${reservation.status}</p>
                </div>
            </div>
            <div class="dates-section">
                <div>
                    <h4>Pick-up Date</h4>
                    <p>${formatDate(reservation.pickupDate)}</p>
                </div>
                <div>
                    <h4>Return Date</h4>
                    <p>${formatDate(reservation.returnDate)}</p>
                </div>
            </div>
            <div class="payment-section">
                <h4>Payment Details</h4>
                <p>Total Amount: ₱${reservation.totalAmount}</p>
                <p>Payment Status: ${reservation.paymentStatus}</p>
            </div>
            <div class="notes-section">
                <h4>Notes</h4>
                <p>${reservation.notes}</p>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
