<?php
// Capa: repositorio PHP que encapsula PDO y las sentencias SQL.

// Clase ConexionBaseDatos utilizada por BARBER X para organizar esta responsabilidad.
final class ConexionBaseDatos
{
// Propiedad interna que conserva estado necesario para esta operación.
    private PDO $connection;

// Inicializa la clase y prepara sus conexiones o valores internos.
    public function __construct()
    {
        $servidor = "localhost";
        $nombre_bd = "barber_x";
        $usuario_bd = "root";
        $contrasena_bd = "";
        $dsn = "mysql:host=$servidor;dbname=$nombre_bd;charset=utf8mb4";

        $this->connection = new PDO($dsn, $usuario_bd, $contrasena_bd, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }

// Ejecuta una consulta SQL directa y devuelve su repositorio de resultados.
    public function query(string $sql): DatabaseStatementRepository
    {
// Consulta o modifica datos de BARBER X en MySQL; los marcadores protegen los parámetros.
        return new DatabaseStatementRepository($this->connection->query($sql));
    }

// Prepara una consulta SQL parametrizada para proteger los datos.
    public function prepare(string $sql): DatabaseStatementRepository
    {
        return new DatabaseStatementRepository($this->connection->prepare($sql));
    }

// Ejecuta una instrucción SQL sin parámetros y devuelve las filas afectadas.
    public function exec(string $sql): int|false
    {
        return $this->connection->exec($sql);
    }

// Devuelve el identificador generado por la última inserción.
    public function lastInsertId(): string|false
    {
        return $this->connection->lastInsertId();
    }

// Inicia una transacción para mantener varios cambios como una unidad.
// Coordina una transacción MySQL para evitar cambios parciales en BARBER X.
    public function beginTransaction(): bool
    {
        return $this->connection->beginTransaction();
    }

// Confirma los cambios de la transacción activa.
    public function commit(): bool
    {
        return $this->connection->commit();
    }

// Revierte los cambios si una operación falla.
    public function rollBack(): bool
    {
        return $this->connection->rollBack();
    }

// Indica si existe una transacción abierta actualmente.
    public function inTransaction(): bool
    {
        return $this->connection->inTransaction();
    }

// Inserta un evento de error de la aplicación en el registro de calidad.
    public function recordQualityError(string $title, string $detail): void
    {
        $statement = $this->connection->prepare(
            "INSERT INTO registro_calidad (tipo, origen, titulo, detalle, severidad)
             VALUES ('error', 'aplicacion', :titulo, :detalle, 'alta')"
        );
        $statement->execute(["titulo" => $title, "detalle" => $detail]);
    }
}

// Clase DatabaseStatementRepository utilizada por BARBER X para organizar esta responsabilidad.
final class DatabaseStatementRepository
{
    private PDOStatement $statement;

    public function __construct(PDOStatement $statement)
    {
        $this->statement = $statement;
    }

// Ejecuta la sentencia SQL preparada con parámetros opcionales.
    public function execute(?array $parameters = null): bool
    {
        return $parameters === null
            ? $this->statement->execute()
            : $this->statement->execute($parameters);
    }

// Obtiene una fila del resultado o informa que no hay más filas.
    public function fetch(): array|false
    {
        return $this->statement->fetch();
    }

// Obtiene todas las filas restantes del resultado SQL.
    public function fetchAll(): array
    {
        return $this->statement->fetchAll();
    }

// Devuelve cuántas filas fueron afectadas por la sentencia.
    public function rowCount(): int
    {
        return $this->statement->rowCount();
    }
}
