document.addEventListener('DOMContentLoaded', function() {
    // Account Settings Form
    const accountSettingsForm = document.getElementById('accountSettingsForm');
    if (accountSettingsForm) {
        accountSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add your account settings update logic here
            alert('Account settings updated successfully!');
        });
    }

    // Rental Settings
    const lateFee = document.getElementById('lateFee');

    // Save rental settings
    const saveSettings = document.querySelector('.settings-card .save-btn');
    if (saveSettings) {
        saveSettings.addEventListener('click', function() {
            // Add your settings save logic here
            const settings = {
                lateFee: lateFee.value
            };
            localStorage.setItem('rentalSettings', JSON.stringify(settings));
            alert('Settings saved successfully!');
        });
    }

    // Load saved settings on page load
    loadSavedSettings();
});

function loadSavedSettings() {
    // Load rental settings
    const savedRentalSettings = localStorage.getItem('rentalSettings');
    if (savedRentalSettings) {
        const settings = JSON.parse(savedRentalSettings);
        document.getElementById('lateFee').value = settings.lateFee;
    }
}
