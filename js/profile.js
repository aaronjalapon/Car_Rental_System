document.addEventListener('DOMContentLoaded', () => {
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
});

// Function to save profile data
async function saveProfileData(data) {
    try {
        // Here you would typically make an API call to save the data
        console.log('Saving profile data:', data);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to update profile. Please try again.');
    }
}

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
