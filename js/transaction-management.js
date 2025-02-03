document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');

    window.openModal = function() {
        modal.style.display = 'block';
        populateReservations();
    };

    window.closeModal = function() {
        modal.style.display = 'none';
        form.reset();
    };

    function populateReservations() {
        // Add reservation population logic here
    }

    // Form handling
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Add transaction data handling logic here
        closeModal();
    });

    // Search functionality
    document.querySelector('.search-box input').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        // Add search logic here
    });

    // Status update handling
    window.updateStatus = function(transactionId, newStatus) {
        // Add status update logic here
    };
});
