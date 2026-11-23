<?php
// Capa: servicio PHP con reglas de negocio y acceso a datos.
// Coordina la consulta, edición y eliminación del manual.
function handleManualService(): void
{
// Prepara la respuesta JSON y configura la sesión segura usada por este endpoint.
// Importa dependencias necesarias para que esta capa trabaje con servicios, controladores o MySQL.
require_once __DIR__ . "/calidad_logger.php";
require_once __DIR__ . "/../repositories/ConexionBaseDatos.php";

// Envía el código HTTP y el contenido JSON, y luego detiene el endpoint.
function responderManual(int $estado, array $datos, array $headers = []): void
{
    throw new ApiResponseException($estado, $datos, $headers);
}

// Protege el contenido del manual: solo usuarios con sesión pueden consultarlo.
if (!isset($_SESSION["usuario"])) {
    responderManual(401, ["error" => "Inicia sesión para consultar el manual."]);
}

// Separa lectura pública autenticada y operaciones de escritura exclusivas del admin.
try {
    $conexion = new ConexionBaseDatos();
    $metodo = $_SERVER["REQUEST_METHOD"];
    // Devuelve el manual guardado o un contenido vacío si aún no fue creado.
    if ($metodo === "GET") {
// Consulta o modifica datos de BARBER X en MySQL; los marcadores protegen los parámetros.
        $manual = $conexion->query("SELECT titulo, contenido, actualizado_en FROM manual_usuario WHERE id_manual = 1")->fetch();
        responderManual(200, $manual ?: ["titulo" => "Manual de usuario", "contenido" => "", "actualizado_en" => null]);
    }

    // Valida y guarda los cambios del manual enviados por administración.
    if ($metodo === "PUT") {
// Evalúa el estado de autenticación o sesión del usuario.
        if ($_SESSION["usuario"]["rol"] !== "admin") {
            responderManual(403, ["error" => "Solo el administrador puede editar el manual."]);
        }
// Decodifica el contenido recibido desde el cliente y exige un objeto JSON válido.
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!is_array($datos)) {
            responderManual(400, ["error" => "Los datos enviados no son válidos."]);
        }
// Normaliza o valida datos y archivos antes de aceptar la operación.
        $titulo = trim((string)($datos["titulo"] ?? ""));
        $contenido = trim((string)($datos["contenido"] ?? ""));
        $longitudTitulo = function_exists("mb_strlen") ? mb_strlen($titulo, "UTF-8") : strlen($titulo);
        $longitudContenido = function_exists("mb_strlen") ? mb_strlen($contenido, "UTF-8") : strlen($contenido);
        if ($titulo === "" || $longitudTitulo > 120 || $contenido === "" || $longitudContenido > 100000) {
            responderManual(422, ["error" => "Escribe un título y contenido; el título admite 120 caracteres y el manual 100.000."]);
        }
        $guardar = $conexion->prepare(
            "INSERT INTO manual_usuario (id_manual, titulo, contenido) VALUES (1, :titulo, :contenido)
             ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), contenido = VALUES(contenido)"
        );
        $guardar->execute(["titulo" => $titulo, "contenido" => $contenido]);
        responderManual(200, ["mensaje" => "El manual fue actualizado."]);
    }

    // Elimina el manual publicado cuando lo solicita una cuenta administrativa.
    if ($metodo === "DELETE") {
        if ($_SESSION["usuario"]["rol"] !== "admin") {
            responderManual(403, ["error" => "Solo el administrador puede eliminar el manual."]);
        }
        $conexion->exec("DELETE FROM manual_usuario WHERE id_manual = 1");
        responderManual(200, ["mensaje" => "El manual fue eliminado."]);
    }

    responderManual(405, ["error" => "Método no permitido."], ["Allow" => "GET, PUT, DELETE"]);
} catch (PDOException $error) {
    registrarErrorAplicacion($conexion ?? null, "Gestión del manual", "Error en el manual de BARBER x: " . $error->getMessage());
    responderManual(500, ["error" => "No fue posible gestionar el manual. Verifica la base de datos."]);
}
}
