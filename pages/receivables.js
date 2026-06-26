let paymentModalInstance;
let currentBalance = 0;

document.addEventListener('DOMContentLoaded', async () => {
    paymentModalInstance = new bootstrap.Modal(document.getElementById('paymentModal'));
    await loadReceivables();
});

async function loadReceivables() {
    try {
        const data = await ApiClient.request('/Receivables');
        const tbody = document.getElementById('receivables-table-body');
        tbody.innerHTML = '';

        data.forEach(item => {
            const isPaid = item.status === 'PAID';
            const badgeClass = isPaid ? 'bg-success' : 'bg-warning text-dark';
            const badgeText = isPaid ? 'Pagado' : 'Pendiente';
            
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold text-secondary">#${item.id}</td>
                    <td>${item.customerName}</td>
                    <td><span class="badge bg-light text-dark border">${item.ticketNumber}</span></td>
                    <td>${new Date(item.dueDate).toLocaleDateString()}</td>
                    <td>$${item.totalDebt.toFixed(2)}</td>
                    <td class="text-success">$${item.amountPaid.toFixed(2)}</td>
                    <td class="text-danger fw-bold">$${item.balance.toFixed(2)}</td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                    <td class="text-end">
                        ${!isPaid ? `<button class="btn btn-sm btn-primary shadow-sm" onclick="openPaymentModal(${item.id}, ${item.balance})"><i class="bi bi-cash-coin me-1"></i> Abonar</button>` : ''}
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading receivables", e);
    }
}

function openPaymentModal(id, balance) {
    document.getElementById('payment-account-id').value = id;
    document.getElementById('payment-balance').value = `$${balance.toFixed(2)}`;
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-amount').max = balance;
    document.getElementById('payment-notes').value = '';
    currentBalance = balance;
    paymentModalInstance.show();
}

async function savePayment() {
    const id = document.getElementById('payment-account-id').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const notes = document.getElementById('payment-notes').value;

    if (!amount || amount <= 0) {
        alert('Ingrese un monto válido mayor a 0');
        return;
    }

    if (amount > currentBalance) {
        alert(`El monto no puede superar el saldo pendiente de $${currentBalance.toFixed(2)}`);
        return;
    }

    try {
        await ApiClient.request(`/Receivables/${id}/pay`, 'POST', {
            amount: amount,
            notes: notes
        });
        showToast('Abono registrado correctamente', 'success');
        paymentModalInstance.hide();
        await loadReceivables();
    } catch (e) {
        alert('Error al procesar el abono');
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
