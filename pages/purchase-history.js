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
        
        const data = (result.items || []).map(item => ({
            id: item.id,
            invoiceNumber: item.invoicenumber !== undefined ? item.invoicenumber : item.invoiceNumber,
            supplierName: item.suppliername !== undefined ? item.suppliername : item.supplierName,
            supplierId: item.supplierid !== undefined ? item.supplierid : item.supplierId,
            createdAt: item.createdat !== undefined ? item.createdat : item.createdAt,
            paymentType: item.paymenttype !== undefined ? item.paymenttype : item.paymentType,
            total: item.total !== undefined ? item.total : item.total
        }));
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
                    <td class="fw-bold">${item.total.toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPurchaseDetails(${item.id})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                    </td>
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


async function viewPurchaseDetails(id) {
    try {
        const data = await ApiClient.request(`/Purchases/${id}`);
        if (!data || !data.purchase) {
            alert('No se pudo cargar los detalles de la compra.');
            return;
        }

        const p = data.purchase;
        document.getElementById('detailInvoice').innerText = p.invoiceNumber;
        document.getElementById('detailDate').innerText = new Date(p.createdAt || p.date).toLocaleString();
        document.getElementById('detailSupplier').innerText = p.supplierName || 'N/A';
        document.getElementById('detailStatus').innerText = `${p.status} - ${p.paymentType}`;
        document.getElementById('detailTotal').innerText = `$${p.total.toFixed(2)}`;

        const tbody = document.getElementById('detailProductsBody');
        tbody.innerHTML = '';
        
        data.details.forEach(d => {
            tbody.innerHTML += `
                <tr>
                    <td>${d.productCode || '-'}</td>
                    <td>${d.productName || 'Producto Eliminado'}</td>
                    <td class="text-center">${d.quantity}</td>
                    <td class="text-end">$${d.unitCost.toFixed(2)}</td>
                    <td class="text-end fw-bold">$${d.subtotal.toFixed(2)}</td>
                </tr>`;
        });

        const modal = new bootstrap.Modal(document.getElementById('purchaseDetailsModal'));
        modal.show();
    } catch (e) {
        console.error(e);
        alert('Error al cargar la informaci�n de la compra.');
    }
}
