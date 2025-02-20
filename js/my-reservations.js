// Sample reservation data (in a real application, this would come from a backend)
const reservations = [
    {
        id: "RES001",
        carId: 1,
        carName: "Toyota Camry",
        carImage: "/images/camry.jpg",
        pickupDate: "2024-01-15",
        returnDate: "2024-01-18",
        status: "active",
        totalAmount: 7500,
        paymentStatus: "paid",
        notes: "Pick up at main branch"
    },
    // Add more reservation data here
];

// DOM Elements
const reservationsGrid = document.querySelector('.reservations-grid');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchReservation');
const modal = document.getElementById('reservationModal');
const closeBtn = document.querySelector('.close');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
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
    reservationsGrid.innerHTML = reservationsToShow.map(reservation => `
        <div class="reservation-card">
            <span class="reservation-status status-${reservation.status}">
                ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
            </span>
            <div class="car-details">
                <img src="${reservation.carImage}" alt="${reservation.carName}">
                <div>
                    <h3>${reservation.carName}</h3>
                    <p>Reservation ID: ${reservation.id}</p>
                </div>
            </div>
            <div class="reservation-dates">
                <div>
                    <small>Pick-up</small>
                    <p>${formatDate(reservation.pickupDate)}</p>
                </div>
                <div>
                    <small>Return</small>
                    <p>${formatDate(reservation.returnDate)}</p>
                </div>
            </div>
            <button class="view-details-btn" onclick="showReservationDetails('${reservation.id}')">
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

function showReservationDetails(reservationId) {
    const reservation = reservations.find(r => r.id === reservationId);
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
