document.addEventListener('DOMContentLoaded', () => {
    loadDrivers();
    loadVehicles();
    loadRoutes();
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
}

function editDriver(id) {
    const d = drivers.find(x => x.id === id);
    if(!d) return;
    document.getElementById('driverId').value = d.id;
    document.getElementById('driverName').value = d.name;
    document.getElementById('driverLicense').value = d.licenseNumber;
    document.getElementById('driverPhone').value = d.phone;
    document.getElementById('driverModal').classList.add('show');
}

async function saveDriver() {
    const id = document.getElementById('driverId').value;
    const data = {
        name: document.getElementById('driverName').value,
        licenseNumber: document.getElementById('driverLicense').value,
        phone: document.getElementById('driverPhone').value,
        isActive: true
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
}

function editVehicle(id) {
    const v = vehicles.find(x => x.id === id);
    if(!v) return;
    document.getElementById('vehicleId').value = v.id;
    document.getElementById('vehiclePlate').value = v.plateNumber;
    document.getElementById('vehicleModel').value = v.model;
    document.getElementById('vehicleCapacity').value = v.capacity;
    document.getElementById('vehicleModal').classList.add('show');
}

async function saveVehicle() {
    const id = document.getElementById('vehicleId').value;
    const data = {
        plateNumber: document.getElementById('vehiclePlate').value,
        model: document.getElementById('vehicleModel').value,
        capacity: document.getElementById('vehicleCapacity').value ? parseFloat(document.getElementById('vehicleCapacity').value) : null,
        isActive: true
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
            <td class="text-end pe-4"><button class="btn btn-sm btn-light" onclick="editRoute(${r.id})"><i class="bi bi-pencil"></i></button></td>
        </tr>
    `}).join('');
}

function clearRouteForm() {
    document.getElementById('routeId').value = '';
    document.getElementById('routeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('routeDriver').value = '';
    document.getElementById('routeVehicle').value = '';
}

function editRoute(id) {
    const r = routes.find(x => x.id === id);
    if(!r) return;
    document.getElementById('routeId').value = r.id;
    document.getElementById('routeDate').value = r.date.split('T')[0];
    document.getElementById('routeDriver').value = r.driverId;
    document.getElementById('routeVehicle').value = r.vehicleId;
    document.getElementById('routeModal').classList.add('show');
}

async function saveRoute() {
    const id = document.getElementById('routeId').value;
    const data = {
        date: document.getElementById('routeDate').value + 'T00:00:00Z',
        driverId: parseInt(document.getElementById('routeDriver').value),
        vehicleId: parseInt(document.getElementById('routeVehicle').value),
        status: 'PENDING',
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
