let customerModalInstance;

document.addEventListener('DOMContentLoaded', async () => {
    customerModalInstance = new bootstrap.Modal(document.getElementById('customerModal'));
    await loadCustomers();
});

async function loadCustomers() {
    try {
        const customers = await ApiClient.request('/Customers');
        const tbody = document.getElementById('customers-table-body');
        tbody.innerHTML = '';
        customers.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.documentNumber || '-'}</td>
                    <td>${c.email || '-'}</td>
                    <td>${c.phone || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick='editCustomer(${JSON.stringify(c)})'><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading customers", e);
    }
}

function clearForm() {
    document.getElementById('customerId').value = '';
    document.getElementById('customerForm').reset();
    document.getElementById('modalTitle').innerText = 'Nuevo Cliente';
}

function editCustomer(customer) {
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerDocument').value = customer.documentNumber;
    document.getElementById('customerEmail').value = customer.email;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerAddress').value = customer.address;
    document.getElementById('modalTitle').innerText = 'Editar Cliente';
    customerModalInstance.show();
}

async function saveCustomer() {
    const id = document.getElementById('customerId').value;
    const customer = {
        id: id ? parseInt(id) : 0,
        name: document.getElementById('customerName').value,
        documentNumber: document.getElementById('customerDocument').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
    };

    try {
        if (id) {
            await ApiClient.request(`/Customers/${id}`, 'PUT', customer);
        } else {
            await ApiClient.request('/Customers', 'POST', customer);
        }
        customerModalInstance.hide();
        await loadCustomers();
    } catch (e) {
        alert('Error guardando el cliente');
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
