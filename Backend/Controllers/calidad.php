<?php
// Capa: controlador PHP que recibe solicitudes HTTP y delega al servicio.
// Importa dependencias necesarias para que esta capa trabaje con servicios, controladores o MySQL.
require_once __DIR__ . "/ApiResponse.php";
require_once __DIR__ . "/../services/calidad.php";

sendApiResponse("handleCalidadService");
