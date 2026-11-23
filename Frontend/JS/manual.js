// Rol: carga de manuales y recursos de consulta del panel de anexos.
// Relación: obtiene el esquema SQL y la documentación/manual desde archivos y el controlador manual; solicita registros de calidad al módulo correspondiente.
// Carga una sola vez el esquema SQL y lo presenta como texto en Anexos.
// Entradas: Ninguna; usa annexSqlLoaded y el panel asociado.
// Salida: Promesa sin valor; actualiza contenido o error.
// Uso: Al abrir por primera vez la pestaña SQL.
async function loadAnnexSql() {
  // Evita volver a descargar el esquema despues de cargarlo correctamente.
  if (annexSqlLoaded) return;
  const error = document.querySelector("#annex-sql-error");
  const content = document.querySelector("#annex-sql-content");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../database/schema.sql; sin cuerpo. Respuesta: el cuerpo de texto se muestra en el panel SQL.
    const response = await fetch("../database/schema.sql");
    // Convierte una respuesta HTTP fallida en un error visible.
    if (!response.ok) throw new Error(`No se pudo cargar schema.sql (HTTP ${response.status}).`);
    content.textContent = await response.text();
    annexSqlLoaded = true;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    content.textContent = "";
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Solicita y muestra una sola vez la documentación técnica en Anexos.
// Entradas: Ninguna; usa annexDocsLoaded y el panel asociado.
// Salida: Promesa sin valor; actualiza texto o error.
// Uso: Al abrir por primera vez la pestaña de documentación.
async function loadAnnexDocs() {
  // Evita volver a descargar la documentación despues de cargarla correctamente.
  if (annexDocsLoaded) return;
  const error = document.querySelector("#annex-docs-error");
  const content = document.querySelector("#annex-docs-content");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/manual.php?recurso=documentacion&inline=1; sin cuerpo; filtros en la URL. Respuesta: el texto se muestra en el panel de documentacion.
    const response = await fetch("../backend/controllers/manual.php?recurso=documentacion&inline=1");
    // Convierte una respuesta HTTP fallida en un error visible.
    if (!response.ok) throw new Error(`No se pudo cargar la documentación técnica (HTTP ${response.status}).`);
    content.textContent = await response.text();
    annexDocsLoaded = true;
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    content.textContent = "";
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

// Activa una pestaña de anexos y carga de forma diferida el recurso requerido.
// Entradas: button: botón de pestaña elegido.
// Salida: Ninguno; actualiza ARIA/paneles y dispara su carga.
// Uso: Al seleccionar una pestaña del módulo Anexos.
function selectAnnexTab(button) {
  document.querySelectorAll("[data-annex-tab]").forEach(tab => {
    const selected = tab === button;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.querySelector(`#${tab.getAttribute("aria-controls")}`).hidden = !selected;
  });
  // Solicita el esquema solo al activar su pestana.
  if (button.dataset.annexTab === "sql") loadAnnexSql();
  // Solicita la documentacion solo al activar su pestana.
  if (button.dataset.annexTab === "docs") loadAnnexDocs();
  // Carga registros de calidad al activar esa pestana.
  if (button.dataset.annexTab === "quality") loadQuality();
}

// Obtiene el manual y lo presenta editable al administrador o legible al cliente.
// Entradas: admin: determina el formulario/panel de destino.
// Salida: Promesa sin valor; actualiza campos/contenido o error.
// Uso: Al abrir el módulo Manual en el espacio correspondiente.
async function loadManual(admin) {
  const error = document.querySelector(admin ? "#manual-admin-error" : "#manual-client-error");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/manual.php; sin cuerpo. Respuesta: el estado HTTP confirma el cambio del manual.
    const manual = await requestJson("../backend/controllers/manual.php");
    // Selecciona el formulario editable o la lectura para clientes.
    if (admin) {
      document.querySelector("#manual-title").value = manual.titulo || "Manual de usuario";
      document.querySelector("#manual-content").value = manual.contenido || "";
    // Presenta el contenido en modo de lectura para el cliente.
    } else {
      document.querySelector("#client-manual-title").textContent = manual.titulo || "Manual de usuario";
      const content = document.querySelector("#client-manual-content");
      const text = document.createElement("div");
      text.className = "manual-text";
      const imageByAnchor = new Map([
        ["Inicio de sesión", ["paso-1.png", "Pantalla para iniciar sesión."]],
        ["5.2 Crear una cuenta de cliente", ["paso-2.png", "Formulario para crear una cuenta de cliente."]],
        ["Espacio del cliente", ["paso-3.png", "Espacio del cliente con los servicios disponibles."]],
        ["Los contadores resumen el total y algunos datos de los registros de la sección seleccionada.", ["paso-4.png", "Panel de administración y lista de clientes."]],
        ["Pulse “Guardar”. Si desea salir sin guardar, pulse “Cancelar” o cierre el formulario.", ["paso-5.png", "Formulario para agregar un barbero."]],
        ["Guarde los cambios y compruebe que la lista se actualice.", ["paso-6.png", "Formulario para editar un cliente."]],
        ["Advertencia: eliminar puede ser una acción irreversible y podría afectar información relacionada. Verifique cuidadosamente el registro antes de continuar.", ["paso-7.png", "Confirmación antes de eliminar un cliente."]]
      ]);
      const lines = (manual.contenido || "").split("\n");
      lines.forEach((line, index) => {
        text.append(document.createTextNode(line));
        // Conserva los saltos de línea originales entre renglones del manual.
        if (index < lines.length - 1) text.append(document.createTextNode("\n"));
        const imageDetails = imageByAnchor.get(line.trim());
        // Omite la imagen cuando la línea no coincide con un ancla ilustrada.
        if (!imageDetails) return;
        const [file, description] = imageDetails;
        const figure = document.createElement("figure");
        figure.className = "manual-figure";
        const image = document.createElement("img");
        image.src = `images/manual/${file}`;
        image.alt = description;
        image.loading = "lazy";
        figure.append(image);
        text.append(figure);
      });
      content.replaceChildren(text);
    }
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

