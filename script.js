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

function formatearApellidos(nombre) {
    const partes = nombre.split(' ');
    if (partes.length < 2) return nombre;
    
    const apellidos = partes.slice(0, -1).join(' ').toUpperCase();
    const nombres = partes[partes.length - 1];
    
    return `${apellidos}, ${nombres}`;
}

function generarListado(profesores) {
    const lista = document.getElementById('profesor-list');
    
    // Ordenar alfabéticamente por apellido
    const profesoresOrdenados = [...profesores].sort((a, b) => {
        const apellidoA = a.nombre.split(' ').slice(0, -1).join(' ').toUpperCase();
        const apellidoB = b.nombre.split(' ').slice(0, -1).join(' ').toUpperCase();
        return apellidoA.localeCompare(apellidoB);
    });
    
    lista.innerHTML = profesoresOrdenados.map(p => `
        <div class="profesor-row ${!p.tieneDatos ? 'sin-ficha' : ''}" onclick="${p.tieneDatos ? `abrirModal('${p.id}')` : ''}">
            <div class="profesor-info">
                <div class="profesor-nombre">${formatearApellidos(p.nombre)}</div>
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
    const btnDescargaPDF = document.getElementById('btn-descargar-pdf');
    const btnDescargaWord = document.getElementById('btn-descargar-word');
    
    if (!nombreProfesor) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>Selecciona un profesor para visualizar su ficha</p>
            </div>
        `;
        btnDescargaPDF.style.display = 'none';
        btnDescargaWord.style.display = 'none';
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
        btnDescargaWord.style.display = 'none';
        return;
    }
    
    profesorActualFicha = nombreProfesor;
    const fichaHTML = construirFichaCNA(nombreProfesor, base, produccion);
    preview.innerHTML = fichaHTML;
    btnDescargaPDF.style.display = 'inline-block';
    btnDescargaWord.style.display = 'inline-block';
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
    
    const mapeoTitulos = {
        'tesis_magister_guia': '2.1. Tesis de Magister Dirigidas (Como Guía)',
        'tesis_magister_coguia': '2.2. Tesis de Magister Dirigidas (Como Co-guía)',
        'tesis_doctorado_guia': '3.1. Tesis de Doctorado Dirigidas (Como Guía)',
        'tesis_doctorado_coguia': '3.2. Tesis de Doctorado Dirigidas (Como Co-guía)',
        'publicaciones_indexadas': '4.1. Publicaciones Indexadas',
        'publicaciones_no_indexadas': '4.2. Publicaciones No Indexadas',
        'libros': '4.3. Libros',
        'capitulos': '4.4. Capítulos de Libro',
        'patentes': '4.5. Patentes',
        'proyectos': '5. Proyectos de Investigación'
    };
    
    // Recorrer TODAS las secciones en orden
    for (const tipo of ordenSecciones) {
        const seccion = secciones[tipo];
        
        // Incluir tabla SI existe la sección Y tiene filas
        if (seccion && seccion.filas && seccion.filas.length > 0) {
            const filasFiltradas = filtrarPorAño(seccion.filas);
            
            // Incluir tabla INCLUSO si filasFiltradas está vacío después de filtrar por año
            // Mostrar tabla con todos los registros sin filtro de año
            if (seccion.filas.length > 0) {
                html += construirTabla(mapeoTitulos[tipo], seccion.headers, seccion.filas);
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

function descargarWord() {
    if (!profesorActualFicha) {
        alert('Por favor genera la ficha primero');
        return;
    }
    
    const base = datosBase[profesorActualFicha];
    const produccion = datosProduccion[profesorActualFicha];
    const secciones = produccion?.secciones || {};
    
    const children = [];
    
    // Título principal
    children.push(
        new docx.Paragraph({
            text: 'Ficha Académica CNA',
            heading: docx.HeadingLevel.HEADING_1,
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );
    
    // Nombre del profesor
    children.push(
        new docx.Paragraph({
            text: profesorActualFicha,
            bold: true,
            fontSize: 24,
            spacing: { after: 200 }
        })
    );
    
    // Tabla información básica
    const infoBásica = [
        ['Nombre', base.nombre || 'N/D'],
        ['Vínculo', base.vinculo || 'N/D'],
        ['Título Profesional', base.titulo || 'N/D'],
        ['Grado Académico Máximo', base.grado || 'N/D'],
        ['Líneas de Investigación', base.lineas || 'N/D']
    ];
    
    children.push(
        new docx.Table({
            rows: infoBásica.map(([label, value]) => new docx.TableRow({
                cells: [
                    new docx.TableCell({
                        children: [new docx.Paragraph({ text: label, bold: true })],
                        width: { size: 30, type: docx.WidthType.PERCENTAGE }
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph({ text: value })],
                        width: { size: 70, type: docx.WidthType.PERCENTAGE }
                    })
                ]
            }))
        })
    );
    
    children.push(new docx.Paragraph({ text: '', spacing: { after: 200 } }));
    
    // Definir orden y títulos de TODAS las secciones
    const ordenSecciones = [
        'tesis_magister_guia', 'tesis_magister_coguia',
        'tesis_doctorado_guia', 'tesis_doctorado_coguia',
        'publicaciones_indexadas', 'publicaciones_no_indexadas',
        'libros', 'capitulos', 'patentes', 'proyectos'
    ];
    
    const mapeoTitulos = {
        'tesis_magister_guia': '2.1. Tesis de Magister Dirigidas (Como Guía)',
        'tesis_magister_coguia': '2.2. Tesis de Magister Dirigidas (Como Co-guía)',
        'tesis_doctorado_guia': '3.1. Tesis de Doctorado Dirigidas (Como Guía)',
        'tesis_doctorado_coguia': '3.2. Tesis de Doctorado Dirigidas (Como Co-guía)',
        'publicaciones_indexadas': '4.1. Publicaciones Indexadas',
        'publicaciones_no_indexadas': '4.2. Publicaciones No Indexadas',
        'libros': '4.3. Libros',
        'capitulos': '4.4. Capítulos de Libro',
        'patentes': '4.5. Patentes',
        'proyectos': '5. Proyectos de Investigación'
    };
    
    // Recorrer TODAS las secciones
    for (const tipo of ordenSecciones) {
        const seccion = secciones[tipo];
        
        // Incluir tabla SI tiene filas
        if (seccion && seccion.filas && seccion.filas.length > 0) {
            // Título de sección
            children.push(
                new docx.Paragraph({
                    text: mapeoTitulos[tipo],
                    bold: true,
                    fontSize: 22,
                    spacing: { before: 200, after: 200 }
                })
            );
            
            // Tabla
            const headers = seccion.headers;
            const headersConNumero = !headers.includes('N°') ? ['N°', ...headers] : headers;
            
            children.push(
                new docx.Table({
                    width: { size: 100, type: docx.WidthType.PERCENTAGE },
                    rows: [
                        // Encabezado
                        new docx.TableRow({
                            cells: headersConNumero.map(h => new docx.TableCell({
                                children: [new docx.Paragraph({
                                    text: h,
                                    bold: true,
                                    color: '000000'
                                })],
                                shading: { fill: 'f0f0f0' }
                            }))
                        }),
                        // Filas de datos
                        ...seccion.filas.map((fila, idx) => new docx.TableRow({
                            cells: headersConNumero.map((header, colIdx) => {
                                let valor = 'N/D';
                                if (header === 'N°') {
                                    valor = fila['N°'] || (idx + 1).toString();
                                } else {
                                    valor = fila[header] || 'N/D';
                                }
                                return new docx.TableCell({
                                    children: [new docx.Paragraph({ text: valor, fontSize: 20 })]
                                });
                            })
                        }))
                    ]
                })
            );
            
            children.push(new docx.Paragraph({ text: '', spacing: { after: 200 } }));
        }
    }
    
    // Pie de página
    children.push(
        new docx.Paragraph({
            text: 'Reporte generado automáticamente desde el Sistema de Productividad Académica - UANDES',
            alignment: docx.AlignmentType.CENTER,
            fontSize: 18,
            color: '999999',
            spacing: { before: 200 }
        })
    );
    
    // Crear y descargar documento
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: children
        }]
    });
    
    docx.Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ficha_CNA_${profesorActualFicha.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }).catch(err => {
        console.error('Error generando Word:', err);
        alert('Error al generar archivo Word');
    });
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
