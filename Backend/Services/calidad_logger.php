<?php
// Capa: servicio PHP con reglas de negocio y acceso a datos.
// Importa dependencias necesarias para que esta capa trabaje con servicios, controladores o MySQL.
require_once __DIR__ . "/../repositories/ConexionBaseDatos.php";

// Oculta credenciales comunes y limita la longitud antes de guardar detalles técnicos.
function sanitizarDetalleCalidad(string $detalle): string
{
    $detalle = preg_replace(
        '/\b(password|contrasena|token|authorization|cookie)\b\s*[:=]\s*(?:(?:bearer|basic)\s+)?("[^"]*"|\'[^\']*\'|[^\s,;]+)/i',
        '$1=[oculto]',
        $detalle
    ) ?? $detalle;
    return function_exists("mb_substr")
        ? mb_substr($detalle, 0, 10000, "UTF-8")
        : substr($detalle, 0, 10000);
}

// Registra un error tanto en el historial de calidad como en el log estándar de PHP.
function registrarErrorAplicacion(?ConexionBaseDatos $conexion, string $titulo, string $mensaje): void
{
    // Guarda el evento en MySQL cuando hay una conexión disponible.
    if ($conexion instanceof ConexionBaseDatos) {
// Encapsula operaciones que pueden fallar para controlar la respuesta y el registro de calidad.
        try {
            $conexion->recordQualityError(
                function_exists("mb_substr")
                    ? mb_substr($titulo, 0, 120, "UTF-8")
                    : substr($titulo, 0, 120),
                sanitizarDetalleCalidad($mensaje)
            );
        } catch (PDOException $error) {
            error_log("No se pudo guardar el error de BARBER X en el registro de calidad: " . $error->getMessage());
        }
    }

    error_log($mensaje);
}
