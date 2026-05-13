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
    
    if (base.vinculo) items.push(base.vinculo);
    if (base.lineas) items.push(base.lineas);
    
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
    const btnDescarga = document.getElementById('btn-descargar-pdf');
    
    if (!nombreProfesor) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>Selecciona un profesor para visualizar su ficha</p>
            </div>
        `;
        btnDescarga.style.display = 'none';
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
        btnDescarga.style.display = 'none';
        return;
    }
    
    profesorActualFicha = nombreProfesor;
    const fichaHTML = construirFichaCNA(nombreProfesor, base, produccion);
    preview.innerHTML = fichaHTML;
    btnDescarga.style.display = 'inline-block';
}

function construirFichaCNA(nombreProfesor, base, produccion) {
    const secciones = produccion?.secciones || {};
    let html = `
        <div id="ficha-pdf-content" style="background: white; padding: 20px; border-radius: 8px; font-family: Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.6;">
            
            <h1 style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Ficha Académica CNA</h1>
            
            <h2 style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px;">${nombreProfesor}</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #ddd;">
                <tbody>
                    <tr>
                        <td style="padding: 10px; background: #f0f0f0; font-weight: bold; width: 30%; border: 1px solid #ddd;">Nombre</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${base.nombre || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Vínculo</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${base.vinculo || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Título Profesional</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${base.titulo || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Grado Académico Máximo</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${base.grado || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Líneas de Investigación</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${base.lineas || 'N/D'}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-bottom: 30px;"></div>
    `;
    
    // Tesis Magister Guía
    if (secciones.tesis_magister_guia && secciones.tesis_magister_guia.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.tesis_magister_guia.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('2.1. Tesis de Magister Dirigidas (Como Guía)', secciones.tesis_magister_guia.headers, filasFiltradas);
        }
    }
    
    // Tesis Magister Co-guía
    if (secciones.tesis_magister_coguia && secciones.tesis_magister_coguia.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.tesis_magister_coguia.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('2.2. Tesis de Magister Dirigidas (Como Co-guía)', secciones.tesis_magister_coguia.headers, filasFiltradas);
        }
    }
    
    // Tesis Doctorado Guía
    if (secciones.tesis_doctorado_guia && secciones.tesis_doctorado_guia.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.tesis_doctorado_guia.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('3.1. Tesis de Doctorado Dirigidas (Como Guía)', secciones.tesis_doctorado_guia.headers, filasFiltradas);
        }
    }
    
    // Tesis Doctorado Co-guía
    if (secciones.tesis_doctorado_coguia && secciones.tesis_doctorado_coguia.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.tesis_doctorado_coguia.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('3.2. Tesis de Doctorado Dirigidas (Como Co-guía)', secciones.tesis_doctorado_coguia.headers, filasFiltradas);
        }
    }
    
    // Publicaciones Indexadas
    if (secciones.publicaciones_indexadas && secciones.publicaciones_indexadas.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.publicaciones_indexadas.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('4.1. Publicaciones Indexadas', secciones.publicaciones_indexadas.headers, filasFiltradas);
        }
    }
    
    // Publicaciones No Indexadas
    if (secciones.publicaciones_no_indexadas && secciones.publicaciones_no_indexadas.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.publicaciones_no_indexadas.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('4.2. Publicaciones No Indexadas', secciones.publicaciones_no_indexadas.headers, filasFiltradas);
        }
    }
    
    // Libros
    if (secciones.libros && secciones.libros.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.libros.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('4.3. Libros', secciones.libros.headers, filasFiltradas);
        }
    }
    
    // Capítulos
    if (secciones.capitulos && secciones.capitulos.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.capitulos.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('4.4. Capítulos de Libro', secciones.capitulos.headers, filasFiltradas);
        }
    }
    
    // Patentes
    if (secciones.patentes && secciones.patentes.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.patentes.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('4.5. Patentes', secciones.patentes.headers, filasFiltradas);
        }
    }
    
    // Proyectos
    if (secciones.proyectos && secciones.proyectos.filas.length > 0) {
        const filasFiltradas = filtrarPorAño(secciones.proyectos.filas);
        if (filasFiltradas.length > 0) {
            html += construirTabla('5. Proyectos de Investigación', secciones.proyectos.headers, filasFiltradas);
        }
    }
    
    html += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 10px;">
                <p>Reporte generado automáticamente desde el Sistema de Productividad Académica - UANDES</p>
            </div>
        </div>
    `;
    
    return html;
}

function construirTabla(titulo, headers, filas) {
    if (!filas || filas.length === 0) return '';
    
    let html = `
        <h3 style="font-size: 13px; font-weight: bold; color: #333; margin-top: 25px; margin-bottom: 10px;">${titulo}</h3>
        <table class="ficha-table" style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #ddd;">
            <thead>
                <tr style="background: #f0f0f0;">
    `;
    
    // Crear headers con N° al inicio si no existe
    const headersConNumero = !headers.includes('N°') ? ['N°', ...headers] : headers;
    
    headersConNumero.forEach(header => {
        html += `<th style="padding: 10px; text-align: left; font-weight: bold; border: 1px solid #ddd; background: #f0f0f0;">${header}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    filas.forEach((fila, idx) => {
        html += `<tr>`;
        
        // Agregar número si no existe
        if (!headers.includes('N°')) {
            html += `<td style="padding: 10px; border: 1px solid #ddd; background: #fafafa;">${idx + 1}</td>`;
        }
        
        headersConNumero.forEach(header => {
            if (header !== 'N°') {
                const valor = fila[header] || 'N/D';
                html += `<td style="padding: 10px; border: 1px solid #ddd;">${valor}</td>`;
            } else if (header === 'N°') {
                html += `<td style="padding: 10px; border: 1px solid #ddd; background: #fafafa;">${fila['N°'] || idx + 1}</td>`;
            }
        });
        
        html += `</tr>`;
    });
    
    html += `</tbody></table><div style="margin-bottom: 15px;"></div>`;
    
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
        margin: 10,
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
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
