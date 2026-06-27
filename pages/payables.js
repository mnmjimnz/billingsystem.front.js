let payablesList = [];
let paymentModalInstance = null;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    paymentModalInstance = new bootstrap.Modal(document.getElementById('paymentModal'));
    await loadPayables();
    await loadTotalPending();
});

async function loadTotalPending() {
    try {
        const pending = await ApiClient.request('/Payables/pending');
        const total = pending.reduce((sum, p) => sum + p.balance, 0);
        document.getElementById('total-pending').innerText = `$${total.toFixed(2)}`;
    } catch(e) {
        console.error("Error cargando total pendiente", e);
    }
}

async function loadPayables(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Payables/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        const tbody = document.getElementById('payables-table-body');
        tbody.innerHTML = '';
        
        payablesList = result.items || [];
        payablesList.forEach(p => {
            const dueDate = new Date(p.dueDate).toLocaleDateString();
            const isOverdue = new Date(p.dueDate) < new Date() && p.balance > 0;
            
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 text-secondary">#${p.id}</td>
                    <td><a href="#" class="text-decoration-none">C-${p.purchaseId}</a></td>
                    <td>${p.supplierName || 'Prov-'+p.supplierId}</td>
                    <td class="fw-semibold text-dark">$${p.totalDebt.toFixed(2)}</td>
                    <td class="text-success">$${p.amountPaid.toFixed(2)}</td>
                    <td class="fw-bold text-danger">$${p.balance.toFixed(2)}</td>
                    <td>
                        <span class="badge ${isOverdue ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill px-3">
                            <i class="bi ${isOverdue ? 'bi-exclamation-circle' : 'bi-clock'} me-1"></i> ${dueDate}
                        </span>
                    </td>
                    <td class="text-end pe-4">
                        ${p.balance > 0 ? `
                        <button class="btn btn-sm btn-primary rounded-pill px-3 shadow-sm" onclick="openPaymentModal(${p.id}, ${p.balance})">
                            Abonar <i class="bi bi-arrow-right ms-1"></i>
                        </button>` : `<span class="badge bg-success">Pagado</span>`}
                    </td>
                </tr>
            `;
        });
        
        renderPagination('pagination-container', result, 'loadPayables');
    } catch(e) {
        console.error("Error cargando cuentas por pagar", e);
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadPayables(1);
    }, 500);
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
