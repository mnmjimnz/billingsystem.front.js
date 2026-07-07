
document.addEventListener('DOMContentLoaded', async () => {
    if (!ApiClient.getToken()) { window.location.href = '../index.html'; return; }
    initSidebar();
    await loadInitialData();
    await loadOrders();
    initMaps();
});

let branches = [];
let customers = [];
let products = [];
let orders = [];
let cart = [];
let orderModalInstance;
let deliverModalInstance;

let mainMap;
let modalMap;
let modalMarker;
let routingControl;

// Haversine Distance (in km)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function initSidebar() {
    try {
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('show');
        });
        const path = window.location.pathname;
        const links = document.querySelectorAll('.sidebar .nav-link');
        links.forEach(link => {
            if (path.includes(link.getAttribute('href'))) link.classList.add('active');
        });
    } catch (e) { }
}

async function loadInitialData() {
    try {
        branches = await ApiClient.request('/Branches') || [];
        customers = await ApiClient.request('/Customers') || [];
        products = await ApiClient.request('/Products') || [];
        
        const branchSelect = document.getElementById('branchSelect');
        branchSelect.innerHTML = '<option value="">Seleccione sucursal origen...</option>' + 
            branches.map(b => `<option value="${b.id}" data-lat="${b.latitude||''}" data-lng="${b.longitude||''}">${b.name}</option>`).join('');
            
        const customerSelect = document.getElementById('customerSelect');
        customerSelect.innerHTML = '<option value="">Seleccione cliente...</option>' + 
            customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            
        const productSelect = document.getElementById('productSelect');
        productSelect.innerHTML = '<option value="">Seleccione producto...</option>' + 
            products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price.toFixed(2)}</option>`).join('');
    } catch (e) { console.error("Error loading data", e); }
}

async function loadOrders() {
    try {
        const response = await ApiClient.request('/Orders?pageSize=100');
        orders = response.items || [];
        renderOrdersTable();
    } catch (e) { console.error("Error loading orders", e); }
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersList');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay pedidos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(o => {
        let badge = 'bg-secondary';
        if (o.status === 'PENDING') badge = 'bg-warning text-dark';
        if (o.status === 'DELIVERED') badge = 'bg-success';
        if (o.status === 'CANCELLED') badge = 'bg-danger';

        let actions = `<button class="btn btn-sm btn-outline-info me-1" onclick="viewOrder(${o.id})" title="Ver detalles"><i class="bi bi-eye"></i></button>`;
        if (o.status === 'PENDING') {
            actions += `
                <button class="btn btn-sm btn-outline-success me-1" onclick="openDeliverModal(${o.id})" title="Marcar Entregado"><i class="bi bi-check-circle"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="cancelOrder(${o.id})" title="Cancelar Pedido"><i class="bi bi-x-circle"></i></button>
            `;
        }

        return `
        <tr>
            <td class="fw-bold">${o.orderNumber || ''}</td>
            <td>${new Date(o.createdAt).toLocaleString()}</td>
            <td>${o.customerName || ''}</td>
            <td>${o.deliveryAddress || ''}</td>
            <td class="fw-bold text-primary">$${(o.total || 0).toFixed(2)}</td>
            <td><span class="badge ${badge}">${o.status}</span></td>
            <td>${actions}</td>
        </tr>
    `}).join('');
}

function initMaps() {
    // Main Map (Routing)
    mainMap = L.map('map-container').setView([14.6349, -90.5069], 12); // Guatemala default
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mainMap);

    // Modal Map (Address Selection)
    modalMap = L.map('order-map').setView([14.6349, -90.5069], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(modalMap);
    
    modalMarker = L.marker([14.6349, -90.5069], { draggable: true }).addTo(modalMap);
    
    modalMarker.on('dragend', function (e) {
        const coords = e.target.getLatLng();
        document.getElementById('orderLat').value = coords.lat.toFixed(6);
        document.getElementById('orderLng').value = coords.lng.toFixed(6);
        if (window.updateAddressFromCoords) window.updateAddressFromCoords(coords.lat, coords.lng, 'deliveryAddress');
    });

    modalMap.on('click', function (e) {
        modalMarker.setLatLng(e.latlng);
        document.getElementById('orderLat').value = e.latlng.lat.toFixed(6);
        document.getElementById('orderLng').value = e.latlng.lng.toFixed(6);
        if (window.updateAddressFromCoords) window.updateAddressFromCoords(e.latlng.lat, e.latlng.lng, 'deliveryAddress');
    });

    // Fix map rendering issue in Bootstrap Modal
    document.getElementById('orderModal').addEventListener('shown.bs.modal', function () {
        setTimeout(() => {
            modalMap.invalidateSize();
            // If branch has coordinates, center map there
            const branchSelect = document.getElementById('branchSelect');
            if (branchSelect.selectedIndex > 0) {
                const opt = branchSelect.options[branchSelect.selectedIndex];
                if (opt.dataset.lat && opt.dataset.lng) {
                    const lat = parseFloat(opt.dataset.lat);
                    const lng = parseFloat(opt.dataset.lng);
                    modalMap.setView([lat, lng], 14);
                    modalMarker.setLatLng([lat, lng]);
                    document.getElementById('orderLat').value = lat.toFixed(6);
                    document.getElementById('orderLng').value = lng.toFixed(6);
                }
            } else {
                modalMap.setView([14.6349, -90.5069], 13);
                modalMarker.setLatLng([14.6349, -90.5069]);
                window.useMyLocation('order');
            }
        }, 300);
    });
    
    // Also fix main map when tab is shown
    document.getElementById('map-tab').addEventListener('shown.bs.tab', function () {
        setTimeout(() => {
            mainMap.invalidateSize();
        }, 100);
    });
}

function openOrderModal() {
    if (!orderModalInstance) orderModalInstance = new bootstrap.Modal(document.getElementById('orderModal'));
    document.getElementById('orderForm').reset();
    cart = [];
    renderCart();
    document.getElementById('orderLat').value = '';
    document.getElementById('orderLng').value = '';
    orderModalInstance.show();
}

function addProduct() {
    const sel = document.getElementById('productSelect');
    if (!sel.value) return;
    
    const qty = parseInt(document.getElementById('productQty').value) || 1;
    const price = parseFloat(sel.options[sel.selectedIndex].dataset.price);
    const name = sel.options[sel.selectedIndex].text.split(' - ')[0];
    
    const existing = cart.find(i => i.productId == sel.value);
    if (existing) {
        existing.quantity += qty;
        existing.total = existing.quantity * price;
    } else {
        cart.push({ productId: parseInt(sel.value), name, quantity: qty, price, total: qty * price });
    }
    renderCart();
}

function removeProduct(index) {
    cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cartItems');
    let sum = 0;
    tbody.innerHTML = cart.map((item, i) => {
        sum += item.total;
        return `<tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${item.total.toFixed(2)}</td>
            <td><button class="btn btn-sm btn-danger py-0 px-1" type="button" onclick="removeProduct(${i})"><i class="bi bi-x"></i></button></td>
        </tr>`;
    }).join('');
    document.getElementById('cartTotal').innerText = `$${sum.toFixed(2)}`;
}

async function saveOrder() {
    if (cart.length === 0) { showToast("Agrega al menos un producto.", "error"); return; }
    
    const customerId = document.getElementById('customerSelect').value;
    const branchId = document.getElementById('branchSelect').value;
    const address = document.getElementById('deliveryAddress').value;
    const lat = document.getElementById('orderLat').value;
    const lng = document.getElementById('orderLng').value;

    if (!customerId || !branchId || !address || !lat || !lng) {
        showToast("Complete cliente, sucursal, direcci�n y asegure el pin en el mapa.", "error");
        return;
    }

    const btn = document.getElementById('btnSaveOrder');
    btn.disabled = true;

    const payload = {
        Order: {
            OrderNumber: 'ORD-' + Date.now().toString().substring(5),
            CustomerId: parseInt(customerId),
            BranchId: parseInt(branchId),
            DeliveryAddress: address,
            Latitude: parseFloat(lat),
            Longitude: parseFloat(lng),
            Total: cart.reduce((s, i) => s + i.total, 0)
        },
        Details: cart.map(c => ({
            ProductId: c.productId,
            Quantity: c.quantity,
            Price: c.price,
            Total: c.total
        }))
    };

    try {
        await ApiClient.request('/Orders', 'POST', payload);
        showToast("Pedido creado y stock reservado.", "success");
        orderModalInstance.hide();
        loadOrders();
    } catch (e) {
        showToast(e.message || "Error al crear", "error");
    } finally {
        btn.disabled = false;
    }
}

function openDeliverModal(id) {
    if (!deliverModalInstance) deliverModalInstance = new bootstrap.Modal(document.getElementById('deliverModal'));
    document.getElementById('deliverOrderId').value = id;
    document.getElementById('deliverReceiver').value = '';
    deliverModalInstance.show();
}

async function confirmDelivery() {
    const id = document.getElementById('deliverOrderId').value;
    const receiver = document.getElementById('deliverReceiver').value;
    if (!receiver) return;

    const btn = document.getElementById('btnDeliver');
    btn.disabled = true;

    try {
        await ApiClient.request(`/Orders/${id}/status`, 'PUT', { Status: 'DELIVERED', ReceiverName: receiver });
        showToast("Entregado. Venta generada exitosamente.", "success");
        deliverModalInstance.hide();
        loadOrders();
    } catch (e) {
        showToast(e.message || "Error al entregar", "error");
    } finally {
        btn.disabled = false;
    }
}

async function cancelOrder(id) {
    if (!confirm("�Seguro que deseas cancelar este pedido? El stock ser� devuelto al inventario.")) return;
    try {
        await ApiClient.request(`/Orders/${id}/status`, 'PUT', { Status: 'CANCELLED' });
        showToast("Pedido cancelado y stock devuelto.", "success");
        loadOrders();
    } catch (e) { showToast("Error al cancelar", "error"); }
}

// LOGICAL ROUTING
function calculateRoute() {
    const pendingOrders = orders.filter(o => o.status === 'PENDING' && o.latitude && o.longitude);
    if (pendingOrders.length === 0) {
        showToast("No hay pedidos pendientes para rutear.", "info");
        return;
    }

    // Get origin branch from the first pending order (assuming all belong to the same branch for routing, or just pick the first)
    const branchId = pendingOrders[0].branchId;
    const branch = branches.find(b => b.id == branchId);
    
    if (!branch || !branch.latitude || !branch.longitude) {
        showToast("La sucursal origen no tiene coordenadas definidas.", "error");
        return;
    }

    const origin = L.latLng(branch.latitude, branch.longitude);
    
    // Sort orders by distance from current point (TSP Greedy approach)
    let waypoints = [origin];
    let unvisited = [...pendingOrders];
    let currentPoint = origin;

    while (unvisited.length > 0) {
        // Find closest
        let closest = null;
        let minD = Infinity;
        let closestIdx = -1;

        unvisited.forEach((order, idx) => {
            const d = getDistance(currentPoint.lat, currentPoint.lng, order.latitude, order.longitude);
            if (d < minD) {
                minD = d;
                closest = order;
                closestIdx = idx;
            }
        });

        const p = L.latLng(closest.latitude, closest.longitude);
        waypoints.push(p);
        currentPoint = p;
        unvisited.splice(closestIdx, 1);
    }

    if (routingControl) mainMap.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        addWaypoints: false,
        lineOptions: { styles: [{ color: '#0d6efd', weight: 6 }] },
        createMarker: function(i, wp, nWps) {
            if (i === 0) return L.marker(wp.latLng).bindPopup("<b>SUCURSAL ORIGEN</b>");
            return L.marker(wp.latLng).bindPopup(`<b>Pedido ${i}</b>`);
        }
    }).addTo(mainMap);

    showToast(`Ruta trazada �ptimamente para ${waypoints.length - 1} entregas.`, "success");
}

function viewOrder(id) {
    // For simplicity, just shows a toast or implement a viewer modal
    showToast("Funci�n ver detalles en desarrollo.", "info");
}


window.useMyLocation = function(type) {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            if (type === 'order') {
                modalMap.setView([lat, lng], 16);
                modalMarker.setLatLng([lat, lng]);
                document.getElementById('orderLat').value = lat;
                document.getElementById('orderLng').value = lng;
                showToast("Ubicación obtenida.", "success");
                if (window.updateAddressFromCoords) window.updateAddressFromCoords(lat, lng, 'deliveryAddress');
            }
        }, function(error) {
            showToast("No se pudo obtener la ubicaci�n. Permisos denegados.", "error");
        });
    } else {
        showToast("Geolocalización no soportada en este navegador.", "error");
    }
}
