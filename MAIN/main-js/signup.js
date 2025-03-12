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
    registrationForm.addEventListener('submit', async function(event) {
        // Prevent the default form submission
        event.preventDefault();
        
        try {
            // Validate form data
            const formData = new FormData(this);
            const file = formData.get('dlpic');
            
            // Validate file
            if (!file || file.size === 0) {
                throw new Error('Please select a driver\'s license image');
            }

            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                throw new Error('Please select a valid JPG or PNG image');
            }

            // Log form data for debugging
            console.log('Submitting form data:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            const response = await fetch('../main-php/signup.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Raw server response:', text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                throw new Error('Server returned invalid data');
            }

            if (data.status === 'success') {
                alert('Registration successful! Please log in.');
                window.location.href = 'login.html';
            } else {
                throw new Error(data.message || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'Registration failed. Please try again.');
        }
    });

    // Add password toggle functionality
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    });
});