let usersList = [];
let rolesList = [];
let branchesList = [];
let userModalInstance = null;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

function toggleTerminationFields() {
    const isActive = document.getElementById('userIsActive').checked;
    const termFields = document.getElementById('terminationFields');
    if (isActive) {
        termFields.style.display = 'none';
        document.getElementById('userTerminationDate').value = '';
        document.getElementById('userTerminationReason').value = '';
    } else {
        termFields.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    userModalInstance = new bootstrap.Modal(document.getElementById('userModal'));
    await loadDependencies();
    await loadUsers();
});

async function loadDependencies() {
    try {
        rolesList = await ApiClient.request('/Roles');
        branchesList = await ApiClient.request('/Branches');

        const roleSelect = document.getElementById('userRole');
        roleSelect.innerHTML = '<option value="">Seleccione un rol...</option>';
        rolesList.forEach(r => {
            roleSelect.innerHTML += `<option value="${r.id}">${r.name}</option>`;
        });

        const branchSelect = document.getElementById('userBranch');
        branchSelect.innerHTML = '<option value="">Seleccione una sucursal...</option>';
        branchesList.forEach(b => {
            branchSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
        });
    } catch(e) {
        console.error("Error cargando dependencias", e);
    }
}

async function loadUsers(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Users/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        usersList = result.items || [];
        renderUsers();
        renderPagination('pagination-container', result, 'loadUsers');
    } catch(e) {
        console.error(e);
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadUsers(1);
    }, 500);
}

function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    if (usersList) {
        usersList.forEach(u => {
            const roleName = rolesList.find(r => r.id === u.roleId)?.name || `Role ${u.roleId}`;
            const branchName = branchesList.find(b => b.id === u.branchId)?.name || 'Global';
            
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 text-secondary">#${u.id}</td>
                    <td class="fw-semibold text-primary"><i class="bi bi-shield-lock me-2"></i>${u.username}</td>
                    <td class="fw-medium">${u.fullName}</td>
                    <td><span class="badge bg-info text-dark rounded-pill px-3">${roleName}</span></td>
                    <td>${branchName}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="editUser(${u.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
}

function openUserModal() {
    document.getElementById('userId').value = '';
    document.getElementById('userForm').reset();
    document.getElementById('userModalLabel').innerText = 'Nuevo Usuario';
    document.getElementById('passwordHelp').style.display = 'none';
    
    document.getElementById('userSalary').value = '';
    document.getElementById('userHireDate').value = '';
    document.getElementById('userIsActive').checked = true;
    document.getElementById('userTerminationDate').value = '';
    document.getElementById('userTerminationReason').value = '';
    toggleTerminationFields();
    
    userModalInstance.show();
}

function editUser(id) {
    const user = usersList.find(u => u.id === id);
    if (!user) return;

    document.getElementById('userId').value = user.id;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userFullName').value = user.fullName;
    document.getElementById('userRole').value = user.roleId;
    document.getElementById('userBranch').value = user.branchId;
    document.getElementById('userPassword').value = '';
    
    document.getElementById('userSalary').value = user.salary || '';
    document.getElementById('userHireDate').value = user.hireDate ? user.hireDate.split('T')[0] : '';
    document.getElementById('userIsActive').checked = user.isActive !== false;
    document.getElementById('userTerminationDate').value = user.terminationDate ? user.terminationDate.split('T')[0] : '';
    document.getElementById('userTerminationReason').value = user.terminationReason || '';
    toggleTerminationFields();
    
    document.getElementById('userModalLabel').innerText = 'Editar Usuario';
    document.getElementById('passwordHelp').style.display = 'block';
    
    userModalInstance.show();
}

async function saveUser() {
    const id = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value;
    const fullName = document.getElementById('userFullName').value;
    const password = document.getElementById('userPassword').value;
    const roleId = document.getElementById('userRole').value;
    const branchId = document.getElementById('userBranch').value;

    if (!username || !fullName || !roleId || !branchId) {
        showToast('Por favor completa todos los campos requeridos.', 'error');
        return;
    }

    if (!id && !password) {
        showToast('La contraseña es requerida para nuevos usuarios.', 'error');
        return;
    }

    const payload = {
        username: username,
        fullName: fullName,
        roleId: parseInt(roleId),
        branchId: parseInt(branchId),
        passwordHash: password || '',
        salary: document.getElementById('userSalary').value ? parseFloat(document.getElementById('userSalary').value) : null,
        hireDate: document.getElementById('userHireDate').value || null,
        isActive: document.getElementById('userIsActive').checked,
        terminationDate: document.getElementById('userTerminationDate').value || null,
        terminationReason: document.getElementById('userTerminationReason').value || null
    };

    try {
        const btn = document.getElementById('btnSaveUser');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

        if (id) {
            await ApiClient.request(`/Users/${id}`, 'PUT', payload);
            showToast('Usuario actualizado exitosamente', 'success');
        } else {
            await ApiClient.request('/Users', 'POST', payload);
            showToast('Usuario creado exitosamente', 'success');
        }

        userModalInstance.hide();
        await loadUsers();
    } catch (e) {
        showToast('Error al guardar el usuario', 'error');
        console.error(e);
    } finally {
        const btn = document.getElementById('btnSaveUser');
        btn.disabled = false;
        btn.innerHTML = 'Guardar Usuario';
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
