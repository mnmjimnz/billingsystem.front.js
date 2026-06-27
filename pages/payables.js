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
        
        payablesList = (result.items || []).map(item => ({
            id: item.id,
            purchaseId: item.purchaseid !== undefined ? item.purchaseid : item.purchaseId,
            supplierName: item.suppliername !== undefined ? item.suppliername : item.supplierName,
            supplierId: item.supplierid !== undefined ? item.supplierid : item.supplierId,
            totalDebt: item.totaldebt !== undefined ? item.totaldebt : item.totalDebt,
            amountPaid: item.amountpaid !== undefined ? item.amountpaid : item.amountPaid,
            balance: item.balance !== undefined ? item.balance : item.balance,
            dueDate: item.duedate !== undefined ? item.duedate : item.dueDate,
            status: item.status !== undefined ? item.status : item.status
        }));
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
                        <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm me-2" onclick="viewDetails(${p.id})">
                            <i class="bi bi-eye"></i>
                        </button>
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

async function viewDetails(id) {
    const p = payablesList.find(x => x.id === id);
    if (!p) return;

    document.getElementById('detail-purchase-id').innerText = `C-${p.purchaseId}`;
    document.getElementById('detail-supplier').innerText = p.supplierName || 'Prov-' + p.supplierId;
    document.getElementById('detail-total').innerText = `$${p.totalDebt.toFixed(2)}`;
    document.getElementById('detail-paid').innerText = `$${p.amountPaid.toFixed(2)}`;
    document.getElementById('detail-balance').innerText = `$${p.balance.toFixed(2)}`;

    const tbody = document.getElementById('detail-payments-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Cargando historial...</td></tr>';
    
    new bootstrap.Modal(document.getElementById('detailsModal')).show();

    try {
        const payments = await ApiClient.request(`/Payables/${id}/payments`);
        tbody.innerHTML = '';
        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay abonos registrados.</td></tr>';
            return;
        }
        
        payments.forEach(pay => {
            const date = new Date(pay.paymentDate).toLocaleString();
            tbody.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td>Usuario ${pay.userId}</td>
                    <td class="fw-bold text-success">$${pay.amount.toFixed(2)}</td>
                    <td>${pay.notes || '-'}</td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar historial.</td></tr>';
        console.error(e);
    }
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
