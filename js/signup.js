console.log('Script is running');

// First, let's make sure the script runs after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is loaded');
    
    // Get the form element
    const registrationForm = document.getElementById('registrationForm');
    console.log('Form:', registrationForm);
    
    // Check if form exists
    if (!registrationForm) {
        console.error('Registration form not found');
        return;
    }

    // Add submit event listener to the form
    registrationForm.addEventListener('submit', function(event) {
        // Prevent the default form submission
        event.preventDefault();
        
        // Get each form element individually and log its value
        const nameInput = document.getElementById('name');
        console.log('Name input:', nameInput);
        
        const emailInput = document.getElementById('email');
        console.log('Email input:', emailInput);
        
        const contactInput = document.getElementById('contact');
        console.log('Contact input:', contactInput);
        
        const passwordInput = document.getElementById('password');
        console.log('Password input:', passwordInput);
        
        const confirmPasswordInput = document.getElementById('confirmPassword');
        console.log('Confirm password input:', confirmPasswordInput);
        
        const dlpicInput = document.getElementById('dlpic');
        console.log('Driver\'s license input:', dlpicInput);

        // Only proceed if all elements exist
        if (!nameInput || !emailInput || !contactInput || !passwordInput || !confirmPasswordInput || !dlpicInput) {
            console.error('One or more form elements not found');
            return;
        }

        // Create FormData object
        const formData = new FormData();
        
        // Add form data
        formData.append('name', nameInput.value.trim());
        formData.append('email', emailInput.value.trim());
        formData.append('contact', contactInput.value.trim());
        formData.append('password', passwordInput.value);
        formData.append('confirmPassword', confirmPasswordInput.value);

        // Check if a file is selected
        if (dlpicInput.files.length > 0) {
            formData.append('dlpic', dlpicInput.files[0]);
        } else {
            console.error('No file selected for dlpic');
            alert('Please select a file for the driver\'s license.');
            return;
        }

        // Submit the form data
        fetch('../php/signup.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Registration successful! Welcome to Car Rental Services.');
                window.location.href = '../html/login.html';
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during registration. Please try again.');
        });
    });
});