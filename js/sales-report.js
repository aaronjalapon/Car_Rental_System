document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    setupEventListeners();
    fetchSalesData('monthly');
});

function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    
    // Create gradient for the line chart
    const gradient = revenueCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(219, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(219, 0, 0, 0.02)');

    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Revenue',
                data: [45000, 52000, 59000, 68000, 72000, 85000, 89000, 98000, 105000, 112000, 125000, 135000],
                fill: {
                    target: 'origin',
                    above: gradient,
                },
                borderColor: '#ff1a1a',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#ff1a1a',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#ff1a1a',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,  // Add this
            layout: {        // Add this section
                padding: {
                    left: 10,
                    right: 20,
                    top: 20,
                    bottom: 10
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(40, 40, 40, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ff1a1a',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '₱' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#cdcdcd',
                        padding: 10,
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#cdcdcd',
                        padding: 10
                    }
                }
            }
        }
    });

    // Car Types Chart
    const carTypeCtx = document.getElementById('carTypeChart').getContext('2d');
    new Chart(carTypeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Sedan', 'SUV', 'Van', 'Luxury', 'Sports Car'],
            datasets: [{
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0',
                    '#F44336'
                ],
                borderColor: '#1a1a1a',
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#ffffff',
                        padding: 20,
                        font: {
                            size: 12
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label} (${data.datasets[0].data[i]}%)`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(33, 33, 33, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

// Add new functions for handling sales data
async function fetchSalesData(timeRange = 'monthly') {
    try {
        showLoading();
        const response = await fetch(`/api/sales?timeRange=${timeRange}`);
        const data = await response.json();
        updateSalesTable(data);
        updateSalesStats(data);
        hideLoading();
    } catch (error) {
        handleError(error);
    }
}

function updateSalesTable(sales) {
    const tbody = document.querySelector('.table-section tbody');
    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td>#S${sale.id.toString().padStart(3, '0')}</td>
            <td>#TR${sale.transactionID.toString().padStart(3, '0')}</td>
            <td>${formatDate(sale.transactionDate)}</td>
            <td>₱${formatAmount(sale.finalAmount)}</td>
            <td><span class="status ${sale.status}">${capitalizeFirst(sale.status)}</span></td>
        </tr>
    `).join('');
}

function updateSalesStats(sales) {
    const totalRevenue = sales.reduce((sum, sale) => 
        sale.status === 'completed' ? sum + parseFloat(sale.finalAmount) : sum, 0);
    
    const statsData = {
        totalRevenue: totalRevenue,
        completedSales: sales.filter(s => s.status === 'completed').length,
        pendingSales: sales.filter(s => s.status === 'pending').length,
        failureRate: calculateFailureRate(sales)
    };

    updateStatsDisplay(statsData);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-PH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatAmount(amount) {
    return parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function calculateFailureRate(sales) {
    const totalSales = sales.length;
    const failedSales = sales.filter(s => s.status === 'failed').length;
    return totalSales > 0 ? (failedSales / totalSales) * 100 : 0;
}

// Modify existing event listeners
function setupEventListeners() {
    document.getElementById('timeRange').addEventListener('change', function(e) {
        fetchSalesData(e.target.value);
    });

    document.querySelector('.export-btn').addEventListener('click', exportSalesReport);
}

function updateCharts(timeRange) {
    // This function would fetch new data based on the selected time range
    // and update the charts accordingly
    console.log('Updating charts for time range:', timeRange);
    // Add API call here to fetch new data
}

function exportReport() {
    // Implementation for exporting the report
    console.log('Exporting report...');
    // Add export logic here
}

// Add loading spinner
function showLoading() {
    // Implementation for showing loading state
}

function hideLoading() {
    // Implementation for hiding loading state
}

// Error handling
function handleError(error) {
    console.error('Error:', error);
    // Add error handling UI logic here
}
