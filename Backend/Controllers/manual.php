<?php
// Capa: controlador PHP que recibe solicitudes HTTP y delega al servicio.
// Importa dependencias necesarias para que esta capa trabaje con servicios, controladores o MySQL.
require_once __DIR__ . "/ApiResponse.php";
require_once __DIR__ . "/../services/manual.php";

// Evalúa el estado de autenticación o sesión del usuario.
if (isset($_GET["recurso"])) {
    $documentos = [
        "srs" => [
            "ruta" => dirname(__DIR__, 2) . "/docs/documentos/SRS_Barber_X.docx",
            "tipo" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "nombre" => "SRS_Barber_X.docx",
        ],
        "pac" => [
            "ruta" => dirname(__DIR__, 2) . "/docs/documentos/PAC.docx",
            "tipo" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "nombre" => "PAC.docx",
        ],
        "diagrama" => [
            "ruta" => dirname(__DIR__, 2) . "/docs/documentos/modelo_entidad_relacion.svg",
            "tipo" => "image/svg+xml",
            "nombre" => "modelo_entidad_relacion.svg",
        ],
        "documentacion" => [
            "ruta" => dirname(__DIR__, 2) . "/docs/documentos/DOCUMENTACION_TECNICA.md",
            "tipo" => "text/markdown; charset=utf-8",
            "nombre" => "DOCUMENTACION_TECNICA.md",
        ],
    ];
    $recurso = $documentos[(string)$_GET["recurso"]] ?? null;
// Normaliza o valida datos y archivos antes de aceptar la operación.
    if ($recurso === null || !is_file($recurso["ruta"]) || !is_readable($recurso["ruta"])) {
        http_response_code(404);
        exit;
    }

    $inline = filter_var($_GET["inline"] ?? false, FILTER_VALIDATE_BOOLEAN);
    header("Content-Type: " . $recurso["tipo"]);
    header("Content-Disposition: " . ($inline ? "inline" : "attachment") . '; filename="' . $recurso["nombre"] . '"');
    header("X-Content-Type-Options: nosniff");
    readfile($recurso["ruta"]);
    exit;
}

sendApiResponse("handleManualService");
