document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('reservationModal');
    const form = document.getElementById('reservationForm');
    const closeBtn = modal.querySelector('.close');

    window.openModal = function() {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
        populateCustomers();
        populateCars();
    };

    window.closeModal = function() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
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

    // Populate dropdown menus
    function populateCustomers() {
        // Add customer population logic here
    }

    function populateCars() {
        // Add car population logic here
    }

    // Date validation
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const startDate = new Date(form.startDate.value);
        const endDate = new Date(form.endDate.value);

        if (endDate <= startDate) {
            alert('End date must be after start date');
            return;
        }

        // Add reservation submission logic here
        closeModal();
    });
});
