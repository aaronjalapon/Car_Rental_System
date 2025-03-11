document.addEventListener('DOMContentLoaded', function() {
    // Fetch user profile data
    fetchUserProfile();
});

async function fetchUserProfile() {
    try {
        const response = await fetch('../client-php/get_profile.php');
        const data = await response.json();
        
        if (data.success) {
            // Update personal information
            document.getElementById('name').value = data.user.name;
            document.getElementById('email').value = data.user.email;
            document.getElementById('contact').value = data.user.contact;
            
            // Update license status
            const licenseStatus = document.getElementById('licenseStatus');
            if (data.user.license_verified === 1) {
                licenseStatus.textContent = 'Verified';
                licenseStatus.className = 'status-badge status-verified';
            } else {
                licenseStatus.textContent = 'Not Verified';
                licenseStatus.className = 'status-badge status-not-verified';
            }
            
            // Update last rental
            const lastRental = document.getElementById('lastRental');
            if (data.user.lastRental) {
                const rentalDate = new Date(data.user.lastRental);
                lastRental.textContent = rentalDate.toLocaleDateString();
            } else {
                lastRental.textContent = 'No previous rentals';
            }
            
            // Update license image
            if (data.user.dlpic) {
                document.getElementById('licenseImage').src = '../../' + data.user.dlpic;
            }
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../client-php/profile-management.php');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load profile');
        }

        // Populate form fields
        document.getElementById('name').value = data.data.name;
        document.getElementById('email').value = data.data.email;
        document.getElementById('contact').value = data.data.contact;

        // Update license status
        const verificationStatus = document.getElementById('verificationStatus');
        if (verificationStatus) {
            if (data.data.license_verified === 1) {
                verificationStatus.textContent = 'Verified';
                verificationStatus.className = 'status-badge status-verified';
            } else {
                verificationStatus.textContent = 'Not Verified';
                verificationStatus.className = 'status-badge status-not-verified';
            }
        }

        // Display license image
        const licenseImage = document.getElementById('licenseImage');
        if (licenseImage) {
            if (data.data.dlpic && data.data.dlpic.trim() !== '') {
                licenseImage.src = '../../' + data.data.dlpic;
                licenseImage.onerror = function() {
                    this.src = '../../IMAGES/default-license.png';
                    this.onerror = null;
                };
            } else {
                licenseImage.src = '../../IMAGES/default-license.png';
            }
        }

        // Show last rental date
        const lastRental = document.getElementById('lastRental');
        if (lastRental) {
            if (data.data.lastRental) {
                const rentalDate = new Date(data.data.lastRental);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                lastRental.textContent = rentalDate.toLocaleDateString('en-US', options);
            } else {
                lastRental.textContent = 'No previous rentals';
            }
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile data. Please try again later.');
    }

    // Handle profile form submission
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value
        };
        saveProfileData(formData);
    });

    // Handle password change form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match!');
            return;
        }
        changePassword(currentPassword, newPassword);
    });

    // Handle license image upload
    const licenseUpload = document.getElementById('licenseUpload');
    const uploadButton = document.querySelector('.upload-license-btn');
    const licenseImage = document.getElementById('licenseImage');

    uploadButton.addEventListener('click', () => {
        licenseUpload.click();
    });

    licenseUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                licenseImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
            uploadLicenseImage(file);
        }
    });

    async function loadProfileData() {
        try {
            const response = await fetch('/php/profile-management.php');
            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                document.getElementById('fullName').value = data.name;
                document.getElementById('email').value = data.email;
                document.getElementById('phone').value = data.contact;
                document.getElementById('address').value = data.address;
                
                // If there's a license image, display it
                if (data.license) {
                    document.getElementById('licenseImage').src = data.license;
                }
            } else {
                showAlert('Failed to load profile data', 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showAlert('Error loading profile data', 'error');
        }
    }

    async function saveProfileData(data) {
        try {
            const response = await fetch('/php/profile-management.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.success) {
                showAlert('Profile updated successfully', 'success');
            } else {
                showAlert(result.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showAlert('Error saving profile data', 'error');
        }
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }
});

// Function to change password
async function changePassword(currentPassword, newPassword) {
    try {
        // Here you would typically make an API call to change the password
        console.log('Changing password...');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Password changed successfully!');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to change password. Please try again.');
    }
}

// Function to upload license image
async function uploadLicenseImage(file) {
    try {
        // Here you would typically upload the file to your server
        console.log('Uploading license image:', file.name);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('License image uploaded successfully!');
    } catch (error) {
        console.error('Error uploading license:', error);
        alert('Failed to upload license image. Please try again.');
    }
}
