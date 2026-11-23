// Rol: catálogo público de servicios, ilustraciones y gestión administrativa del catálogo.
// Relación: consulta los controladores de servicios y reportes y comparte estado y utilidades del módulo común.
// Carga los servicios administrativos y sus estadísticas de popularidad.
// Entradas: Ninguna; consulta servicios.php y despues reportes.php.
// Salida: Promesa sin valor; actualiza catálogo o muestra error.
// Uso: Al abrir o refrescar el panel de servicios.
async function loadAdminServices() {
  const error = document.querySelector("#services-admin-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/servicios.php; sin cuerpo. Respuesta: el listado JSON actualiza el catalogo y las opciones de reserva.
    adminServices = await requestJson("../backend/controllers/servicios.php");
    renderAdminServices();
    loadServicePopularity();
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Obtiene el reporte para mostrar los servicios más reservados.
// Entradas: Ninguna; consulta reportes.php.
// Salida: Promesa sin valor; almacena el reporte y dibuja el gráfico o error.
// Uso: Después de cargar el catálogo administrativo.
async function loadServicePopularity() {
  const error = document.querySelector("#services-popularity-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/reportes.php; sin cuerpo. Respuesta: el JSON alimenta metricas y graficos del reporte.
    const report = await requestJson("../backend/controllers/reportes.php");
    latestReport = report;
    renderPopularServices("#services-popularity-chart", report.servicios);
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Dibuja filas administrativas de servicio, estado y acciones disponibles.
// Entradas: Ninguna; usa adminServices.
// Salida: Ninguno; actualiza tabla y estado vacío.
// Uso: Al recibir o modificar servicios.
function renderAdminServices() {
  const body = document.querySelector("#admin-services-list");
  body.innerHTML = adminServices.map(service => `
    <tr>
      <td><strong>${escapeHtml(service.nombre)}</strong></td>
      <td>${escapeHtml(service.descripcion || "Sin descripción")}</td>
      <td>${currency(service.precio)}</td>
      <td>${escapeHtml(service.duracion)} min</td>
      <td><span class="status ${Number(service.activo) === 1 ? "status-completada" : "inactive"}">${Number(service.activo) === 1 ? "Disponible" : "Pausado"}</span></td>
      <td><div class="actions">
        <button class="icon-button" type="button" data-service-action="edit" data-service-id="${escapeHtml(service.id)}" aria-label="Editar ${escapeHtml(service.nombre)}" title="Editar">✎</button>
        <button class="icon-button" type="button" data-service-action="toggle" data-service-id="${escapeHtml(service.id)}" aria-label="${Number(service.activo) === 1 ? "Pausar" : "Activar"} ${escapeHtml(service.nombre)}" title="${Number(service.activo) === 1 ? "Pausar" : "Activar"}">${Number(service.activo) === 1 ? "Ⅱ" : "▶"}</button>
      </div></td>
    </tr>`).join("");
  document.querySelector("#admin-services-empty").hidden = adminServices.length > 0;
}

// Limpia el formulario y restaura los valores iniciales para crear un servicio.
// Entradas: Ninguna; limpia editingServiceId y los campos.
// Salida: Ninguno; formulario listo para alta.
// Uso: Al guardar o cancelar una edición.
function resetServiceForm() {
  editingServiceId = null;
  document.querySelector("#service-form").reset();
  document.querySelector("#service-duration").value = "30";
  document.querySelector("#service-active").value = "1";
  document.querySelector("#service-form-title").textContent = "Agregar servicio";
  document.querySelector("#save-service").textContent = "Guardar servicio";
  document.querySelector("#cancel-service-edit").hidden = true;
}

// Clasifica el nombre del servicio para asignarle categoría e ilustración.
// Entradas: serviceName: nombre del servicio.
// Salida: Clave classic, fade, beard, shave o combo.
// Uso: Al elegir diseño y etiqueta en el catálogo.
function getServiceType(serviceName) {
  const name = String(serviceName || "").toLocaleLowerCase("es");
  // Prioriza la categoría combinada cuando el nombre incluye corte y barba.
  if (name.includes("corte") && name.includes("barba")) return "combo";
  // Reconoce el afeitado por cualquiera de sus nombres habituales.
  if (name.includes("afeitado") || name.includes("navaja")) return "shave";
  // Clasifica barba/perfilado antes de evaluar otras categorias.
  if (name.includes("barba") || name.includes("perfilado")) return "beard";
  // Reconoce degradado por cualquiera de sus nombres habituales.
  if (name.includes("degradado") || name.includes("fade")) return "fade";
  return "classic";
}

// Genera el SVG decorativo accesible correspondiente al servicio.
// Entradas: service: datos del servicio; index: índice que identifica sus recursos SVG.
// Salida: Cadena con el SVG completo.
// Uso: Al renderizar cada tarjeta del catálogo.
function serviceIllustration(service, index) {
  const name = String(service.nombre || "").toLocaleLowerCase("es");
  const id = `service-art-${index}`;
  const type = getServiceType(name);
  const illustrations = {
    classic: {
      label: "Corte clásico con tijeras y peine",
      color: "#b9965c",
      art: `<path d="M123 260c12-48 54-76 118-76s106 28 118 76Z" fill="#22221e"/>
        <path d="M188 110c0-37 23-62 57-62s56 25 56 62v34c0 32-24 55-56 55s-57-23-57-55Z" fill="#c9956b"/>
        <path d="M184 116c-4-46 19-77 61-77 36 0 59 28 56 67-12-7-21-18-27-34-17 19-45 30-86 30l-4 17Z" fill="#171714"/>
        <path d="M200 128h20m33 0h20M218 148c8 5 16 5 24 0" fill="none" stroke="#35271f" stroke-width="3" stroke-linecap="round"/>
        <g class="service-art-tool" fill="none" stroke="#edcf91" stroke-linecap="round" stroke-linejoin="round" stroke-width="4">
          <path d="m349 76 72 69m-8-78-63 81m-8-74 13 12m49 48 13 13"/>
          <circle cx="348" cy="65" r="9"/><circle cx="416" cy="151" r="9"/><circle cx="424" cy="67" r="9"/><circle cx="363" cy="148" r="9"/>
        </g>
        <path d="M347 184h79M358 195h68M369 206h57" stroke="#d7ae63" stroke-opacity=".55" stroke-width="3"/>`
    },
    fade: {
      label: "Corte degradado con máquina",
      color: "#829276",
      art: `<path d="M112 260c11-52 60-80 127-80s114 28 128 80Z" fill="#22221e"/>
        <path d="M186 112c0-38 23-63 58-63s57 25 57 63v33c0 31-24 53-57 53s-58-22-58-53Z" fill="#c9956b"/>
        <path d="M181 118c-2-47 20-78 64-78 37 0 60 29 57 69-11-4-20-12-27-24-14 15-42 25-88 27l-5 12Z" fill="#171714"/>
        <path d="M186 119c4-5 9-9 16-11m-14 19c6-7 13-11 21-13m-19 22c8-8 16-12 25-14" fill="none" stroke="#d6b77f" stroke-opacity=".85" stroke-width="3"/>
        <path d="M201 132h20m33 0h20M220 151c8 5 16 5 24 0" fill="none" stroke="#35271f" stroke-width="3" stroke-linecap="round"/>
        <g class="service-art-tool" transform="rotate(-18 365 138)">
          <rect x="339" y="83" width="54" height="95" rx="12" fill="#d7ae63"/>
          <rect x="348" y="98" width="36" height="35" rx="6" fill="#27251f"/>
          <path d="M350 91v-9m9 9v-9m9 9v-9m9 9v-9" stroke="#edcf91" stroke-width="3" stroke-linecap="round"/>
          <path d="M357 145h18m-18 10h18" stroke="#75613b" stroke-width="3" stroke-linecap="round"/>
        </g>
        <path d="M343 204h81" stroke="#d7ae63" stroke-opacity=".6" stroke-width="3"/>`
    },
    beard: {
      label: "Perfilado de barba con navaja",
      color: "#a77a68",
      art: `<path d="M90 260c15-46 56-66 150-66s136 20 150 66Z" fill="#29221f"/>
        <path d="M174 75h130l-9 86c-4 39-25 62-56 62s-52-23-56-62Z" fill="#c9956b"/>
        <path d="M178 93c17 10 34 15 61 15s44-5 62-15v24c-19 7-39 11-62 11s-43-4-61-11Z" fill="#171714"/>
        <path d="M184 125c18 10 36 14 55 14s38-4 56-14l-7 49c-10 30-27 47-49 50-21-3-39-20-48-50Z" fill="#211a15"/>
        <path d="M212 167c8 6 18 6 27 0m9 0c9 6 19 6 27 0" fill="none" stroke="#d7ae63" stroke-width="3" stroke-linecap="round"/>
        <g class="service-art-tool" transform="rotate(24 366 134)">
          <path d="M354 61h26v105h-26z" fill="#d7ae63"/>
          <path d="m354 61 13-28 13 28" fill="#edcf91"/>
          <path d="M354 165h26v30h-26z" rx="8" fill="#51452e"/>
          <path d="M360 74v78" stroke="#fff0d2" stroke-opacity=".65" stroke-width="3"/>
        </g>
        <path d="M56 207c23-21 45-31 70-34m228 0c27 3 49 13 70 34" fill="none" stroke="#d7ae63" stroke-opacity=".5" stroke-width="2"/>`
    },
    shave: {
      label: "Afeitado clásico con navaja y toalla caliente",
      color: "#a77a68",
      art: `<path d="M101 260c12-48 54-75 139-75s128 27 140 75Z" fill="#26221e"/>
        <path d="M180 64h120v83c0 47-24 76-60 76s-60-29-60-76Z" fill="#c9956b"/>
        <path d="M180 75c20 13 41 19 60 19s40-6 60-19" fill="none" stroke="#171714" stroke-width="13"/>
        <path d="M197 128h18m50 0h18" stroke="#35271f" stroke-width="3" stroke-linecap="round"/>
        <path d="M219 151c12 7 30 7 42 0" fill="none" stroke="#6b3f31" stroke-width="3" stroke-linecap="round"/>
        <path d="M207 166c9 12 20 18 33 18s24-6 33-18" fill="none" stroke="#edcf91" stroke-opacity=".65" stroke-width="2"/>
        <path d="M73 198c36-15 69-14 102 2m130-1c35-17 68-18 102-2" fill="none" stroke="#d7ae63" stroke-opacity=".45" stroke-width="3"/>
        <g class="service-art-tool" transform="rotate(-25 366 134)">
          <path d="M349 58h31l-8 91h-15Z" fill="#edcf91"/>
          <path d="M357 148h16v45h-16Z" rx="6" fill="#685337"/>
          <path d="M365 66v72" stroke="#fff4dd" stroke-width="3"/>
        </g>
        <path d="M339 204h70" stroke="#d7ae63" stroke-opacity=".58" stroke-width="3"/>`
    },
    combo: {
      label: "Corte de cabello y arreglo de barba",
      color: "#9b8d68",
      art: `<path d="M122 260c10-51 55-77 118-77s109 26 118 77Z" fill="#22221e"/>
        <path d="M188 105c0-37 21-62 53-62 35 0 57 25 57 62v34c0 32-24 55-57 55s-53-23-53-55Z" fill="#c9956b"/>
        <path d="M183 115c-4-45 17-77 59-77 38 0 60 28 57 67-13-7-22-17-28-32-16 17-43 28-83 30l-5 12Z" fill="#171714"/>
        <path d="M192 116c5-5 10-9 17-12" fill="none" stroke="#d6b77f" stroke-width="3"/>
        <path d="M201 128h19m32 0h19" stroke="#35271f" stroke-width="3" stroke-linecap="round"/>
        <path d="M194 157c12 8 27 11 47 11s35-3 47-11l-7 27c-10 18-23 28-40 30-17-2-30-12-40-30Z" fill="#211a15"/>
        <path d="M222 177c6 4 14 4 20 0m7 0c6 4 14 4 20 0" fill="none" stroke="#d7ae63" stroke-width="2.5" stroke-linecap="round"/>
        <g class="service-art-tool" transform="rotate(-12 364 135)">
          <rect x="344" y="91" width="40" height="84" rx="9" fill="#d7ae63"/>
          <rect x="351" y="101" width="26" height="31" rx="4" fill="#27251f"/>
          <path d="M351 95v-8m7 8v-8m7 8v-8m7 8v-8" stroke="#edcf91" stroke-width="2.5"/>
          <path d="M352 190h26m-21 9h16" stroke="#edcf91" stroke-width="3" stroke-linecap="round"/>
        </g>
        <path d="M70 215h95m180 0h65" stroke="#d7ae63" stroke-opacity=".5" stroke-width="2"/>`
    }
  };
  const illustration = illustrations[type];
  return `<svg class="service-art service-art-${type}" viewBox="0 0 480 260" role="img" aria-label="${escapeHtml(`${illustration.label}: ${service.nombre}`)}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="${id}-grain" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="3" r=".7" fill="#f3e7d0" opacity=".12"/>
        <circle cx="12" cy="11" r=".6" fill="#f3e7d0" opacity=".08"/>
      </pattern>
      <linearGradient id="${id}-wash" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="${illustration.color}" stop-opacity=".35"/>
        <stop offset="1" stop-color="#11110f" stop-opacity=".08"/>
      </linearGradient>
    </defs>
    <rect width="480" height="260" fill="#171714"/>
    <path d="M0 0h480v260H0z" fill="url(#${id}-wash)"/>
    <path d="M21 25h438v210H21z" fill="none" stroke="#edcf91" stroke-opacity=".16"/>
    <path d="M34 215h412" stroke="#edcf91" stroke-opacity=".13"/>
    ${illustration.art}
    <rect width="480" height="260" fill="url(#${id}-grain)" pointer-events="none"/>
  </svg>`;
}

// Carga servicios disponibles y dibuja opciones de reserva y tarjetas públicas.
// Entradas: Ninguna; consulta servicios.php.
// Salida: Promesa sin valor; actualiza catálogo o presenta error.
// Uso: Al abrir la pestaña de servicios del cliente.
async function loadServices() {
  const errorMessage = document.querySelector("#services-error");
  const servicesList = document.querySelector("#services-list");
  errorMessage.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/servicios.php; sin cuerpo. Respuesta: el listado JSON actualiza el catalogo y las opciones de reserva.
    availableServices = await requestJson("../backend/controllers/servicios.php");
    const services = availableServices;
    document.querySelector("#booking-service").innerHTML = `<option value="">Selecciona un servicio</option>${services.map(service => `<option value="${escapeHtml(service.id)}">${escapeHtml(service.nombre)} · ${currency(service.precio)}</option>`).join("")}`;
    servicesList.innerHTML = services.map((service, index) => `
      <article class="service-card" style="--service-index:${index}">
        <div class="service-visual">
          ${serviceIllustration(service, index)}
          <span class="service-visual-tag">BARBER x · SERVICIO</span>
        </div>
        <div class="service-card-content">
          <div class="service-card-title"><span class="service-icon" aria-hidden="true">✂</span><span class="service-category">${({
            classic: "Corte clásico",
            fade: "Fade / degradado",
            beard: "Barba y perfilado",
            shave: "Afeitado clásico",
            combo: "Corte & barba"
          })[getServiceType(service.nombre)]}</span></div>
          <h3>${escapeHtml(service.nombre)}</h3>
          <p>${escapeHtml(service.descripcion || "Un servicio pensado para que salgas con tu mejor estilo.")}</p>
        <div class="service-meta">
          <strong>${currency(service.precio)}</strong>
          <span>${escapeHtml(service.duracion)} min</span>
        </div>
        <button class="secondary-button service-book" type="button" data-book-service="${escapeHtml(service.id)}">Agendar este servicio</button>
        </div>
      </article>`).join("");
    // Cancela la animación anterior para evitar temporizadores acumulados.
    if (servicesAnimationTimer !== null) window.clearTimeout(servicesAnimationTimer);
    servicesList.classList.remove("services-grid-enter");
    void servicesList.offsetWidth;
    servicesList.classList.add("services-grid-enter");
    servicesAnimationTimer = window.setTimeout(() => {
      servicesList.classList.remove("services-grid-enter");
      servicesAnimationTimer = null;
    }, services.length * 55 + 500);
    document.querySelector("#services-empty").hidden = services.length > 0;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (error) {
    console.error("No se pudieron cargar los servicios de BARBER x.", error);
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
  }
}

