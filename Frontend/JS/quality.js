// Rol: presentación de incidencias y sugerencias del registro de calidad.
// Relación: consulta el controlador de calidad y usa utilidades compartidas para escapar datos y gestionar peticiones.
// Dibuja los registros de calidad con etiquetas, detalle y selector de estado.
// Entradas: records: lista recibida del backend.
// Salida: Ninguno; actualiza filas y estado vacío.
// Uso: Al cargar o cambiar el estado de registros.
function renderQualityRecords(records) {
  const stateLabels = { nuevo: "Nuevo", en_revision: "En revisión", en_proceso: "En proceso", resuelto: "Resuelto" };
  const typeLabels = { error: "Error", sugerencia: "Sugerencia" };
  const sourceLabels = { aplicacion: "Aplicación", cliente: "Cliente", administrador: "Administrador" };
  const severityLabels = { baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica" };
  document.querySelector("#quality-records-list").innerHTML = records.map(record => {
    const date = new Date(String(record.creado_en).replace(" ", "T"));
    const created = Number.isNaN(date.getTime()) ? record.creado_en : date.toLocaleString("es-CO");
    const reporter = record.origen === "cliente" && record.cliente ? ` · ${record.cliente}` : "";
    return `<tr>
      <td>${escapeHtml(created)}</td>
      <td><strong>${escapeHtml(typeLabels[record.tipo] || record.tipo)}</strong><span class="quality-source">${escapeHtml(sourceLabels[record.origen] || record.origen)}${escapeHtml(reporter)}</span></td>
      <td><span class="quality-severity quality-severity-${escapeHtml(record.severidad)}">${escapeHtml(severityLabels[record.severidad] || record.severidad)}</span></td>
      <td><details class="quality-detail"><summary>${escapeHtml(record.titulo)}</summary><p>${escapeHtml(record.detalle)}</p></details></td>
      <td><select class="quality-status" data-quality-id="${escapeHtml(record.id)}" aria-label="Cambiar estado del registro de calidad">${Object.entries(stateLabels).map(([value, label]) => `<option value="${value}" ${record.estado === value ? "selected" : ""}>${label}</option>`).join("")}</select></td>
    </tr>`;
  }).join("");
  document.querySelector("#quality-records-empty").hidden = records.length > 0;
}

// Obtiene resumen y registros de calidad para la administración.
// Entradas: Ninguna; consulta el controlador de calidad.
// Salida: Promesa sin valor; actualiza métricas/listado o muestra error.
// Uso: Al abrir o refrescar el panel de calidad.
async function loadQuality() {
  const error = document.querySelector("#quality-admin-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/calidad.php; sin cuerpo. Respuesta: el estado HTTP confirma el registro y la interfaz muestra el resultado.
    const data = await requestJson("../backend/controllers/calidad.php");
    document.querySelector("#quality-open-errors").textContent = data.resumen.errores_abiertos;
    document.querySelector("#quality-pending-suggestions").textContent = data.resumen.sugerencias_pendientes;
    document.querySelector("#quality-resolved").textContent = data.resumen.resueltos;
    renderQualityRecords(data.registros);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

