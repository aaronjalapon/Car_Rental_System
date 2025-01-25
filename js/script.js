document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    // Send the form data via AJAX
    fetch('../php/login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'admin') {
            alert(data.message);
            window.location.href = 'testAdmin.html';  // Redirect to admin dashboard
        } else if (data.status === 'user') {
            alert(data.message);
            window.location.href = 'test.html';  // Redirect to user dashboard
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
});