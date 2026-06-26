let branchesList = [];
let branchModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    branchModalInstance = new bootstrap.Modal(document.getElementById('branchModal'));
    await loadBranches();
});

async function loadBranches() {
    try {
        branchesList = await ApiClient.request('/Branches');
        renderBranches();
    } catch(e) {
        console.error("Error cargando sucursales", e);
    }
}

function renderBranches() {
    const tbody = document.getElementById('branches-table-body');
    tbody.innerHTML = '';
    
    if (branchesList) {
        branchesList.forEach(b => {
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 text-secondary">#${b.id}</td>
                    <td class="fw-semibold text-primary"><i class="bi bi-buildings me-2"></i>${b.name}</td>
                    <td class="text-muted">${b.address || 'N/A'}</td>
                    <td>${b.phone || 'N/A'}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="editBranch(${b.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
}

function openBranchModal() {
    document.getElementById('branchId').value = '';
    document.getElementById('branchForm').reset();
    document.getElementById('branchModalLabel').innerText = 'Nueva Sucursal';
    branchModalInstance.show();
}

function editBranch(id) {
    const branch = branchesList.find(b => b.id === id);
    if (!branch) return;

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

    const payload = {
        name: name,
        address: address,
        phone: phone
    };

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
        await loadBranches();
    } catch (e) {
        showToast('Error al guardar la sucursal', 'error');
        console.error(e);
    } finally {
        const btn = document.getElementById('btnSaveBranch');
        btn.disabled = false;
        btn.innerHTML = 'Guardar Sucursal';
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
