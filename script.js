// Dashboard Académico - UANDES
// Versión estable - Sin módulo de PDFs

let datosBase = {};
let datosProduccion = {};
const sinFicha = [];
let profesorActualFicha = null;

// ============================================
// CARGA DE DATOS
// ============================================

async function cargarDatos() {
    try {
        console.log('→ Cargando datos...');
        
        const responseBase = await fetch('profesores-base.json');
        datosBase = await responseBase.json();
        console.log(`✓ Base: ${Object.keys(datosBase).length} profesores`);
        
        const responseProduccion = await fetch('profesores-produccion.json');
        datosProduccion = await responseProduccion.json();
        console.log(`✓ Producción: ${Object.keys(datosProduccion).length} profesores`);
        
        // Identificar profesores sin ficha
        for (const nombre of Object.keys(datosBase)) {
            if (!datosProduccion[nombre]) {
                sinFicha.push({ nombre });
            }
        }
        
        console.log(`✓ Sin ficha: ${sinFicha.length} profesores`);
        inicializar();
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
    }
}

function inicializar() {
    console.log('→ Inicializando dashboard...');
    
    const profesoresConDatos = Object.keys(datosBase).map((nombre, idx) => ({
        id: `prof${String(idx + 1).padStart(2, '0')}`,
        nombre: nombre,
        nombres: datosBase[nombre].nombres || nombre,
        grado: datosBase[nombre].grado || '',
        nombreVisual: datosBase[nombre].nombre_visual || nombre,
        tieneDatos: true
    }));
    
    const profesoresSinDatos = sinFicha.map((p, idx) => ({
        id: `prof${String(Object.keys(datosBase).length + idx + 1).padStart(2, '0')}`,
        nombre: p.nombre,
        nombres: p.nombre,
        grado: '',
        nombreVisual: p.nombre,
        tieneDatos: false
    }));
    
    const profesores = [...profesoresConDatos, ...profesoresSinDatos];
    
    generarListado(profesores);
    poblarSelectorProfesores();
    
    console.log('✓ Dashboard inicializado');
}

// ============================================
// PÁGINA: PROFESORES
// ============================================

function generarListado(profesores) {
    const container = document.getElementById('profesores-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const prof of profesores) {
        const card = document.createElement('div');
        card.className = 'profesor-card';
        card.innerHTML = `
            <div class="card-header">
                <h2>${prof.nombreVisual}</h2>
                <p class="card-grado">${prof.grado || 'Sin grado'}</p>
            </div>
            ${prof.tieneDatos ? `
                <div class="card-actions">
                    <button class="btn-primary" onclick="mostrarModalProfesor('${prof.nombre}')">
                        Ver Perfil
                    </button>
                </div>
            ` : '<p style="padding: 10px; text-align: center; color: #999;">Sin datos académicos</p>'}
        `;
        container.appendChild(card);
    }
}

function mostrarModalProfesor(nombreProfesor) {
    const base = datosBase[nombreProfesor];
    const produccion = datosProduccion[nombreProfesor];
    
    if (!base || !produccion) return;
    
    const modal = document.getElementById('profesor-modal');
    const modalContent = document.getElementById('profesor-modal-content');
    
    let html = `
        <h2>${base.nombre_visual || nombreProfesor}</h2>
        <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; background: #f0f0f0; font-weight: bold; width: 30%;"><strong>Vínculo:</strong></td>
                <td style="padding: 8px;">${base.vinculo || 'N/A'}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f0f0f0; font-weight: bold;"><strong>Título:</strong></td>
                <td style="padding: 8px;">${base.titulo || 'N/A'}</td>
            </tr>
            <tr>
                <td style="padding: 8px; background: #f0f0f0; font-weight: bold;"><strong>Grado:</strong></td>
                <td style="padding: 8px;">${base.grado || 'N/A'}</td>
            </tr>
        </table>
    `;
    
    const secciones = produccion.secciones || {};
    for (const tipo in secciones) {
        const sec = secciones[tipo];
        if (!sec.filas || sec.filas.length === 0) continue;
        
        html += `<h3 style="margin-top: 20px; margin-bottom: 10px;">${tipo}</h3>`;
        html += construirTabla(tipo, sec.headers, sec.filas);
    }
    
    modalContent.innerHTML = html;
    modal.style.display = 'block';
}

function construirTabla(titulo, headers, filas) {
    let html = `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
            <tr style="background: #667eea; color: white;">`;
    
    for (const header of headers) {
        html += `<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">${header}</th>`;
    }
    
    html += `</tr></thead><tbody>`;
    
    for (let i = 0; i < filas.length; i++) {
        html += `<tr style="background: ${i % 2 === 0 ? '#f9f9f9' : 'white'};">`;
        for (const header of headers) {
            html += `<td style="padding: 10px; border: 1px solid #ddd;">${filas[i][header] || ''}</td>`;
        }
        html += `</tr>`;
    }
    
    html += `</tbody></table>`;
    return html;
}

// ============================================
// REPORTERÍA: FICHA ACADÉMICA CNA
// ============================================

function poblarSelectorProfesores() {
    const select = document.getElementById('profesor-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona un profesor</option>';
    
    for (const nombre of Object.keys(datosBase)) {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = datosBase[nombre].nombre_visual || nombre;
        select.appendChild(option);
    }
}

function generarFichaCNA() {
    const select = document.getElementById('profesor-select');
    const nombreProfesor = select.value;
    const preview = document.getElementById('ficha-cna-preview');
    const btnDescargaPDF = document.getElementById('btn-descargar-pdf');
    const btnDescargaExcel = document.getElementById('btn-descargar-ficha-excel-cna');
    
    if (!nombreProfesor) {
        preview.innerHTML = `<div class="preview-placeholder"><p>Selecciona un profesor</p></div>`;
        btnDescargaPDF.style.display = 'none';
        btnDescargaExcel.style.display = 'none';
        return;
    }
    
    const base = datosBase[nombreProfesor];
    const produccion = datosProduccion[nombreProfesor];
    
    if (!base || !produccion) {
        preview.innerHTML = `<div class="preview-placeholder"><p>No se encontraron datos</p></div>`;
        btnDescargaPDF.style.display = 'none';
        btnDescargaExcel.style.display = 'none';
        return;
    }
    
    profesorActualFicha = nombreProfesor;
    const fichaHTML = construirFichaCNA(nombreProfesor, base, produccion);
    preview.innerHTML = fichaHTML;
    btnDescargaPDF.style.display = 'inline-block';
    btnDescargaExcel.style.display = 'inline-block';
}

function construirFichaCNA(nombreProfesor, base, produccion) {
    const secciones = produccion?.secciones || {};
    let html = `
        <div id="ficha-pdf-content" style="background: white; padding: 20px; border-radius: 8px; font-family: Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.5;">
            <h1 style="font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Ficha Académica CNA</h1>
            <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px;">${nombreProfesor}</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
                <tbody>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; width: 30%; border: 1px solid #ddd;">Nombre</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.nombre || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Vínculo</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.vinculo || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Título Profesional</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.titulo || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Grado Académico Máximo</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.grado || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Líneas de Investigación</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.lineas || 'N/D'}</td>
                    </tr>
                </tbody>
            </table>
    `;
    
    const titulosOficiales = {
        'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
        'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
        'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
        'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)',
        'publicaciones_indexadas': 'Publicaciones Indexadas',
        'libros': 'Libros',
        'capitulos': 'Capítulos de Libro',
        'patentes': 'Patentes',
        'proyectos': 'Proyectos de Investigación'
    };
    
    const ordenSecciones = [
        'tesis_magister_guia',
        'tesis_magister_coguia',
        'tesis_doctorado_guia',
        'tesis_doctorado_coguia',
        'publicaciones_indexadas',
        'libros',
        'capitulos',
        'patentes',
        'proyectos'
    ];
    
    for (const tipo of ordenSecciones) {
        const seccion = secciones[tipo];
        
        if (tipo === 'publicaciones_no_indexadas') continue;
        
        if (seccion && seccion.filas && seccion.filas.length > 0) {
            const filasFiltradas = filtrarDesde2020(seccion.filas);
            if (filasFiltradas.length === 0) continue;
            
            const filasOrdenadas = ordenarPorAnoYRenumerar(filasFiltradas, seccion.headers);
            html += construirTabla(titulosOficiales[tipo], seccion.headers, filasOrdenadas);
        }
    }
    
    html += `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 9px;">
                <p>Reporte generado desde el Sistema de Productividad Académica - UANDES</p>
            </div>
        </div>
    `;
    
    return html;
}

function filtrarDesde2020(filas) {
    return filas.filter(fila => {
        const ano = fila['Año'] || fila['Año de adjudicación'] || '';
        return parseInt(ano) >= 2020;
    });
}

function ordenarPorAnoYRenumerar(filas, headers) {
    const filasOrdenadas = [...filas].sort((a, b) => {
        const anoA = parseInt(a['Año'] || a['Año de adjudicación'] || '0');
        const anoB = parseInt(b['Año'] || b['Año de adjudicación'] || '0');
        return anoB - anoA;
    });
    
    filasOrdenadas.forEach((fila, idx) => {
        fila['N°'] = idx + 1;
    });
    
    return filasOrdenadas;
}

function descargarPDF() {
    const element = document.getElementById('ficha-pdf-content');
    const opt = { margin: 10, filename: 'Ficha_CNA.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' } };
    html2pdf().set(opt).from(element).save();
}

function descargarFichaExcel() {
    if (!profesorActualFicha) {
        alert('Primero genera la ficha antes de descargar.');
        return;
    }
    
    const base = datosBase[profesorActualFicha];
    const produccion = datosProduccion[profesorActualFicha];
    
    if (!base || !produccion) return;
    
    const filas = [];
    filas.push(['Ficha Académica CNA']);
    filas.push([]);
    filas.push([profesorActualFicha]);
    filas.push([]);
    filas.push(['INFORMACIÓN PERSONAL']);
    filas.push(['Nombre', base.nombre || '']);
    filas.push(['Vínculo', base.vinculo || '']);
    filas.push(['Título Profesional', base.titulo || '']);
    filas.push(['Grado Académico Máximo', base.grado || '']);
    filas.push(['Líneas de Investigación', base.lineas || '']);
    filas.push([]);
    filas.push([]);
    
    const secciones = produccion.secciones || {};
    const titulosOficiales = {
        'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
        'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
        'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
        'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)',
        'publicaciones_indexadas': 'Publicaciones Indexadas',
        'libros': 'Libros',
        'capitulos': 'Capítulos de Libro',
        'patentes': 'Patentes',
        'proyectos': 'Proyectos de Investigación'
    };
    
    const ordenSecciones = ['tesis_magister_guia', 'tesis_magister_coguia', 'tesis_doctorado_guia', 'tesis_doctorado_coguia', 'publicaciones_indexadas', 'libros', 'capitulos', 'patentes', 'proyectos'];
    
    for (const tipo of ordenSecciones) {
        const seccion = secciones[tipo];
        if (seccion && seccion.filas && seccion.filas.length > 0) {
            const filasFiltradas = filtrarDesde2020(seccion.filas);
            if (filasFiltradas.length === 0) continue;
            
            filas.push([titulosOficiales[tipo]]);
            filas.push(seccion.headers);
            for (const fila of filasFiltradas) {
                filas.push(seccion.headers.map(h => fila[h] || ''));
            }
            filas.push([]);
            filas.push([]);
        }
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(filas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ficha CNA');
    
    const colWidths = [];
    colWidths.push({ wch: 30 });
    colWidths.push({ wch: 50 });
    for (let i = 2; i < 20; i++) {
        colWidths.push({ wch: 25 });
    }
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, 'ReporteVSC_FichaCNA.xlsx');
}

// ============================================
// REPORTERÍA: REPORTE PERSONALIZADO
// ============================================

let filtrosSeleccionados = {
    profesores: [],
    tablas: []
};

function inicializarFiltrosDatosProfesores() {
    const containerProfesores = document.getElementById('filtro-profesores');
    const containerTablas = document.getElementById('filtro-tablas');
    
    if (!containerProfesores || !containerTablas) return;
    
    containerProfesores.innerHTML = `
        <label><input type="checkbox" id="checkbox-todos-profesores" onchange="toggleTodosProfesores()"> Todos los profesores</label>
    `;
    
    for (const nombre of Object.keys(datosBase)) {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" class="checkbox-profesor" value="${nombre}" onchange="actualizarFiltros()"> ${datosBase[nombre].nombre_visual || nombre}`;
        containerProfesores.appendChild(label);
    }
    
    const tiposTabla = new Set();
    for (const nombre of Object.keys(datosProduccion)) {
        const secciones = datosProduccion[nombre].secciones || {};
        for (const tipo of Object.keys(secciones)) {
            tiposTabla.add(tipo);
        }
    }
    
    containerTablas.innerHTML = `
        <label><input type="checkbox" id="checkbox-todas-tablas" onchange="toggleTodasTablas()"> Todas las tablas</label>
    `;
    
    for (const tipo of Array.from(tiposTabla).sort()) {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" class="checkbox-tabla" value="${tipo}" onchange="actualizarFiltros()"> ${tipo}`;
        containerTablas.appendChild(label);
    }
}

function toggleTodosProfesores() {
    const checkboxes = document.querySelectorAll('.checkbox-profesor');
    const todoCheck = document.getElementById('checkbox-todos-profesores').checked;
    checkboxes.forEach(cb => cb.checked = todoCheck);
    actualizarFiltros();
}

function toggleTodasTablas() {
    const checkboxes = document.querySelectorAll('.checkbox-tabla');
    const todoCheck = document.getElementById('checkbox-todas-tablas').checked;
    checkboxes.forEach(cb => cb.checked = todoCheck);
    actualizarFiltros();
}

function actualizarFiltros() {
    filtrosSeleccionados.profesores = Array.from(document.querySelectorAll('.checkbox-profesor:checked')).map(cb => cb.value);
    filtrosSeleccionados.tablas = Array.from(document.querySelectorAll('.checkbox-tabla:checked')).map(cb => cb.value);
}

function generarReporteDatosProfesores() {
    const reporte = construirReporteDatos();
    
    if (!reporte || reporte.filas.length === 0) {
        alert('No hay datos para mostrar. Selecciona profesores y tablas.');
        return;
    }
    
    const preview = document.getElementById('reporte-preview');
    let html = `
        <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #667eea; color: white;">
    `;
    
    for (const col of reporte.columnasBase.concat(reporte.headersUnicos)) {
        html += `<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">${col}</th>`;
    }
    
    html += `</tr></thead><tbody>`;
    
    for (const fila of reporte.filas) {
        html += `<tr style="background: white;">`;
        for (const col of reporte.columnasBase.concat(reporte.headersUnicos)) {
            html += `<td style="padding: 10px; border: 1px solid #ddd;">${fila[col] || ''}</td>`;
        }
        html += `</tr>`;
    }
    
    html += `</tbody></table></div>`;
    
    preview.innerHTML = html;
    document.getElementById('btn-descargar-reporte-excel').style.display = 'inline-block';
    
    window.datosReporteActual = reporte;
}

function construirReporteDatos() {
    const columnasBase = ['RUT', 'Apellido paterno', 'Apellido materno', 'Nombres', 'Nombre visual', 'Vínculo'];
    const headersUnicos = new Set();
    const filas = [];
    
    for (const nombreProfesor of filtrosSeleccionados.profesores) {
        const base = datosBase[nombreProfesor];
        const produccion = datosProduccion[nombreProfesor];
        
        if (!base || !produccion) continue;
        
        const secciones = produccion.secciones || {};
        
        for (const tipoTabla of filtrosSeleccionados.tablas) {
            const seccion = secciones[tipoTabla];
            if (!seccion || !seccion.filas) continue;
            
            for (const header of seccion.headers) {
                headersUnicos.add(header);
            }
            
            for (const filaDatos of seccion.filas) {
                const fila = {
                    'RUT': base.rut || '',
                    'Apellido paterno': base.apellido_paterno || '',
                    'Apellido materno': base.apellido_materno || '',
                    'Nombres': base.nombres || '',
                    'Nombre visual': base.nombre_visual || nombreProfesor,
                    'Vínculo': base.vinculo || '',
                    'Tipo de tabla': tipoTabla
                };
                
                for (const header of seccion.headers) {
                    fila[header] = filaDatos[header] || '';
                }
                
                filas.push(fila);
            }
        }
    }
    
    return {
        columnasBase,
        headersUnicos: Array.from(headersUnicos).sort(),
        filas
    };
}

function descargarDatosExcel() {
    if (!window.datosReporteActual) {
        alert('Primero genera el reporte.');
        return;
    }
    
    const reporte = window.datosReporteActual;
    const worksheet = XLSX.utils.json_to_sheet(reporte.filas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    
    const colWidths = [];
    for (let i = 0; i < reporte.columnasBase.length + reporte.headersUnicos.length; i++) {
        colWidths.push({ wch: 25 });
    }
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, 'ReporteVSC_Personalizado.xlsx');
}

// ============================================
// NAVEGACIÓN
// ============================================

function cambiarPagina(pagina) {
    const pageId = pagina.startsWith('page-') ? pagina : `page-${pagina}`;
    
    document.querySelectorAll('.page').forEach(el => {
        el.style.display = 'none';
    });
    
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.style.display = 'block';
    }
}

function toggleMenuReporteria(event) {
    const submenu = document.getElementById('submenu-reporteria');
    if (submenu) {
        submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleMenuControl(event) {
    const submenu = document.getElementById('submenu-control');
    if (submenu) {
        submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
    }
}

// ============================================
// INICIAR
// ============================================

cargarDatos();

window.cambiarPagina = cambiarPagina;
window.generarFichaCNA = generarFichaCNA;
window.descargarPDF = descargarPDF;
window.descargarFichaExcel = descargarFichaExcel;
window.inicializarFiltrosDatosProfesores = inicializarFiltrosDatosProfesores;
window.toggleTodosProfesores = toggleTodosProfesores;
window.toggleTodasTablas = toggleTodasTablas;
window.generarReporteDatosProfesores = generarReporteDatosProfesores;
window.descargarDatosExcel = descargarDatosExcel;
