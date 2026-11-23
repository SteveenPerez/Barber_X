<?php
// Capa: servicio PHP con reglas de negocio y acceso a datos.
// Controlador del servicio que conecta GET, autorización y consulta de barberos.
function handleBarberosService(): void
{
// Configura respuestas JSON y una cookie de sesión protegida para este endpoint.
// Importa dependencias necesarias para que esta capa trabaje con servicios, controladores o MySQL.
require_once __DIR__ . "/../repositories/ConexionBaseDatos.php";
require_once __DIR__ . "/calidad_logger.php";

// Envía una respuesta JSON con el estado HTTP indicado y termina la ejecución.
function responderBarberos(int $estado, array $datos, array $headers = []): void
{
    throw new ApiResponseException($estado, $datos, $headers);
}

// Solo personas con una sesión iniciada pueden consultar barberos disponibles.
if (!isset($_SESSION["usuario"])) {
    responderBarberos(401, ["error" => "Inicia sesión para consultar los barberos."]);
}
// Este endpoint únicamente ofrece lectura de barberos activos.
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responderBarberos(405, ["error" => "Método no permitido."], ["Allow" => "GET"]);
}

// Consulta en MySQL los barberos activos y registra los errores de base de datos.
try {
    $conexion = new ConexionBaseDatos();
// Consulta o modifica datos de BARBER X en MySQL; los marcadores protegen los parámetros.
    $barberos = $conexion->query(
        "SELECT id_barbero AS id, nombre, apellido, especialidad
         FROM barbero
         WHERE activo = 1
         ORDER BY nombre, apellido"
    );
    responderBarberos(200, $barberos->fetchAll());
} catch (PDOException $error) {
    registrarErrorAplicacion($conexion ?? null, "Consulta de barberos", "Error al consultar barberos disponibles en BARBER x: " . $error->getMessage());
    responderBarberos(500, ["error" => "No fue posible cargar los barberos disponibles."]);
}
}
