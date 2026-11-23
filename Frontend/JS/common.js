// Rol: estado compartido, utilidades HTTP y conexión de eventos de toda la aplicación.
// Relación: conecta los módulos de interfaz con los controladores y gestiona autenticación, formularios y acciones de cada rol.
const list = document.querySelector("#person-list");
const form = document.querySelector("#user-form");
const backdrop = document.querySelector("#modal-backdrop");
const search = document.querySelector("#search");
const tableHead = document.querySelector("#table-head");
const loginScreen = document.querySelector("#login-screen");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
// Conserva en memoria la sesión, los datos cargados y el estado temporal de la interfaz.
let signedInUser = null;
let annexSqlLoaded = false;
let annexDocsLoaded = false;
let adminAppointments = [];
let clientAppointments = [];
let barberAppointments = [];
let barberSchedulePeriod = "today";
let editingServiceId = null;
let adminServices = [];
let latestReport = null;
let servicesAnimationTimer = null;
let clientRegistrationPeriod = "semana";
// Define etiquetas y textos para reutilizar la tabla de clientes y barberos.
const types = {
  clientes: {
    singular: "cliente",
    plural: "clientes",
    title: "Clientes",
    description: "Administra los clientes de tu barbería.",
    icon: "♙"
  },
  barberos: {
    singular: "barbero",
    plural: "barberos",
    title: "Barberos",
    description: "Administra los barberos y sus especialidades.",
    icon: "✂"
  }
};
let currentType = "clientes";
let people = [];
let editingId = null;
let availableServices = [];
let bookingSlotsRequest = 0;
let bookingCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let bookingSlots = [];
let bookingSlotPeriod = "morning";
let bookingMessageReturnFocus = null;
let bookingMessageConfirmationResolve = null;
let reschedulingAppointmentId = null;
// Formatea valores monetarios en pesos colombianos para mostrarlos en la interfaz.
// Entradas: value, importe numérico o convertible a número.
// Salida: Cadena con formato monetario COP, sin decimales.
// Uso: Al mostrar precios, ingresos y totales en los módulos.
const currency = value => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));
// Unifica el estado histórico "confirmada" con el estado pendiente de la agenda.
// Entradas: status, estado recibido para una cita.
// Salida: "pendiente" si era "confirmada"; en otro caso conserva el estado.
// Uso: Al comparar y presentar estados de citas en la agenda.
const normalizeAppointmentStatus = status => status === "confirmada" ? "pendiente" : status;

// Lee la respuesta del servidor, verifica que sea JSON y comunica errores HTTP.

// Prepara las opciones comunes de una solicitud HTTP y serializa sus datos.

// Consulta la API de personas para operar sobre clientes o barberos.

// Envía una solicitud JSON a cualquier endpoint de la aplicación.

// Consulta o actualiza la sesión activa según los datos recibidos.

// Escapa caracteres especiales para mostrar texto de forma segura en HTML.

// Obtiene las iniciales de un nombre para mostrar en el avatar.

// Construye las columnas de la tabla según el tipo de registro seleccionado.

// Dibuja la lista filtrada de personas y actualiza sus indicadores.

// Actualiza títulos, etiquetas y controles al cambiar entre clientes y barberos.

// Muestra el módulo administrativo elegido y carga sus datos necesarios.

// Carga una vez el contenido SQL del anexo para mostrarlo en pantalla.

// Carga una vez la documentación técnica y la muestra dentro del panel de Anexos.

// Activa la pestaña del anexo seleccionada y solicita su contenido si hace falta.

// Presenta las filas del historial de reportes y sus enlaces de descarga.

// Dibuja las incidencias y sugerencias de calidad con su estado actual.

// Obtiene los indicadores y registros de errores y sugerencias de administración.

// Carga la lista de barberos para completar el selector de reservas.

// Consulta y representa el catálogo de servicios en el panel administrativo.

// Obtiene las estadísticas de popularidad para el gráfico de servicios.

// Genera las filas de servicios con sus datos y controles de administración.

// Limpia el formulario de servicio y lo deja listo para crear uno nuevo.

// Cambia la sección visible dentro del espacio del cliente.

// Establece la fecha mínima permitida para seleccionar una cita.

// Convierte una hora del servidor al formato legible de 12 horas.

// Clasifica un servicio por su nombre para elegir una ilustración apropiada.

// Genera la ilustración SVG decorativa que acompaña a cada servicio.

// Formatea una fecha del calendario de reservas como año-mes-día.

// Dibuja el calendario mensual y deshabilita las fechas pasadas.

// Muestra los horarios disponibles de acuerdo con la franja del día elegida.

// Presenta el resultado de una reserva en el cuadro de mensajes.

// Abre un diálogo que espera que la persona confirme o cancele una acción.

// Cierra el diálogo de reserva, restaura el foco y resuelve una confirmación pendiente.

// Consulta al servidor los horarios libres para el barbero y la fecha elegidos.

// Atiende el evento de clic en el control #booking-calendar-days.
document.querySelector("#booking-calendar-days").addEventListener("click", event => {
  const button = event.target.closest("[data-booking-date]");
  // Ignora clics fuera de un día válido y las fechas deshabilitadas.
  if (!button || button.disabled) return;
  document.querySelector("#booking-date").value = button.dataset.bookingDate;
  document.querySelector("#booking-time").value = "";
  renderBookingCalendar();
  loadBookingSlots();
});
// Atiende el evento de clic en el control #booking-prev-month.
document.querySelector("#booking-prev-month").addEventListener("click", () => {
  bookingCalendarMonth = new Date(bookingCalendarMonth.getFullYear(), bookingCalendarMonth.getMonth() - 1, 1);
  renderBookingCalendar();
});
// Atiende el evento de clic en el control #booking-next-month.
document.querySelector("#booking-next-month").addEventListener("click", () => {
  bookingCalendarMonth = new Date(bookingCalendarMonth.getFullYear(), bookingCalendarMonth.getMonth() + 1, 1);
  renderBookingCalendar();
});
// Atiende el evento de clic en el control [data-slot-period].
document.querySelectorAll("[data-slot-period]").forEach(button => button.addEventListener("click", () => {
  bookingSlotPeriod = button.dataset.slotPeriod;
  document.querySelectorAll("[data-slot-period]").forEach(period => {
    const selected = period === button;
    period.classList.toggle("active", selected);
    period.setAttribute("aria-pressed", String(selected));
  });
  renderBookingTimes();
}));
// Atiende el evento de clic en el control #booking-times.
document.querySelector("#booking-times").addEventListener("click", event => {
  const button = event.target.closest("[data-booking-time]");
  // Ignora eventos que no provienen de un control delegado valido.
  if (!button) return;
  document.querySelector("#booking-time").value = button.dataset.bookingTime;
  renderBookingTimes();
});
// Atiende el evento de cambio en el control #booking-barber.
document.querySelector("#booking-barber").addEventListener("change", loadBookingSlots);
// Atiende el evento de clic en el control #booking-message-close.
document.querySelector("#booking-message-close").addEventListener("click", closeBookingMessage);
// Atiende el evento de clic en el control #booking-message-confirm.
document.querySelector("#booking-message-confirm").addEventListener("click", () => {
  const resolve = bookingMessageConfirmationResolve;
  bookingMessageConfirmationResolve = null;
  closeBookingMessage();
  // Resuelve la promesa solo si existe una confirmacion pendiente.
  if (resolve) resolve(true);
});
// Atiende el evento de clic en el control #booking-message-backdrop.
document.querySelector("#booking-message-backdrop").addEventListener("click", event => {
  // Cierra el diálogo solo cuando el clic ocurre en el fondo exterior.
  if (event.target === event.currentTarget) closeBookingMessage();
});

// Dibuja las citas recibidas en la tabla correspondiente al usuario actual.

// Filtra las citas administrativas y actualiza sus indicadores y gráficos.

// Devuelve las citas pendientes cuya fecha todavía no ha llegado, ordenadas por hora.

// Muestra una lista breve de las próximas citas en el panel indicado.

// Construye el gráfico circular con la cantidad de citas por estado.

// Genera un gráfico mensual comparando las citas y las cancelaciones.

// Dibuja la cantidad de nuevos clientes para el periodo seleccionado.

// Presenta los servicios más solicitados en un gráfico comparativo.

// Actualiza los gráficos y listas de resumen de citas del administrador.

// Obtiene los reportes y citas necesarios para actualizar el panel principal.

// Convierte una fecha local a una clave estable con formato año-mes-día.

// Filtra y muestra la agenda del barbero para hoy o para la semana actual.

// Carga citas del barbero y calcula sus indicadores de actividad e ingresos.

// Carga el reporte de registros y actualiza el gráfico de nuevos clientes.

// Obtiene las citas y decide si las presenta al administrador o al cliente.

// Carga el historial de citas del cliente y muestra errores si la consulta falla.

// Cancela el modo de reprogramación y restaura el formulario de reserva original.

// Prepara el formulario con los datos de una cita que se desea reprogramar.

// Carga los indicadores y gráficos del módulo de reportes.

// Consulta y dibuja el historial de informes generados.

// Solicita al servidor un nuevo informe y gestiona su descarga.

// Obtiene y muestra el manual en el espacio del cliente o del administrador.

// Carga la información del video y actualiza el reproductor correspondiente.

// Obtiene los registros del tipo actual y actualiza la tabla de personas.

// Carga los servicios disponibles para el catálogo y el formulario de citas.

// Oculta el acceso y presenta la interfaz correspondiente al rol autenticado.

// Oculta los espacios privados y muestra la pantalla de autenticación.

// Abre el formulario de usuarios y carga los datos para crear o editar.

// Cierra el formulario emergente y limpia sus mensajes y estado de edición.

document.querySelectorAll(".nav-item[data-type]").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => {
    currentType = button.dataset.type;
    setAdminModule(null);
  });
});
document.querySelectorAll(".nav-item[data-module]").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => setAdminModule(button.dataset.module));
});
document.querySelectorAll("[data-open-module]").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => setAdminModule(button.dataset.openModule));
});
document.querySelectorAll("[data-client-period]").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => {
    clientRegistrationPeriod = button.dataset.clientPeriod;
    // Redibuja con datos en memoria; si faltan, solicita el reporte.
    if (latestReport) renderClientRegistrationsChart(latestReport, clientRegistrationPeriod);
    // Solicita el reporte si todavía no está disponible en memoria.
    else loadClientRegistrationData();
  });
});
// Atiende el evento de clic en el control #refresh-dashboard.
document.querySelector("#refresh-dashboard").addEventListener("click", loadDashboard);
document.querySelectorAll("[data-annex-tab]").forEach((button, index, buttons) => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => selectAnnexTab(button));
  // Atiende el evento de pulsacion de tecla en cada boton de su grupo.
  button.addEventListener("keydown", event => {
    const nextIndex = event.key === "ArrowRight" ? (index + 1) % buttons.length
      : event.key === "ArrowLeft" ? (index - 1 + buttons.length) % buttons.length
        : event.key === "Home" ? 0
          : event.key === "End" ? buttons.length - 1
            : -1;
    // Ignora teclas que no forman parte de la navegacion accesible.
    if (nextIndex < 0) return;
    event.preventDefault();
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  });
});
document.querySelectorAll(".client-tab").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => setClientTab(button.dataset.clientTab));
});
// Atiende el evento de clic en el control #services-list.
document.querySelector("#services-list").addEventListener("click", event => {
  const button = event.target.closest("[data-book-service]");
  // Ignora eventos que no provienen de un control delegado valido.
  if (!button) return;
  setClientTab("appointments");
  document.querySelector("#booking-service").value = button.dataset.bookService;
});
document.querySelectorAll("[data-add-type]").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => {
    currentType = button.dataset.addType;
    updateSection();
    loadPeople();
    openModal(null);
  });
});
// Atiende el evento de clic en el control #close-modal.
document.querySelector("#close-modal").addEventListener("click", closeModal);
// Atiende el evento de clic en el control #cancel-modal.
document.querySelector("#cancel-modal").addEventListener("click", closeModal);
// Atiende el evento de clic en el fondo del modal.
backdrop.addEventListener("click", event => {
  // Cierra el modal solo si el clic ocurrio en el fondo exterior.
  if (event.target === backdrop) closeModal();
});
// Atiende el evento de pulsacion de tecla en el documento.
document.addEventListener("keydown", event => {
  // Limita el manejador global a la tecla Escape.
  if (event.key !== "Escape") return;
  // Da prioridad al modal de terminos si esta visible.
  if (!document.querySelector("#terms-backdrop").hidden) closeTermsModal();
  // Da prioridad al dialogo de reserva si esta visible.
  else if (!document.querySelector("#booking-message-backdrop").hidden) closeBookingMessage();
  // Cierra el modal de personas si no hay un diálogo de reserva visible.
  else if (!backdrop.hidden) closeModal();
});
// Atiende el evento de entrada de texto en el campo de busqueda.
search.addEventListener("input", render);

// Cambia la pantalla de acceso al formulario para registrar un cliente.

// Regresa desde el registro al formulario para iniciar sesión.

// Bloquea la entrada de caracteres no numéricos en el campo de teléfono del registro.
document.querySelector("#register-phone").addEventListener("input", event => {
  event.target.value = event.target.value.replace(/\D/g, "");
});
// Atiende el evento de clic en el control #show-register.
document.querySelector("#show-register").addEventListener("click", showRegisterForm);
// Atiende el evento de clic en el enlace para abrir los terminos y condiciones.
document.querySelector("#open-terms").addEventListener("click", openTermsModal);
// Atiende el evento de clic en el botón para cerrar el modal de terminos.
document.querySelector("#close-terms").addEventListener("click", closeTermsModal);
// Atiende el evento de clic en el fondo del modal de terminos.
document.querySelector("#terms-backdrop").addEventListener("click", event => {
  if (event.target === event.currentTarget) closeTermsModal();
});
// Atiende el evento de clic en el boton de aceptar terminos dentro del modal.
document.querySelector("#accept-terms-btn").addEventListener("click", acceptTermsFromModal);
document.querySelectorAll("[data-barber-period]").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", () => {
    barberSchedulePeriod = button.dataset.barberPeriod;
    renderBarberSchedule();
  });
});
// Atiende el evento de clic en el control #refresh-barber-dashboard.
document.querySelector("#refresh-barber-dashboard").addEventListener("click", loadBarberDashboard);

// Valida y envía las credenciales de acceso, mostrando el espacio del rol recibido.
// Atiende el evento de envio en el formulario de acceso.
loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const error = document.querySelector("#login-error");
  const button = loginForm.querySelector("button[type='submit']");
  button.disabled = true;
  error.textContent = "";
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    const data = Object.fromEntries(new FormData(loginForm));
    // POST ../backend/controllers/sesion.php; JSON con accion=login y credenciales del formulario. Respuesta: el JSON devuelve usuario/rol para actualizar el espacio o confirmar la accion de sesion.
    const result = await requestSession({ accion: "login", ...data });
    showWorkspace(result.usuario);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Registra una cuenta de cliente y abre su espacio al completar el registro.
// Atiende el evento de envio en el formulario de registro.
registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  const error = document.querySelector("#register-error");
  const button = registerForm.querySelector("button[type='submit']");
  // Valida que el usuario haya aceptado los terminos y condiciones antes de enviar.
  const termsCheckbox = document.querySelector("#accept-terms");
  if (!termsCheckbox.checked) {
    error.textContent = "Debes leer y aceptar los Términos y Condiciones para crear tu cuenta.";
    return;
  }
  button.disabled = true;
  error.textContent = "";
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    const data = Object.fromEntries(new FormData(registerForm));
    data.acepta_terminos = "1";
    // POST ../backend/controllers/sesion.php; JSON con accion=registro y datos del nuevo cliente. Respuesta: el JSON devuelve usuario/rol para actualizar el espacio o confirmar la accion de sesion.
    const result = await requestSession({ accion: "registro", ...data });
    showWorkspace(result.usuario);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Cierra la sesión activa en el servidor y devuelve al usuario al acceso.
document.querySelectorAll("[data-logout]").forEach(button => {
  // Atiende el evento de clic en cada boton de su grupo.
  button.addEventListener("click", async () => {
    button.disabled = true;
    // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
    try {
      // POST ../backend/controllers/sesion.php; JSON con accion=logout. Respuesta: el JSON devuelve usuario/rol para actualizar el espacio o confirmar la accion de sesion.
      await requestSession({ accion: "logout" });
      showLogin();
    // Si la operación falla, muestra o conserva el error según el contexto de la función.
    } catch (error) {
      console.error("No se pudo cerrar la sesión.", error);
      alert(error.message);
    // Restablece el estado transitorio tanto si la operación termina bien como si falla.
    } finally {
      button.disabled = false;
    }
  });
});

// Guarda los datos del cliente o barbero, ya sea como alta o como edición.
// Atiende el evento de envio en el formulario de personas.
form.addEventListener("submit", async event => {
  event.preventDefault();
  const formData = new FormData(form);
  const data = {
    nombre: String(formData.get("nombre")).trim(),
    apellido: String(formData.get("apellido")).trim(),
    email: String(formData.get("email")).trim(),
    telefono: String(formData.get("telefono")).trim()
  };
  // Incluye campos y datos exclusivos del tipo barbero.
  if (currentType === "barberos") {
    data.especialidad = String(formData.get("especialidad")).trim();
    const password = String(formData.get("contrasena"));
    // Omite enviar una contraseña vacía para conservar la credencial existente.
    if (password) data.contrasena = password;
  }
  // Envia el estado activo solo para tipos que lo administran.
  if (currentType !== "clientes") data.activo = String(formData.get("activo"));
  const saveButton = document.querySelector("#save-user");
  const errorMessage = document.querySelector("#form-error");
  saveButton.disabled = true;
  errorMessage.textContent = "";
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // ../backend/controllers/personas.php; POST al crear o PUT al editar; JSON con campos personales, tipo e id opcional en query. Respuesta: registro guardado para actualizar la lista.
    const savedPerson = await requestApi(editingId ? "PUT" : "POST", data, editingId);
    // Aplica la respuesta sobre el registro editado; en alta se agrega una fila nueva.
    if (editingId) {
      people = people.map(person => person.id === editingId ? savedPerson : person);
    // Agrega el nuevo registro cuando el formulario no estaba editando.
    } else {
      people.push(savedPerson);
    }
    render();
    closeModal();
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (error) {
    console.error(`No se pudo guardar el registro en ${types[currentType].plural}.`, error);
    errorMessage.textContent = error.message;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    saveButton.disabled = false;
  }
});

// Atiende las acciones de edición y eliminación de filas de clientes o barberos.
// Atiende el evento de clic en la tabla de personas.
list.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  // Ignora eventos que no provienen de un control delegado valido.
  if (!button) return;
  const person = people.find(item => String(item.id) === button.dataset.id);
  // Evita operar sobre una persona que ya no esta en la lista.
  if (!person) return;
  // Abre edicion; la accion alternativa elimina solo tras confirmar.
  if (button.dataset.action === "edit") {
    openModal(person);
  // Elimina la persona solo si se eligio esa accion y se confirmo el dialogo.
  } else if (button.dataset.action === "delete" && confirm(`¿Seguro que quieres eliminar a ${person.name}?`)) {
    button.disabled = true;
    // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
    try {
      // DELETE ../backend/controllers/personas.php?tipo=currentType&id=person.id; sin cuerpo. El estado HTTP confirma la eliminacion.
      await requestApi("DELETE", undefined, person.id);
      people = people.filter(item => item.id !== person.id);
      render();
    // Si la operación falla, muestra o conserva el error según el contexto de la función.
    } catch (error) {
      console.error(`No se pudo eliminar el registro de ${types[currentType].plural}.`, error);
      alert(error.message);
      button.disabled = false;
    }
  }
});

// Envía una reserva nueva o modifica la fecha y el barbero de una cita existente.
// Atiende el evento de envio en el control #booking-form.
document.querySelector("#booking-form").addEventListener("submit", async event => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const error = document.querySelector("#booking-error");
  const button = formElement.querySelector("button[type='submit']");
  const values = Object.fromEntries(new FormData(formElement));
  const selectedDate = values.fecha;
  const selectedBarber = values.id_barbero;
  const selectedTime = values.hora;
  // Exige servicio en una cita nueva y siempre requiere barbero, fecha y hora.
  if ((!reschedulingAppointmentId && !values.id_servicio) || !selectedBarber || !selectedDate || !selectedTime) {
    showBookingMessage(false, reschedulingAppointmentId
      ? "Selecciona un barbero, una fecha y una hora disponible para reprogramar."
      : "Selecciona un servicio, un barbero, una fecha y una hora disponible para continuar.");
    return;
  }
  values.fecha_hora = `${values.fecha}T${values.hora}`;
  delete values.fecha;
  delete values.hora;
  button.disabled = true;
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    const dateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    // Envia solo barbero y nueva fecha/hora al modificar una cita existente.
    if (reschedulingAppointmentId) {
      // PUT ../backend/controllers/citas.php; JSON con accion, id_barbero y fecha_hora; id de cita en la URL. Respuesta: el estado HTTP confirma el cambio; despues se refresca la agenda.
      await requestJson("../backend/controllers/citas.php", "PUT", {
        accion: "reprogramar",
        id_barbero: selectedBarber,
        fecha_hora: values.fecha_hora
      }, reschedulingAppointmentId);
      resetBookingReschedule();
      showBookingMessage(true, `Tu cita fue reprogramada para el ${dateLabel} a las ${formatBookingTime(selectedTime)}. Conserva el mismo número de cita.`, "Cita reprogramada");
    // Crea una reserva nueva cuando el formulario no esta reprogramando una cita.
    } else {
      // POST ../backend/controllers/citas.php; JSON con los campos del formulario de reserva. Respuesta: el estado HTTP confirma el cambio; despues se refresca la agenda.
      await requestJson("../backend/controllers/citas.php", "POST", values);
      showBookingMessage(true, `Tu cita para el ${dateLabel} a las ${formatBookingTime(selectedTime)} se agendó correctamente.`);
    }
    formElement.reset();
    document.querySelector("#booking-date").value = selectedDate;
    document.querySelector("#booking-barber").value = selectedBarber;
    setBookingMinDate();
    await loadBookingSlots();
    const refreshed = await loadClientAppointments();
    // Detiene el flujo cuando no se pudo actualizar el historial.
    if (!refreshed) {
      return;
    }
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    const message = requestError.message;
    await loadBookingSlots();
    showBookingMessage(false, message, "Cita agendada", reschedulingAppointmentId ? "No se pudo reprogramar" : "No se pudo agendar");
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Atiende el evento de clic en el control #booking-cancel-reschedule.
document.querySelector("#booking-cancel-reschedule").addEventListener("click", () => {
  resetBookingReschedule();
  document.querySelector("#booking-form").reset();
  setBookingMinDate();
  loadBookingSlots();
});

// Permite reprogramar o cancelar una cita desde el historial del cliente.
// Atiende el evento de clic en el control #client-appointments-list.
document.querySelector("#client-appointments-list").addEventListener("click", async event => {
  const button = event.target.closest("[data-client-appointment-action]");
  // Ignora eventos que no provienen de un control delegado valido.
  if (!button) return;
  const appointment = clientAppointments.find(item => String(item.id) === button.dataset.appointmentId);
  // Ignora una accion cuyo id no coincide con una cita cargada.
  if (!appointment) return;
  // Abre la reprogramacion; la otra accion se comprueba como cancelacion.
  if (button.dataset.clientAppointmentAction === "reschedule") {
    await startBookingReschedule(appointment);
    return;
  }
  // Ignora acciones desconocidas en vez de enviarlas al backend.
  if (button.dataset.clientAppointmentAction !== "cancel") return;
  const confirmed = await showBookingConfirmation(
    "¿Cancelar esta cita?",
    `La cita #${appointment.id} se cancelará y el horario quedará disponible para otros clientes.`,
    "Sí, cancelar cita"
  );
  // No envia la cancelación si la persona descarta el diálogo.
  if (!confirmed) return;
  button.disabled = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // PUT ../backend/controllers/citas.php; JSON con accion=cancelar e id de cita en la URL. Respuesta: el estado HTTP confirma el cambio; despues se refresca la agenda.
    await requestJson("../backend/controllers/citas.php", "PUT", { accion: "cancelar" }, appointment.id);
    await loadClientAppointments();
    showBookingMessage(true, `La cita #${appointment.id} fue cancelada correctamente.`, "Cita cancelada");
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    showBookingMessage(false, requestError.message, "Cita agendada", "No se pudo cancelar");
    button.disabled = false;
  }
});

// Guarda en el servidor el nuevo estado elegido para una cita administrativa.
// Atiende el evento de cambio en el control #admin-appointments-list.
document.querySelector("#admin-appointments-list").addEventListener("change", async event => {
  const select = event.target.closest("[data-appointment-id]");
  // Ignora cambios que no proceden de un selector de estado.
  if (!select) return;
  select.disabled = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // PUT ../backend/controllers/citas.php; JSON con estado e id del registro en la URL. Respuesta: el estado HTTP confirma el cambio; despues se refresca la agenda.
    await requestJson("../backend/controllers/citas.php", "PUT", { estado: select.value }, select.dataset.appointmentId);
    await loadAppointments(true);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    alert(requestError.message);
    await loadAppointments(true);
  }
});

// Atiende el evento de entrada de texto en el control #appointment-search.
document.querySelector("#appointment-search").addEventListener("input", renderAdminAppointments);
// Atiende el evento de cambio en el control #appointment-filter.
document.querySelector("#appointment-filter").addEventListener("change", renderAdminAppointments);
// Atiende el evento de clic en el control #refresh-appointments.
document.querySelector("#refresh-appointments").addEventListener("click", () => loadAppointments(true));
// Atiende el evento de clic en el control #refresh-reports.
document.querySelector("#refresh-reports").addEventListener("click", loadReports);
// Atiende el evento de clic en el control #refresh-report-history.
document.querySelector("#refresh-report-history").addEventListener("click", loadReportHistory);
// Atiende el evento de clic en el control #create-report.
document.querySelector("#create-report").addEventListener("click", createReport);
// Atiende el evento de clic en el control #refresh-services.
document.querySelector("#refresh-services").addEventListener("click", loadAdminServices);

// Guarda un servicio nuevo o los cambios realizados sobre uno existente.
// Atiende el evento de envio en el control #service-form.
document.querySelector("#service-form").addEventListener("submit", async event => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const error = document.querySelector("#services-admin-error");
  const button = document.querySelector("#save-service");
  const payload = Object.fromEntries(new FormData(formElement));
  error.hidden = true;
  error.classList.remove("success");
  button.disabled = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // POST al crear o PUT al editar en ../backend/controllers/servicios.php; JSON payload con campos del servicio y, al editar, id en la URL. El estado HTTP confirma; luego se recarga la lista.
    await requestJson("../backend/controllers/servicios.php", editingServiceId ? "PUT" : "POST", payload, editingServiceId || undefined);
    resetServiceForm();
    await loadAdminServices();
    // Conserva el error de la recarga sin reemplazarlo por un mensaje de exito.
    if (!error.hidden) return;
    error.textContent = "Servicio guardado en la base de datos.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.classList.remove("success");
    error.textContent = requestError.message;
    error.hidden = false;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Atiende el evento de clic en el control #cancel-service-edit.
document.querySelector("#cancel-service-edit").addEventListener("click", resetServiceForm);
// Atiende el evento de clic en el control #admin-services-list.
document.querySelector("#admin-services-list").addEventListener("click", async event => {
  const button = event.target.closest("[data-service-action]");
  // Ignora eventos que no provienen de un control delegado valido.
  if (!button) return;
  const service = adminServices.find(item => String(item.id) === button.dataset.serviceId);
  // Evita modificar un servicio ausente del catalogo local.
  if (!service) return;

  // Rellena el formulario al editar; la otra accion cambia disponibilidad.
  if (button.dataset.serviceAction === "edit") {
    editingServiceId = service.id;
    document.querySelector("#service-form-title").textContent = `Editar ${service.nombre}`;
    document.querySelector("#service-name").value = service.nombre;
    document.querySelector("#service-description").value = service.descripcion || "";
    document.querySelector("#service-price").value = service.precio;
    document.querySelector("#service-duration").value = service.duracion;
    document.querySelector("#service-active").value = String(service.activo);
    document.querySelector("#save-service").textContent = "Guardar cambios";
    document.querySelector("#cancel-service-edit").hidden = false;
    document.querySelector("#service-name").focus();
    return;
  }

  button.disabled = true;
  const error = document.querySelector("#services-admin-error");
  error.hidden = true;
  error.classList.remove("success");
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // PUT ../backend/controllers/servicios.php; JSON con nombre, descripcion, precio, duracion y estado invertido; id en la URL. El estado HTTP confirma; luego se recarga la lista.
    await requestJson("../backend/controllers/servicios.php", "PUT", {
      nombre: service.nombre,
      descripcion: service.descripcion || "",
      precio: service.precio,
      duracion: service.duracion,
      activo: Number(service.activo) === 1 ? "0" : "1"
    }, service.id);
    await loadAdminServices();
    // Conserva el error de la recarga sin reemplazarlo por un mensaje de exito.
    if (!error.hidden) return;
    error.classList.remove("success");
    error.textContent = "Disponibilidad del servicio actualizada.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Envía los datos del video al servidor y actualiza la vista previa.
// Atiende el evento de envio en el control #video-form.
document.querySelector("#video-form").addEventListener("submit", async event => {
  event.preventDefault();
  const videoForm = event.currentTarget;
  const error = document.querySelector("#video-admin-error");
  const button = document.querySelector("#save-video");
  error.hidden = true;
  error.classList.remove("success");
  button.disabled = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // POST ../backend/controllers/video.php; FormData del formulario con el archivo y metadatos del video. Respuesta: se valida el JSON y luego se recarga el reproductor.
    const response = await fetch("../backend/controllers/video.php", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(videoForm)
    });
    await readJsonResponse(response);
    videoForm.elements.video.value = "";
    await loadVideo(true);
    // Conserva el error de la recarga sin reemplazarlo por un mensaje de exito.
    if (!error.hidden) return;
    error.textContent = "Video guardado correctamente.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Atiende el evento de clic en el control #delete-video.
document.querySelector("#delete-video").addEventListener("click", async () => {
  // Pide confirmacion antes de eliminar el video; si se cancela, conserva el archivo.
  if (!confirm("¿Seguro que deseas eliminar el video explicativo?")) return;
  const error = document.querySelector("#video-admin-error");
  error.hidden = true;
  error.classList.remove("success");
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // DELETE ../backend/controllers/video.php; sin cuerpo. El estado HTTP confirma la eliminacion y luego se recarga el reproductor.
    await requestJson("../backend/controllers/video.php", "DELETE");
    document.querySelector("#video-form").reset();
    await loadVideo(true);
    error.textContent = "Video eliminado.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
});

// Guarda una incidencia o sugerencia creada desde el panel administrativo.
// Atiende el evento de envio en el control #quality-admin-form.
document.querySelector("#quality-admin-form").addEventListener("submit", async event => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const error = document.querySelector("#quality-admin-error");
  const button = document.querySelector("#quality-save");
  error.hidden = true;
  error.classList.remove("success");
  button.disabled = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // POST ../backend/controllers/calidad.php; JSON formado con los campos del formulario. Respuesta: el estado HTTP confirma el registro y la interfaz muestra el resultado.
    await requestJson("../backend/controllers/calidad.php", "POST", Object.fromEntries(new FormData(formElement)));
    formElement.reset();
    await loadQuality();
    // Conserva el error de la recarga sin reemplazarlo por un mensaje de exito.
    if (!error.hidden) return;
    error.textContent = "El registro de calidad fue guardado.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Atiende el evento de cambio en el control #quality-records-list.
document.querySelector("#quality-records-list").addEventListener("change", async event => {
  const select = event.target.closest("[data-quality-id]");
  // Ignora cambios que no proceden de un selector de estado.
  if (!select) return;
  select.disabled = true;
  const error = document.querySelector("#quality-admin-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // PUT ../backend/controllers/calidad.php; JSON con estado e id del registro en la URL. Respuesta: el estado HTTP confirma el cambio; despues se recargan los registros.
    await requestJson("../backend/controllers/calidad.php", "PUT", { estado: select.value }, select.dataset.qualityId);
    await loadQuality();
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
    select.disabled = false;
  }
});

// Atiende el evento de clic en el control #refresh-quality.
document.querySelector("#refresh-quality").addEventListener("click", loadQuality);

// Guarda en el registro compartido el error o la sugerencia enviados por el cliente.
// Atiende el evento de envio en el control #suggestion-form.
document.querySelector("#suggestion-form").addEventListener("submit", async event => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const error = document.querySelector("#suggestion-error");
  const button = document.querySelector("#suggestion-submit");
  const tipo = document.querySelector("#suggestion-type").value;
  error.hidden = true;
  error.classList.remove("success");
  button.disabled = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // POST ../backend/controllers/calidad.php; JSON formado con los campos del formulario. Respuesta: el estado HTTP confirma el registro y la interfaz muestra el resultado.
    await requestJson("../backend/controllers/calidad.php", "POST", Object.fromEntries(new FormData(formElement)));
    formElement.reset();
    error.textContent = tipo === "error"
      ? "Gracias por reportarlo. El equipo de BARBER X revisará el problema."
      : "Gracias por tu idea. El equipo de BARBER X la recibió para revisión.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  // Restablece el estado transitorio tanto si la operación termina bien como si falla.
  } finally {
    button.disabled = false;
  }
});

// Guarda el contenido actualizado del manual en el servidor.
// Atiende el evento de envio en el control #manual-form.
document.querySelector("#manual-form").addEventListener("submit", async event => {
  event.preventDefault();
  const error = document.querySelector("#manual-admin-error");
  error.hidden = true;
  error.classList.remove("success");
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // PUT ../backend/controllers/manual.php; JSON formado con los campos del formulario. Respuesta: el estado HTTP confirma el cambio del manual.
    await requestJson("../backend/controllers/manual.php", "PUT", Object.fromEntries(new FormData(event.currentTarget)));
    error.textContent = "Manual guardado correctamente.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
});

// Atiende el evento de clic en el control #delete-manual.
document.querySelector("#delete-manual").addEventListener("click", async () => {
  // Pide confirmacion antes de borrar el manual; si se cancela, conserva su contenido.
  if (!confirm("¿Seguro que deseas eliminar el manual? Los clientes dejarán de verlo.")) return;
  const error = document.querySelector("#manual-admin-error");
  error.hidden = true;
  error.classList.remove("success");
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // DELETE ../backend/controllers/manual.php; sin cuerpo. El estado HTTP confirma la eliminacion del manual.
    await requestJson("../backend/controllers/manual.php", "DELETE");
    document.querySelector("#manual-form").reset();
    error.textContent = "Manual eliminado.";
    error.classList.add("success");
    error.hidden = false;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
});

// Verifica si ya existe una sesión activa y abre el espacio correspondiente.
// GET sin data consulta la sesion; POST con data envia JSON al controlador de sesion. La respuesta JSON se valida y se devuelve al modulo.
requestSession().then(result => {
  // Abre el espacio de la sesion o muestra el acceso si no hay usuario.
  if (result.usuario) showWorkspace(result.usuario);
  // Muestra el acceso cuando el servidor no devuelve una sesión activa.
  else showLogin();
}).catch(error => {
  console.error("No se pudo verificar la sesión.", error);
  showLogin("No fue posible conectar con el servidor. Recarga la página e inténtalo de nuevo.");
});
// Lee y valida una respuesta HTTP JSON, convirtiendo errores del servidor en excepciones legibles.
// Entradas: response: objeto Response de fetch.
// Salida: Objeto JSON parseado; lanza Error si el cuerpo no es JSON o el estado HTTP falla.
// Uso: Después de cada solicitud al backend.
async function readJsonResponse(response) {
  const content = await response.text();
  let result;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    result = JSON.parse(content);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch {
    throw new Error(`El servidor respondió con un formato inesperado (HTTP ${response.status}). Revisa la configuración de PHP.`);
  }
  // Convierte una respuesta HTTP fallida en un error con el mensaje del backend.
  if (!response.ok) throw new Error(result.error || "No se pudo completar la solicitud.");
  return result;
}

// Prepara opciones fetch comunes e incluye JSON solo si hay datos.
// Entradas: method: verbo HTTP; data: cuerpo opcional.
// Salida: Opciones para fetch con Accept y Content-Type/cuerpo cuando corresponde.
// Uso: En las solicitudes JSON a la API.
function buildRequestOptions(method, data) {
  const options = { method, headers: { Accept: "application/json" } };
  // Añade cuerpo y Content-Type solo cuando se proporcionaron datos.
  if (data !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }
  return options;
}

// Envía solicitudes de personas al controlador y valida su respuesta.
// Entradas: method, data opcional, id opcional y type por defecto del listado activo.
// Salida: Promesa con JSON devuelto por personas.php.
// Uso: Al consultar, crear, editar o eliminar clientes/barberos.
async function requestApi(method, data, id, type = currentType) {
  const url = new URL("../backend/controllers/personas.php", document.baseURI);
  url.searchParams.set("tipo", type);
  // Agrega el id a la URL solo para operar sobre un registro.
  if (id !== undefined) url.searchParams.set("id", id);
  // Envia method y data a personas.php; el tipo y el id opcional van en la URL. Valida y devuelve el JSON.
  const response = await fetch(url, buildRequestOptions(method, data));
  return readJsonResponse(response);
}

// Envía una solicitud JSON a un endpoint y agrega un identificador opcional.
// Entradas: url, method, data e id opcional.
// Salida: Promesa con JSON devuelto por el endpoint.
// Uso: En los módulos para servicios, citas, calidad, manual, video y reportes.
async function requestJson(url, method = "GET", data, id) {
  const target = new URL(url, document.baseURI);
  // Agrega el id a la URL solo para operar sobre un registro.
  if (id !== undefined) target.searchParams.set("id", id);
  // Envia method, data e id al endpoint recibido; omite el cuerpo si no hay datos. Valida y devuelve el JSON.
  const response = await fetch(target, buildRequestOptions(method, data));
  return readJsonResponse(response);
}

// Consulta el estado de sesión o envia una acción de autenticación.
// Entradas: data opcional; sin datos consulta sesión, con datos envia acción.
// Salida: Promesa con respuesta JSON del controlador de sesión.
// Uso: Al verificar sesión, iniciar/cerrar sesión o registrar cliente.
async function requestSession(data) {
  // GET sin data consulta la sesion; POST con data envia JSON. Valida y devuelve usuario/rol o el resultado de la accion.
  const response = await fetch("../backend/controllers/sesion.php", {
    method: data ? "POST" : "GET",
    headers: { Accept: "application/json", ...(data ? { "Content-Type": "application/json" } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  return readJsonResponse(response);
}

// Codifica caracteres HTML especiales para evitar interpretar datos como marcado.
// Entradas: value: valor a presentar.
// Salida: Cadena escapada.
// Uso: Antes de insertar datos del servidor en HTML generado.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

// Obtiene hasta dos iniciales de un nombre para el avatar.
// Entradas: name: nombre completo.
// Salida: Cadena en mayúsculas con una o dos letras.
// Uso: Al renderizar filas de personas.
function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
}

