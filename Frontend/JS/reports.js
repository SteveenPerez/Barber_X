// Rol: visualización de informes, historial, tendencias y estadísticas de clientes y servicios.
// Relación: consume el controlador de reportes y alimenta los gráficos de los paneles administrativo y de clientes.
// Dibuja el historial de informes y sus enlaces de descarga.
// Entradas: reports: registros devueltos por el controlador.
// Salida: Ninguno; actualiza tabla y estado vacío.
// Uso: Al cargar o actualizar el historial.
function renderReportHistory(reports) {
  const body = document.querySelector("#report-history-list");
  body.innerHTML = reports.map(report => {
    const date = new Date(String(report.generado_en).replace(" ", "T"));
    const formattedDate = Number.isNaN(date.getTime()) ? report.generado_en : date.toLocaleString("es-CO");
    return `<tr>
      <td>#${escapeHtml(report.id)}</td>
      <td>${escapeHtml(formattedDate)}</td>
      <td>${escapeHtml(report.generado_por)}</td>
      <td>${escapeHtml(report.total_citas)}</td>
      <td>${escapeHtml(report.total_clientes)}</td>
      <td>${currency(report.ingresos)}</td>
      <td><a class="secondary-button report-download" href="../backend/controllers/reportes.php?id=${encodeURIComponent(report.id)}">Descargar Excel</a></td>
    </tr>`;
  }).join("");
  document.querySelector("#report-history-empty").hidden = reports.length > 0;
}

// Construye una serie de seis meses para comparar citas y cancelaciones.
// Entradas: targetSelector: destino; monthlyActivity: datos mensuales opcionales.
// Salida: Ninguno; genera SVG y leyenda en el destino.
// Uso: En dashboard y reportes.
function renderActivityChart(targetSelector, monthlyActivity = []) {
  const activityByMonth = new Map((monthlyActivity || []).map(item => [item.mes, item]));
  const months = [];
  // Recorre los meses recientes para construir una serie temporal continua.
  for (let offset = 5; offset >= 0; offset--) {
    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - offset);
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: month.toLocaleDateString("es-CO", { month: "short" }).replace(".", ""),
      appointments: Number(activityByMonth.get(key)?.citas || 0),
      cancellations: Number(activityByMonth.get(key)?.canceladas || 0)
    });
  }
  const maxValue = Math.max(1, ...months.map(month => month.appointments));
  const width = 700;
  const height = 235;
  const left = 37;
  const right = 12;
  const top = 18;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const pointsFor = key => months.map((month, index) => ({
    x: left + (chartWidth * index) / (months.length - 1),
    y: top + chartHeight - (month[key] / maxValue) * chartHeight
  }));
  const bookingPoints = pointsFor("appointments");
  const cancellationPoints = pointsFor("cancellations");
  const makePath = points => points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const grid = Array.from({ length: 4 }, (_, index) => {
    const y = top + (chartHeight * index) / 3;
    const value = Math.round(maxValue * (1 - index / 3));
    return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="chart-grid-line"/><text x="${left - 8}" y="${y + 4}" text-anchor="end" class="chart-axis-label">${value}</text>`;
  }).join("");
  const labels = months.map((month, index) => `<text x="${bookingPoints[index].x}" y="${height - 10}" text-anchor="middle" class="chart-axis-label">${escapeHtml(month.label)}</text>`).join("");
  const dots = (points, className) => points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4" class="chart-point ${className}"/>`).join("");
  const target = document.querySelector(targetSelector);
  target.innerHTML = `<svg class="activity-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico mensual de citas y cancelaciones">
    ${grid}
    <path d="${makePath(bookingPoints)}" class="chart-line chart-line-bookings"/>
    <path d="${makePath(cancellationPoints)}" class="chart-line chart-line-cancellations"/>
    ${dots(bookingPoints, "booking-point")}${dots(cancellationPoints, "cancellation-point")}${labels}
  </svg>
  <div class="chart-legend"><span><i class="legend-dot confirmed"></i>Citas</span><span><i class="legend-dot cancelled"></i>Cancelaciones</span></div>`;
}

// Agrupa y representa nuevas altas por día de la semana o por semana del mes.
// Entradas: report: resumen de registros; period: semana o mes (valor por defecto del estado actual).
// Salida: Ninguno; actualiza cifras, botones y SVG.
// Uso: En la tarjeta de registros de clientes al cambiar el periodo.
function renderClientRegistrationsChart(report, period = clientRegistrationPeriod) {
  clientRegistrationPeriod = period;
  const now = new Date();
  const dailyCounts = new Map((report.registros_clientes?.[period] || []).map(item => [item.fecha, Number(item.total)]));
  let points;
  // Agrupa por los últimos siete días o, en caso contrario, por semanas del mes.
  if (period === "semana") {
    points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return {
        label: date.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", ""),
        detail: date.toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", ""),
        total: dailyCounts.get(key) || 0
      };
    });
  // Agrupa los registros por semanas del mes en vez de por dias recientes.
  } else {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil(daysInMonth / 7);
    points = Array.from({ length: weeks }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      let total = 0;
      // Recorre los días incluidos para acumular el total del intervalo.
      for (let day = startDay; day <= endDay; day++) {
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        total += dailyCounts.get(key) || 0;
      }
      return { label: `Sem ${index + 1}`, detail: `${startDay}–${endDay}`, total };
    });
  }

  const total = points.reduce((sum, point) => sum + point.total, 0);
  const maxValue = Math.max(1, ...points.map(point => point.total));
  const width = 760;
  const height = 220;
  const left = 38;
  const right = 12;
  const top = 18;
  const bottom = 48;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const step = chartWidth / points.length;
  const barWidth = Math.min(period === "semana" ? 48 : 72, step * .48);
  const bars = points.map((point, index) => {
    const x = left + index * step + (step - barWidth) / 2;
    const barHeight = point.total ? Math.max(3, (point.total / maxValue) * chartHeight) : 0;
    const y = top + chartHeight - barHeight;
    return `<g class="client-chart-bar" style="--bar-delay:${index * 45}ms">
      <title>${escapeHtml(point.label)} (${escapeHtml(point.detail)}): ${point.total} ${point.total === 1 ? "cliente" : "clientes"}</title>
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="5" class="client-chart-bar-shape"/>
      ${point.total ? `<text x="${x + barWidth / 2}" y="${y - 7}" text-anchor="middle" class="client-chart-value">${point.total}</text>` : ""}
      <text x="${x + barWidth / 2}" y="${height - 24}" text-anchor="middle" class="chart-axis-label">${escapeHtml(point.label)}</text>
      <text x="${x + barWidth / 2}" y="${height - 9}" text-anchor="middle" class="client-chart-detail">${escapeHtml(point.detail)}</text>
    </g>`;
  }).join("");
  const grid = Array.from({ length: 4 }, (_, index) => {
    const y = top + (chartHeight * index) / 3;
    const value = Math.round(maxValue * (1 - index / 3));
    return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="chart-grid-line"/><text x="${left - 8}" y="${y + 4}" text-anchor="end" class="chart-axis-label">${value}</text>`;
  }).join("");
  document.querySelector("#client-period-total").textContent = total;
  document.querySelector("#client-period-label").textContent = period === "semana" ? "clientes registrados esta semana" : "clientes registrados este mes";
  document.querySelector("#client-registrations-caption").textContent = period === "semana"
    ? "Altas durante los últimos 7 días"
    : `Altas durante ${now.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`;
  document.querySelectorAll("[data-client-period]").forEach(button => {
    const selected = button.dataset.clientPeriod === period;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#client-registrations-chart").innerHTML = `<svg class="client-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${period === "semana" ? "Registros de clientes durante los últimos siete días" : "Registros de clientes por semana del mes"}">
    <defs><linearGradient id="client-chart-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#edcf91"/><stop offset="100%" stop-color="#9d7737"/></linearGradient></defs>
    ${grid}${bars}
  </svg>`;
}

// Muestra hasta cinco servicios con citas y una barra proporcional.
// Entradas: targetSelector: destino; services: catálogo con conteos.
// Salida: Ninguno; dibuja barras o mensaje vacío.
// Uso: En dashboard, reportes y gestión de servicios.
function renderPopularServices(targetSelector, services = []) {
  const target = document.querySelector(targetSelector);
  const popular = (services || []).filter(service => Number(service.citas) > 0).sort((a, b) => Number(b.citas) - Number(a.citas)).slice(0, 5);
  // Muestra un estado vacío cuando ningún servicio tiene citas.
  if (!popular.length) {
    target.innerHTML = `<p class="chart-empty">Aún no hay suficientes citas para mostrar la demanda.</p>`;
    return;
  }
  const max = Math.max(...popular.map(service => Number(service.citas)));
  target.innerHTML = popular.map((service, index) => {
    const count = Number(service.citas);
    const percentage = Math.max(4, (count / max) * 100);
    return `<div class="popular-service-row">
      <div class="popular-service-top"><span><i class="popular-service-rank">${String(index + 1).padStart(2, "0")}</i><strong>${escapeHtml(service.servicio)}</strong></span><b>${count}<small> citas</small></b></div>
      <div class="popular-service-track" role="progressbar" aria-label="${escapeHtml(service.servicio)}" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${max}"><span style="width:${percentage}%"></span></div>
    </div>`;
  }).join("");
}

// Obtiene el reporte más reciente y actualiza el gráfico de registros de clientes.
// Entradas: Ninguna; consulta el controlador de reportes.
// Salida: Promesa sin valor; conserva el reporte o muestra error.
// Uso: Al mostrar el panel de clientes sin datos en memoria.
async function loadClientRegistrationData() {
  const error = document.querySelector("#client-registrations-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/reportes.php; sin cuerpo. Respuesta: el JSON alimenta metricas y graficos del reporte.
    latestReport = await requestJson("../backend/controllers/reportes.php");
    renderClientRegistrationsChart(latestReport, clientRegistrationPeriod);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Carga las métricas, tablas y gráficos del módulo de reportes junto al historial.
// Entradas: Ninguna; consulta el controlador de reportes.
// Salida: Promesa sin valor; actualiza panel o informa error.
// Uso: Al abrir o refrescar Reportes.
async function loadReports() {
  const error = document.querySelector("#reports-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/reportes.php; sin cuerpo. Respuesta: el JSON alimenta metricas y graficos del reporte.
    const report = await requestJson("../backend/controllers/reportes.php");
    latestReport = report;
    document.querySelector("#report-total").textContent = report.citas.total;
    document.querySelector("#report-pending").textContent = report.citas.pendientes;
    document.querySelector("#report-completed").textContent = report.citas.completadas;
    document.querySelector("#report-cancelled").textContent = report.citas.canceladas;
    document.querySelector("#report-clients").textContent = report.clientes;
    document.querySelector("#report-revenue").textContent = currency(report.ingresos);
    document.querySelector("#report-services").innerHTML = report.servicios.map(service => `<tr><td>${escapeHtml(service.servicio)}</td><td>${escapeHtml(service.citas)}</td><td>${escapeHtml(service.completadas)}</td><td>${currency(service.ingresos)}</td></tr>`).join("");
    renderActivityChart("#report-trend-chart", report.actividad_mensual);
    renderPopularServices("#report-services-chart", report.servicios);
    document.querySelector("#report-updated").textContent = `Actualizado ${new Date().toLocaleString("es-CO")}`;
    await loadReportHistory();
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Solicita el listado de informes generados y representa las descargas.
// Entradas: Ninguna; consulta reportes.php con accion=lista.
// Salida: Promesa sin valor; actualiza tabla o error.
// Uso: Al entrar al módulo o despues de crear un informe.
async function loadReportHistory() {
  const error = document.querySelector("#report-history-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/reportes.php?accion=lista; sin cuerpo; filtros en la URL. Respuesta: la lista JSON alimenta la tabla del historial.
    const history = await requestJson("../backend/controllers/reportes.php?accion=lista");
    renderReportHistory(history.reportes);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Solicita generar un informe, refresca el historial e inicia la descarga del archivo.
// Entradas: Ninguna; envia la acción crear al controlador de reportes.
// Salida: Promesa sin valor; descarga el archivo recibido o presenta error.
// Uso: Al pulsar crear informe.
async function createReport() {
  const button = document.querySelector("#create-report");
  const error = document.querySelector("#reports-error");
  error.hidden = true;
  button.disabled = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // POST ../backend/controllers/reportes.php; JSON con accion=crear. Respuesta: el JSON devuelve el id usado para descargar el archivo generado.
    const report = await requestJson("../backend/controllers/reportes.php", "POST", { accion: "crear" });
    await loadReportHistory();
    const download = document.createElement("a");
    download.href = `../backend/controllers/reportes.php?id=${encodeURIComponent(report.id)}`;
    download.download = "";
    document.body.append(download);
    download.click();
    download.remove();
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
}

