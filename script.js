let datosBase = {};
let datosProduccion = {};

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

function inicializar() {
    const profesoresConDatos = Object.keys(datosBase).map((nombre, idx) => ({
        id: `prof${String(idx + 1).padStart(2, '0')}`,
        nombre: nombre,
        resumen: generarResumen(nombre),
        tieneDatos: true
    }));
    
    const profesoresSinDatos = sinFicha.map((p, idx) => ({
        id: `prof${String(Object.keys(datosBase).length + idx + 1).padStart(2, '0')}`,
        nombre: p.nombre,
        resumen: p.resumen,
        tieneDatos: false
    }));
    
    const profesores = [...profesoresConDatos, ...profesoresSinDatos];
    
    generarListado(profesores);
    generarModales(profesoresConDatos);
    poblarSelectorProfesores();
}

function generarResumen(nombre) {
    const base = datosBase[nombre] || {};
    const secciones = datosProduccion[nombre]?.secciones || {};
    const items = [];
    
    // Agregar Vínculo y Líneas de investigación
    if (base.vinculo) items.push(base.vinculo);
    if (base.lineas) items.push(base.lineas);
    
    // Agregar conteo de registros
    if (secciones.publicaciones_indexadas) items.push(`${secciones.publicaciones_indexadas.filas.length} pub ind`);
    if (secciones.publicaciones_no_indexadas) items.push(`${secciones.publicaciones_no_indexadas.filas.length} no ind`);
    if (secciones.libros) items.push(`${secciones.libros.filas.length} libros`);
    if (secciones.capitulos) items.push(`${secciones.capitulos.filas.length} caps`);
    if (secciones.proyectos) items.push(`${secciones.proyectos.filas.length} proy`);
    if (secciones.tesis_magister_guia) items.push(`${secciones.tesis_magister_guia.filas.length} tm guía`);
    if (secciones.tesis_magister_coguia) items.push(`${secciones.tesis_magister_coguia.filas.length} tm coguía`);
    if (secciones.tesis_doctorado_guia) items.push(`${secciones.tesis_doctorado_guia.filas.length} td guía`);
    if (secciones.tesis_doctorado_coguia) items.push(`${secciones.tesis_doctorado_coguia.filas.length} td coguía`);
    
    return items.join(' • ') || 'Sin datos';
}

function generarListado(profesores) {
    const lista = document.getElementById('profesor-list');
    lista.innerHTML = profesores.map(p => `
        <div class="profesor-row ${!p.tieneDatos ? 'sin-ficha' : ''}" onclick="${p.tieneDatos ? `abrirModal('${p.id}')` : ''}">
            <div class="profesor-info">
                <div class="profesor-nombre">${p.nombre}</div>
                <div class="profesor-resumen">${p.resumen}</div>
            </div>
            <div class="profesor-arrow">${p.tieneDatos ? '→' : ''}</div>
        </div>
    `).join('');
}

function poblarSelectorProfesores() {
    const select = document.getElementById('profesor-select');
    const profesoresOrdenados = Object.keys(datosBase).sort();
    
    profesoresOrdenados.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

function generarFichaCNA() {
    const select = document.getElementById('profesor-select');
    const nombreProfesor = select.value;
    const preview = document.getElementById('ficha-cna-preview');
    
    if (!nombreProfesor) {
        preview.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Selecciona un profesor para generar la ficha</p>';
        return;
    }
    
    if (nombreProfesor === 'Todos los profesores') {
        preview.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Función de ficha para todos los profesores en desarrollo</p>';
        return;
    }
    
    const base = datosBase[nombreProfesor];
    const produccion = datosProduccion[nombreProfesor];
    
    if (!base || !produccion) {
        preview.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No se encontraron datos para este profesor</p>';
        return;
    }
    
    // Mostrar información básica de la ficha
    preview.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="font-size: 16px; color: #333; margin-bottom: 15px;">Ficha Académica CNA</h3>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <p><strong>Profesor:</strong> ${base.nombre}</p>
                <p><strong>Vínculo:</strong> ${base.vinculo}</p>
                <p><strong>Título Profesional:</strong> ${base.titulo}</p>
                <p><strong>Grado Académico:</strong> ${base.grado}</p>
                <p><strong>Líneas de Investigación:</strong> ${base.lineas}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 6px;">
                <h4 style="font-size: 14px; color: #667eea; margin-bottom: 10px;">Resumen de Producción Académica</h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${generarResumenProduccion(produccion)}
                </ul>
            </div>
        </div>
        
        <div style="color: #999; font-size: 13px; text-align: center; padding: 20px; border-top: 1px solid #e0e0e0;">
            <p>Previsualización de ficha CNA - Construcción completa en desarrollo</p>
        </div>
    `;
}

function generarResumenProduccion(produccion) {
    const secciones = produccion?.secciones || {};
    const items = [];
    
    const mapeoSecciones = {
        'publicaciones_indexadas': 'Publicaciones Indexadas',
        'publicaciones_no_indexadas': 'Publicaciones No Indexadas',
        'libros': 'Libros',
        'capitulos': 'Capítulos de Libro',
        'proyectos': 'Proyectos de Investigación',
        'tesis_doctorado_guia': 'Tesis Doctorado (Guía)',
        'tesis_doctorado_coguia': 'Tesis Doctorado (Co-guía)',
        'tesis_magister_guia': 'Tesis Magister (Guía)',
        'tesis_magister_coguia': 'Tesis Magister (Co-guía)'
    };
    
    for (const [clave, titulo] of Object.entries(mapeoSecciones)) {
        const seccion = secciones[clave];
        if (seccion && seccion.filas && seccion.filas.length > 0) {
            items.push(`<li style="padding: 5px 0;"><strong>${titulo}:</strong> ${seccion.filas.length} registro(s)</li>`);
        }
    }
    
    return items.length > 0 ? items.join('') : '<li style="color: #999;">Sin información de producción académica</li>';
}

function generarModales(profesores) {
    const container = document.getElementById('modales-container');
    container.innerHTML = profesores.map(p => {
        const nombre = p.nombre;
        const base = datosBase[nombre];
        const produccion = datosProduccion[nombre];
        const secciones = produccion?.secciones || {};
        
        let seccionesHTML = '';
        const ordenSecciones = [
            'publicaciones_indexadas', 'publicaciones_no_indexadas', 
            'libros', 'capitulos', 'proyectos',
            'tesis_doctorado_guia', 'tesis_doctorado_coguia',
            'tesis_magister_guia', 'tesis_magister_coguia'
        ];
        
        for (const tipo of ordenSecciones) {
            const seccion = secciones[tipo];
            if (!seccion || !seccion.filas || seccion.filas.length === 0) continue;
            
            const titulo = traducirTipo(tipo);
            const headers = seccion.headers;
            
            seccionesHTML += `
                <div class="info-section">
                    <div class="section-title">${titulo} (${seccion.filas.length} registros)</div>
                    <div class="table-container">
                        <table>
                            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                            <tbody>${seccion.filas.map(fila => `
                                <tr>${headers.map(h => `<td>${fila[h] || 'N/A'}</td>`).join('')}</tr>
                            `).join('')}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        return `
            <div id="modal-${p.id}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h2>${base.nombre}</h2>
                            <p>Vínculo: ${base.vinculo}</p>
                        </div>
                        <button class="close-btn" onclick="cerrarModal('${p.id}')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="info-section">
                            <div class="section-title">Perfil Académico</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Título Profesional</div>
                                    <div class="info-value">${base.titulo}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Grado Académico</div>
                                    <div class="info-value">${base.grado}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Líneas de Investigación</div>
                                    <div class="info-value">${base.lineas}</div>
                                </div>
                            </div>
                        </div>
                        ${seccionesHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function traducirTipo(tipo) {
    const t = {
        'publicaciones_indexadas': 'Publicaciones Indexadas',
        'publicaciones_no_indexadas': 'Publicaciones No Indexadas',
        'libros': 'Libros',
        'capitulos': 'Capítulos de Libro',
        'proyectos': 'Proyectos de Investigación',
        'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
        'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-guía)',
        'tesis_magister_guia': 'Tesis Magister (Profesor Guía)',
        'tesis_magister_coguia': 'Tesis Magister (Profesor Co-guía)'
    };
    return t[tipo] || tipo;
}

function abrirModal(id) {
    document.getElementById(`modal-${id}`).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(id) {
    document.getElementById(`modal-${id}`).classList.remove('active');
    document.body.style.overflow = 'auto';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function cambiarPagina(pagina) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`page-${pagina}`).classList.add('active');
    event.target.classList.add('active');
}

// Cargar datos al iniciar
cargarDatos();
