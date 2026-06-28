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
        const invoiceNumber = p.InvoiceNumber || p.invoiceNumber || p.invoicenumber || '-';
        const dateVal = p.CreatedAt || p.createdAt || p.createdat || p.Date || p.date || new Date();
        const supplierName = p.SupplierName || p.supplierName || p.suppliername || 'N/A';
        const status = p.Status || p.status || '-';
        const paymentType = p.PaymentType || p.paymentType || p.paymenttype || '-';
        const total = p.Total || p.total || 0;

        document.getElementById('detailInvoice').innerText = invoiceNumber;
        document.getElementById('detailDate').innerText = new Date(dateVal).toLocaleString();
        document.getElementById('detailSupplier').innerText = supplierName;
        document.getElementById('detailStatus').innerText = `${status} - ${paymentType}`;
        document.getElementById('detailTotal').innerText = `$${Number(total).toFixed(2)}`;

        const tbody = document.getElementById('detailProductsBody');
        tbody.innerHTML = '';
        
        if (data.details && data.details.length > 0) {
            data.details.forEach(d => {
                const productCode = d.ProductCode || d.productCode || d.productcode || '-';
                const productName = d.ProductName || d.productName || d.productname || 'Producto Eliminado';
                const quantity = d.Quantity || d.quantity || 0;
                const unitCost = d.UnitCost || d.unitCost || d.unitcost || 0;
                const subtotal = d.Subtotal || d.subtotal || 0;

                tbody.innerHTML += `
                    <tr>
                        <td>${productCode}</td>
                        <td>${productName}</td>
                        <td class="text-center">${quantity}</td>
                        <td class="text-end">$${Number(unitCost).toFixed(2)}</td>
                        <td class="text-end fw-bold">$${Number(subtotal).toFixed(2)}</td>
                    </tr>`;
            });
        }

        const modal = new bootstrap.Modal(document.getElementById('purchaseDetailsModal'));
        modal.show();
    } catch (e) {
        console.error(e);
        alert('Error al cargar la informaci�n de la compra.');
    }
}
