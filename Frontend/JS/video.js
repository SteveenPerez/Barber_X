// Rol: carga y configuración del reproductor de video explicativo.
// Relación: obtiene los metadatos del controlador de video y actualiza la vista de cliente o administrador.
// Carga metadatos del video y configura reproductor y campos según el rol.
// Entradas: admin: determina la vista administrativa o la del cliente.
// Salida: Promesa sin valor; actualiza título, descripción y fuente o presenta error.
// Uso: Al abrir el módulo Video en cualquiera de los espacios.
async function loadVideo(admin) {
  const error = document.querySelector(admin ? "#video-admin-error" : "#video-client-error");
  const player = document.querySelector(admin ? "#admin-video-player" : "#client-video-player");
  const empty = document.querySelector(admin ? "#admin-video-empty" : "#client-video-empty");
  error.hidden = true;
  // Aísla la operación para que sus errores puedan convertirse en mensajes de interfaz.
  try {
    // GET ../backend/controllers/video.php; sin cuerpo. Respuesta: se valida el JSON y luego se recarga el reproductor.
    const video = await requestJson("../backend/controllers/video.php");
    const title = video.titulo || "Video explicativo";
    document.querySelector(admin ? "#admin-video-title" : "#client-video-title").textContent = title;
    document.querySelector(admin ? "#admin-video-description" : "#client-video-description").textContent = video.descripcion || "";
    // Actualiza campos editables solo en la vista administrativa.
    if (admin) {
      document.querySelector("#video-title").value = video.titulo || "";
      document.querySelector("#video-description").value = video.descripcion || "";
    }
    const available = Boolean(video.video_url);
    player.hidden = !available;
    empty.hidden = available;
    // Configura la fuente si hay video o limpia el reproductor si falta.
    if (available) {
      const source = new URL(`../${video.video_url}`, document.baseURI).href;
      // Evita reiniciar el reproductor si su URL no cambió.
      if (player.src !== source) {
        player.src = source;
        player.load();
      }
    // Detiene el reproductor y elimina una fuente que ya no existe.
    } else {
      player.pause();
      player.removeAttribute("src");
      player.load();
    }
  // Si la operación falla, muestra o conserva el error según el contexto de la función.
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  }
}

