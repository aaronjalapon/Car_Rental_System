document.addEventListener('DOMContentLoaded', function() {
    console.log('Transaction management script loaded');
    fetchTransactions();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
});

function fetchTransactions() {
    console.log('Fetching transactions...');
    fetch('../admin-php/transaction-management.php')
        .then(response => {
            console.log('Response received:', response);
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);
            if (data.success) {
                displayTransactions(data.data);
            } else {
                console.error('Error:', data.message);
            }
        })
        .catch(error => console.error('Error fetching transactions:', error));
}

function displayTransactions(transactions) {
    const tbody = document.querySelector('tbody');
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.id}</td>
            <td>${t.reservationID}</td>
            <td>${t.customerName}</td>
            <td>${t.transactionDate}</td>
            <td>₱${parseFloat(t.totalAmount).toFixed(2)}</td>
            <td><span class="status ${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span></td>
            <td class="actions">
                <button class="edit-btn" onclick="editTransaction(${t.id})"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    console.log(`Displayed ${transactions.length} transactions`);
}

function editTransaction(id) {
    console.log('Edit transaction:', id);
    // Add edit functionality if needed
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        const formData = new FormData();
        formData.append('id', id);

        fetch('../admin-php/transaction-management-delete.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Transaction deleted successfully');
                fetchTransactions(); // Refresh the table
            } else {
                alert('Error deleting transaction: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting transaction');
        });
    }
}
