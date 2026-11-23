<?php
// Capa: servicio PHP con reglas de negocio y acceso a datos.
// Autoriza y coordina la administración de clientes y barberos.
function handlePersonasService(): void
{
// Configura el endpoint JSON y la sesión que autoriza la administración.
// Importa dependencias necesarias para que esta capa trabaje con servicios, controladores o MySQL.
require_once __DIR__ . "/calidad_logger.php";
require_once __DIR__ . "/../repositories/ConexionBaseDatos.php";

// Rechaza de inmediato las operaciones de gestión que no realiza un administrador.
if (!isset($_SESSION["usuario"]) || $_SESSION["usuario"]["rol"] !== "admin") {
    throw new ApiResponseException(403, ["error" => "Debes iniciar sesión como administrador para administrar estos registros."]);
}

// Devuelve un resultado JSON con el código HTTP y detiene el endpoint.
function responder(int $estado, array $datos, array $headers = []): void
{
    throw new ApiResponseException($estado, $datos, $headers);
}

// Convierte el cuerpo JSON de la solicitud en datos utilizables por PHP.
function leerEntrada(): array
{
// Decodifica el contenido recibido desde el cliente y exige un objeto JSON válido.
    $entrada = json_decode(file_get_contents("php://input"), true);
// Evalúa el estado de autenticación o sesión del usuario.
    if (!is_array($entrada)) {
        responder(400, ["error" => "La solicitud no contiene datos JSON válidos."]);
    }
    return $entrada;
}

// Cuenta caracteres respetando UTF-8 cuando la extensión correspondiente está instalada.
function longitud(string $valor): int
{
// Normaliza o valida datos y archivos antes de aceptar la operación.
    return function_exists("mb_strlen") ? mb_strlen($valor, "UTF-8") : strlen($valor);
}

// Exige una clave válida cuando se habilita el acceso a una cuenta de barbero.
function validarContrasenaBarbero(string $contrasena, bool $requerida): void
{
    if ($requerida && $contrasena === "") {
        responder(422, ["error" => "Define una contraseña para la cuenta del barbero."]);
    }
    if ($contrasena !== "" && strlen($contrasena) < 8) {
        responder(422, ["error" => "La contraseña del barbero debe tener al menos 8 caracteres."]);
    }
}

// Evita que clientes y barberos compartan el mismo correo electrónico.
function validarCorreoOtraCategoria(ConexionBaseDatos $conexion, string $email, string $tipo): void
{
    if (!in_array($tipo, ["clientes", "barberos"], true)) {
        return;
    }

    $tabla = $tipo === "clientes" ? "barbero" : "cliente";
// Consulta o modifica datos de BARBER X en MySQL; los marcadores protegen los parámetros.
    $consulta = $conexion->prepare("SELECT 1 FROM $tabla WHERE email = :email LIMIT 1");
    $consulta->execute(["email" => $email]);
    if ($consulta->fetch()) {
        responder(409, ["error" => "Ese correo ya está registrado en la otra categoría de cuentas."]);
    }
}

// Normaliza y valida los campos personales recibidos antes de escribir en MySQL.
function validarPersona(array $entrada, string $tipo): array
{
    $persona = [
        "nombre" => trim((string)($entrada["nombre"] ?? "")),
        "apellido" => trim((string)($entrada["apellido"] ?? "")),
        "telefono" => trim((string)($entrada["telefono"] ?? "")),
        "email" => trim((string)($entrada["email"] ?? "")),
        "especialidad" => trim((string)($entrada["especialidad"] ?? "")),
        "activo" => (string)($entrada["activo"] ?? "1"),
    ];

    if ($persona["nombre"] === "" || $persona["apellido"] === "" || $persona["telefono"] === "" || $persona["email"] === "") {
        responder(422, ["error" => "Completa nombre, apellido, teléfono y correo electrónico."]);
    }
    if (!filter_var($persona["email"], FILTER_VALIDATE_EMAIL)) {
        responder(422, ["error" => "Escribe un correo electrónico válido."]);
    }
    $limites = ["nombre" => 50, "apellido" => 50, "telefono" => 20, "email" => 100];
// Recorre los elementos necesarios y aplica la misma operación a cada uno.
    foreach ($limites as $campo => $limite) {
        if (longitud($persona[$campo]) > $limite) {
            responder(422, ["error" => "El campo $campo supera el máximo de $limite caracteres."]);
        }
    }
    if ($tipo === "barberos" && ($persona["especialidad"] === "" || longitud($persona["especialidad"]) > 100)) {
        responder(422, ["error" => "Indica una especialidad de hasta 100 caracteres para el barbero."]);
    }
    if (!in_array($persona["activo"], ["0", "1"], true)) {
        responder(422, ["error" => "El estado seleccionado no es válido."]);
    }

    return $persona;
}

// Adapta una fila de base de datos al formato que espera la interfaz JavaScript.
function formatoPersona(array $persona, string $tipo): array
{
    $resultado = [
        "id" => (int)$persona["id"],
        "nombre" => $persona["nombre"],
        "apellido" => $persona["apellido"],
        "name" => trim($persona["nombre"] . " " . $persona["apellido"]),
        "email" => $persona["email"],
        "phone" => $persona["telefono"],
        "type" => $tipo,
    ];
    if ($tipo !== "clientes") {
        $resultado["status"] = (int)$persona["activo"] === 1 ? "active" : "inactive";
    }
    if ($tipo === "barberos") {
        $resultado["especialidad"] = $persona["especialidad"];
        $resultado["tiene_cuenta"] = (bool)($persona["tiene_cuenta"] ?? false);
    }
    return $resultado;
}

// Selecciona la tabla y los campos autorizados para el tipo de persona solicitado.
try {
    $conexion = new ConexionBaseDatos();

    $tipos = [
        "clientes" => [
            "tabla" => "cliente",
            "id" => "id_clte",
            "campos" => "nombre, apellido, telefono, email",
        ],
        "barberos" => [
            "tabla" => "barbero",
            "id" => "id_barbero",
            "campos" => "nombre, apellido, telefono, email, especialidad, activo",
        ],
    ];
    $tipo = $_GET["tipo"] ?? "";
    if (!isset($tipos[$tipo])) {
        responder(400, ["error" => "Selecciona una categoría válida: clientes o barberos."]);
    }

    $config = $tipos[$tipo];
    $tabla = $config["tabla"];
    $idCampo = $config["id"];
    $metodo = $_SERVER["REQUEST_METHOD"];

    if ($metodo === "GET") {
        if ($tipo === "barberos") {
            $sql = "SELECT b.id_barbero AS id, b.nombre, b.apellido, b.telefono, b.email,
                           b.especialidad, b.activo,
                           EXISTS (
                               SELECT 1 FROM cuenta_barbero cb
                               WHERE cb.id_barbero = b.id_barbero AND cb.autorizada_por_admin = 1
                           ) AS tiene_cuenta
                    FROM barbero b";
        } else {
            $sql = "SELECT $idCampo AS id, {$config["campos"]} FROM $tabla";
        }
        $consulta = $conexion->query($sql . " ORDER BY $idCampo DESC");
        responder(200, array_map(
            fn(array $persona): array => formatoPersona($persona, $tipo),
            $consulta->fetchAll()
        ));
    }

    if ($metodo === "POST") {
        $entrada = leerEntrada();
        $persona = validarPersona($entrada, $tipo);
        $contrasenaBarbero = $tipo === "barberos" ? (string)($entrada["contrasena"] ?? "") : "";
        if ($tipo === "barberos") {
            validarContrasenaBarbero($contrasenaBarbero, true);
        }
        $emailCheck = $conexion->prepare("SELECT $idCampo FROM $tabla WHERE email = :email LIMIT 1");
        $emailCheck->execute(["email" => $persona["email"]]);
        if ($emailCheck->fetch()) {
            responder(409, ["error" => "Ya existe un registro con ese correo en esta categoría."]);
        }
        validarCorreoOtraCategoria($conexion, $persona["email"], $tipo);

        if ($tipo === "barberos") {
// Coordina una transacción MySQL para evitar cambios parciales en BARBER X.
            $conexion->beginTransaction();
        }
        $parametros = [
            "nombre" => $persona["nombre"],
            "apellido" => $persona["apellido"],
            "telefono" => $persona["telefono"],
            "email" => $persona["email"],
        ];
        if ($tipo === "clientes") {
            $consulta = $conexion->prepare(
                "INSERT INTO cliente (nombre, apellido, telefono, email)
                 VALUES (:nombre, :apellido, :telefono, :email)"
            );
        } else {
            $consulta = $conexion->prepare(
                "INSERT INTO barbero (nombre, apellido, telefono, email, especialidad, activo)
                 VALUES (:nombre, :apellido, :telefono, :email, :especialidad, :activo)"
            );
            $parametros["especialidad"] = $persona["especialidad"];
            $parametros["activo"] = $persona["activo"];
        }
        $consulta->execute($parametros);
        $persona["id"] = (int)$conexion->lastInsertId();
        if ($tipo === "barberos") {
            $crearCuenta = $conexion->prepare(
// Maneja o verifica contraseñas con funciones criptográficas seguras de PHP.
                "INSERT INTO cuenta_barbero (id_barbero, password_hash, autorizada_por_admin)
                 VALUES (:id, :password_hash, 1)"
            );
            $crearCuenta->execute([
                "id" => $persona["id"],
                "password_hash" => password_hash($contrasenaBarbero, PASSWORD_DEFAULT),
            ]);
            $persona["tiene_cuenta"] = true;
            $conexion->commit();
        }
        responder(201, formatoPersona($persona, $tipo));
    }

    $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        responder(400, ["error" => "El identificador no es válido."]);
    }

    if ($metodo === "PUT") {
        $entrada = leerEntrada();
        $persona = validarPersona($entrada, $tipo);
        $contrasenaBarbero = $tipo === "barberos" ? (string)($entrada["contrasena"] ?? "") : "";
        if ($tipo === "barberos") {
            validarContrasenaBarbero($contrasenaBarbero, false);
            $cuenta = $conexion->prepare(
                "SELECT 1 FROM cuenta_barbero
                 WHERE id_barbero = :id AND autorizada_por_admin = 1"
            );
            $cuenta->execute(["id" => $id]);
            validarContrasenaBarbero($contrasenaBarbero, !$cuenta->fetch());
        }
        $emailCheck = $conexion->prepare(
            "SELECT $idCampo FROM $tabla WHERE email = :email AND $idCampo <> :id LIMIT 1"
        );
        $emailCheck->execute(["email" => $persona["email"], "id" => $id]);
        if ($emailCheck->fetch()) {
            responder(409, ["error" => "Ya existe otro registro con ese correo en esta categoría."]);
        }
        validarCorreoOtraCategoria($conexion, $persona["email"], $tipo);

        if ($tipo === "barberos") {
            $conexion->beginTransaction();
        }
        $parametros = [
            "nombre" => $persona["nombre"],
            "apellido" => $persona["apellido"],
            "telefono" => $persona["telefono"],
            "email" => $persona["email"],
        ];
        if ($tipo === "clientes") {
            $consulta = $conexion->prepare(
                "UPDATE cliente SET nombre = :nombre, apellido = :apellido, telefono = :telefono, email = :email
                 WHERE id_clte = :id"
            );
        } else {
            $consulta = $conexion->prepare(
                "UPDATE barbero
                 SET nombre = :nombre, apellido = :apellido, telefono = :telefono, email = :email,
                     especialidad = :especialidad, activo = :activo
                 WHERE id_barbero = :id"
            );
            $parametros["especialidad"] = $persona["especialidad"];
            $parametros["activo"] = $persona["activo"];
        }
        $consulta->execute($parametros + ["id" => $id]);
        if ($consulta->rowCount() === 0) {
            $verificar = $conexion->prepare("SELECT $idCampo FROM $tabla WHERE $idCampo = :id");
            $verificar->execute(["id" => $id]);
            if (!$verificar->fetch()) {
                if ($tipo === "barberos") {
                    $conexion->rollBack();
                }
                responder(404, ["error" => "No se encontró el registro que deseas editar."]);
            }
        }
        if ($tipo === "barberos" && $contrasenaBarbero !== "") {
            $actualizarCuenta = $conexion->prepare(
                "INSERT INTO cuenta_barbero (id_barbero, password_hash, autorizada_por_admin)
                 VALUES (:id, :password_hash, 1)
                 ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), autorizada_por_admin = 1"
            );
            $actualizarCuenta->execute([
                "id" => $id,
                "password_hash" => password_hash($contrasenaBarbero, PASSWORD_DEFAULT),
            ]);
            $persona["tiene_cuenta"] = true;
        } elseif ($tipo === "barberos") {
            $persona["tiene_cuenta"] = true;
        }
        if ($tipo === "barberos") {
            $conexion->commit();
        }
        $persona["id"] = $id;
        responder(200, formatoPersona($persona, $tipo));
    }

    if ($metodo === "DELETE") {
        $consulta = $conexion->prepare("DELETE FROM $tabla WHERE $idCampo = :id");
        $consulta->execute(["id" => $id]);
        if ($consulta->rowCount() === 0) {
            responder(404, ["error" => "No se encontró el registro que deseas eliminar."]);
        }
        responder(200, ["mensaje" => "Registro eliminado correctamente."]);
    }

    responder(405, ["error" => "Método no permitido."], ["Allow" => "GET, POST, PUT, DELETE"]);
} catch (PDOException $error) {
    if (isset($conexion) && $conexion->inTransaction()) {
        $conexion->rollBack();
    }
    if ($error->getCode() === "23000") {
        responder(409, ["error" => "No se pudo guardar el registro porque ya existe información duplicada o relacionada."]);
    }
    registrarErrorAplicacion($conexion ?? null, "Gestión de personas", "Error de base de datos en la API de personas: " . $error->getMessage());
    responder(500, ["error" => "No fue posible completar la operación. Verifica las tablas y la conexión con MySQL."]);
} catch (Throwable $error) {
    registrarErrorAplicacion($conexion ?? null, "Error de servidor en personas", "Error en la API de personas: " . $error->getMessage());
    responder(500, ["error" => "Ocurrió un error en el servidor al procesar la solicitud."]);
}
}
