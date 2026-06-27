let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadPurchases();
});

async function loadPurchases(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Purchases/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        
        const tbody = document.getElementById('purchases-table-body');
        tbody.innerHTML = '';
        
        const data = result.items || [];
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No hay compras registradas.</td></tr>';
            document.getElementById('pagination-container').innerHTML = '';
            return;
        }

        data.forEach(item => {
            const paymentType = item.paymentType === 'CASH' ? 'Contado' : 'Crédito';
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4">#${item.id}</td>
                    <td class="fw-medium">${item.invoiceNumber || '-'}</td>
                    <td>${item.supplierName || 'Prov-'+item.supplierId}</td>
                    <td>${new Date(item.createdAt).toLocaleString()}</td>
                    <td><span class="badge ${item.paymentType === 'CASH' ? 'bg-success' : 'bg-warning text-dark'}">${paymentType}</span></td>
                    <td class="fw-bold">$${item.total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        renderPagination('pagination-container', result, 'loadPurchases');
    } catch (e) {
        console.error("Error loading purchases", e);
        showToast('Error al cargar historial de compras', 'error');
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadPurchases(1);
    }, 500);
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
