let categoryModalInstance;
let currentPage = 1;
let currentSearch = '';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    categoryModalInstance = new bootstrap.Modal(document.getElementById('categoryModal'));
    await loadCategories();
});

async function loadCategories(page = 1) {
    try {
        currentPage = page;
        const result = await ApiClient.request(`/Categories/paged?page=${page}&pageSize=10&search=${encodeURIComponent(currentSearch)}`);
        const tbody = document.getElementById('categories-table-body');
        tbody.innerHTML = '';
        const categories = result.items || [];
        categories.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 fw-medium text-secondary">#${c.id}</td>
                    <td class="fw-bold text-primary">${c.name}</td>
                    <td>${c.description || '-'}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick='editCategory(${JSON.stringify(c)})' title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        renderPagination('pagination-container', result, 'loadCategories');
    } catch (e) {
        console.error("Error loading categories", e);
    }
}

function handleSearch(event) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = event.target.value;
        loadCategories(1);
    }, 500);
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
