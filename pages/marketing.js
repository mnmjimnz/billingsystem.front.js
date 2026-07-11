document.addEventListener('DOMContentLoaded', () => {
    loadCoupons();
});

let coupons = [];
const modal = new bootstrap.Modal(document.getElementById('couponModal'));

async function loadCoupons() {
    try {
        coupons = await apiClient.get('/api/Coupons');
        renderCoupons();
    } catch (error) {
        showToast('Error al cargar cupones', 'error');
    }
}

function renderCoupons() {
    const tbody = document.getElementById('coupons-table-body');
    tbody.innerHTML = '';
    
    coupons.forEach(c => {
        let discountTxt = c.discountPercentage ? ${c.discountPercentage}% : $;
        let validTxt = (c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'Siempre') + ' - ' + (c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'Siempre');
        let useTxt = c.maxUses ? ${c.currentUses} /  : ${c.currentUses} (Sin límite);
        let statusBadge = c.isActive 
            ? <span class="badge bg-success-subtle text-success">Activo</span> 
            : <span class="badge bg-danger-subtle text-danger">Inactivo</span>;

        tbody.innerHTML += 
            <tr>
                <td class="ps-4 fw-bold text-primary"></td>
                <td></td>
                <td><small class="text-muted"></small></td>
                <td></td>
                <td></td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-light me-2" onclick="editCoupon()" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="deleteCoupon()" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        ;
    });
}

function clearForm() {
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = '';
    document.getElementById('modalTitle').textContent = 'Nuevo Cupón';
}

function editCoupon(id) {
    const c = coupons.find(x => x.id === id);
    if (!c) return;

    document.getElementById('couponId').value = c.id;
    document.getElementById('couponCode').value = c.code;
    document.getElementById('discountPercentage').value = c.discountPercentage || '';
    document.getElementById('discountAmount').value = c.discountAmount || '';
    document.getElementById('validFrom').value = c.validFrom ? c.validFrom.split('T')[0] : '';
    document.getElementById('validUntil').value = c.validUntil ? c.validUntil.split('T')[0] : '';
    document.getElementById('maxUses').value = c.maxUses || '';
    document.getElementById('isActive').checked = c.isActive;

    document.getElementById('modalTitle').textContent = 'Editar Cupón';
    modal.show();
}

async function saveCoupon() {
    const id = document.getElementById('couponId').value;
    const code = document.getElementById('couponCode').value;
    const discountPercentage = document.getElementById('discountPercentage').value;
    const discountAmount = document.getElementById('discountAmount').value;
    const validFrom = document.getElementById('validFrom').value;
    const validUntil = document.getElementById('validUntil').value;
    const maxUses = document.getElementById('maxUses').value;
    const isActive = document.getElementById('isActive').checked;

    if (!code) {
        showToast('El código es requerido', 'error');
        return;
    }

    if (!discountPercentage && !discountAmount) {
        showToast('Debe ingresar un porcentaje o un monto de descuento', 'error');
        return;
    }

    const payload = {
        code,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        validFrom: validFrom ? validFrom + 'T00:00:00Z' : null,
        validUntil: validUntil ? validUntil + 'T23:59:59Z' : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        isActive
    };

    try {
        if (id) {
            payload.id = parseInt(id);
            await apiClient.put(/api/Coupons/, payload);
            showToast('Cupón actualizado exitosamente');
        } else {
            await apiClient.post('/api/Coupons', payload);
            showToast('Cupón creado exitosamente');
        }
        modal.hide();
        loadCoupons();
    } catch (error) {
        showToast('Error al guardar el cupón', 'error');
    }
}

async function deleteCoupon(id) {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
    try {
        await apiClient.delete(/api/Coupons/);
        showToast('Cupón eliminado');
        loadCoupons();
    } catch (error) {
        showToast('Error al eliminar', 'error');
    }
}
