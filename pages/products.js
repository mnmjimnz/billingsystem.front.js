let productModalInstance;
let barcodeModalInstance;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    productModalInstance = new bootstrap.Modal(document.getElementById('productModal'));
    barcodeModalInstance = new bootstrap.Modal(document.getElementById('barcodeModal'));
    await loadCategories();
    await loadProducts();
});

async function loadCategories() {
    try {
        const categories = await ApiClient.request('/Categories');
        const select = document.getElementById('productCategory');
        select.innerHTML = '<option value="">Seleccione una categoría...</option>';
        if (categories) {
            categories.forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        }
    } catch (e) {
        console.error("Error loading categories", e);
    }
}

async function loadProducts(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Products/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = '';
        const products = result.items || [];
        products.forEach(p => {
            const exemptBadge = p.isTaxExempt
                ? '<span class="badge bg-secondary ms-1" title="Exento de IVA">Exento</span>'
                : '';
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4">#${p.id}</td>
                    <td>${p.barcode}</td>
                    <td class="fw-medium">${p.name}${exemptBadge}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>$${p.cost.toFixed(2)}</td>
                    <td><span class="badge ${p.stock > 10 ? 'bg-success' : 'bg-danger'} rounded-pill">${p.stock}</span></td>
                    <td class="text-end pe-4">
                        
                          <button class="btn btn-sm btn-outline-success me-1 rounded-circle" onclick='showStockBreakdown(${JSON.stringify(p)})' title="Ver Stock Sucursales"><i class="bi bi-boxes"></i></button>
                          <button class="btn btn-sm btn-outline-info me-1 rounded-circle" onclick='showBarcodes(${JSON.stringify(p)})' title="Ver Códigos"><i class="bi bi-upc-scan"></i></button>
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick='editProduct(${JSON.stringify(p)})' title="Editar"><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            `;
        });
        renderPagination('pagination-container', result, 'loadProducts');
    } catch (e) {
        console.error("Error loading products", e);
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadProducts(1);
    }, 500);
}

function clearForm() {
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('productIsTaxExempt').checked = false;
    document.getElementById('modalTitle').innerText = 'Nuevo Producto';
}

function editProduct(product) {
    document.getElementById('productId').value = product.id;
    document.getElementById('productBarcode').value = product.barcode;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCost').value = product.cost;
    document.getElementById('productCategory').value = product.categoryId;
    document.getElementById('productIsTaxExempt').checked = product.isTaxExempt || false;
    document.getElementById('modalTitle').innerText = 'Editar Producto';
    productModalInstance.show();
}

async function saveProduct() {
    const id = document.getElementById('productId').value;
    const product = {
        id: id ? parseInt(id) : 0,
        barcode: document.getElementById('productBarcode').value,
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        cost: parseFloat(document.getElementById('productCost').value),
        stock: 0,
        categoryId: parseInt(document.getElementById('productCategory').value),
        isTaxExempt: document.getElementById('productIsTaxExempt').checked
    };

    try {
        if (id) {
            await ApiClient.request(`/Products/${id}`, 'PUT', product);
        } else {
            await ApiClient.request('/Products', 'POST', product);
        }
        productModalInstance.hide();
        await loadProducts();
    } catch (e) {
        alert('Error guardando el producto');
    }
}

let currentBarcodeProduct = null;

function showBarcodes(product) {
    if (!product.barcode) {
        alert('Este producto no tiene un código asignado.');
        return;
    }
    
    currentBarcodeProduct = product;
    document.getElementById('barcodeModalTitle').innerText = `Códigos: ${product.name}`;
    
    // Generar Barcode
    try {
        JsBarcode("#barcodeSvg", product.barcode, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: true
        });
    } catch (e) {
        console.error('Error generando barcode', e);
    }

    // Generar QR
    const canvas = document.getElementById('qrcodeCanvas');
    QRCode.toCanvas(canvas, product.barcode, { width: 200 }, function (error) {
        if (error) console.error('Error generando QR', error);
    });

    barcodeModalInstance.show();
}

function downloadBarcode() {
    if (!currentBarcodeProduct) return;
    const svg = document.getElementById("barcodeSvg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const url = canvas.toDataURL("image/png");
        triggerDownload(url, `barcode_${currentBarcodeProduct.barcode}.png`);
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
}

function downloadQR() {
    if (!currentBarcodeProduct) return;
    const canvas = document.getElementById('qrcodeCanvas');
    const url = canvas.toDataURL("image/png");
    triggerDownload(url, `qr_${currentBarcodeProduct.barcode}.png`);
}

function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}

async function showStockBreakdown(product) {
    try {
        const stocks = await ApiClient.request(`/Products/${product.id}/stock`);
        const tbody = document.getElementById('stockBreakdownBody');
        if (stocks && stocks.length > 0) {
            tbody.innerHTML = stocks.map(s => `
                <tr>
                    <td>${s.branchname || s.branchName}</td>
                    <td class="text-end fw-bold ${s.stock > 10 ? 'text-success' : 'text-danger'}">${s.stock}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center">No hay registros de stock por sucursal para este producto.</td></tr>';
        }
        document.getElementById('stockBreakdownProductName').innerText = product.name;
        new bootstrap.Modal(document.getElementById('stockBreakdownModal')).show();
    } catch (e) {
        showToast("Error al cargar el stock por sucursal", "error");
    }
}
