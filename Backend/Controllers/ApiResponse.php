<?php
// Capa: controlador PHP que recibe solicitudes HTTP y delega al servicio.

// Clase ApiResponseException utilizada por BARBER X para organizar esta responsabilidad.
final class ApiResponseException extends RuntimeException
{
// Propiedad interna que conserva estado necesario para esta operación.
    public int $statusCode;
    public array|string $body;
    public array $headers;

// Inicializa la clase y prepara sus conexiones o valores internos.
    public function __construct(int $statusCode, array|string $body, array $headers = [])
    {
        parent::__construct("API response");
        $this->statusCode = $statusCode;
        $this->body = $body;
        $this->headers = $headers;
    }
}

// Ejecuta la acción y convierte sus respuestas controladas a JSON.
function sendApiResponse(callable $action): void
{
    header("Content-Type: application/json; charset=utf-8");
// Gestiona la sesión autenticada y protege la cuenta dentro de BARBER X.
    session_set_cookie_params([
        "httponly" => true,
        "secure" => !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off",
        "samesite" => "Lax",
    ]);
    session_start();

// Encapsula operaciones que pueden fallar para controlar la respuesta y el registro de calidad.
    try {
        $action();
    } catch (ApiResponseException $response) {
        http_response_code($response->statusCode);
// Recorre los elementos necesarios y aplica la misma operación a cada uno.
        foreach ($response->headers as $name => $value) {
            header($name . ": " . $value);
        }

        echo is_array($response->body)
            ? json_encode($response->body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : $response->body;
    }
}
