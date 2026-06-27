let branchesList = [];
let branchModalInstance;
let confirmStatusModalInstance;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;
let pendingStatusAction = null; // { id, action }

document.addEventListener('DOMContentLoaded', async () => {
    branchModalInstance = new bootstrap.Modal(document.getElementById('branchModal'));
    confirmStatusModalInstance = new bootstrap.Modal(document.getElementById('confirmStatusModal'));
    await loadBranches();
});

async function loadBranches(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Branches/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        const tbody = document.getElementById('branches-table-body');
        tbody.innerHTML = '';
        const branches = result.items || [];

        if (branches.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">
                <i class="bi bi-buildings fs-3 d-block mb-2"></i>No hay sucursales registradas.
            </td></tr>`;
        }

        branches.forEach(b => {
            const isClosed = b.status === 'CLOSED';
            const statusBadge = isClosed
                ? `<span class="badge bg-danger"><i class="bi bi-lock-fill me-1"></i>CERRADA</span>`
                : `<span class="badge bg-success"><i class="bi bi-unlock-fill me-1"></i>ABIERTA</span>`;

            const toggleBtn = isClosed
                ? `<button class="btn btn-sm btn-success me-1" onclick='promptToggle(${b.id}, "open", "${b.name}")' title="Aperturar Sucursal">
                       <i class="bi bi-unlock-fill"></i> Aperturar
                   </button>`
                : `<button class="btn btn-sm btn-warning me-1" onclick='promptToggle(${b.id}, "close", "${b.name}")' title="Cerrar Sucursal">
                       <i class="bi bi-lock-fill"></i> Cerrar
                   </button>`;

            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 text-muted">#${b.id}</td>
                    <td class="fw-semibold">${b.name}</td>
                    <td>
                        <div class="mb-1">${statusBadge}</div>
                        <small class="text-muted"><i class="bi bi-cash-coin me-1"></i>Fondos: <strong>$${(b.availableFunds || 0).toFixed(2)}</strong></small>
                    </td>
                    <td>${b.phone || '<span class="text-muted">-</span>'}</td>
                    <td><span class="badge bg-light text-dark border">${b.seriesPrefix || '-'}</span></td>
                    <td class="text-end pe-4">
                        ${toggleBtn}
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick='editBranch(${JSON.stringify(b)})' title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        renderPagination('pagination-container', result, 'loadBranches');
    } catch (e) {
        console.error("Error loading branches", e);
        showToast('Error al cargar las sucursales', 'error');
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadBranches(1);
    }, 500);
}

function clearForm() {
    document.getElementById('branchId').value = '';
    document.getElementById('branchForm').reset();
    document.getElementById('branchModalLabel').innerText = 'Nueva Sucursal';
}

function editBranch(branch) {
    document.getElementById('branchId').value = branch.id;
    document.getElementById('branchName').value = branch.name;
    document.getElementById('branchAddress').value = branch.address || '';
    document.getElementById('branchPhone').value = branch.phone || '';
    document.getElementById('branchModalLabel').innerText = 'Editar Sucursal';
    branchModalInstance.show();
}

async function saveBranch() {
    const id = document.getElementById('branchId').value;
    const name = document.getElementById('branchName').value;
    const address = document.getElementById('branchAddress').value;
    const phone = document.getElementById('branchPhone').value;

    if (!name) {
        showToast('El nombre de la sucursal es requerido.', 'error');
        return;
    }

    const payload = { name, address, phone };

    try {
        const btn = document.getElementById('btnSaveBranch');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

        if (id) {
            await ApiClient.request(`/Branches/${id}`, 'PUT', payload);
            showToast('Sucursal actualizada exitosamente', 'success');
        } else {
            await ApiClient.request('/Branches', 'POST', payload);
            showToast('Sucursal creada exitosamente', 'success');
        }

        branchModalInstance.hide();
        await loadBranches(currentPage);
    } catch (e) {
        showToast('Error al guardar la sucursal', 'error');
        console.error(e);
    } finally {
        const btn = document.getElementById('btnSaveBranch');
        btn.disabled = false;
        btn.innerHTML = 'Guardar Sucursal';
    }
}

// Show custom confirmation modal before open/close
function promptToggle(id, action, name) {
    pendingStatusAction = { id, action };

    const isOpen = action === 'open';
    document.getElementById('confirm-icon-wrap').innerHTML = isOpen
        ? `<span style="color: #198754;"><i class="bi bi-unlock-fill"></i></span>`
        : `<span style="color: #dc3545;"><i class="bi bi-lock-fill"></i></span>`;

    document.getElementById('confirm-title').innerText = isOpen
        ? `¿Aperturar "${name}"?`
        : `¿Cerrar "${name}"?`;

    document.getElementById('confirm-message').innerText = isOpen
        ? 'Al aperturar la sucursal se habilitarán las ventas y compras para esta sede.'
        : 'Al cerrar la sucursal se bloquearán las ventas y compras hasta que sea aperturada nuevamente.';

    const confirmBtn = document.getElementById('btn-confirm-action');
    confirmBtn.className = `btn px-4 fw-semibold ${isOpen ? 'btn-success' : 'btn-danger'}`;
    confirmBtn.innerHTML = isOpen
        ? '<i class="bi bi-unlock-fill me-1"></i> Sí, aperturar'
        : '<i class="bi bi-lock-fill me-1"></i> Sí, cerrar';

    // Remove old listener and add fresh one
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', () => executeBranchToggle());

    confirmStatusModalInstance.show();
}

async function executeBranchToggle() {
    if (!pendingStatusAction) return;
    const { id, action } = pendingStatusAction;

    const confirmBtn = document.getElementById('btn-confirm-action');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        const res = await ApiClient.request(`/Branches/${id}/${action}`, 'POST');
        if (res && res.success) {
            showToast(res.message, 'success');
            confirmStatusModalInstance.hide();
            await loadBranches(currentPage);
        } else {
            showToast(res?.message || 'Error al cambiar estado', 'error');
        }
    } catch (e) {
        showToast('Error de conexión al procesar la operación', 'error');
        console.error(e);
    } finally {
        pendingStatusAction = null;
        confirmBtn.disabled = false;
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
