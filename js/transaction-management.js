document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');

    window.openModal = function() {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
        populateReservations();
    };

    window.closeModal = function() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
        }, 300);
    };

    // Add click outside modal to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

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
