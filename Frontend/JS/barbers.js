// Rol: selector de barberos y resumen de agenda del barbero autenticado.
// Relación: consulta los controladores de barberos y citas y comparte utilidades y estado con el módulo común.
// Carga las opciones de barberos en el formulario de citas y conserva la selección válida.
// Entradas: Ninguna; consulta el controlador de barberos.
// Salida: Promesa booleana de éxito; puede cargar horarios y mostrar un error.
// Uso: Al abrir las citas del cliente o preparar una reprogramación.
async function loadBarbers() {
  const selector = document.querySelector("#booking-barber");
  const selectedBarber = selector.value;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/barberos.php; sin cuerpo. Respuesta: el listado JSON llena el selector y conserva una seleccion valida.
    const barbers = await requestJson("../backend/controllers/barberos.php");
    selector.innerHTML = `<option value="">Selecciona un barbero</option>${barbers.map(barber => `<option value="${escapeHtml(barber.id)}">${escapeHtml(`${barber.nombre} ${barber.apellido}`)}${barber.especialidad ? ` · ${escapeHtml(barber.especialidad)}` : ""}</option>`).join("")}`;
    selector.value = barbers.some(barber => String(barber.id) === selectedBarber) ? selectedBarber : "";
    // Consulta horarios solo si quedo seleccionado un barbero valido.
    if (selector.value) await loadBookingSlots();
    return true;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (error) {
    const message = document.querySelector("#booking-error");
    message.textContent = error.message;
    message.hidden = false;
    return false;
  }
}

// Filtra, ordena y muestra la agenda del barbero para hoy o la semana actual.
// Entradas: Ninguna; usa barberAppointments y barberSchedulePeriod.
// Salida: Ninguno; actualiza filas, título, vacío y botones de periodo.
// Uso: Al cargar datos o cambiar el periodo visible.
function renderBarberSchedule() {
  const now = new Date();
  const today = localDateKey(now);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const schedule = barberAppointments
    .filter(appointment => {
      const date = new Date(String(appointment.fecha_hora).replace(" ", "T"));
      // Ignora las fechas invalidas antes de clasificarlas en el periodo.
      if (Number.isNaN(date.getTime())) return false;
      return barberSchedulePeriod === "today"
        ? localDateKey(date) === today
        : date >= weekStart && date < weekEnd;
    })
    .sort((first, second) => String(first.fecha_hora).localeCompare(String(second.fecha_hora)));
  const body = document.querySelector("#barber-schedule-list");
  body.innerHTML = schedule.map(appointment => {
    const date = new Date(String(appointment.fecha_hora).replace(" ", "T"));
    const status = appointment.estado;
    const statusLabel = { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada" }[status] || status;
    return `<tr>
      <td>${escapeHtml(date.toLocaleString("es-CO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</td>
      <td>${escapeHtml(appointment.servicio || "Servicio sin detallar")}</td>
      <td>${escapeHtml(`${appointment.cliente_nombre} ${appointment.cliente_apellido}`.trim())}</td>
      <td><span class="status ${status === "cancelada" ? "inactive" : ""}">${escapeHtml(statusLabel)}</span></td>
    </tr>`;
  }).join("");
  document.querySelector("#barber-schedule-empty").hidden = schedule.length > 0;
  document.querySelector("#barber-schedule-caption").textContent = barberSchedulePeriod === "today" ? "Tus citas para hoy" : "Tus citas de lunes a domingo";
  document.querySelectorAll("[data-barber-period]").forEach(button => {
    const selected = button.dataset.barberPeriod === barberSchedulePeriod;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

// Carga citas del barbero y calcula próximas citas, completadas e ingresos.
// Entradas: Ninguna; consulta el controlador de citas.
// Salida: Promesa sin valor; actualiza métricas y agenda o muestra error.
// Uso: Al iniciar o refrescar el espacio del barbero.
async function loadBarberDashboard() {
  const error = document.querySelector("#barber-dashboard-error");
  error.hidden = true;
  document.querySelector("#barber-dashboard-date").textContent = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/citas.php; sin cuerpo. Respuesta: la lista JSON actualiza la agenda correspondiente y sus resumenes.
    barberAppointments = await requestJson("../backend/controllers/citas.php");
    const now = new Date();
    const upcoming = barberAppointments.filter(appointment =>
      ["pendiente", "confirmada"].includes(normalizeAppointmentStatus(appointment.estado))
      && new Date(String(appointment.fecha_hora).replace(" ", "T")) > now
    );
    const completed = barberAppointments.filter(appointment => appointment.estado === "completada");
    const revenue = completed.reduce((total, appointment) => total + Number(appointment.precio || 0), 0);
    document.querySelector("#barber-total").textContent = barberAppointments.length;
    document.querySelector("#barber-upcoming").textContent = upcoming.length;
    document.querySelector("#barber-completed").textContent = completed.length;
    document.querySelector("#barber-revenue").textContent = currency(revenue);
    renderBarberSchedule();
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

