document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadDrivers(), loadVehicles()]);
    await loadRoutes();
});

let drivers = [];
let vehicles = [];
let routes = [];

// Drivers
async function loadDrivers() {
    drivers = await ApiClient.request('/Delivery/drivers');
    const tbody = document.getElementById('driversTable');
    tbody.innerHTML = drivers.map(d => `
        <tr>
            <td class="ps-4">${d.id}</td>
            <td>${d.name}</td>
            <td>${d.licenseNumber}</td>
            <td>${d.isActive ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
            <td class="text-end pe-4"><button class="btn btn-sm btn-light" onclick="editDriver(${d.id})"><i class="bi bi-pencil"></i></button></td>
        </tr>
    `).join('');
    
    // update select
    const sel = document.getElementById('routeDriver');
    if (sel) sel.innerHTML = '<option value="">Seleccione Conductor</option>' + drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

function clearDriverForm() {
    document.getElementById('driverId').value = '';
    document.getElementById('driverName').value = '';
    document.getElementById('driverLicense').value = '';
    document.getElementById('driverPhone').value = '';
    document.getElementById('driverStatus').value = 'true';
}

function editDriver(id) {
    const d = drivers.find(x => x.id === id);
    if(!d) return;
    document.getElementById('driverId').value = d.id;
    document.getElementById('driverName').value = d.name;
    document.getElementById('driverLicense').value = d.licenseNumber;
    document.getElementById('driverPhone').value = d.phone;
    document.getElementById('driverStatus').value = d.isActive ? 'true' : 'false';
    document.getElementById('driverModal').classList.add('show');
}

async function saveDriver() {
    const id = document.getElementById('driverId').value;
    const data = {
        name: document.getElementById('driverName').value,
        licenseNumber: document.getElementById('driverLicense').value,
        phone: document.getElementById('driverPhone').value,
        isActive: document.getElementById('driverStatus').value === 'true'
    };
    if(id) {
        data.id = parseInt(id);
        await ApiClient.request('/Delivery/drivers/' + id, 'PUT', data);
    } else {
        await ApiClient.request('/Delivery/drivers', 'POST', data);
    }
    document.getElementById('driverModal').classList.remove('show');
    loadDrivers();
}

// Vehicles
async function loadVehicles() {
    vehicles = await ApiClient.request('/Delivery/vehicles');
    const tbody = document.getElementById('vehiclesTable');
    tbody.innerHTML = vehicles.map(v => `
        <tr>
            <td class="ps-4">${v.plateNumber}</td>
            <td>${v.model}</td>
            <td>${v.capacity || 0}</td>
            <td>${v.isActive ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
            <td class="text-end pe-4"><button class="btn btn-sm btn-light" onclick="editVehicle(${v.id})"><i class="bi bi-pencil"></i></button></td>
        </tr>
    `).join('');
    
    const sel = document.getElementById('routeVehicle');
    if (sel) sel.innerHTML = '<option value="">Seleccione Vehículo</option>' + vehicles.map(v => `<option value="${v.id}">${v.plateNumber} - ${v.model}</option>`).join('');
}

function clearVehicleForm() {
    document.getElementById('vehicleId').value = '';
    document.getElementById('vehiclePlate').value = '';
    document.getElementById('vehicleModel').value = '';
    document.getElementById('vehicleCapacity').value = '';
    document.getElementById('vehicleStatus').value = 'true';
}

function editVehicle(id) {
    const v = vehicles.find(x => x.id === id);
    if(!v) return;
    document.getElementById('vehicleId').value = v.id;
    document.getElementById('vehiclePlate').value = v.plateNumber;
    document.getElementById('vehicleModel').value = v.model;
    document.getElementById('vehicleCapacity').value = v.capacity;
    document.getElementById('vehicleStatus').value = v.isActive ? 'true' : 'false';
    document.getElementById('vehicleModal').classList.add('show');
}

async function saveVehicle() {
    const id = document.getElementById('vehicleId').value;
    const data = {
        plateNumber: document.getElementById('vehiclePlate').value,
        model: document.getElementById('vehicleModel').value,
        capacity: document.getElementById('vehicleCapacity').value ? parseFloat(document.getElementById('vehicleCapacity').value) : null,
        isActive: document.getElementById('vehicleStatus').value === 'true'
    };
    if(id) {
        data.id = parseInt(id);
        await ApiClient.request('/Delivery/vehicles/' + id, 'PUT', data);
    } else {
        await ApiClient.request('/Delivery/vehicles', 'POST', data);
    }
    document.getElementById('vehicleModal').classList.remove('show');
    loadVehicles();
}

// Routes
async function loadRoutes() {
    routes = await ApiClient.request('/Delivery/routes');
    const tbody = document.getElementById('routesTable');
    tbody.innerHTML = routes.map(r => {
        const d = drivers.find(x => x.id === r.driverId)?.name || 'N/A';
        const v = vehicles.find(x => x.id === r.vehicleId)?.plateNumber || 'N/A';
        return `
        <tr>
            <td class="ps-4">${r.id}</td>
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td>${d}</td>
            <td>${v}</td>
            <td><span class="badge bg-primary">${r.status}</span></td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-light me-1" onclick="manageStops(${r.id})" title="Gestionar Paradas"><i class="bi bi-geo-alt"></i></button>
                <button class="btn btn-sm btn-light" onclick="editRoute(${r.id})" title="Editar Ruta"><i class="bi bi-pencil"></i></button>
            </td>
        </tr>
    `}).join('');
}

function clearRouteForm() {
    document.getElementById('routeId').value = '';
    document.getElementById('routeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('routeDriver').value = '';
    document.getElementById('routeVehicle').value = '';
    document.getElementById('routeStatus').value = 'PENDING';
}

function editRoute(id) {
    const r = routes.find(x => x.id === id);
    if(!r) return;
    document.getElementById('routeId').value = r.id;
    document.getElementById('routeDate').value = r.date.split('T')[0];
    document.getElementById('routeDriver').value = r.driverId;
    document.getElementById('routeVehicle').value = r.vehicleId;
    document.getElementById('routeStatus').value = r.status;
    document.getElementById('routeModal').classList.add('show');
}

async function saveRoute() {
    const id = document.getElementById('routeId').value;
    const data = {
        date: document.getElementById('routeDate').value + 'T00:00:00Z',
        driverId: parseInt(document.getElementById('routeDriver').value),
        vehicleId: parseInt(document.getElementById('routeVehicle').value),
        status: document.getElementById('routeStatus').value,
        stops: []
    };
    if(id) {
        data.id = parseInt(id);
        await ApiClient.request('/Delivery/routes/' + id, 'PUT', data);
    } else {
        await ApiClient.request('/Delivery/routes', 'POST', data);
    }
    document.getElementById('routeModal').classList.remove('show');
    loadRoutes();
}

// Manage Stops
let currentRouteStops = [];
let availableOrders = [];

async function loadAvailableOrders() {
    try {
        // We load all orders and filter out those that are not PAID or already delivered
        // For simplicity, we just fetch orders (assuming page size is enough for this MVP)
        const res = await ApiClient.request('/Orders?pageSize=100');
        // Filter orders that are not COMPLETED/CANCELLED
        availableOrders = (res.items || []).filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
        
        const sel = document.getElementById('availableOrders');
        sel.innerHTML = '<option value="">Seleccione un Pedido...</option>' + 
            availableOrders.map(o => `<option value="${o.id}">Pedido #${o.id} - ${o.customerName || 'Cliente'} ($${o.total})</option>`).join('');
    } catch(e) {
        console.error(e);
    }
}

async function manageStops(routeId) {
    const r = routes.find(x => x.id === routeId);
    if(!r) return;
    
    document.getElementById('stopsRouteId').value = r.id;
    currentRouteStops = JSON.parse(JSON.stringify(r.stops || []));
    
    await loadAvailableOrders();
    renderStops();
    document.getElementById('stopsModal').classList.add('show');
}

function renderStops() {
    const tbody = document.getElementById('stopsTableBody');
    if(currentRouteStops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay paradas asignadas a esta ruta.</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentRouteStops.map((s, index) => `
        <tr>
            <td>Pedido #${s.orderId}</td>
            <td>${index + 1}</td>
            <td><span class="badge bg-secondary">${s.status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-light text-danger" onclick="removeStop(${index})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function addStopToRoute() {
    const sel = document.getElementById('availableOrders');
    const orderId = parseInt(sel.value);
    if(!orderId) return;
    
    // Check if already in stops
    if(currentRouteStops.find(s => s.orderId === orderId)) {
        showToast('Error', 'Este pedido ya está en la ruta', 'danger');
        return;
    }
    
    currentRouteStops.push({
        orderId: orderId,
        stopOrder: currentRouteStops.length + 1,
        status: 'PENDING'
    });
    
    sel.value = ''; // Reset selection
    renderStops();
}

function removeStop(index) {
    currentRouteStops.splice(index, 1);
    // Re-calculate stop orders
    currentRouteStops.forEach((s, i) => s.stopOrder = i + 1);
    renderStops();
}

async function saveStops() {
    const routeId = parseInt(document.getElementById('stopsRouteId').value);
    const r = routes.find(x => x.id === routeId);
    if(!r) return;
    
    // Create an updated route object with the new stops
    const data = {
        id: r.id,
        date: r.date,
        driverId: r.driverId,
        vehicleId: r.vehicleId,
        status: r.status,
        stops: currentRouteStops
    };
    
    try {
        await ApiClient.request('/Delivery/routes/' + routeId, 'PUT', data);
        document.getElementById('stopsModal').classList.remove('show');
        showToast('Éxito', 'Paradas actualizadas correctamente', 'success');
        loadRoutes();
    } catch(e) {
        console.error(e);
        showToast('Error', 'No se pudieron guardar las paradas', 'danger');
    }
}

