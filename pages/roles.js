let rolesList = [];
let permissionsList = [];
let currentRoleId = null;
let roleModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    roleModalInstance = new bootstrap.Modal(document.getElementById('roleModal'));
    await loadPermissions();
    await loadRoles();
});

async function loadPermissions() {
    try {
        permissionsList = await ApiClient.request('/Roles/permissions');
    } catch(e) {
        console.error("Error cargando permisos", e);
    }
}

async function loadRoles() {
    try {
        rolesList = await ApiClient.request('/Roles');
        renderRoles();
    } catch(e) {
        console.error("Error cargando roles", e);
    }
}

function renderRoles() {
    const list = document.getElementById('roles-list');
    list.innerHTML = '';
    
    rolesList.forEach(r => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-start py-3 ${r.id === currentRoleId ? 'active' : ''}`;
        a.onclick = (e) => { e.preventDefault(); selectRole(r.id); };
        
        a.innerHTML = `
            <div class="ms-2 me-auto">
                <div class="fw-bold">${r.name}</div>
                <small class="${r.id === currentRoleId ? 'text-white-50' : 'text-muted'}">${r.description || 'Sin descripción'}</small>
            </div>
            <button class="btn btn-sm ${r.id === currentRoleId ? 'btn-light text-primary' : 'btn-outline-secondary'} rounded-circle" onclick="event.stopPropagation(); editRole(${r.id})">
                <i class="bi bi-pencil"></i>
            </button>
        `;
        list.appendChild(a);
    });
}

async function selectRole(id) {
    currentRoleId = id;
    renderRoles(); // update active state
    
    const role = rolesList.find(r => r.id === id);
    if (!role) return;
    
    document.getElementById('no-role-selected').style.display = 'none';
    document.getElementById('permissions-card').style.display = 'block';
    document.getElementById('selected-role-name').innerText = `Permisos para: ${role.name}`;
    
    try {
        const rolePerms = await ApiClient.request(`/Roles/${id}/permissions`);
        const assignedIds = rolePerms.map(p => p.id);
        
        renderPermissionsGrid(assignedIds);
    } catch (e) {
        showToast('Error cargando los permisos asignados', 'error');
    }
}

function renderPermissionsGrid(assignedIds = []) {
    const grid = document.getElementById('permissions-grid');
    grid.innerHTML = '';
    
    // Agrupar por módulo
    const modules = {};
    permissionsList.forEach(p => {
        if (!modules[p.module]) modules[p.module] = [];
        modules[p.module].push(p);
    });
    
    for (const [mod, perms] of Object.entries(modules)) {
        let col = document.createElement('div');
        col.className = 'col-md-6';
        
        let html = `
            <div class="card h-100 border-0 bg-light rounded-3">
                <div class="card-body">
                    <h6 class="fw-bold text-uppercase text-secondary mb-3"><i class="bi bi-folder2-open me-2"></i>${mod}</h6>
        `;
        
        perms.forEach(p => {
            const isChecked = assignedIds.includes(p.id) ? 'checked' : '';
            html += `
                <div class="form-check form-switch mb-2">
                    <input class="form-check-input perm-checkbox" type="checkbox" role="switch" id="perm_${p.id}" value="${p.id}" ${isChecked}>
                    <label class="form-check-label user-select-none w-100" for="perm_${p.id}">
                        <span class="d-block text-dark">${p.displayName}</span>
                        <small class="text-muted d-block" style="font-size: 0.75em;">${p.description}</small>
                    </label>
                </div>
            `;
        });
        
        html += `</div></div>`;
        col.innerHTML = html;
        grid.appendChild(col);
    }
}

async function savePermissions() {
    if (!currentRoleId) return;
    
    const checkboxes = document.querySelectorAll('.perm-checkbox:checked');
    const permIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    try {
        const btn = document.getElementById('btn-save-permissions');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        
        await ApiClient.request(`/Roles/${currentRoleId}/permissions`, 'POST', permIds);
        showToast('Permisos guardados correctamente', 'success');
        
    } catch(e) {
        showToast('Error al guardar permisos', 'error');
    } finally {
        const btn = document.getElementById('btn-save-permissions');
        btn.disabled = false;
        btn.innerHTML = 'Guardar Permisos';
    }
}

function openRoleModal() {
    document.getElementById('roleId').value = '';
    document.getElementById('roleForm').reset();
    document.getElementById('roleModalLabel').innerText = 'Nuevo Rol';
    roleModalInstance.show();
}

function editRole(id) {
    const role = rolesList.find(r => r.id === id);
    if (!role) return;

    document.getElementById('roleId').value = role.id;
    document.getElementById('roleName').value = role.name;
    document.getElementById('roleDescription').value = role.description;
    document.getElementById('roleModalLabel').innerText = 'Editar Rol';
    
    roleModalInstance.show();
}

async function saveRole() {
    const id = document.getElementById('roleId').value;
    const name = document.getElementById('roleName').value;
    const description = document.getElementById('roleDescription').value;

    if (!name) {
        showToast('El nombre del rol es requerido.', 'error');
        return;
    }

    const payload = {
        name: name,
        description: description
    };

    try {
        const btn = document.getElementById('btnSaveRole');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

        if (id) {
            await ApiClient.request(`/Roles/${id}`, 'PUT', payload);
            showToast('Rol actualizado exitosamente', 'success');
        } else {
            await ApiClient.request('/Roles', 'POST', payload);
            showToast('Rol creado exitosamente', 'success');
        }

        roleModalInstance.hide();
        await loadRoles();
    } catch (e) {
        showToast('Error al guardar el rol', 'error');
        console.error(e);
    } finally {
        const btn = document.getElementById('btnSaveRole');
        btn.disabled = false;
        btn.innerHTML = 'Guardar Rol';
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
