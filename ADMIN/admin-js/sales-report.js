document.addEventListener('DOMContentLoaded', function() {
    fetchSalesData('monthly');

    document.getElementById('timeRange').addEventListener('change', function(e) {
        fetchSalesData(e.target.value);
    });
});

function fetchSalesData(timeRange = 'monthly') {
    showLoading();
    fetch(`../admin-php/sales-report.php?timeRange=${timeRange}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();  // First get the raw response
        })
        .then(text => {
            try {
                // Try to parse the response as JSON
                const data = JSON.parse(text);
                if (data.success) {
                    updateDashboard(data.data, timeRange);
                } else {
                    console.error('Server error:', data.message);
                    showError('Failed to load data: ' + data.message);
                }
            } catch (e) {
                console.error('Parse error:', e);
                console.log('Raw response:', text);
                showError('Invalid server response');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showError('Network error occurred');
        })
        .finally(() => {
            hideLoading();
        });
}

function showLoading() {
    // Add loading overlay to charts
    document.querySelectorAll('.chart-container').forEach(container => {
        container.style.opacity = '0.5';
    });
}

function hideLoading() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.style.opacity = '1';
    });
}

function showError(message) {
    alert(message); // You can replace this with a better error UI
}

function updateDashboard(data, timeRange) {
    // Update stats with animations
    const totalRevenueElement = document.getElementById('totalRevenue');
    if (data.totalRevenue && data.totalRevenue.amount !== undefined) {
        totalRevenueElement.textContent = '₱' + formatNumber(data.totalRevenue.amount, true);
        
        // Update trend
        const trendSpan = document.getElementById('revenueTrend');
        const percentageSpan = trendSpan.querySelector('.percentage');
        const icon = trendSpan.querySelector('i');
        
        const salesRate = data.totalRevenue.salesRate;
        
        if (salesRate > 0) {
            trendSpan.className = 'trend positive';
            icon.className = 'fas fa-arrow-up';
        } else if (salesRate < 0) {
            trendSpan.className = 'trend negative';
            icon.className = 'fas fa-arrow-down';
        } else {
            trendSpan.className = 'trend neutral';
            icon.className = 'fas fa-minus';
        }
        
        percentageSpan.textContent = `${salesRate}%`;
    }

    // Update other stats
    updateStatCard('totalRentals', data.totalRentals, '', data.trends.rentals, false);
    updateStatCard('activeRentals', data.activeRentals, '', data.trends.active, false);

    // Update charts
    updateRevenueChart(data.monthlyRevenue, timeRange);
    updateCarTypeChart(data.carTypeStats);
}

function updateStatCard(elementId, value, prefix = '', trend = { change: 0, trend: 'neutral' }, isDecimal = true) {
    // Update main value with animation
    animateValue(elementId, parseFloat(value), prefix, isDecimal);

    // Update trend indicator
    const card = document.getElementById(elementId).parentElement;
    const trendSpan = card.querySelector('.trend');
    const absoluteChange = Math.abs(trend.change);
    const icon = trend.trend === 'positive' ? 'fa-arrow-up' : 
                (trend.trend === 'negative' ? 'fa-arrow-down' : 'fa-minus');

    trendSpan.className = `trend ${trend.trend}`;
    trendSpan.innerHTML = `${trend.change >= 0 ? '+' : ''}${absoluteChange}% <i class="fas ${icon}"></i>`;
}

function animateValue(elementId, value, prefix = '', isDecimal = true) {
    const element = document.getElementById(elementId);
    const start = parseFloat(element.textContent.replace(/[^0-9.-]+/g, "")) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = start + (value - start) * progress;
        element.textContent = `${prefix}${formatNumber(current, isDecimal)}`;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Add global chart variables
let revenueChart = null;
let carTypeChart = null;

function getDefaultLabels(timeRange) {
    switch (timeRange) {
        // case 'daily':
            // return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        case 'weekly':
            return Array.from({length: 4}, (_, i) => `Week ${i + 1}`);
        case 'monthly':
            return ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
        case 'yearly':
            const currentYear = new Date().getFullYear();
            return Array.from({length: 10}, (_, i) => (currentYear - 9 + i).toString());
        default:
            return [];
    }
}

function updateRevenueChart(revenueData, timeRange) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    if (revenueChart) {
        revenueChart.destroy();
    }

    // Get maximum value for setting y-axis scale
    const revenues = revenueData.map(item => item.revenue);
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);
    const padding = (maxRevenue - minRevenue) * 0.2;
    const yAxisMax = maxRevenue + padding;
    const yAxisMin = Math.max(0, minRevenue - padding);

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: revenueData.map(item => item.period),
            datasets: [{
                label: 'Revenue',
                data: revenueData.map(item => item.revenue),
                borderColor: '#ff1a1a',
                backgroundColor: 'rgba(219, 0, 0, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ff1a1a',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMin: yAxisMin,
                    suggestedMax: yAxisMax,
                    ticks: {
                        callback: value => '₱' + formatNumber(value),
                        color: '#cdcdcd',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cdcdcd',
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        autoSkip: false
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => '₱' + formatNumber(context.parsed.y)
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateCarTypeChart(carStats) {
    const ctx = document.getElementById('carTypeChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (carTypeChart) {
        carTypeChart.destroy();
    }
    
    carTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: carStats.map(stat => stat.type),
            datasets: [{
                data: carStats.map(stat => stat.count),
                backgroundColor: [
                    '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function formatNumber(number, isDecimal = true) {
    return isDecimal ? 
        number.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) :
        Math.round(number).toLocaleString('en-PH');
}

window.exportReport = async function() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Car Rental Sales Report', 20, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

        // Add statistics
        doc.setFontSize(14);
        doc.text('Summary Statistics', 20, 45);
        doc.setFontSize(12);
        doc.text(`Total Revenue: ${document.getElementById('totalRevenue').textContent}`, 25, 55);
        doc.text(`Total Rentals: ${document.getElementById('totalRentals').textContent}`, 25, 65);
        doc.text(`Active Rentals: ${document.getElementById('activeRentals').textContent}`, 25, 75);

        // Convert charts to images
        const revenueChart = document.getElementById('revenueChart');
        const carTypeChart = document.getElementById('carTypeChart');
        
        // Revenue Chart
        const revenueImage = await html2canvas(revenueChart);
        doc.text('Revenue Trend', 20, 95);
        doc.addImage(revenueImage.toDataURL('image/png'), 'PNG', 20, 100, 170, 80);

        // Car Types Chart
        const carTypesImage = await html2canvas(carTypeChart);
        doc.addPage();
        doc.text('Popular Car Types Distribution', 20, 20);
        doc.addImage(carTypesImage.toDataURL('image/png'), 'PNG', 20, 30, 170, 80);

        // Save PDF
        const filename = `car_rental_sales_report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        console.log('Report exported successfully');
    } catch (error) {
        console.error('Error exporting report:', error);
        alert('Error generating report. Please try again.');
    }
}
