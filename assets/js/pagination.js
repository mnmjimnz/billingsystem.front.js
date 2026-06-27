function renderPagination(containerId, data, onPageChangeName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.totalCount === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3 small">No se encontraron resultados.</div>';
        return;
    }

    let html = '<nav aria-label="Navegación"><ul class="pagination justify-content-end mb-0">';
    
    // Prev
    html += `<li class="page-item ${data.page <= 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); window['${onPageChangeName}'](${data.page - 1})">Anterior</a>
             </li>`;

    // Calculate max pages to show
    let startPage = Math.max(1, data.page - 2);
    let endPage = Math.min(data.totalPages, data.page + 2);

    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="event.preventDefault(); window['${onPageChangeName}'](1)">1</a></li>`;
        if (startPage > 2) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${i === data.page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); window['${onPageChangeName}'](${i})">${i}</a>
                 </li>`;
    }

    if (endPage < data.totalPages) {
        if (endPage < data.totalPages - 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        html += `<li class="page-item"><a class="page-link" href="#" onclick="event.preventDefault(); window['${onPageChangeName}'](${data.totalPages})">${data.totalPages}</a></li>`;
    }

    // Next
    html += `<li class="page-item ${data.page >= data.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); window['${onPageChangeName}'](${data.page + 1})">Siguiente</a>
             </li>`;

    html += '</ul></nav>';
    
    html += `<div class="text-end text-muted mt-2 small">Mostrando ${data.items.length} de ${data.totalCount} registros</div>`;
    
    container.innerHTML = html;
}
