document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const addBtn = document.querySelector('.add-btn');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');

    // Open modal
    addBtn.addEventListener('click', function() {
        console.log('Opening modal'); // Debug line
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
        document.querySelector('.modal-title').textContent = 'Add New Employee';
    });

    // Close modal handlers
    function closeModal() {
        console.log('Closing modal'); // Debug line
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);

    cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Stop propagation on modal content
    modal.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        console.log('Form submitted'); // Debug line
        // Add your form submission logic here
        
        closeModal();
    });

    // Edit employee
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            document.querySelector('.modal-title').textContent = 'Edit Employee';
            // Populate form with employee data
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('show'), 10);
        });
    });

    // Delete employee
    window.deleteEmployee = function(employeeId) {
        if (confirm('Are you sure you want to delete this employee?')) {
            // Add delete logic here
        }
    };
});
