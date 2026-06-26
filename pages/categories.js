let categoryModalInstance;

document.addEventListener('DOMContentLoaded', async () => {
    categoryModalInstance = new bootstrap.Modal(document.getElementById('categoryModal'));
    await loadCategories();
});

async function loadCategories() {
    try {
        const categories = await ApiClient.request('/Categories');
        const tbody = document.getElementById('categories-table-body');
        tbody.innerHTML = '';
        categories.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 fw-medium text-secondary">#${c.id}</td>
                    <td class="fw-bold text-primary">${c.name}</td>
                    <td>${c.description || '-'}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-light text-primary border" onclick='editCategory(${JSON.stringify(c)})'>
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error loading categories", e);
    }
}

function clearForm() {
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryForm').reset();
    document.getElementById('modalTitle').innerText = 'Nueva Categoría';
}

function editCategory(cat) {
    document.getElementById('categoryId').value = cat.id;
    document.getElementById('categoryName').value = cat.name;
    document.getElementById('categoryDescription').value = cat.description;
    document.getElementById('modalTitle').innerText = 'Editar Categoría';
    categoryModalInstance.show();
}

async function saveCategory() {
    const id = document.getElementById('categoryId').value;
    const cat = {
        id: id ? parseInt(id) : 0,
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value
    };

    try {
        if (id) {
            await ApiClient.request(`/Categories/${id}`, 'PUT', cat);
        } else {
            await ApiClient.request('/Categories', 'POST', cat);
        }
        categoryModalInstance.hide();
        await loadCategories();
    } catch (e) {
        alert('Error guardando la categoría');
    }
}

function logout() {
    ApiClient.clearToken();
    window.location.href = 'login.html';
}
