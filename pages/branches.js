let branchesList = [];
let branchModalInstance;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    branchModalInstance = new bootstrap.Modal(document.getElementById('branchModal'));
    await loadBranches();
});

async function loadBranches(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Branches/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        const tbody = document.getElementById('branches-table-body');
        tbody.innerHTML = '';
        const branches = result.items || [];
        branches.forEach(b => {
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4">#${b.id}</td>
                    <td class="fw-medium">${b.name}</td>
                    <td>${b.address || '-'}</td>
                    <td>${b.phone || '-'}</td>
                    <td><span class="badge bg-light text-dark border">${b.seriesPrefix}</span></td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick='editBranch(${JSON.stringify(b)})'><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            `;
        });
        renderPagination('pagination-container', result, 'loadBranches');
    } catch (e) {
        console.error("Error loading branches", e);
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
