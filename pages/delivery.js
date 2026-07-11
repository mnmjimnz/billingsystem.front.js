document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadDrivers(), loadVehicles(), loadBranches()]);
    await loadRoutes();
});

let drivers = [];
let vehicles = [];
let branches = [];
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

// Branches
async function loadBranches() {
    branches = await ApiClient.request('/Branches');
    const select = document.getElementById('routeBranch');
    if (select) {
        select.innerHTML = '<option value="">Seleccione Sucursal</option>' + branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
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
                <button class="btn btn-sm btn-light me-1 text-info" onclick="viewRouteMap(${r.id})" title="Ver Mapa de la Ruta"><i class="bi bi-map"></i></button>
                <button class="btn btn-sm btn-light me-1" onclick="manageStops(${r.id})" title="Gestionar Paradas"><i class="bi bi-geo-alt"></i></button>
                <button class="btn btn-sm btn-light" onclick="editRoute(${r.id})" title="Editar Ruta"><i class="bi bi-pencil"></i></button>
            </td>
        </tr>
    `}).join('');
}

function clearRouteForm() {
    document.getElementById('routeId').value = '';
    document.getElementById('routeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('routeBranch').value = '';
    document.getElementById('routeDriver').value = '';
    document.getElementById('routeVehicle').value = '';
    document.getElementById('routeStatus').value = 'PENDING';
}

function editRoute(id) {
    const r = routes.find(x => x.id === id);
    if(!r) return;
    document.getElementById('routeId').value = r.id;
    document.getElementById('routeDate').value = r.date.split('T')[0];
    document.getElementById('routeBranch').value = r.branchId || '';
    document.getElementById('routeDriver').value = r.driverId;
    document.getElementById('routeVehicle').value = r.vehicleId;
    document.getElementById('routeStatus').value = r.status;
    document.getElementById('routeModal').classList.add('show');
}

async function saveRoute() {
    const id = document.getElementById('routeId').value;
    const data = {
        date: document.getElementById('routeDate').value + 'T00:00:00Z',
        branchId: parseInt(document.getElementById('routeBranch').value) || 1,
        driverId: parseInt(document.getElementById('routeDriver').value),
        vehicleId: parseInt(document.getElementById('routeVehicle').value),
        status: document.getElementById('routeStatus').value,
        stops: id ? (routes.find(r => r.id === parseInt(id))?.stops || []) : []
    };
    if(id) {
        data.id = parseInt(id);
        await ApiClient.request('/Delivery/routes/' + id, 'PUT', data);
    } else {
        await ApiClient.request('/Delivery/routes', 'POST', data);
    }
    document.getElementById('routeModal').classList.remove('show');
    clearRouteForm();
    await loadRoutes();
}

// Manage Stops
let currentRouteStops = [];
let availableOrders = [];
let map = null;
let markers = [];
let polyline = null;
let branchMarker = null;
const mapCenter = [19.432608, -99.133209]; // Default CDMX

async function loadAvailableOrders() {
    try {
        const res = await ApiClient.request('/Orders?pageSize=100');
        availableOrders = (res.items || []).filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    } catch(e) {
        console.error(e);
    }
}

async function manageStops(routeId) {
    const r = routes.find(x => x.id === routeId);
    if(!r) return;
    
    // Set map center to branch location if available
    const branch = branches.find(b => b.id === r.branchId);
    if (branch && branch.latitude && branch.longitude) {
        mapCenter[0] = branch.latitude;
        mapCenter[1] = branch.longitude;
    }
    
    document.getElementById('stopsRouteId').value = r.id;
    currentRouteStops = JSON.parse(JSON.stringify(r.stops || []));
    
    await loadAvailableOrders();
    document.getElementById('stopsModal').classList.add('show');
    
    // Initialize map after modal is shown to ensure correct dimensions
    setTimeout(() => {
        if (!map) {
            map = L.map('routeMapContainer').setView(mapCenter, 12);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(map);
        } else {
            map.setView(mapCenter, 12);
        }
        
        if (branchMarker) {
            map.removeLayer(branchMarker);
        }
        branchMarker = L.marker(mapCenter, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
            })
        }).addTo(map).bindPopup('<b>' + (branch ? branch.name : 'Tu Ubicación') + ' (Origen)</b>').openPopup();

        map.invalidateSize();
        renderStops();
    }, 250);
}

function renderStops() {
    const tbody = document.getElementById('stopsTableBody');
    if(currentRouteStops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay paradas asignadas a esta ruta.</td></tr>';
    } else {
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
    
    updateMap();
}

async function updateMap() {
    if (!map) return;
    
    // Clear existing markers and polyline
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (polyline) map.removeLayer(polyline);
    
    const latlngsForRoute = [];
    
    // Draw all pending orders not in the route
    availableOrders.forEach(o => {
        const isInRoute = currentRouteStops.some(s => s.orderId === o.id);
        if(!isInRoute && o.latitude && o.longitude) {
            const marker = L.marker([o.latitude, o.longitude], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
                })
            }).addTo(map);
            marker.bindPopup(`
                <b>Pedido #${o.id}</b><br>
                Cliente: ${o.customerName}<br>
                Total: $${o.total}<br>
                <button class="btn btn-sm btn-primary mt-2" onclick="addStopFromMap(${o.id})">Añadir a Ruta</button>
            `);
            markers.push(marker);
        }
    });
    
    // Draw route stops in order
    currentRouteStops.forEach((s, index) => {
        // Stop might be in availableOrders (if recent), or we might need to fetch it (for MVP, we assume we have it or just plot what we know)
        const order = availableOrders.find(o => o.id === s.orderId);
        if (order && order.latitude && order.longitude) {
            latlngsForRoute.push([order.latitude, order.longitude]);
            const marker = L.marker([order.latitude, order.longitude], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
                })
            }).addTo(map);
            marker.bindPopup(`<b>Parada ${index + 1}</b><br>Pedido #${order.id}<br>${order.customerName}`);
            markers.push(marker);
        }
    });
    
    if (latlngsForRoute.length > 1) {
        try {
            // Include warehouse location as starting point if available
            if (mapCenter && latlngsForRoute.length > 0) {
                latlngsForRoute.unshift(mapCenter); // Add branch at start
            }
            
            // Build OSRM query string (lng,lat;lng,lat)
            const coordsStr = latlngsForRoute.map(ll => `${ll[1]},${ll[0]}`).join(';');
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
            
            const response = await fetch(osrmUrl);
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                // Convert coordinates from GeoJSON [lng, lat] to Leaflet [lat, lng]
                const routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                polyline = L.polyline(routeCoords, {color: 'blue', weight: 4, opacity: 0.7}).addTo(map);
                map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
            } else {
                throw new Error("No route found");
            }
        } catch(e) {
            console.error("OSRM Routing error, falling back to straight lines:", e);
            polyline = L.polyline(latlngsForRoute, {color: 'blue', weight: 4, opacity: 0.7}).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
    } else if (latlngsForRoute.length === 1) {
        map.setView(latlngsForRoute[0], 14);
    }
}

window.addStopFromMap = function(orderId) {
    if(currentRouteStops.find(s => s.orderId === orderId)) return;
    currentRouteStops.push({
        orderId: orderId,
        stopOrder: currentRouteStops.length + 1,
        status: 'PENDING'
    });
    map.closePopup();
    renderStops();
};

let viewMap = null;
let viewMarkers = [];
let viewPolyline = null;

window.viewRouteMap = async function(routeId) {
    const r = routes.find(x => x.id === routeId);
    if(!r) return;
    
    document.getElementById('viewMapModal').classList.add('show');
    
    // We need all orders to get their coordinates (even if they are completed)
    let allOrders = [];
    try {
        const res = await ApiClient.request('/Orders?pageSize=100');
        allOrders = res.items || [];
    } catch(e) {
        console.error(e);
    }
    
    const branch = branches.find(b => b.id === r.branchId);
    let viewCenter = [...mapCenter];
    if (branch && branch.latitude && branch.longitude) {
        viewCenter = [branch.latitude, branch.longitude];
    }
    
    setTimeout(async () => {
        if (!viewMap) {
            viewMap = L.map('viewOnlyMapContainer').setView(viewCenter, 12);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(viewMap);
        } else {
            viewMap.setView(viewCenter, 12);
        }

        if (viewBranchMarker) {
            viewMap.removeLayer(viewBranchMarker);
        }
        viewBranchMarker = L.marker(viewCenter, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
            })
        }).addTo(viewMap).bindPopup('<b>' + (branch ? branch.name : 'Origen') + '</b>');

        viewMap.invalidateSize();
        
        // Clear old routes
        viewMarkers.forEach(m => viewMap.removeLayer(m));
        viewMarkers = [];
        if (viewPolyline) viewMap.removeLayer(viewPolyline);
        
        const latlngsForRoute = [];
        const stops = r.stops || [];
        
        stops.forEach((s, index) => {
            const order = allOrders.find(o => o.id === s.orderId);
            if (order && order.latitude && order.longitude) {
                latlngsForRoute.push([order.latitude, order.longitude]);
                const marker = L.marker([order.latitude, order.longitude], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
                    })
                }).addTo(viewMap);
                marker.bindPopup(`<b>Parada ${index + 1}</b><br>Pedido #${order.id}<br>${order.customerName || ''}<br>Estado: ${s.status}`);
                viewMarkers.push(marker);
            }
        });
        
        if (latlngsForRoute.length > 0) {
            try {
                if (viewCenter) {
                    latlngsForRoute.unshift(viewCenter);
                }
                const coordsStr = latlngsForRoute.map(ll => `${ll[1]},${ll[0]}`).join(';');
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
                const response = await fetch(osrmUrl);
                const data = await response.json();
                
                if (data.routes && data.routes.length > 0) {
                    const routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    viewPolyline = L.polyline(routeCoords, {color: 'blue', weight: 4, opacity: 0.7}).addTo(viewMap);
                    viewMap.fitBounds(viewPolyline.getBounds(), { padding: [50, 50] });
                }
            } catch(e) {
                viewPolyline = L.polyline(latlngsForRoute, {color: 'blue', weight: 4, opacity: 0.7}).addTo(viewMap);
                viewMap.fitBounds(viewPolyline.getBounds(), { padding: [50, 50] });
            }
        } else if (latlngsForRoute.length === 1) {
            viewMap.setView(latlngsForRoute[0], 14);
        } else {
            viewMap.setView(mapCenter, 12);
        }
    }, 250);
};

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

