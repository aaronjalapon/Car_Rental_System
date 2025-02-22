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
            window.location.href = '../html/admin-panel.html';  // Redirect to admin dashboard
        } else if (data.status === 'user') {
            alert(data.message);
            window.location.href = '../html/try.html';  // Redirect to user dashboard
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
});

// Forgot Password Modal Functionality
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeModal = document.getElementById('closeModal');
const resetPasswordForm = document.getElementById('resetPasswordForm');

// Open Modal
forgotPasswordLink.addEventListener('click', function (e) {
    e.preventDefault();
    forgotPasswordModal.classList.remove('hidden');
});

// Close Modal
closeModal.addEventListener('click', function () {
    forgotPasswordModal.classList.add('hidden');
});

// Handle Reset Password Form Submission
resetPasswordForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const resetEmail = document.getElementById('resetEmail').value.trim();

    if (!resetEmail) {
        alert('Please enter your email.');
        return;
    }

    // Simulate sending reset email
    alert(`A reset link has been sent to ${resetEmail}.`);
    forgotPasswordModal.classList.add('hidden');
});
