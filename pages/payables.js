let payablesList = [];
let paymentModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    paymentModalInstance = new bootstrap.Modal(document.getElementById('paymentModal'));
    await loadPayables();
});

async function loadPayables() {
    try {
        payablesList = await ApiClient.request('/Payables/pending');
        renderPayables();
        
        const total = payablesList.reduce((sum, p) => sum + p.balance, 0);
        document.getElementById('total-pending').innerText = `$${total.toFixed(2)}`;
    } catch(e) {
        console.error("Error cargando cuentas por pagar", e);
    }
}

function renderPayables() {
    const tbody = document.getElementById('payables-table-body');
    tbody.innerHTML = '';
    
    if (payablesList) {
        payablesList.forEach(p => {
            const dueDate = new Date(p.dueDate).toLocaleDateString();
            const isOverdue = new Date(p.dueDate) < new Date();
            
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 text-secondary">#${p.id}</td>
                    <td><a href="#" class="text-decoration-none">C-${p.purchaseId}</a></td>
                    <td>Prov-${p.supplierId}</td>
                    <td class="fw-semibold text-dark">$${p.totalDebt.toFixed(2)}</td>
                    <td class="text-success">$${p.amountPaid.toFixed(2)}</td>
                    <td class="fw-bold text-danger">$${p.balance.toFixed(2)}</td>
                    <td>
                        <span class="badge ${isOverdue ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill px-3">
                            <i class="bi ${isOverdue ? 'bi-exclamation-circle' : 'bi-clock'} me-1"></i> ${dueDate}
                        </span>
                    </td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-primary rounded-pill px-3 shadow-sm" onclick="openPaymentModal(${p.id}, ${p.balance})">
                            Abonar <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
}

function openPaymentModal(id, balance) {
    document.getElementById('payableId').value = id;
    document.getElementById('currentBalance').value = `$${balance.toFixed(2)}`;
    document.getElementById('paymentAmount').value = balance.toFixed(2);
    document.getElementById('paymentAmount').max = balance;
    document.getElementById('paymentNotes').value = '';
    
    paymentModalInstance.show();
}

async function savePayment() {
    const accountId = document.getElementById('payableId').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const notes = document.getElementById('paymentNotes').value;

    if (!amount || amount <= 0) {
        showToast('Ingrese un monto válido.', 'error');
        return;
    }

    const payload = {
        amount: amount,
        notes: notes
    };

    try {
        const btn = document.getElementById('btnSavePayment');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';

        await ApiClient.request(`/Payables/${accountId}/payments`, 'POST', payload);
        
        showToast('Abono registrado exitosamente', 'success');
        paymentModalInstance.hide();
        await loadPayables();
    } catch (e) {
        showToast('Error al registrar el abono', 'error');
        console.error(e);
    } finally {
        const btn = document.getElementById('btnSavePayment');
        btn.disabled = false;
        btn.innerHTML = 'Procesar Pago';
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
