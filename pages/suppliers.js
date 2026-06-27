let supplierModalInstance;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    supplierModalInstance = new bootstrap.Modal(document.getElementById('supplierModal'));
    await loadSuppliers();
});

async function loadSuppliers(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Suppliers/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        const tbody = document.getElementById('suppliers-table-body');
        tbody.innerHTML = '';
        const suppliers = result.items || [];
        suppliers.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4">#${s.id}</td>
                    <td class="fw-medium">${s.name}</td>
                    <td>${s.documentNumber || '-'}</td>
                    <td>${s.contactName || '-'}</td>
                    <td>${s.email || '-'}</td>
                    <td>${s.phone || '-'}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick='editSupplier(${JSON.stringify(s)})'><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            `;
        });
        renderPagination('pagination-container', result, 'loadSuppliers');
    } catch (e) {
        console.error("Error loading suppliers", e);
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadSuppliers(1);
    }, 500);
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
