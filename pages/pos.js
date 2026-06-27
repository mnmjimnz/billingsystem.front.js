let products = [];
let cart = [];
let html5QrcodeScanner = null;
let checkoutModalInstance = null;
let customers = [];
let currentSaleTotal = 0;

document.addEventListener('DOMContentLoaded', async () => {
    checkoutModalInstance = new bootstrap.Modal(document.getElementById('checkoutModal'));
    await loadProducts();
    await loadCustomers();

    // Auto start camera
    startCamera();

    // Search input
    document.getElementById('search-input').addEventListener('input', (e) => {
        renderProducts(e.target.value);
    });

    // Discount
    document.getElementById('input-discount').addEventListener('input', renderCart);
    
    // Process Sale button opens Modal now
    document.getElementById('btn-pay').addEventListener('click', openCheckoutModal);
});

async function loadCustomers() {
    try {
        customers = await ApiClient.request('/Customers') || [];
        const select = document.getElementById('checkout-customer');
        select.innerHTML = '<option value="">Cliente Público General</option>';
        customers.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    } catch (e) {
        console.error("Error loading customers", e);
        customers = [];
    }
}

async function loadProducts() {
    try {
        products = await ApiClient.request('/Products') || [];
        renderProducts();
    } catch (e) {
        console.error("Error loading products", e);
        products = [];
    }
}

let currentProductPage = 1;
const PAGE_SIZE = 6;

function renderProducts(filter = document.getElementById('search-input').value) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    // Si no hay texto de búsqueda, no mostrar nada
    if (filter.trim() === '') {
        document.getElementById('pagination-container').innerHTML = '';
        return;
    }

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
                    <i class="bi bi-bag-dash text-secondary" style="font-size: 2.5rem;"></i>
                    <h6 class="mt-3 mb-1 fw-bold text-truncate" title="${p.name}">${p.name}</h6>
                    <div class="text-primary fw-bold mb-2">$${p.price.toFixed(2)}</div>
                    <span class="badge ${p.stock > 10 ? 'bg-success' : (p.stock > 0 ? 'bg-warning' : 'bg-danger')}">${p.stock} en stock</span>
                </div>
            </div>
        `;
        div.firstElementChild.style.cursor = 'pointer';
        div.firstElementChild.addEventListener('mouseover', function() { this.classList.add('border-primary'); });
        div.firstElementChild.addEventListener('mouseout', function() { this.classList.remove('border-primary'); });
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
    if (!p) return;
    
    if (p.stock <= 0) {
        showToast("Atención: Este producto no tiene stock disponible.", "warning");
        return;
    }

    const existing = cart.find(x => x.id === productId);
    if (existing) {
        if (existing.quantity + 1 > p.stock) {
            showToast(`Límite alcanzado. Solo hay ${p.stock} unidades en stock.`, "warning");
            return;
        }
        existing.quantity += 1;
        existing.subtotal = existing.quantity * existing.price;
    } else {
        cart.push({
            id: p.id,
            name: p.name,
            price: p.price,
            quantity: 1,
            subtotal: p.price,
            stock: p.stock
        });
    }
    renderCart();
}

async function addProductByBarcode(barcode) {
    let p = products.find(x => x.barcode === barcode);
    if (!p) {
        try {
            const product = await ApiClient.request(`/Products/barcode/${barcode}`);
            if (product) {
                products.push(product);
                p = product;
            }
        } catch (error) {
            showToast('Producto no encontrado en el sistema.', 'error');
            return;
        }
    }
    
    if (p) {
        addToCart(p.id);
        const searchInput = document.getElementById('search-input');
        searchInput.value = p.name;
        renderProducts(p.name);
        showToast(`Producto escaneado: ${p.name}`, 'success');
    }
}

function renderCart() {
    const list = document.getElementById('cart-items');
    list.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.subtotal;
        list.innerHTML += `
            <div class="p-3 border-bottom bg-white">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="fw-bold text-truncate me-2 text-dark fs-6">${item.name}</div>
                    <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeFromCart(${index})"><i class="bi bi-trash"></i></button>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="flex-grow-1">
                        <label class="form-label small text-muted mb-1" style="font-size: 0.75rem;">Cant.</label>
                        <input type="number" class="form-control text-center fw-bold" value="${item.quantity}" min="1" oninput="updateQty(${index}, this.value)">
                    </div>
                    <div class="text-end" style="width: 100px;">
                        <label class="form-label small text-muted mb-1" style="font-size: 0.75rem;">Subtotal</label>
                        <div class="fw-bold text-primary" id="item-subtotal-${index}">$${item.subtotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    });
    updateTotalsOnly();
}

function updateTotalsOnly() {
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const discount = parseFloat(document.getElementById('input-discount').value) || 0;
    const total = subtotal - discount;

    document.getElementById('cart-subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').innerText = `$${Math.max(0, total).toFixed(2)}`;
}

function updateQty(index, qty) {
    const q = parseInt(qty);
    if (isNaN(q) || q <= 0) return;
    
    if (q > cart[index].stock) {
        showToast(`Límite alcanzado. Solo hay ${cart[index].stock} unidades en stock.`, "warning");
        cart[index].quantity = cart[index].stock;
        cart[index].subtotal = cart[index].stock * cart[index].price;
        renderCart(); // re-render to reset input visibly
        return;
    }
    
    cart[index].quantity = q;
    cart[index].subtotal = q * cart[index].price;
    document.getElementById(`item-subtotal-${index}`).innerText = `$${cart[index].subtotal.toFixed(2)}`;
    updateTotalsOnly();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('El carrito está vacío', 'warning');
        return;
    }
    
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const discount = parseFloat(document.getElementById('input-discount').value) || 0;
    currentSaleTotal = subtotal - discount;
    
    document.getElementById('checkout-grand-total').innerText = `$${Math.max(0, currentSaleTotal).toFixed(2)}`;
    document.getElementById('checkout-tendered').value = currentSaleTotal.toFixed(2);
    document.getElementById('checkout-payment-type').value = "CASH";
    togglePaymentFields();
    calculateChange();
    
    checkoutModalInstance.show();
}

function togglePaymentFields() {
    const cashFields = document.getElementById('cash-fields');
    cashFields.style.display = 'block'; // Always show so they can input advance payment
}

function calculateChange() {
    const tendered = parseFloat(document.getElementById('checkout-tendered').value) || 0;
    const change = tendered - currentSaleTotal;
    document.getElementById('checkout-change').value = Math.max(0, change).toFixed(2);
}

async function confirmSale() {
    const customerValue = document.getElementById('checkout-customer').value;
    const paymentType = document.getElementById('checkout-payment-type').value;
    
    if (paymentType === 'CREDIT' && !customerValue) {
        showToast('Debes seleccionar un cliente registrado para una venta al crédito.', 'error');
        return;
    }

    const tendered = parseFloat(document.getElementById('checkout-tendered').value) || 0;
    if (paymentType === 'CASH' && tendered < currentSaleTotal) {
        showToast('El monto recibido no puede ser menor al total de la venta.', 'error');
        return;
    }

    const change = tendered > currentSaleTotal ? tendered - currentSaleTotal : 0;
    
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const discount = parseFloat(document.getElementById('input-discount').value) || 0;
    const total = currentSaleTotal;

    const request = {
        customerId: customerValue ? parseInt(customerValue) : null,
        subtotal: subtotal,
        discount: discount,
        total: total,
        paymentType: paymentType,
        amountTendered: tendered,
        change: Math.max(0, change),
        details: cart.map(c => ({
            productId: c.id,
            quantity: c.quantity,
            unitPrice: c.price,
            subtotal: c.subtotal
        }))
    };

    try {
        const btn = document.getElementById('btn-confirm-pay');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Procesando...';

        const response = await ApiClient.request('/Sales', 'POST', request);
        if (response && response.ticketNumber) {
            checkoutModalInstance.hide();
            generateTicketPDF(response.ticketNumber, cart, subtotal, discount, total);
            cart = [];
            document.getElementById('input-discount').value = '0';
            renderCart();
            showToast('Venta procesada con éxito!', 'success');
            await loadProducts(); // Recargar stock
        }
        
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Confirmar Venta';
    } catch (e) {
        showToast('Error al procesar la venta', 'error');
        document.getElementById('btn-confirm-pay').disabled = false;
        document.getElementById('btn-confirm-pay').innerHTML = '<i class="bi bi-check-circle me-2"></i> Confirmar Venta';
    }
}

function startCamera() {
    const reader = document.getElementById('reader');
    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Error al iniciar la cámara automáticamente", err);
        reader.innerHTML = `<div class="p-4 text-muted small"><i class="bi bi-camera-video-off fs-4 d-block mb-2"></i>Cámara no disponible o sin permisos.</div>`;
    });
}

function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
        console.error("Audio beep failed", e);
    }
}

let isScanning = false;

async function onScanSuccess(decodedText, decodedResult) {
    if (isScanning) return;
    isScanning = true;
    
    playBeep();
    await addProductByBarcode(decodedText);
    
    // Pausar medio segundo para evitar escaneos duplicados descontrolados
    setTimeout(() => {
        isScanning = false;
    }, 1500);
}

function onScanFailure(error) {
    // Ignore frequent errors from scanner
}

function generateTicketPDF(ticketNumber, items, subtotal, discount, total) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200]
    });

    doc.setFontSize(14);
    doc.text("NEXUS POS", 40, 10, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Ticket: ${ticketNumber}`, 5, 20);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 25);
    
    let y = 30;
    doc.line(5, y, 75, y);
    y += 5;

    doc.text("CANT DESCRIPCION        IMPORTE", 5, y);
    y += 5;
    doc.line(5, y, 75, y);
    y += 5;

    items.forEach(item => {
        doc.text(`${item.quantity}`, 5, y);
        doc.text(`${item.name.substring(0,15)}`, 15, y);
        doc.text(`$${item.subtotal.toFixed(2)}`, 60, y);
        y += 5;
    });

    doc.line(5, y, 75, y);
    y += 5;

    doc.text(`Subtotal:`, 30, y);
    doc.text(`$${subtotal.toFixed(2)}`, 60, y);
    y += 5;
    
    if (discount > 0) {
        doc.text(`Descuento:`, 30, y);
        doc.text(`-$${discount.toFixed(2)}`, 60, y);
        y += 5;
    }

    doc.setFontSize(12);
    doc.text(`TOTAL:`, 30, y);
    doc.text(`$${total.toFixed(2)}`, 60, y);
    y += 10;

    doc.setFontSize(10);
    doc.text("¡Gracias por su compra!", 40, y, { align: "center" });

    doc.save(`${ticketNumber}.pdf`);
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
