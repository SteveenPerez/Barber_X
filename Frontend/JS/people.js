// Rol: presentación y edición de clientes y barberos en la administración.
// Relación: usa el controlador de personas y comparte la configuración, estado, formularios y funciones HTTP del módulo común.
// Genera las columnas adecuadas para la lista de clientes o barberos.
// Entradas: Ninguna; consulta currentType.
// Salida: Ninguno; actualiza el encabezado de la tabla.
// Uso: Al cambiar de sección o tipo de persona.
function renderHeaders() {
  const columns = ["Nombre y correo", "Teléfono"];
  // Incluye las columnas especificas de barberos.
  if (currentType === "barberos") columns.push("Especialidad");
  // Muestra estado solo para tipos que lo administran.
  if (currentType !== "clientes") columns.push("Estado");
  // Incluye las columnas especificas de barberos.
  if (currentType === "barberos") columns.push("Acceso");
  columns.push("Acciones");
  tableHead.innerHTML = `<tr>${columns.map(column => `<th>${column}</th>`).join("")}</tr>`;
}

// Filtra y dibuja personas con sus datos y actualiza contadores.
// Entradas: Ninguna; usa people, currentType y el texto de búsqueda.
// Salida: Ninguno; actualiza tabla, estado vacío y estadísticas.
// Uso: Al cargar datos o escribir en el filtro.
function render() {
  const query = search.value.trim().toLocaleLowerCase("es");
  const visiblePeople = people.filter(person =>
    `${person.name} ${person.email}`.toLocaleLowerCase("es").includes(query)
  );
  list.innerHTML = visiblePeople.map(person => `
    <tr>
      <td><div class="user-cell"><div class="avatar user-avatar">${escapeHtml(initials(person.name))}</div><div class="user-details"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.email)}</span></div></div></td>
      <td>${escapeHtml(person.phone || "—")}</td>
      ${currentType === "barberos" ? `<td>${escapeHtml(person.especialidad || "—")}</td>` : ""}
      ${currentType !== "clientes" ? `<td><span class="status ${person.status === "inactive" ? "inactive" : ""}">${person.status === "inactive" ? "Inactivo" : "Activo"}</span></td>` : ""}
      ${currentType === "barberos" ? `<td><span class="status ${person.tiene_cuenta ? "" : "inactive"}">${person.tiene_cuenta ? "Habilitado" : "Sin cuenta"}</span></td>` : ""}
      <td><div class="actions">
        <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(person.id)}" aria-label="Editar a ${escapeHtml(person.name)}" title="Editar">✎</button>
        <button class="icon-button delete" type="button" data-action="delete" data-id="${escapeHtml(person.id)}" aria-label="Eliminar a ${escapeHtml(person.name)}" title="Eliminar">⌫</button>
      </div></td>
    </tr>`).join("");
  const config = types[currentType];
  const activeCount = people.filter(person => person.status === "active").length;
  document.querySelector("#empty-state").hidden = visiblePeople.length > 0;
  document.querySelector("#result-count").textContent = `${visiblePeople.length} ${visiblePeople.length === 1 ? config.singular : config.plural}`;
  document.querySelector("#total-count").textContent = people.length;
  document.querySelector("#active-count").textContent = currentType === "clientes" ? people.filter(person => person.email).length : activeCount;
  document.querySelector("#extra-count").textContent = currentType === "clientes"
    ? people.filter(person => person.phone).length
    : currentType === "barberos"
      ? people.filter(person => person.especialidad).length
      : people.filter(person => person.status === "inactive").length;
}

// Actualiza títulos, etiquetas, navegación y controles según el tipo activo.
// Entradas: Ninguna; consulta currentType y types.
// Salida: Ninguno; prepara el panel de clientes o barberos.
// Uso: Al navegar o iniciar un alta.
function updateSection() {
  const config = types[currentType];
  document.querySelector("#breadcrumb-title").textContent = config.title;
  document.querySelector("#page-title").textContent = config.title;
  document.querySelector("#page-subtitle").textContent = config.description;
  document.querySelector("#list-title").textContent = `Lista de ${config.plural}`;
  document.querySelector("#footer-category").textContent = config.title;
  document.querySelector("#total-label").textContent = `${config.title} registrados`;
  document.querySelector("#active-label").textContent = currentType === "clientes" ? "Con correo" : "Activos";
  document.querySelector("#extra-label").textContent = currentType === "clientes"
    ? "Con teléfono"
    : currentType === "barberos" ? "Con especialidad" : "Inactivos";
  search.setAttribute("aria-label", `Buscar ${config.plural}`);
  search.placeholder = `Buscar ${config.singular} por nombre o correo...`;
  // Conecta los controles de navegación, filtros, pestañas y accesos rápidos.
  document.querySelectorAll(".nav-item[data-type]").forEach(button => {
    const selected = button.dataset.type === currentType;
    button.classList.toggle("active", selected);
    // Sincroniza aria-current con la sección que está activa.
    if (selected) button.setAttribute("aria-current", "page");
    // Retira aria-current de los elementos que no están activos.
    else button.removeAttribute("aria-current");
  });
  document.querySelector(".add-actions").hidden = currentType !== "barberos";
  document.querySelector("#client-registrations-card").hidden = currentType !== "clientes";
  renderHeaders();
}

// Obtiene personas desde el backend y actualiza la tabla y estadísticas de clientes.
// Entradas: Ninguna; requestApi usa currentType.
// Salida: Promesa sin valor; guarda datos o presenta el error de conexión.
// Uso: Al entrar a clientes/barberos o guardar/eliminar registros.
async function loadPeople() {
  const errorMessage = document.querySelector("#api-error");
  errorMessage.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/personas.php?tipo=currentType; sin cuerpo. Respuesta: el JSON contiene el listado o registro aplicado a la tabla.
    people = await requestApi("GET");
    render();
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (error) {
    console.error(`No se pudieron cargar ${types[currentType].plural} desde MySQL.`, error);
    errorMessage.textContent = `${error.message} Abre este sitio desde XAMPP (http://localhost/), no directamente como archivo.`;
    errorMessage.hidden = false;
    people = [];
    render();
  }
  // Usa el indicador y conteo especificos de clientes.
  if (currentType === "clientes") await loadClientRegistrationData();
}

// Prepara y muestra el formulario para crear o editar una persona.
// Entradas: person opcional: registro a editar; si falta, inicia alta.
// Salida: Ninguno; rellena campos y ajusta requisitos por rol/registro.
// Uso: Al pulsar Agregar o Editar.
function openModal(person) {
  editingId = person ? person.id : null;
  const config = types[currentType];
  form.reset();
  document.querySelector("#modal-title").textContent = person
    ? `Editar ${config.singular}`
    : currentType === "clientes" ? "Crear cliente" : `Agregar ${config.singular}`;
  document.querySelector("#modal-description").textContent = `Completa los datos del ${config.singular}.`;
  document.querySelector("#save-user").textContent = person ? "Guardar cambios" : "Guardar";
  document.querySelector("#form-error").textContent = "";
  const specialtyField = document.querySelector("#specialty-field");
  const barberPasswordField = document.querySelector("#barber-password-field");
  const barberPasswordInput = form.elements.contrasena;
  const statusField = document.querySelector("#status-field");
  specialtyField.hidden = currentType !== "barberos";
  form.elements.especialidad.required = currentType === "barberos";
  barberPasswordField.hidden = currentType !== "barberos";
  barberPasswordInput.required = currentType === "barberos" && (!person || !person.tiene_cuenta);
  barberPasswordField.querySelector("label").textContent = person && person.tiene_cuenta
    ? "Nueva contraseña (opcional; mínimo 8 caracteres)"
    : "Contraseña de acceso (mínimo 8 caracteres)";
  document.querySelector("#barber-password-hint").textContent = person && person.tiene_cuenta
    ? "Cuenta habilitada. Por seguridad, la contraseña no se muestra. Déjalo vacío para conservarla o escribe una nueva para reemplazarla."
    : "Este barbero aún no tiene cuenta. Define una contraseña de al menos 8 caracteres para habilitar su acceso.";
  statusField.hidden = currentType === "clientes";
  form.elements.activo.disabled = currentType === "clientes";
  // Rellena campos solo al editar un registro existente.
  if (person) {
    form.elements.nombre.value = person.nombre;
    form.elements.apellido.value = person.apellido;
    form.elements.email.value = person.email;
    form.elements.telefono.value = person.phone || "";
    form.elements.especialidad.value = person.especialidad || "";
    form.elements.activo.value = person.status === "inactive" ? "0" : "1";
  }
  backdrop.hidden = false;
  form.elements.nombre.focus();
}

// Oculta el formulario modal y limpia el identificador de edición.
// Entradas: Ninguna.
// Salida: Ninguno; deja el formulario fuera de edición.
// Uso: Al guardar, cancelar o cerrar el modal.
function closeModal() {
  backdrop.hidden = true;
  editingId = null;
}

