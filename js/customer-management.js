document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    const selectAll = document.getElementById('selectAll');
    const addBtn = document.querySelector('.add-btn');
    const closeBtn = document.querySelector('.modal .close');

    // Toggle select all checkboxes
    selectAll.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.row-select');
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
    });

    // Handle pagination
    document.querySelector('.pagination').addEventListener('click', function(e) {
        if (e.target.matches('button')) {
            // Add pagination logic here
        }
    });

    // Open modal with animation
    addBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.querySelector('.modal-title').textContent = 'Add New Customer';
    });

    // Close modal with animation
    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
        form.reset();
    }

    closeBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        // Add your form submission logic here
        
        modal.style.display = 'none';
        form.reset();
    });

    // Edit customer
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            document.querySelector('.modal-title').textContent = 'Edit Customer';
            // Populate form with customer data
        });
    });

    // Search functionality
    document.querySelector('.search-box input').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        // Add search logic here
    });
});
