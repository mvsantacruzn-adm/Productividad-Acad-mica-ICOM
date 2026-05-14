let datosBase = {};
let datosProduccion = {};
let profesorActualFicha = null;

// Cargar datos desde los JSONs
async function cargarDatos() {
    try {
        const resBase = await fetch('profesores-base.json');
        const resProd = await fetch('profesores-produccion.json');
        
        datosBase = await resBase.json();
        datosProduccion = await resProd.json();
        
        inicializar();
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Los 4 profesores sin ficha
const sinFicha = [
    { nombre: 'Hugo Benedetti', resumen: 'Finanzas. Por completar datos.' },
    { nombre: 'María José Bosch', resumen: 'Management. Por completar datos.' },
    { nombre: 'Matias Braun', resumen: 'Finanzas Corporativas. Por completar datos.' },
    { nombre: 'Natalia Yankovic', resumen: 'Investigación de Operaciones. Por completar datos.' }
];

// Headers oficiales normalizados
const headersOficiales = {
    'publicaciones_indexadas': ['N°', 'Autor(es)', 'Año', 'Título de la publicación', 'Nombre revista', 'Factor de impacto', 'Link de verificación electrónica'],
    'publicaciones_no_indexadas': ['N°', 'Autor(es)', 'Año', 'Título de la publicación', 'Nombre revista', 'Estado', 'ISSN'],
    'libros': ['N°', 'Autor(es)', 'Año', 'Título de la publicación', 'Lugar', 'Editorial'],
    'capitulos': ['N°', 'Autor(es)', 'Año', 'Título de la publicación', 'Lugar', 'Editorial'],
    'proyectos': ['N°', 'Título', 'Fuente de financiamiento', 'Año de adjudicación', 'Período de ejecución', 'Rol en el proyecto'],
    'tesis_magister_guia': ['N°', 'Año', 'Autor', 'Título de la tesis', 'Nombre del programa', 'Institución'],
    'tesis_magister_coguia': ['N°', 'Año', 'Autor', 'Título de la tesis', 'Nombre del programa', 'Institución'],
    'tesis_doctorado_guia': ['N°', 'Año', 'Autor', 'Título de la tesis', 'Nombre del programa', 'Institución'],
    'tesis_doctorado_coguia': ['N°', 'Año', 'Autor', 'Título de la tesis', 'Nombre del programa', 'Institución'],
    'patentes': ['N°', 'Año', 'Título', 'Estado', 'Institución / Registro']
};

const titulosOficiales = {
    'publicaciones_indexadas': 'Publicaciones Indexadas',
    'publicaciones_no_indexadas': 'Publicaciones No Indexadas',
    'libros': 'Libros',
    'capitulos': 'Capítulos de Libro',
    'proyectos': 'Proyectos de Investigación',
    'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
    'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
    'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
    'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)',
    'patentes': 'Patentes'
};

function inicializar() {
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
    generarModales(profesoresConDatos);
    poblarSelectorProfesores();
    generarControlEstructura();
}

function generarListado(profesores) {
    const lista = document.getElementById('profesor-list');
    
    // Ordenar alfabéticamente por nombres (campo interno)
    const profesoresOrdenados = [...profesores].sort((a, b) => {
        return a.nombres.localeCompare(b.nombres);
    });
    
    lista.innerHTML = profesoresOrdenados.map(p => `
        <div class="profesor-row ${!p.tieneDatos ? 'sin-ficha' : ''}" onclick="${p.tieneDatos ? `abrirModal('${p.id}')` : ''}">
            <div class="profesor-info">
                <div class="profesor-nombre">${p.nombreVisual}</div>
                <div class="profesor-resumen">${p.grado || 'N/D'}</div>
            </div>
            <div class="profesor-arrow">${p.tieneDatos ? '→' : ''}</div>
        </div>
    `).join('');
}

function poblarSelectorProfesores() {
    const select = document.getElementById('profesor-select');
    const profesoresOrdenados = Object.keys(datosBase).sort();
    
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    profesoresOrdenados.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

function filtrarPorAño(filas, año = 2020) {
    return filas.filter(fila => {
        const añoFila = parseInt(fila.Año || fila['Año'] || '');
        return !isNaN(añoFila) && añoFila >= año;
    });
}

function generarFichaCNA() {
    const select = document.getElementById('profesor-select');
    const nombreProfesor = select.value;
    const preview = document.getElementById('ficha-cna-preview');
    const btnDescargaPDF = document.getElementById('btn-descargar-pdf');
    
    if (!nombreProfesor) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>Selecciona un profesor para visualizar su ficha</p>
            </div>
        `;
        btnDescargaPDF.style.display = 'none';
        return;
    }
    
    const base = datosBase[nombreProfesor];
    const produccion = datosProduccion[nombreProfesor];
    
    if (!base || !produccion) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>No se encontraron datos para este profesor</p>
            </div>
        `;
        btnDescargaPDF.style.display = 'none';
        return;
    }
    
    profesorActualFicha = nombreProfesor;
    const fichaHTML = construirFichaCNA(nombreProfesor, base, produccion);
    preview.innerHTML = fichaHTML;
    btnDescargaPDF.style.display = 'inline-block';
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
            
            <div style="margin-bottom: 20px;"></div>
    `;
    
    // Orden definido de todas las secciones posibles
    const ordenSecciones = [
        'tesis_magister_guia', 'tesis_magister_coguia',
        'tesis_doctorado_guia', 'tesis_doctorado_coguia',
        'publicaciones_indexadas', 'publicaciones_no_indexadas',
        'libros', 'capitulos', 'patentes', 'proyectos'
    ];
    
    // Recorrer TODAS las secciones en orden
    for (const tipo of ordenSecciones) {
        const seccion = secciones[tipo];
        
        // Incluir tabla SI existe la sección Y tiene filas
        if (seccion && seccion.filas && seccion.filas.length > 0) {
            if (seccion.filas.length > 0) {
                html += construirTabla(titulosOficiales[tipo], seccion.headers, seccion.filas);
            }
        }
    }
    
    html += `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 9px;">
                <p>Reporte generado automáticamente desde el Sistema de Productividad Académica - UANDES</p>
            </div>
        </div>
    `;
    
    return html;
}

function construirTabla(titulo, headers, filas) {
    if (!filas || filas.length === 0) return '';
    
    let html = `
        <h3 style="font-size: 11px; font-weight: bold; color: #333; margin-top: 18px; margin-bottom: 8px;">${titulo}</h3>
        <table class="ficha-table" style="width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #ddd; font-size: 10px;">
            <thead>
                <tr style="background: #f0f0f0;">
    `;
    
    // Crear headers con N° al inicio si no existe
    const headersConNumero = !headers.includes('N°') ? ['N°', ...headers] : headers;
    
    headersConNumero.forEach(header => {
        html += `<th style="padding: 6px; text-align: left; font-weight: bold; border: 1px solid #ddd; background: #f0f0f0; color: black;">${header}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    filas.forEach((fila, idx) => {
        html += `<tr>`;
        
        // Agregar número si no existe
        if (!headers.includes('N°')) {
            html += `<td style="padding: 6px; border: 1px solid #ddd; background: #fafafa;">${idx + 1}</td>`;
        }
        
        headersConNumero.forEach(header => {
            if (header !== 'N°') {
                const valor = fila[header] || 'N/D';
                html += `<td style="padding: 6px; border: 1px solid #ddd;">${valor}</td>`;
            } else if (header === 'N°') {
                html += `<td style="padding: 6px; border: 1px solid #ddd; background: #fafafa;">${fila['N°'] || idx + 1}</td>`;
            }
        });
        
        html += `</tr>`;
    });
    
    html += `</tbody></table><div style="margin-bottom: 10px;"></div>`;
    
    return html;
}

function descargarPDF() {
    if (!profesorActualFicha) {
        alert('Por favor genera la ficha primero');
        return;
    }
    
    const element = document.getElementById('ficha-pdf-content');
    const nombreArchivo = `Ficha_CNA_${profesorActualFicha.replace(/\s+/g, '_')}.pdf`;
    
    const opt = {
        margin: 8,
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// ============================================
// CONTROL DE ESTRUCTURA - AUDITORÍA
// ============================================

function validarHeadersNormalizados(tipo, headersActuales) {
    const headersOficial = headersOficiales[tipo] || [];
    
    // Verificar duplicados
    if (new Set(headersActuales).size !== headersActuales.length) {
        return { estado: 'REVISAR', razon: 'Headers duplicados detectados' };
    }
    
    // Verificar cantidad de columnas
    if (headersActuales.length !== headersOficial.length) {
        return { 
            estado: 'REVISAR', 
            razon: `Columnas: ${headersActuales.length} (esperadas ${headersOficial.length})`
        };
    }
    
    // Verificar headers exactos
    if (JSON.stringify(headersActuales) !== JSON.stringify(headersOficial)) {
        return { estado: 'REVISAR', razon: 'Headers no coinciden exactamente' };
    }
    
    return { estado: 'OK', razon: 'Normalizado correctamente' };
}

function obtenerDatosControl() {
    const tipos_tabla = [
        'publicaciones_indexadas',
        'publicaciones_no_indexadas',
        'libros',
        'capitulos',
        'proyectos',
        'tesis_magister_guia',
        'tesis_magister_coguia',
        'tesis_doctorado_guia',
        'tesis_doctorado_coguia',
        'patentes'
    ];
    
    let tablasData = [];
    
    // Recopilar información de todas las tablas
    for (const nombreProfesor of Object.keys(datosProduccion)) {
        const profesor = datosProduccion[nombreProfesor];
        const base = datosBase[nombreProfesor] || {};
        
        if (!profesor.secciones) continue;
        
        for (const tipo of tipos_tabla) {
            if (tipo in profesor.secciones) {
                const seccion = profesor.secciones[tipo];
                const headers = seccion.headers || [];
                const filas = seccion.filas || [];
                
                const validacion = validarHeadersNormalizados(tipo, headers);
                
                tablasData.push({
                    rut: base.rut || 'N/D',
                    apellido_paterno: base.apellido_paterno || 'N/D',
                    apellido_materno: base.apellido_materno || 'N/D',
                    nombres: base.nombres || 'N/D',
                    nombre_visual: base.nombre_visual || nombreProfesor,
                    profesor: nombreProfesor,
                    tipo: tipo,
                    titulo: titulosOficiales[tipo],
                    headers: headers.join(' | '),
                    numColumnas: headers.length,
                    numRegistros: filas.length,
                    validacion: validacion
                });
            }
        }
    }
    
    return tablasData;
}

function generarControlEstructura() {
    const container = document.getElementById('control-tabla');
    const tablasData = obtenerDatosControl();
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>RUT</th>
                    <th>Apellido Paterno</th>
                    <th>Apellido Materno</th>
                    <th>Nombres</th>
                    <th>Nombre Visual</th>
                    <th>Categoría Interna</th>
                    <th>Título Visual</th>
                    <th>Headers Detectados</th>
                    <th>Columnas</th>
                    <th>Registros</th>
                    <th>Estado</th>
                    <th>Detalle</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Generar filas ordenadas
    for (const tabla of tablasData) {
        const estadoClass = tabla.validacion.estado === 'OK' ? 'estado-ok' : 'estado-revisar';
        const estadoTexto = tabla.validacion.estado === 'OK' ? '✓ OK' : '⚠ REVISAR';
        
        html += `
            <tr>
                <td>${tabla.rut}</td>
                <td>${tabla.apellido_paterno}</td>
                <td>${tabla.apellido_materno}</td>
                <td>${tabla.nombres}</td>
                <td>${tabla.nombre_visual}</td>
                <td style="font-family: monospace; font-size: 9px;">${tabla.tipo}</td>
                <td>${tabla.titulo}</td>
                <td style="font-family: monospace; font-size: 8px; white-space: normal;">${tabla.headers}</td>
                <td style="text-align: center;">${tabla.numColumnas}</td>
                <td style="text-align: center;">${tabla.numRegistros}</td>
                <td><span class="${estadoClass}">${estadoTexto}</span></td>
                <td style="font-size: 10px;">${tabla.validacion.razon}</td>
            </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function descargarControlExcel() {
    const tablasData = obtenerDatosControl();
    
    // Convertir a formato para Excel
    const datos = tablasData.map(tabla => ({
        'RUT': tabla.rut,
        'Apellido Paterno': tabla.apellido_paterno,
        'Apellido Materno': tabla.apellido_materno,
        'Nombres': tabla.nombres,
        'Nombre Visual': tabla.nombre_visual,
        'Categoría Interna': tabla.tipo,
        'Título Visual': tabla.titulo,
        'Headers Detectados': tabla.headers,
        'Cantidad Columnas': tabla.numColumnas,
        'Cantidad Registros': tabla.numRegistros,
        'Estado': tabla.validacion.estado,
        'Detalle': tabla.validacion.razon
    }));
    
    // Crear workbook
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Control Estructura');
    
    // Ajustar ancho de columnas
    const colWidths = [
        { wch: 12 },  // RUT
        { wch: 15 },  // Apellido Paterno
        { wch: 15 },  // Apellido Materno
        { wch: 15 },  // Nombres
        { wch: 25 },  // Nombre Visual
        { wch: 25 },  // Categoría Interna
        { wch: 25 },  // Título Visual
        { wch: 40 },  // Headers Detectados
        { wch: 12 },  // Cantidad Columnas
        { wch: 12 },  // Cantidad Registros
        { wch: 12 },  // Estado
        { wch: 30 }   // Detalle
    ];
    ws['!cols'] = colWidths;
    
    // Descargar
    XLSX.writeFile(wb, 'Control_Estructura_UANDES.xlsx');
}

function descargarControlPDF() {
    const container = document.getElementById('control-tabla');
    const clone = container.cloneNode(true);
    
    const element = document.createElement('div');
    element.id = 'control-pdf-content';
    element.style.cssText = 'background: white; padding: 20px; font-family: Arial, sans-serif; font-size: 9px; color: #333;';
    
    // Agregar título
    const titulo = document.createElement('h1');
    titulo.textContent = 'Control de Estructura - Auditoría Técnica';
    titulo.style.cssText = 'font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;';
    
    const subtitulo = document.createElement('p');
    subtitulo.textContent = 'Normalización de Tablas Académicas - UANDES Doctorado';
    subtitulo.style.cssText = 'text-align: center; color: #666; margin-bottom: 20px; font-size: 10px;';
    
    element.appendChild(titulo);
    element.appendChild(subtitulo);
    
    // Agregar tabla
    const tabla = clone.querySelector('table');
    if (tabla) {
        tabla.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd; font-size: 8px;';
        // Estilo para headers
        const headers = tabla.querySelectorAll('th');
        headers.forEach(h => {
            h.style.cssText = 'padding: 8px; background: #667eea; color: white; font-weight: bold; border: 1px solid #667eea; text-align: left;';
        });
        // Estilo para celdas
        const celdas = tabla.querySelectorAll('td');
        celdas.forEach(c => {
            c.style.cssText = 'padding: 6px; border: 1px solid #ddd;';
        });
        element.appendChild(tabla);
    }
    
    // Agregar pie
    const pie = document.createElement('p');
    pie.textContent = 'Reporte generado automáticamente desde el Sistema de Productividad Académica - UANDES';
    pie.style.cssText = 'margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 8px;';
    element.appendChild(pie);
    
    document.body.appendChild(element);
    
    const opt = {
        margin: 6,
        filename: 'Control_Estructura_UANDES.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
    });
}
// Cargar datos al iniciar
cargarDatos();
