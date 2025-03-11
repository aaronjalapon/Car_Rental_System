document.addEventListener('DOMContentLoaded', () => {
    loadReservations();
});

function loadReservations() {
    const container = document.getElementById('reservationsList');
    if (!container) {
        console.error('Container #reservationsList not found');
        return;
    }

    container.innerHTML = '<p class="loading">Loading your reservations...</p>';

    fetch('../client-php/my-reservations.php')
        .then(response => response.json())
        .then(reservations => {
            console.log('Fetched reservations:', reservations);

            if (!Array.isArray(reservations) || reservations.length === 0) {
                container.innerHTML = '<p class="no-reservations">No reservations found.</p>';
                return;
            }

            const reservationsList = reservations.map(reservation => `
                <div class="reservation-card">
                    <div class="card-header">
                        <h3>Reservation #${reservation.reservation_id || 'N/A'}</h3>
                        <span class="status">${reservation.reservation_status || 'N/A'}</span>
                    </div>
                    <div class="card-content">
                        <p><strong>Car:</strong> ${reservation.car_name || 'N/A'}</p>
                        <p><strong>Plate Number:</strong> ${reservation.plate_number || 'N/A'}</p>
                        <p><strong>Pick-up Date:</strong> ${reservation.pickup_date || 'N/A'}</p>
                        <p><strong>Return Date:</strong> ${reservation.return_date || 'N/A'}</p>
                        <p><strong>Daily Rate:</strong> ₱${reservation.daily_rate || '0.00'}</p>
                    </div>
                </div>
            `).join('');

            container.innerHTML = reservationsList;
        })
        .catch(error => {
            console.error('Error loading reservations:', error);
            container.innerHTML = '<p class="error-message">Error loading reservations. Please try again later.</p>';
        });
}
