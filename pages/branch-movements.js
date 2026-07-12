let movementsList = [];
let branchesList = [];
let usersList = [];
let accountsList = [];
let movementModalInstance = null;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

const categories = {
    IN: ['Inyección de Capital', 'Ajuste Positivo', 'Préstamo', 'Otro Ingreso'],
    OUT: ['Pago de Servicios', 'Pago de Planilla', 'Compra Insumos', 'Pago Impuestos', 'Otro Egreso']
};

document.addEventListener('DOMContentLoaded', async () => {
    movementModalInstance = new bootstrap.Modal(document.getElementById('movementModal'));
    await loadDependencies();
    updateCategories();
});

async function loadDependencies() {
    try {
        branchesList = await ApiClient.request('/Branches');
        const branchSelect = document.getElementById('branchFilter');
        branchesList.forEach(b => {
            branchSelect.innerHTML += `<option value="${b.id}">${b.name} (Disp: $${(b.availableFunds || 0).toFixed(2)})</option>`;
        });

        if (branchesList.length > 0) {
            branchSelect.value = branchesList[0].id;
            await loadMovements(1);
        }

        usersList = await ApiClient.request('/Users');
        const empSelect = document.getElementById('movEmployee');
        usersList.forEach(u => {
            empSelect.innerHTML += `<option value="${u.id}">${u.fullName}</option>`;
        });

        accountsList = await ApiClient.request('/Accounting/accounts');
    } catch (e) {
        console.error("Error cargando dependencias", e);
    }
}

async function loadMovements(page = 1) {
    const branchId = document.getElementById('branchFilter').value;
    if (!branchId) return;

    try {
        currentPage = page;
        // In a real app we would have a paginated endpoint per branch, for now just load all for the branch
        // The backend `GetByBranchIdAsync` doesn't support pagination yet, so we just request them and handle locally or update backend.
        // Wait, earlier I created GetByBranch in BranchMovementsController that returns all. Let's use it.
        const result = await ApiClient.request(`/BranchMovements/branch/${branchId}/paged?page=${page}&pageSize=10`);
        const items = result.items || [];
        
        let filtered = items;
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            filtered = items.filter(m => (m.category || '').toLowerCase().includes(searchLower) || (m.description || '').toLowerCase().includes(searchLower));
        }

        movementsList = filtered;
        renderMovements();
        renderPagination('pagination-container', result, 'loadMovements');
    } catch (e) {
        console.error(e);
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadMovements(1);
    }, 500);
}

function renderMovements() {
    const tbody = document.getElementById('movements-table-body');
    tbody.innerHTML = '';
    
    if (movementsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No se encontraron movimientos.</td></tr>`;
        return;
    }

    movementsList.forEach(m => {
        const typeBadge = m.type === 'IN' 
            ? '<span class="badge bg-success-subtle text-success">Ingreso</span>'
            : '<span class="badge bg-danger-subtle text-danger">Egreso</span>';
            
        const amountClass = m.type === 'IN' ? 'text-success' : 'text-danger';
        const prefix = m.type === 'IN' ? '+' : '-';
        
        const dateStr = new Date(m.date).toLocaleString();

        tbody.innerHTML += `
            <tr>
                <td class="ps-4 text-secondary">#${m.id}</td>
                <td>${dateStr}</td>
                <td class="fw-semibold">${m.category}</td>
                <td>${typeBadge}</td>
                <td class="fw-bold ${amountClass}">${prefix}$${m.amount.toFixed(2)}</td>
                <td>${m.description || '-'}</td>
                <td><span class="badge bg-light text-dark border"><i class="bi bi-person me-1"></i>${m.userName || m.userId}</span></td>
            </tr>
        `;
    });
}

function updateCategories() {
    const type = document.getElementById('movType').value;
    const catSelect = document.getElementById('movCategory');
    catSelect.innerHTML = '';
    
    categories[type].forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    
    // Update accounts list
    const accSelect = document.getElementById('movAccountId');
    accSelect.innerHTML = '<option value="">-- No Registrar en Contabilidad --</option>';
    
    let filteredAccounts = [];
    if (type === 'IN') {
        filteredAccounts = accountsList.filter(a => a.type === 'Revenue' && a.allowsTransactions);
    } else {
        filteredAccounts = accountsList.filter(a => a.type === 'Expense' && a.allowsTransactions);
    }
    
    filteredAccounts.forEach(a => {
        accSelect.innerHTML += `<option value="${a.id}">${a.code} - ${a.name}</option>`;
    });

    toggleEmployeeField();
}

function toggleEmployeeField() {
    const cat = document.getElementById('movCategory').value;
    const empGroup = document.getElementById('employeeGroup');
    const amountInput = document.getElementById('movAmount');
    
    if (cat === 'Pago de Planilla') {
        empGroup.style.display = 'block';
        document.getElementById('movEmployee').required = true;
        amountInput.readOnly = true;
        updateEmployeeSalary();
    } else {
        empGroup.style.display = 'none';
        document.getElementById('movEmployee').required = false;
        document.getElementById('movEmployee').value = '';
        amountInput.readOnly = false;
        amountInput.value = '';
    }
}

function updateEmployeeSalary() {
    const empId = document.getElementById('movEmployee').value;
    const amountInput = document.getElementById('movAmount');
    
    if (!empId) {
        amountInput.value = '';
        return;
    }
    
    const user = usersList.find(u => u.id == empId);
    if (user && user.salary) {
        amountInput.value = user.salary.toFixed(2);
    } else {
        amountInput.value = '0.00';
    }
}

function clearForm() {
    document.getElementById('movementForm').reset();
    document.getElementById('movAmount').readOnly = false;
    updateCategories();
}

async function saveMovement() {
    const branchId = document.getElementById('branchFilter').value;
    if (!branchId) {
        showToast('Debe seleccionar una sucursal primero.', 'warning');
        return;
    }

    const type = document.getElementById('movType').value;
    const category = document.getElementById('movCategory').value;
    const amount = parseFloat(document.getElementById('movAmount').value);
    const description = document.getElementById('movDescription').value;
    const employeeId = document.getElementById('movEmployee').value;
    const accountId = document.getElementById('movAccountId').value;
    const paymentMethod = document.getElementById('movPaymentMethod').value;

    if (!amount || amount <= 0) {
        showToast('El monto debe ser mayor a 0.', 'error');
        return;
    }

    if (category === 'Pago de Planilla' && !employeeId) {
        showToast('Debe seleccionar un empleado para el pago de planilla.', 'error');
        return;
    }

    const payload = {
        branchId: parseInt(branchId),
        type: type,
        category: category,
        amount: amount,
        description: description,
        employeeId: employeeId ? parseInt(employeeId) : null,
        accountId: accountId ? parseInt(accountId) : null,
        paymentMethod: paymentMethod
    };

    try {
        const btn = document.getElementById('btnSaveMovement');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

        await ApiClient.request('/BranchMovements', 'POST', payload);
        showToast('Movimiento registrado exitosamente', 'success');
        
        movementModalInstance.hide();
        
        // Reload branches to update funds
        const oldBranchId = branchId;
        await loadDependencies(); // Reload funds in dropdown
        document.getElementById('branchFilter').value = oldBranchId;
        
        await loadMovements();
    } catch (e) {
        showToast(e.message || 'Error al registrar el movimiento', 'error');
        console.error(e);
    } finally {
        const btn = document.getElementById('btnSaveMovement');
        btn.disabled = false;
        btn.innerHTML = 'Guardar Movimiento';
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
