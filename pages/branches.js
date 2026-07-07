let branchesList = [];
let branchModalInstance;
let confirmStatusModalInstance;
let cashRegistersModalInstance;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;
let pendingStatusAction = null; // { id, action }

document.addEventListener('DOMContentLoaded', async () => {
    branchModalInstance = new bootstrap.Modal(document.getElementById('branchModal'));
    confirmStatusModalInstance = new bootstrap.Modal(document.getElementById('confirmStatusModal'));
    cashRegistersModalInstance = new bootstrap.Modal(document.getElementById('cashRegistersModal'));
    initBranchMap();
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
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-info rounded-circle" onclick='openCashRegisters(${b.id}, "${b.name}")' title="Gestionar Cajas">
                            <i class="bi bi-display"></i>
                        </button>
                    </td>
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
    document.getElementById('branchFunds').value = '0.00';
    document.getElementById('fundsContainer').style.display = 'block';
    document.getElementById('branchModalLabel').innerText = 'Nueva Sucursal';
}

function editBranch(branch) {
    document.getElementById('branchId').value = branch.id;
    document.getElementById('branchName').value = branch.name;
    document.getElementById('branchAddress').value = branch.address || '';
    document.getElementById('branchLatitude').value = branch.latitude || '';
    document.getElementById('branchLongitude').value = branch.longitude || '';
    document.getElementById('branchPhone').value = branch.phone || '';
    document.getElementById('fundsContainer').style.display = 'none'; // Hide when editing
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
            payload.availableFunds = parseFloat(document.getElementById('branchFunds').value || 0);
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

// Cash Registers functions
async function openCashRegisters(branchId, branchName) {
    document.getElementById('crBranchId').value = branchId;
    document.getElementById('crBranchName').innerText = branchName;
    document.getElementById('cashRegisterForm').reset();
    document.getElementById('crId').value = '';
    await loadCashRegisters(branchId);
    cashRegistersModalInstance.show();
}

async function loadCashRegisters(branchId) {
    try {
        const result = await ApiClient.request(`/CashRegistersAdmin/branch/${branchId}`);
        const tbody = document.getElementById('cr-table-body');
        tbody.innerHTML = '';
        if (result.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay cajas registradas</td></tr>';
            return;
        }

        result.forEach(cr => {
            const isClosed = !cr.isActive;
            const statusBadge = cr.isActive ? '<span class="badge bg-success">Activa</span>' : '<span class="badge bg-danger">Inactiva</span>';
            const toggleIcon = cr.isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary';
            
            tbody.innerHTML += `
                <tr>
                    <td>#${cr.id}</td>
                    <td class="fw-semibold">${cr.name}</td>
                    <td>${cr.description || '-'}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-light border" onclick='toggleCashRegisterStatus(${cr.id}, ${!cr.isActive})' title="Cambiar Estado">
                            <i class="bi ${toggleIcon} fs-5"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick='editCashRegister(${JSON.stringify(cr)})' title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        showToast('Error al cargar cajas', 'error');
        console.error(e);
    }
}

async function saveCashRegister(e) {
    e.preventDefault();
    const branchId = document.getElementById('crBranchId').value;
    const id = document.getElementById('crId').value;
    const name = document.getElementById('crName').value;
    const desc = document.getElementById('crDesc').value;

    const payload = { branchId: parseInt(branchId), name, description: desc };

    try {
        const btn = document.getElementById('btnSaveCR');
        btn.disabled = true;
        if (id) {
            await ApiClient.request(`/CashRegistersAdmin/${id}`, 'PUT', payload);
            showToast('Caja actualizada', 'success');
        } else {
            await ApiClient.request('/CashRegistersAdmin', 'POST', payload);
            showToast('Caja agregada', 'success');
        }
        document.getElementById('cashRegisterForm').reset();
        document.getElementById('crId').value = '';
        await loadCashRegisters(branchId);
    } catch (error) {
        showToast('Error al guardar la caja', 'error');
    } finally {
        document.getElementById('btnSaveCR').disabled = false;
    }
}

function editCashRegister(cr) {
    document.getElementById('crId').value = cr.id;
    document.getElementById('crName').value = cr.name;
    document.getElementById('crDesc').value = cr.description || '';
}

async function toggleCashRegisterStatus(id, isActive) {
    try {
        const branchId = document.getElementById('crBranchId').value;
        await ApiClient.request(`/CashRegistersAdmin/${id}/status`, 'PUT', { isActive });
        showToast('Estado de la caja actualizado', 'success');
        await loadCashRegisters(branchId);
    } catch (e) {
        showToast('Error al actualizar estado', 'error');
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}


let branchMap;
let branchMarker;

function initBranchMap() {
    if (branchMap) return; // already init
    branchMap = L.map('branch-map').setView([14.6349, -90.5069], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(branchMap);
    
    branchMarker = L.marker([14.6349, -90.5069], { draggable: true }).addTo(branchMap);
    
    branchMarker.on('dragend', function (e) {
        const coords = e.target.getLatLng();
        document.getElementById('branchLatitude').value = coords.lat.toFixed(6);
        document.getElementById('branchLongitude').value = coords.lng.toFixed(6);
    });

    branchMap.on('click', function (e) {
        branchMarker.setLatLng(e.latlng);
        document.getElementById('branchLatitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('branchLongitude').value = e.latlng.lng.toFixed(6);
    });
}

document.getElementById('branchModal').addEventListener('shown.bs.modal', function () {
    initBranchMap();
    setTimeout(() => {
        if (branchMap) {
            branchMap.invalidateSize();
            const lat = document.getElementById('branchLatitude').value;
            const lng = document.getElementById('branchLongitude').value;
            if (lat && lng) {
                branchMap.setView([lat, lng], 16);
                branchMarker.setLatLng([lat, lng]);
            } else {
                // Automatically request location for new records
                branchMap.setView([14.6349, -90.5069], 13);
                branchMarker.setLatLng([14.6349, -90.5069]);
                window.useMyLocation('branch');
            }
        }
    }, 300);
});

window.useMyLocation = function(type) {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            if (type === 'branch' && branchMap) {
                branchMap.setView([lat, lng], 16);
                branchMarker.setLatLng([lat, lng]);
                document.getElementById('branchLatitude').value = lat;
                document.getElementById('branchLongitude').value = lng;
                showToast("Ubicaci�n obtenida.", "success");
            }
        }, function(error) {
            showToast("No se pudo obtener la ubicaci�n. Permisos denegados.", "error");
        });
    } else {
        showToast("Geolocalizaci�n no soportada en este navegador.", "error");
    }
}
