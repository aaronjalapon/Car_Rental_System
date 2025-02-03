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

    // Open modal
    addBtn.addEventListener('click', function() {
        modal.style.display = 'block';
        document.querySelector('.modal-title').textContent = 'Add New Customer';
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        form.reset();
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            form.reset();
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
            const row = this.closest('tr');
            document.querySelector('.modal-title').textContent = 'Edit Customer';
            // Populate form with customer data
            modal.style.display = 'block';
        });
    });

    // Search functionality
    document.querySelector('.search-box input').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        // Add search logic here
    });
});
