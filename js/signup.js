document.getElementById('registrationForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const driversLicense = document.getElementById('driversLicense').files[0];

    if (!firstName || !lastName || !email || !contact || !password || !confirmPassword || !driversLicense) {
        alert('Please fill in all fields and upload your Driver’s License.');
        return;
    }

    if (!/^[0-9]{10,15}$/.test(contact)) {
        alert('Contact number must be between 10 and 15 digits.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }

    // Prepare form data for submission
    const formData = new FormData();
    formData.append('fname', firstName);
    formData.append('lname', lastName);
    formData.append('email', email);
    formData.append('contact', contact);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    formData.append('dlpic', driversLicense);

    // Submit form data via AJAX
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