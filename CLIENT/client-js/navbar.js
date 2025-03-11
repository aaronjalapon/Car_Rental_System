document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.logo');
    const navMenu = document.querySelector('.nav-menu');
    
    // Only add event listeners if elements exist
    if (logo && navMenu) {
        logo.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!logo.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });

        // Close menu when clicking links
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    const homeLink = document.querySelector('nav a[href*="index.html"]');
    
    if (homeLink) {
        homeLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                const response = await fetch('../client-php/logout.php');
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = this.href;
                } else {
                    throw new Error('Logout failed');
                }
            } catch (error) {
                console.error('Logout error:', error);
                // Redirect anyway
                window.location.href = this.href;
            }
        });
    }
});
