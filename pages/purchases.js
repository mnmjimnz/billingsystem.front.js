let products = [];
let cart = [];
let suppliers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    await loadSuppliers();
    await loadBranches();

    document.getElementById('search-input').addEventListener('input', (e) => {
        renderProducts(e.target.value);
    });

    document.getElementById('btn-save-purchase').addEventListener('click', savePurchase);
});

async function loadProducts() {
    try {
        products = await ApiClient.request('/Products') || [];
        renderProducts();
    } catch (e) {
        console.error("Error loading products", e);
        products = [];
    }
}

async function loadSuppliers() {
    try {
        suppliers = await ApiClient.request('/Suppliers') || [];
        const select = document.getElementById('supplierSelect');
        select.innerHTML = '<option value="">Seleccione un Proveedor...</option>';
        suppliers.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
    } catch (e) {
        console.error("Error loading suppliers", e);
        suppliers = [];
    }
}

let branches = [];
async function loadBranches() {
    try {
        branches = await ApiClient.request('/Branches') || [];
        const select = document.getElementById('branchSelect');
        select.innerHTML = '<option value="">Seleccione una Sucursal...</option>';
        branches.forEach(b => {
            select.innerHTML += `<option value="${b.id}">${b.name} ${b.status === 'CLOSED' ? '(CERRADA)' : ''}</option>`;
        });
    } catch (e) {
        console.error("Error loading branches", e);
    }
}

window.updateAvailableFunds = function() {
    const branchId = document.getElementById('branchSelect').value;
    const badge = document.getElementById('available-funds-badge');
    const branchWarning = document.getElementById('branch-closed-warning');
    const saveBtn = document.getElementById('btn-save-purchase');

    if (!branchId) {
        badge.innerText = 'Seleccione una sucursal';
        badge.className = 'badge bg-secondary position-absolute top-0 end-0 mt-2 me-2';
        if (branchWarning) branchWarning.style.display = 'none';
        return;
    }

    const branch = branches.find(b => b.id == branchId);
    if (branch) {
        const isClosed = branch.status === 'CLOSED';
        badge.innerText = isClosed
            ? `🔒 CERRADA | Fondos: $${(branch.availableFunds || 0).toFixed(2)}`
            : `🟢 Fondos disponibles: $${(branch.availableFunds || 0).toFixed(2)}`;
        badge.className = `badge ${isClosed ? 'bg-danger' : 'bg-success'} position-absolute top-0 end-0 mt-2 me-2`;

        if (branchWarning) {
            if (isClosed) {
                branchWarning.innerHTML = `
                    <div class="alert alert-danger d-flex align-items-center gap-2 py-2 mb-0">
                        <i class="bi bi-lock-fill fs-5"></i>
                        <div>
                            <strong>Sucursal cerrada.</strong> No es posible registrar compras. 
                            Aperture la sucursal desde <a href="branches.html" class="alert-link">Administración de Sucursales</a>.
                        </div>
                    </div>`;
                branchWarning.style.display = 'block';
                if (saveBtn) saveBtn.disabled = true;
            } else {
                branchWarning.style.display = 'none';
                if (saveBtn) saveBtn.disabled = false;
            }
        }
    }
}

let currentProductPage = 1;
const PAGE_SIZE = 6;

function renderProducts(filter = document.getElementById('search-input').value) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    const filtered = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.barcode?.includes(filter));
    
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
    if (currentProductPage > totalPages) currentProductPage = 1;

    const start = (currentProductPage - 1) * PAGE_SIZE;
    const pagedItems = filtered.slice(start, start + PAGE_SIZE);
    
    pagedItems.forEach(p => {
        const div = document.createElement('div');
        div.className = 'col-md-4 col-sm-6';
        div.innerHTML = `
            <div class="card h-100 shadow-sm cursor-pointer border-0" onclick="addToCart(${p.id})">
                <div class="card-body text-center p-4">
                    <i class="bi bi-box-seam text-secondary" style="font-size: 2.5rem;"></i>
                    <h6 class="mt-3 mb-1 fw-bold text-truncate" title="${p.name}">${p.name}</h6>
                    <div class="text-muted small mb-2">Costo actual: $${p.cost.toFixed(2)}</div>
                    <span class="badge ${p.stock > 10 ? 'bg-success' : 'bg-danger'}">${p.stock} en stock</span>
                </div>
            </div>
        `;
        div.firstElementChild.style.cursor = 'pointer';
        div.firstElementChild.addEventListener('mouseover', function() { this.classList.add('border-info'); });
        div.firstElementChild.addEventListener('mouseout', function() { this.classList.remove('border-info'); });
        grid.appendChild(div);
    });

    renderClientPagination(totalPages);
}

function renderClientPagination(totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
        <span class="text-muted small fw-semibold">Página ${currentProductPage} de ${totalPages}</span>
        <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" ${currentProductPage === 1 ? 'disabled' : ''} onclick="changeProductPage(${currentProductPage - 1})"><i class="bi bi-chevron-left"></i></button>
            <button class="btn btn-sm btn-outline-secondary" ${currentProductPage === totalPages ? 'disabled' : ''} onclick="changeProductPage(${currentProductPage + 1})"><i class="bi bi-chevron-right"></i></button>
        </div>
    </div>`;
    container.innerHTML = html;
}

window.changeProductPage = function(page) {
    currentProductPage = page;
    renderProducts();
}

function addToCart(productId) {
    const p = products.find(x => x.id === productId);
    const existing = cart.find(x => x.productId === productId);
    if (existing) {
        existing.quantity += 1;
        existing.subtotal = existing.quantity * existing.unitCost;
    } else {
        cart.push({
            productId: p.id,
            name: p.name,
            quantity: 1,
            unitCost: p.cost,
            subtotal: p.cost
        });
    }
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items');
    list.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.subtotal;
        list.innerHTML += `
            <div class="p-3 border-bottom bg-white">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="fw-bold text-truncate me-2 text-dark fs-6">${item.name}</div>
                    <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeFromCart(${index})"><i class="bi bi-trash"></i></button>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="flex-grow-1">
                        <label class="form-label small text-muted mb-1" style="font-size: 0.75rem;">Cant.</label>
                        <input type="number" class="form-control text-center fw-bold" value="${item.quantity}" min="1" onchange="updateQty(${index}, this.value)">
                    </div>
                    <div class="flex-grow-1">
                        <label class="form-label small text-muted mb-1" style="font-size: 0.75rem;">Costo ($)</label>
                        <input type="number" class="form-control text-center fw-bold" value="${item.unitCost}" step="0.01" min="0" onchange="updateCost(${index}, this.value)">
                    </div>
                    <div class="text-end" style="width: 80px;">
                        <label class="form-label small text-muted mb-1" style="font-size: 0.75rem;">Subtotal</label>
                        <div class="fw-bold text-primary">$${item.subtotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
}

function updateQty(index, qty) {
    const q = parseInt(qty);
    if (q > 0) {
        cart[index].quantity = q;
        cart[index].subtotal = q * cart[index].unitCost;
        renderCart();
    }
}

function updateCost(index, cost) {
    const c = parseFloat(cost);
    if (c >= 0) {
        cart[index].unitCost = c;
        cart[index].subtotal = cart[index].quantity * c;
        renderCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function toggleAdvancePayment() {
    const type = document.getElementById('paymentTypeSelect').value;
    document.getElementById('divAdvancePayment').style.display = type === 'CREDIT' ? 'block' : 'none';
    if (type !== 'CREDIT') {
        document.getElementById('advanceInput').value = '0';
    }
}

async function savePurchase() {
    if (cart.length === 0) return alert("El detalle de compra está vacío");
    
    const invoice = document.getElementById('invoiceInput').value;
    const supplierId = document.getElementById('supplierSelect').value;
    const branchId = document.getElementById('branchSelect').value;
    const paymentType = document.getElementById('paymentTypeSelect').value;
    const amountPaid = document.getElementById('advanceInput').value;

    if (!invoice || !supplierId || !branchId) return showToast("Complete los datos requeridos", "warning");

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

    const dto = {
        invoiceNumber: invoice,
        supplierId: parseInt(supplierId),
        userId: 1, // hardcoded for now, idealmente viene del token JWT
        branchId: parseInt(branchId),
        total: total,
        paymentType: paymentType,
        amountPaid: paymentType === 'CREDIT' ? parseFloat(amountPaid) : total,
        details: cart.map(c => ({
            productId: c.productId,
            quantity: c.quantity,
            unitCost: c.unitCost,
            subtotal: c.subtotal
        }))
    };

    try {
        const btn = document.getElementById('btn-save-purchase');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Procesando...';

        await ApiClient.request('/Purchases', 'POST', dto);
        
        showToast("¡Compra registrada y Kardex actualizado exitosamente!", "success");
        cart = [];
        document.getElementById('invoiceInput').value = '';
        document.getElementById('supplierSelect').value = '';
        renderCart();
        
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Procesar Ingreso';

        // Reload products and branches to update stock and funds
        await loadProducts();
        await loadBranches();
        updateAvailableFunds();
    } catch (e) {
        showToast("Error procesando la compra o fondos insuficientes.", "error");
        document.getElementById('btn-save-purchase').disabled = false;
        document.getElementById('btn-save-purchase').innerHTML = '<i class="bi bi-check-circle me-2"></i> Procesar Ingreso';
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
