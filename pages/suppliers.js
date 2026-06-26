let supplierModalInstance;

document.addEventListener('DOMContentLoaded', async () => {
    supplierModalInstance = new bootstrap.Modal(document.getElementById('supplierModal'));
    await loadSuppliers();
});

async function loadSuppliers() {
    try {
        const suppliers = await ApiClient.request('/Suppliers');
        const tbody = document.getElementById('suppliers-table-body');
        tbody.innerHTML = '';
        suppliers.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.name}</td>
                    <td>${s.documentNumber || '-'}</td>
                    <td>${s.contactName || '-'}</td>
                    <td>${s.email || '-'}</td>
                    <td>${s.phone || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick='editSupplier(${JSON.stringify(s)})'><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading suppliers", e);
    }
}

function clearForm() {
    document.getElementById('supplierId').value = '';
    document.getElementById('supplierForm').reset();
    document.getElementById('modalTitle').innerText = 'Nuevo Proveedor';
}

function editSupplier(supplier) {
    document.getElementById('supplierId').value = supplier.id;
    document.getElementById('supplierName').value = supplier.name;
    document.getElementById('supplierDocument').value = supplier.documentNumber;
    document.getElementById('supplierContact').value = supplier.contactName;
    document.getElementById('supplierEmail').value = supplier.email;
    document.getElementById('supplierPhone').value = supplier.phone;
    document.getElementById('supplierAddress').value = supplier.address;
    document.getElementById('modalTitle').innerText = 'Editar Proveedor';
    supplierModalInstance.show();
}

async function saveSupplier() {
    const id = document.getElementById('supplierId').value;
    const supplier = {
        id: id ? parseInt(id) : 0,
        name: document.getElementById('supplierName').value,
        documentNumber: document.getElementById('supplierDocument').value,
        contactName: document.getElementById('supplierContact').value,
        email: document.getElementById('supplierEmail').value,
        phone: document.getElementById('supplierPhone').value,
        address: document.getElementById('supplierAddress').value
    };

    try {
        if (id) {
            await ApiClient.request(`/Suppliers/${id}`, 'PUT', supplier);
        } else {
            await ApiClient.request('/Suppliers', 'POST', supplier);
        }
        supplierModalInstance.hide();
        await loadSuppliers();
    } catch (e) {
        alert('Error guardando el proveedor');
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
