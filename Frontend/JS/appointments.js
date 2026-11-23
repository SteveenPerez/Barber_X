// Rol: interfaz de reservas y agenda de citas para clientes y administración.
// Relación: coordina los controladores de citas con módulos de barberos, reportes y los componentes de interfaz compartidos.
// Activa la pestaña del cliente y carga los datos de esa sección.
// Entradas: tab: clave de la pestaña elegida.
// Salida: Ninguno; actualiza paneles y controles del DOM.
// Uso: Al navegar entre servicios, citas, video, manual o sugerencias.
function setClientTab(tab) {
  document.querySelectorAll(".client-tab").forEach(button => {
    const selected = button.dataset.clientTab === tab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#client-services-panel").hidden = tab !== "services";
  document.querySelector("#client-appointments-panel").hidden = tab !== "appointments";
  document.querySelector("#client-video-panel").hidden = tab !== "video";
  document.querySelector("#client-manual-panel").hidden = tab !== "manual";
  document.querySelector("#client-suggestions-panel").hidden = tab !== "suggestions";
  // Carga el catalogo al abrir la pestana de servicios.
  if (tab === "services") loadServices();
  // Prepara historial, barberos y fecha al entrar a las reservas.
  if (tab === "appointments") {
    loadClientAppointments();
    loadBarbers();
    setBookingMinDate();
  }
  // Carga el video al seleccionar esa seccion.
  if (tab === "video") loadVideo(false);
  // Carga el manual al abrir su seccion.
  if (tab === "manual") loadManual(false);
}

// Establece la fecha local mínima de reserva y sincroniza el mes del calendario.
// Entradas: Ninguna; lee la fecha actual del navegador.
// Salida: Ninguno; actualiza el campo de fecha y dibuja el calendario.
// Uso: Al abrir o reiniciar el formulario de reserva.
function setBookingMinDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const today = now.toISOString().slice(0, 10);
  const dateInput = document.querySelector("#booking-date");
  dateInput.min = today;
  // Usa hoy como fecha inicial sin reemplazar una fecha ya elegida.
  if (!dateInput.value) dateInput.value = today;
  const selected = new Date(`${dateInput.value}T00:00:00`);
  bookingCalendarMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  renderBookingCalendar();
}

// Convierte una hora HH:mm al formato de 12 horas.
// Entradas: time: hora como texto HH:mm.
// Salida: Una cadena horaria legible.
// Uso: Al mostrar las horas ofrecidas o confirmar una reserva.
function formatBookingTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

// Construye la fecha del calendario con ceros iniciales.
// Entradas: year, month (base cero) y day: componentes numéricos de fecha.
// Salida: Fecha YYYY-MM-DD.
// Uso: Al dibujar los días del calendario.
function bookingDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Dibuja el mes de reservas, marca el día elegido y bloquea fechas anteriores a hoy.
// Entradas: Ninguna; usa bookingCalendarMonth y el valor del campo de fecha.
// Salida: Ninguno; actualiza título, navegación y botones de día.
// Uso: Al elegir fecha o navegar entre meses.
function renderBookingCalendar() {
  const monthTitle = document.querySelector("#booking-month");
  const daysContainer = document.querySelector("#booking-calendar-days");
  const dateInput = document.querySelector("#booking-date");
  const year = bookingCalendarMonth.getFullYear();
  const month = bookingCalendarMonth.getMonth();
  const monthName = bookingCalendarMonth.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  monthTitle.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const offset = (bookingCalendarMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minimumMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  document.querySelector("#booking-prev-month").disabled = bookingCalendarMonth <= minimumMonth;
  daysContainer.innerHTML = `${Array.from({ length: offset }, () => "<span class=\"calendar-day calendar-day-empty\" aria-hidden=\"true\"></span>").join("")}${Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = bookingDateString(year, month, day);
    const dateValue = new Date(year, month, day);
    const disabled = dateValue < today;
    const selected = date === dateInput.value;
    return `<button class="calendar-day${selected ? " selected" : ""}" type="button" data-booking-date="${date}" aria-pressed="${selected}" aria-label="${dateValue.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}"${disabled ? " disabled" : ""}>${day}</button>`;
  }).join("")}`;
  daysContainer.classList.remove("booking-calendar-enter");
  void daysContainer.offsetWidth;
  daysContainer.classList.add("booking-calendar-enter");
}

// Muestra las horas disponibles en la franja del día seleccionada.
// Entradas: Ninguna; usa bookingSlots, bookingSlotPeriod y la hora seleccionada.
// Salida: Ninguno; actualiza la lista de horarios.
// Uso: Al cargar disponibilidad, cambiar franja o elegir una hora.
function renderBookingTimes() {
  const times = document.querySelector("#booking-times");
  const availableSlots = bookingSlots.filter(slot => {
    const hour = Number(slot.hora.split(":")[0]);
    return bookingSlotPeriod === "morning" ? hour < 12 : bookingSlotPeriod === "afternoon" ? hour >= 12 && hour < 18 : hour >= 18;
  });
  times.innerHTML = availableSlots.length
    ? availableSlots.map(slot => `<button class="booking-time${document.querySelector("#booking-time").value === slot.hora ? " selected" : ""}" type="button" data-booking-time="${escapeHtml(slot.hora)}" aria-pressed="${document.querySelector("#booking-time").value === slot.hora}">${escapeHtml(formatBookingTime(slot.hora))}</button>`).join("")
    : `<p class="booking-empty">${bookingSlots.length ? "No hay horas disponibles en esta franja." : "No hay horas disponibles para esta fecha."}</p>`;
  times.classList.remove("booking-times-enter");
  void times.offsetWidth;
  times.classList.add("booking-times-enter");
}

// Presenta un mensaje de éxito o error en el diálogo de reservas.
// Entradas: success y message, con títulos opcionales según resultado.
// Salida: Ninguno; abre el diálogo y enfoca su cierre.
// Uso: Tras enviar una reserva, reprogramar o cancelar.
function showBookingMessage(success, message, successTitle = "Cita agendada", errorTitle = "No se pudo agendar") {
  const backdrop = document.querySelector("#booking-message-backdrop");
  const dialog = document.querySelector("#booking-message");
  bookingMessageReturnFocus = document.activeElement;
  dialog.classList.toggle("is-error", !success);
  dialog.classList.remove("is-confirmation");
  document.querySelector("#booking-message-icon").textContent = success ? "✓" : "!";
  document.querySelector("#booking-message-title").textContent = success ? successTitle : errorTitle;
  document.querySelector("#booking-message-text").textContent = message;
  document.querySelector("#booking-message-close").textContent = "Entendido";
  document.querySelector("#booking-message-confirm").hidden = true;
  backdrop.hidden = false;
  document.querySelector("#booking-message-close").focus();
}

// Abre una confirmación modal y espera la decisión de la persona.
// Entradas: title, message y confirmLabel: textos del diálogo.
// Salida: Promesa booleana resuelta al confirmar o cerrar.
// Uso: Antes de ejecutar una acción destructiva, como cancelar una cita.
function showBookingConfirmation(title, message, confirmLabel) {
  const backdrop = document.querySelector("#booking-message-backdrop");
  const dialog = document.querySelector("#booking-message");
  bookingMessageReturnFocus = document.activeElement;
  dialog.classList.remove("is-error");
  dialog.classList.add("is-confirmation");
  document.querySelector("#booking-message-icon").textContent = "!";
  document.querySelector("#booking-message-title").textContent = title;
  document.querySelector("#booking-message-text").textContent = message;
  document.querySelector("#booking-message-close").textContent = "Volver";
  const confirmButton = document.querySelector("#booking-message-confirm");
  confirmButton.textContent = confirmLabel;
  confirmButton.hidden = false;
  backdrop.hidden = false;
  confirmButton.focus();
  return new Promise(resolve => {
    bookingMessageConfirmationResolve = resolve;
  });
}

// Cierra el diálogo, devuelve el foco y resuelve una confirmación pendiente como cancelada.
// Entradas: Ninguna; usa el elemento de retorno y el callback guardados.
// Salida: Ninguno; la promesa pendiente recibe false.
// Uso: Al cerrar el diálogo o descartar una confirmación.
function closeBookingMessage() {
  document.querySelector("#booking-message-backdrop").hidden = true;
  document.querySelector("#booking-message").classList.remove("is-confirmation");
  document.querySelector("#booking-message-confirm").hidden = true;
  document.querySelector("#booking-message-close").textContent = "Entendido";
  // Devuelve el foco solo si el elemento previo todavia puede recibirlo.
  if (bookingMessageReturnFocus && typeof bookingMessageReturnFocus.focus === "function") {
    bookingMessageReturnFocus.focus();
  }
  // Resuelve como cancelada cualquier confirmacion que siga pendiente.
  if (bookingMessageConfirmationResolve) {
    const resolve = bookingMessageConfirmationResolve;
    bookingMessageConfirmationResolve = null;
    resolve(false);
  }
}

// Consulta y representa la disponibilidad para el barbero y fecha elegidos.
// Entradas: Ninguna; lee fecha, barbero y estado de reprogramación del formulario.
// Salida: Promesa sin valor; guarda horarios válidos o muestra el error.
// Uso: Al cambiar fecha/barbero o iniciar/cancelar una reprogramación.
async function loadBookingSlots() {
  const times = document.querySelector("#booking-times");
  const date = document.querySelector("#booking-date").value;
  const barberSelector = document.querySelector("#booking-barber");
  const barber = barberSelector.value;
  const barberName = barberSelector.selectedOptions[0]?.textContent || "";
  const error = document.querySelector("#booking-error");
  const requestId = ++bookingSlotsRequest;
  bookingSlots = [];
  document.querySelector("#booking-time").value = "";
  document.querySelector("#booking-availability-context").textContent = barber && date
    ? `Consultando la agenda de ${barberName} para el ${new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}.`
    : "Selecciona un barbero para consultar su agenda.";
  times.innerHTML = `<p class="booking-empty">${date && barber ? "Consultando horarios..." : "Selecciona un barbero y una fecha."}</p>`;
  // Evita consultar horarios hasta tener fecha y barbero seleccionados.
  if (!date || !barber) return;

  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    const query = new URLSearchParams({ accion: "horarios", fecha: date, id_barbero: barber });
    // Incluye la cita actual para que el servidor considere su horario al reprogramar.
    if (reschedulingAppointmentId) query.set("id_cita", reschedulingAppointmentId);
    // GET ../backend/controllers/citas.php?${query}; sin cuerpo; filtros en la URL. Respuesta: el listado JSON se filtra por disponibilidad y dibuja los horarios.
    const slots = await requestJson(`../backend/controllers/citas.php?${query}`);
    // Descarta respuestas atrasadas si ya empezó otra consulta o cambió la selección.
    if (requestId !== bookingSlotsRequest || barberSelector.value !== barber || document.querySelector("#booking-date").value !== date) return;
    bookingSlots = slots.filter(slot => slot.disponible);
    document.querySelector("#booking-availability-context").textContent = `Horarios de ${barberName} · ${new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}.`;
    renderBookingTimes();
    error.hidden = true;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    // Descarta respuestas atrasadas si ya empezó otra consulta o cambió la selección.
    if (requestId !== bookingSlotsRequest || barberSelector.value !== barber || document.querySelector("#booking-date").value !== date) return;
    times.innerHTML = `<p class="booking-empty">No se pudieron cargar los horarios.</p>`;
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Dibuja citas en la tabla adecuada, con campos y acciones según el rol.
// Entradas: appointments: lista del servidor; admin: indica vista administrativa o de cliente.
// Salida: Ninguno; actualiza filas y estado vacío.
// Uso: Al cargar o refrescar citas.
function renderAppointments(appointments, admin) {
  const body = document.querySelector(admin ? "#admin-appointments-list" : "#client-appointments-list");
  const empty = document.querySelector(admin ? "#admin-appointments-empty" : "#client-appointments-empty");
  const formatDate = value => {
    const date = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CO");
  };
  const statusClass = status => ["pendiente", "completada", "cancelada"].includes(normalizeAppointmentStatus(status))
    ? `status-${normalizeAppointmentStatus(status)}`
    : "";
  // Elige columnas, acciones y destino segun la vista solicitada.
  if (admin) {
    body.innerHTML = appointments.map(appointment => {
      return `<tr>
        <td class="appointment-id">#${escapeHtml(appointment.id)}</td>
        <td><div class="user-details"><strong>${escapeHtml(`${appointment.cliente_nombre} ${appointment.cliente_apellido}`)}</strong><span>${escapeHtml(appointment.cliente_email)} · ${escapeHtml(appointment.cliente_telefono || "Sin teléfono")}</span></div></td>
        <td><div class="user-details"><strong>${escapeHtml(appointment.servicio)}</strong><span>${escapeHtml(appointment.notas || "Sin notas")}</span></div></td><td>${escapeHtml(appointment.barbero)}</td><td>${escapeHtml(formatDate(appointment.fecha_hora))}</td><td>${currency(appointment.precio)}</td>
        <td><span class="status ${statusClass(appointment.estado)}">${escapeHtml(normalizeAppointmentStatus(appointment.estado))}</span></td>
        <td><select class="appointment-status ${statusClass(appointment.estado)}" data-appointment-id="${escapeHtml(appointment.id)}" aria-label="Cambiar estado de la cita"><option value="pendiente" ${normalizeAppointmentStatus(appointment.estado) === "pendiente" ? "selected" : ""}>Pendiente</option><option value="completada" ${appointment.estado === "completada" ? "selected" : ""}>Completada</option><option value="cancelada" ${appointment.estado === "cancelada" ? "selected" : ""}>Cancelada</option></select></td>
      </tr>`;
    }).join("");
  // Renderiza la tabla del cliente, sin controles administrativos.
  } else {
    body.innerHTML = appointments.map(appointment => {
      const date = new Date(String(appointment.fecha_hora).replace(" ", "T"));
      const canManage = ["pendiente", "confirmada"].includes(appointment.estado)
        && !Number.isNaN(date.getTime()) && date > new Date();
      const actions = canManage
        ? `<div class="client-appointment-actions"><button class="secondary-button" type="button" data-client-appointment-action="reschedule" data-appointment-id="${escapeHtml(appointment.id)}">Reprogramar</button><button class="secondary-button cancel-appointment-button" type="button" data-client-appointment-action="cancel" data-appointment-id="${escapeHtml(appointment.id)}">Cancelar</button></div>`
        : "—";
      return `<tr><td class="appointment-id">#${escapeHtml(appointment.id)}</td><td>${escapeHtml(appointment.servicio)}</td><td>${escapeHtml(appointment.barbero)}</td><td>${escapeHtml(formatDate(appointment.fecha_hora))}</td><td>${currency(appointment.precio)}</td><td><span class="status ${statusClass(appointment.estado)}">${escapeHtml(normalizeAppointmentStatus(appointment.estado))}</span></td><td>${actions}</td></tr>`;
    }).join("");
  }
  empty.hidden = appointments.length > 0;
}

// Filtra la agenda administrativa y actualiza contadores e indicadores.
// Entradas: Ninguna; lee búsqueda, filtro y adminAppointments.
// Salida: Ninguno; redibuja tablas y gráficos.
// Uso: Al escribir en búsqueda, cambiar filtro o recibir citas.
function renderAdminAppointments() {
  const normalize = value => String(value || "").toLocaleLowerCase("es");
  const query = normalize(document.querySelector("#appointment-search").value.trim());
  const status = document.querySelector("#appointment-filter").value;
  document.querySelector("#appointments-total").textContent = adminAppointments.length;
  document.querySelector("#appointments-pending").textContent = adminAppointments.filter(item => normalizeAppointmentStatus(item.estado) === "pendiente").length;
  document.querySelector("#appointments-completed").textContent = adminAppointments.filter(item => item.estado === "completada").length;
  document.querySelector("#appointments-cancelled").textContent = adminAppointments.filter(item => item.estado === "cancelada").length;
  const filtered = adminAppointments.filter(item => {
    const searchable = normalize([
      item.id, item.cliente_nombre, item.cliente_apellido, item.cliente_email,
      item.servicio, item.barbero, item.notas
    ].join(" "));
    return (status === "todas" || normalizeAppointmentStatus(item.estado) === status) && searchable.includes(query);
  });
  renderAppointments(filtered, true);
  document.querySelector("#admin-appointments-empty").textContent = filtered.length
    ? "No hay citas que coincidan con esa búsqueda."
    : adminAppointments.length ? "No hay citas que coincidan con ese estado o búsqueda." : "Aún no hay citas registradas.";
  renderAppointmentInsights(adminAppointments);
}

// Selecciona citas pendientes futuras y las ordena cronológicamente.
// Entradas: appointments: lista de citas a evaluar.
// Salida: Lista nueva de próximas citas válidas.
// Uso: Al construir resúmenes y contadores de próximas citas.
function getUpcomingAppointments(appointments) {
  const now = new Date();
  return appointments
    .filter(appointment => {
      const date = new Date(String(appointment.fecha_hora).replace(" ", "T"));
      return normalizeAppointmentStatus(appointment.estado) === "pendiente" && !Number.isNaN(date.getTime()) && date > now;
    })
    .sort((first, second) => new Date(String(first.fecha_hora).replace(" ", "T")) - new Date(String(second.fecha_hora).replace(" ", "T")));
}

// Muestra hasta cinco citas próximas en el contenedor indicado.
// Entradas: targetSelector: selector DOM; appointments: lista a resumir.
// Salida: Ninguno; actualiza el contenedor.
// Uso: En los paneles de agenda y dashboard.
function renderUpcomingAppointments(targetSelector, appointments) {
  const target = document.querySelector(targetSelector);
  const upcoming = getUpcomingAppointments(appointments).slice(0, 5);
  target.innerHTML = upcoming.length
    ? upcoming.map(appointment => {
      const date = new Date(String(appointment.fecha_hora).replace(" ", "T"));
      return `<article class="upcoming-item">
        <span class="upcoming-date"><strong>${date.toLocaleDateString("es-CO", { day: "2-digit" })}</strong><span>${date.toLocaleDateString("es-CO", { month: "short" }).replace(".", "")}</span></span>
        <div class="upcoming-copy"><strong>${escapeHtml(`${appointment.cliente_nombre} ${appointment.cliente_apellido}`)}</strong><span>${escapeHtml(appointment.servicio)} · ${escapeHtml(appointment.barbero)}</span></div>
        <span class="upcoming-time">${date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
      </article>`;
    }).join("")
    : `<p class="chart-empty">No hay próximas citas programadas.</p>`;
}

// Construye el gráfico circular de citas agrupadas por estado.
// Entradas: targetSelector y appointmentsOrReport: destino y lista o resumen del reporte.
// Salida: Ninguno; reemplaza el contenido del gráfico.
// Uso: En dashboard y reportes.
function renderStatusChart(targetSelector, appointmentsOrReport) {
  const states = [
    { key: "pendiente", label: "Pendientes", color: "pending" },
    { key: "completada", label: "Completadas", color: "completed" },
    { key: "cancelada", label: "Canceladas", color: "cancelled" }
  ];
  const counts = Array.isArray(appointmentsOrReport)
    ? states.map(state => appointmentsOrReport.filter(appointment => normalizeAppointmentStatus(appointment.estado) === state.key).length)
    : states.map(state => Number(appointmentsOrReport.citas[{
      pendiente: "pendientes",
      completada: "completadas",
      cancelada: "canceladas"
    }[state.key]] || 0));
  const total = counts.reduce((sum, count) => sum + count, 0);
  let progress = 0;
  const segments = states.map((state, index) => {
    const percentage = total ? counts[index] / total * 100 : 0;
    const start = progress;
    progress += percentage;
    return `${state.color === "pending" ? "#9b8b68" : state.color === "completed" ? "#79c49a" : "#b56d60"} ${start}% ${progress}%`;
  });
  const target = document.querySelector(targetSelector);
  target.innerHTML = `<div class="status-chart-layout">
    <div class="status-donut${total ? "" : " is-empty"}" style="--status-gradient: conic-gradient(${segments.join(", ")})" role="img" aria-label="${total} citas distribuidas por estado"><div><strong>${total}</strong><span>CITAS</span></div></div>
    <div class="status-chart-legend">${states.map((state, index) => `<div class="status-legend-row"><span class="status-legend-label"><i class="legend-dot ${state.color}"></i>${state.label}</span><strong>${counts[index]}</strong></div>`).join("")}</div>
  </div>`;
}

// Actualiza gráfico de estados y listas de próximas citas relacionadas con la agenda.
// Entradas: appointments: lista de citas cargada.
// Salida: Ninguno; actualiza tres paneles de resumen.
// Uso: Al redibujar el listado administrativo.
function renderAppointmentInsights(appointments) {
  renderStatusChart("#appointments-status-chart", appointments);
  renderUpcomingAppointments("#appointments-upcoming-list", appointments);
  renderUpcomingAppointments("#dashboard-upcoming-list", appointments);
}

// Carga en paralelo resumen de reportes y citas para el dashboard administrativo.
// Entradas: Ninguna; consulta ambos controladores.
// Salida: Promesa sin valor; actualiza métricas, gráficos y error si falla.
// Uso: Al abrir o refrescar el inicio administrativo.
async function loadDashboard() {
  const error = document.querySelector("#dashboard-error");
  error.hidden = true;
  document.querySelector("#dashboard-date").textContent = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    const [report, appointments] = await Promise.all([
      // GET ../backend/controllers/reportes.php; sin cuerpo. Respuesta: el JSON alimenta metricas y graficos del reporte.
      requestJson("../backend/controllers/reportes.php"),
      // GET ../backend/controllers/citas.php; sin cuerpo. Respuesta: el JSON alimenta indicadores y listas de citas.
      requestJson("../backend/controllers/citas.php")
    ]);
    latestReport = report;
    adminAppointments = appointments;
    const upcomingCount = getUpcomingAppointments(appointments).length;
    const cancellationRate = report.citas.total ? Math.round((report.citas.canceladas / report.citas.total) * 100) : 0;
    document.querySelector("#dashboard-total").textContent = report.citas.total;
    document.querySelector("#dashboard-upcoming").textContent = upcomingCount;
    document.querySelector("#dashboard-cancelled").textContent = report.citas.canceladas;
    document.querySelector("#dashboard-cancellation-rate").textContent = `${cancellationRate}% del total`;
    document.querySelector("#dashboard-clients").textContent = report.clientes;
    renderActivityChart("#dashboard-trend-chart", report.actividad_mensual);
    renderPopularServices("#dashboard-services-chart", report.servicios);
    renderStatusChart("#dashboard-status-chart", report);
    renderUpcomingAppointments("#dashboard-upcoming-list", appointments);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Convierte una fecha local a una clave estable YYYY-MM-DD sin conversión UTC.
// Entradas: date: objeto Date local.
// Salida: Cadena YYYY-MM-DD.
// Uso: Al filtrar agendas por el día local.
function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Obtiene citas y decide si actualizar la vista de administración o del cliente.
// Entradas: admin: true para administración; false para tabla no administrativa.
// Salida: Promesa sin valor; actualiza datos o muestra error.
// Uso: Al entrar o refrescar la lista de citas.
async function loadAppointments(admin) {
  const error = document.querySelector("#appointments-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/citas.php; sin cuerpo. Respuesta: la lista JSON actualiza la agenda correspondiente y sus resumenes.
    const appointments = await requestJson("../backend/controllers/citas.php");
    // Elige columnas, acciones y destino segun la vista solicitada.
    if (admin) {
      adminAppointments = appointments;
      renderAdminAppointments();
    // Muestra las citas en la vista no administrativa.
    } else {
      renderAppointments(appointments, false);
    }
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Carga y presenta el historial de citas del cliente.
// Entradas: Ninguna; consulta el controlador de citas.
// Salida: Promesa booleana que indica si la lista se actualizó.
// Uso: Al entrar al historial o luego de modificar una cita.
async function loadClientAppointments() {
  const error = document.querySelector("#client-appointments-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/citas.php; sin cuerpo. Respuesta: la lista JSON actualiza la agenda correspondiente y sus resumenes.
    clientAppointments = await requestJson("../backend/controllers/citas.php");
    renderAppointments(clientAppointments, false);
    return true;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
    return false;
  }
}

// Restaura el formulario de reserva al modo de cita nueva.
// Entradas: Ninguna; limpia reschedulingAppointmentId y controles asociados.
// Salida: Ninguno; formulario en modo de alta.
// Uso: Al cancelar o terminar la reprogramación.
function resetBookingReschedule() {
  reschedulingAppointmentId = null;
  document.querySelector("#booking-heading").textContent = "Agenda una cita";
  document.querySelector("#booking-submit").textContent = "Agendar cita";
  document.querySelector("#booking-cancel-reschedule").hidden = true;
  document.querySelector("#booking-service-field").hidden = false;
  document.querySelector("#booking-service").disabled = false;
  document.querySelector("#booking-service").required = true;
  document.querySelector("#booking-notes-field").hidden = false;
  document.querySelector("#booking-notes").disabled = false;
  document.querySelector("#booking-time").value = "";
}

// Prepara el formulario con la cita elegida y carga horarios disponibles para moverla.
// Entradas: appointment: registro seleccionado del historial del cliente.
// Salida: Promesa sin valor; configura el formulario y desplaza la vista.
// Uso: Cuando el cliente pulsa Reprogramar.
async function startBookingReschedule(appointment) {
  // Detiene la reprogramación si no se pudieron preparar las opciones de barbero.
  if (!await loadBarbers()) return;
  const barberSelector = document.querySelector("#booking-barber");
  const barberAvailable = [...barberSelector.options].some(option => option.value === String(appointment.id_barbero));
  reschedulingAppointmentId = String(appointment.id);
  document.querySelector("#booking-heading").textContent = `Reprogramar cita #${appointment.id}`;
  document.querySelector("#booking-submit").textContent = "Guardar reprogramación";
  document.querySelector("#booking-cancel-reschedule").hidden = false;
  document.querySelector("#booking-service-field").hidden = true;
  document.querySelector("#booking-service").disabled = true;
  document.querySelector("#booking-service").required = false;
  document.querySelector("#booking-notes-field").hidden = true;
  document.querySelector("#booking-notes").disabled = true;
  document.querySelector("#booking-error").hidden = true;
  document.querySelector("#client-appointments-error").hidden = true;
  barberSelector.value = barberAvailable ? String(appointment.id_barbero) : "";
  // Informa que el barbero original ya no está disponible y permite elegir otro.
  if (!barberAvailable) {
    const error = document.querySelector("#booking-error");
    error.textContent = "El barbero de esta cita ya no está disponible. Selecciona otro barbero para continuar.";
    error.hidden = false;
  }
  const dateInput = document.querySelector("#booking-date");
  dateInput.value = String(appointment.fecha_hora).slice(0, 10);
  const selectedDate = new Date(`${dateInput.value}T00:00:00`);
  bookingCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  document.querySelector("#booking-time").value = "";
  renderBookingCalendar();
  await loadBookingSlots();
  document.querySelector("#booking-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

