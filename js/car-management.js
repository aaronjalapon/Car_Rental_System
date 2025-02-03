document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('carModal');
    const form = document.getElementById('carForm');
    const searchInput = document.querySelector('.search-box input');
    const closeBtn = modal.querySelector('.close');

    // Modal functions
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

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close button functionality
    closeBtn.addEventListener('click', closeModal);

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Add form data handling logic here
        closeModal();
    });

    // Search functionality
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        // Add search logic here
    });

    // Filter handling
    document.getElementById('brandFilter').addEventListener('change', function(e) {
        // Add brand filter logic here
    });

    document.getElementById('typeFilter').addEventListener('change', function(e) {
        // Add type filter logic here
    });
});
