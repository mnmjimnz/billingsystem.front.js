const API_URL = 'https://billingsystem-net10pg.onrender.com/api'; // Replace with local if testing locally, or dynamic

let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('storeCart')) || [];
let currentCategory = 0;
let currentPage = 1;

function initStore() {
    loadStoreName();
    updateCartCount();
    checkAuth();
}

function checkAuth() {
    const customer = JSON.parse(localStorage.getItem('storeCustomer'));
    const token = localStorage.getItem('storeToken');

    if (customer && token) {
        document.getElementById('authMenu').style.display = 'none';
        document.getElementById('userMenu').style.display = 'flex';
        document.getElementById('customerName').innerText = customer.name.split(' ')[0];
    } else {
        document.getElementById('authMenu').style.display = 'block';
        document.getElementById('userMenu').style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('storeCustomer');
    localStorage.removeItem('storeToken');
    checkAuth();
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/Store/categories`);
        if (response.ok) {
            categories = await response.json();
            renderCategories();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderCategories() {
    const list = document.getElementById('categoryList');
    if (!list) return;

    let html = `<li class="list-group-item ${currentCategory === 0 ? 'active-category' : ''}" onclick="filterByCategory(0)">Todas</li>`;
    
    categories.forEach(c => {
        html += `<li class="list-group-item ${currentCategory === c.id ? 'active-category' : ''}" onclick="filterByCategory(${c.id})">${c.name}</li>`;
    });
    
    list.innerHTML = html;
}

function filterByCategory(id) {
    currentCategory = id;
    renderCategories();
    loadProducts(1);
}

async function loadProducts(page = 1) {
    currentPage = page;
    const search = document.getElementById('searchInput')?.value || '';
    
    try {
        const response = await fetch(`${API_URL}/Store/products?page=${page}&pageSize=12&categoryId=${currentCategory}&search=${encodeURIComponent(search)}`);
        if (response.ok) {
            const data = await response.json();
            renderProducts(data.items);
            renderPagination(data.totalCount, data.page, data.pageSize);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts(items) {
    const container = document.getElementById('productList');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<div class="col-12 text-center my-5"><h5 class="text-muted">No se encontraron productos.</h5></div>`;
        return;
    }

    let html = '';
    items.forEach(p => {
        html += `
            <div class="col-sm-6 col-md-6 col-lg-4 mb-3">
                <div class="product-card h-100 d-flex flex-column">
                    <div class="product-img-wrapper">
                        <img src="${p.imageUrl ? 'https://billingsystem-net10pg.onrender.com' + p.imageUrl : 'https://via.placeholder.com/300x300?text=Sin+Imagen'}" class="product-img" alt="${p.name}">
                    </div>
                    <div class="p-4 d-flex flex-column flex-grow-1">
                        <h3 class="product-title text-truncate" title="${p.name}">${p.name}</h3>
                        <p class="small text-muted mb-3 flex-grow-1" style="line-height: 1.4;">${p.description ? p.description.substring(0,60) + '...' : ''}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="product-price">${p.price.toFixed(2)}</span>
                            <button class="btn-minimal" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl || ''}')">
                                <i class="bi bi-plus-lg"></i> Agregar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderPagination(totalCount, page, pageSize) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
                <a class="page-link bg-dark text-light border-secondary" href="#" onclick="event.preventDefault(); loadProducts(${page - 1})">Anterior</a>
             </li>`;
             
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link ${i === page ? 'bg-primary border-primary' : 'bg-dark text-light border-secondary'}" href="#" onclick="event.preventDefault(); loadProducts(${i})">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
                <a class="page-link bg-dark text-light border-secondary" href="#" onclick="event.preventDefault(); loadProducts(${page + 1})">Siguiente</a>
             </li>`;
             
    container.innerHTML = html;
}

function addToCart(id, name, price, image) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1, image });
    }
    saveCart();
    
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: 'Agregado al carrito',
        showConfirmButton: false,
        timer: 1500,
        background: '#fff',
        color: '#212529'
    });
}

function saveCart() {
    localStorage.setItem('storeCart', JSON.stringify(cart));
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
}

function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
        countEl.innerText = totalItems;
    }
}

// CART PAGE LOGIC
function renderCart() {
    const tbody = document.getElementById('cartItems');
    if (!tbody) return;

    if (cart.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5">Tu carrito está vacío. <br><a href="index.html" class="btn btn-primary mt-3">Ver catálogo</a></td></tr>`;
        document.getElementById('cartTotal').innerText = '$0.00';
        document.getElementById('checkoutBtn').disabled = true;
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        total += subtotal;

        html += `
            <tr>
                <td class="align-middle">
                    <img src="${item.image || 'https://via.placeholder.com/50'}" alt="" width="50" class="rounded me-2 bg-white">
                    <span class="fw-semibold">${item.name}</span>
                </td>
                <td class="align-middle">$${item.price.toFixed(2)}</td>
                <td class="align-middle">
                    <div class="input-group input-group-sm" style="width: 120px;">
                        <button class="btn btn-outline-secondary text-light" type="button" onclick="updateCartQty(${index}, -1)">-</button>
                        <input type="text" class="form-control text-center bg-dark text-light border-secondary" value="${item.qty}" readonly>
                        <button class="btn btn-outline-secondary text-light" type="button" onclick="updateCartQty(${index}, 1)">+</button>
                    </div>
                </td>
                <td class="align-middle fw-bold">$${subtotal.toFixed(2)}</td>
                <td class="align-middle text-end">
                    <button class="btn btn-outline-danger btn-sm" onclick="removeFromCart(${index})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
    document.getElementById('checkoutBtn').disabled = false;
}

function updateCartQty(index, change) {
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function proceedToCheckout() {
    const token = localStorage.getItem('storeToken');
    if (!token) {
        Swal.fire({
            title: 'Inicia Sesión',
            text: 'Debes iniciar sesión o registrarte para continuar con tu pedido.',
            icon: 'info',
            background: '#fff',
            color: '#212529',
            confirmButtonText: 'Ir a Login'
        }).then(() => {
            window.location.href = 'login.html?redirect=cart.html';
        });
        return;
    }

    // Open map modal
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    checkoutModal.show();

    // Init map if not initialized
    setTimeout(() => {
        if (!window.mapInitialized) {
            initMap();
        }
    }, 500);
}


async function loadStoreName() {
    try {
        const res = await fetch('https://billingsystem-net10pg.onrender.com/api/Settings');
        if (res.ok) {
            const settings = await res.json();
            if (settings && settings.companyName) {
                const el = document.getElementById('storeNameBrand');
                if (el) el.innerText = settings.companyName;
                document.title = settings.companyName + ' - Tienda en Línea';
            }
        }
    } catch (e) {
        console.log("No se pudo cargar el nombre de la tienda");
    }
}
