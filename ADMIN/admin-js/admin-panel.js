document.addEventListener('DOMContentLoaded', function() {
    // Add this at the beginning of the DOMContentLoaded function
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const dateTimeStr = now.toLocaleDateString('en-US', options);
        document.getElementById('current-datetime').textContent = dateTimeStr;
    }

    // Update date/time immediately and then every second
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const burgerMenu = document.querySelector('.burger-menu');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    const overlay = document.querySelector('.overlay');

    burgerMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // Close sidebar when clicking on main content or overlay
    main.addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });

    overlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Add this to handle logout
    document.querySelector('.logout').addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const response = await fetch('../admin-php/logout.php');
            const data = await response.json();
            
            if (data.success) {
                // Clear any local storage if used
                localStorage.clear();
                sessionStorage.clear();
                
                // Updated redirect path to index.html
                window.location.href = '../../MAIN/main-html/index.html';
            } else {
                throw new Error(data.message || 'Logout failed');
            }
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    });

    document.querySelector('.logout').addEventListener('click', function(e) {
        e.preventDefault();
        // Clear localStorage
        localStorage.removeItem('employeeData');
        window.location.href = '../../MAIN/main-html/index.html';
    });

    // Simplified function to fetch sales rate
    async function fetchLatestSalesRate() {
        try {
            const response = await fetch('../admin-php/get_latest_sales.php');
            
            // Get the raw text first
            const rawText = await response.text();
            console.log('Raw response:', rawText); // Debug log
            
            // Try to parse the text as JSON
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.log('Invalid JSON response:', rawText);
                throw new Error('Invalid JSON response');
            }
            
            console.log('Parsed data:', data); // Debug log
            
            const rateElement = document.getElementById('revenue-rate');
            if (data.success && typeof data.salesRate === 'number') {
                const rate = data.salesRate;
                rateElement.textContent = `${rate.toFixed(2)}%`;
                rateElement.style.color = rate < 0 ? '#ff4444' : '#00C851';
            } else {
                throw new Error(data.message || 'Invalid data format');
            }
        } catch (error) {
            console.error('Error details:', error);
            document.getElementById('revenue-rate').textContent = '--.--%';
        }
    }

    // Updated function to fetch dashboard stats
    async function fetchDashboardStats() {
        try {
            const response = await fetch('../admin-php/get_dashboard_stats.php');
            
            // Get the raw text first
            const rawText = await response.text();
            console.log('Dashboard stats raw response:', rawText);
            
            // Try to parse the text as JSON
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                console.error('Dashboard JSON Parse Error:', parseError);
                console.log('Invalid Dashboard JSON response:', rawText);
                throw new Error('Invalid Dashboard JSON response');
            }
            
            console.log('Parsed dashboard data:', data);
            
            if (data.success && data.totalCars !== undefined && data.totalCustomers !== undefined) {
                document.getElementById('total-cars').textContent = data.totalCars;
                document.getElementById('total-customers').textContent = data.totalCustomers;
            } else {
                throw new Error(data.message || 'Invalid dashboard data format');
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            document.getElementById('total-cars').textContent = '--';
            document.getElementById('total-customers').textContent = '--';
        }
    }

    // Call both functions immediately and set up refresh
    fetchLatestSalesRate();
    fetchDashboardStats();
    setInterval(fetchLatestSalesRate, 30000);
    setInterval(fetchDashboardStats, 30000);
});
