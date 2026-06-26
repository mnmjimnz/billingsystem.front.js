let productModalInstance;
let barcodeModalInstance;

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

async function loadProducts() {
    try {
        const products = await ApiClient.request('/Products');
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = '';
        products.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.barcode}</td>
                    <td>${p.name}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>$${p.cost.toFixed(2)}</td>
                    <td><span class="badge ${p.stock > 10 ? 'bg-success' : 'bg-danger'}">${p.stock}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-info me-1" onclick='showBarcodes(${JSON.stringify(p)})' title="Ver Códigos"><i class="bi bi-upc-scan"></i></button>
                        <button class="btn btn-sm btn-outline-primary" onclick='editProduct(${JSON.stringify(p)})' title="Editar"><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading products", e);
    }
}

function clearForm() {
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('modalTitle').innerText = 'Nuevo Producto';
}

function editProduct(product) {
    document.getElementById('productId').value = product.id;
    document.getElementById('productBarcode').value = product.barcode;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCost').value = product.cost;
    document.getElementById('productCategory').value = product.categoryId;
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
        stock: 0, // El stock se maneja por compras/Kardex, aquí se inicia en 0 si es nuevo, o se mantiene si se edita (el API debería ignorar update de stock manual)
        categoryId: parseInt(document.getElementById('productCategory').value)
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
