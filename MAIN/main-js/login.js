document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const debug = document.getElementById('debug');

    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch('../main-php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                if (data.role === 'employee') {
                    window.location.href = '../../ADMIN/admin-html/admin-panel.html';
                } else {
                    window.location.href = '../../CLIENT/client-html/customer-rental.html';
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    });

    // Modal functionality
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeModal = document.getElementById('closeModal');

    if (forgotPasswordLink && forgotPasswordModal && closeModal) {
        forgotPasswordLink.onclick = function(e) {
            e.preventDefault();
            forgotPasswordModal.classList.remove('hidden');
        };

        closeModal.onclick = function() {
            forgotPasswordModal.classList.add('hidden');
        };
    }

    // Add password toggle functionality
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }
});
