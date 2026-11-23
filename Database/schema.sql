-- Crea y selecciona la base donde se almacenan usuarios, citas y catálogos.
CREATE DATABASE IF NOT EXISTS barber_x
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE barber_x;

-- Retira la tabla heredada de recepcionistas: el sistema solo usa admin, clientes y barberos.
DROP TABLE IF EXISTS recepcionista;

-- Datos de clientes con información de contacto y hash opcional de acceso.
CREATE TABLE IF NOT EXISTS cliente (
  -- Identificador único que relaciona al cliente con sus citas y reportes de calidad.
  id_clte INT NOT NULL AUTO_INCREMENT,
  -- Nombre y apellido que se muestran en la cuenta y en la agenda.
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  -- Datos de contacto; el correo también identifica de forma única la cuenta.
  telefono VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  -- Hash seguro de acceso; puede ser NULL en registros heredados sin cuenta.
  password_hash VARCHAR(255) DEFAULT NULL,
  -- Fecha en que se registró la persona en el sistema.
  fecha_registro DATE DEFAULT CURRENT_DATE,
  -- Clave principal y restricción que evita repetir un correo.
  PRIMARY KEY (id_clte),
  UNIQUE KEY cliente_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Perfil de cada barbero, su especialidad y disponibilidad para reservas.
CREATE TABLE IF NOT EXISTS barbero (
  -- Identificador único utilizado por las citas y la cuenta de acceso.
  id_barbero INT NOT NULL AUTO_INCREMENT,
  -- Nombre y apellido que identifican al profesional en el sistema.
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  -- Medios de contacto registrados para el barbero.
  telefono VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  -- Área de trabajo y bandera que determina si puede recibir citas.
  especialidad VARCHAR(100) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  -- Clave principal y correo único para evitar perfiles duplicados.
  PRIMARY KEY (id_barbero),
  UNIQUE KEY barbero_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credenciales separadas y autorización administrativa para iniciar sesión como barbero.
CREATE TABLE IF NOT EXISTS cuenta_barbero (
  -- Identificador compartido con el perfil del barbero.
  id_barbero INT NOT NULL,
  -- Hash de contraseña y autorización que debe conceder un administrador.
  password_hash VARCHAR(255) NOT NULL,
  autorizada_por_admin TINYINT(1) NOT NULL DEFAULT 0,
  -- Momento de creación de las credenciales.
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- La clave también referencia al perfil y se elimina junto con él.
  PRIMARY KEY (id_barbero),
  CONSTRAINT cuenta_barbero_barbero_fk FOREIGN KEY (id_barbero)
    REFERENCES barbero (id_barbero) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo de servicios, precios, duración y estado de publicación.
CREATE TABLE IF NOT EXISTS servicio (
  -- Identificador único usado al asociar un servicio con una cita.
  id_serv INT NOT NULL AUTO_INCREMENT,
  -- Nombre y descripción visibles en el catálogo.
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  -- Precio y duración estimada que se usan para ofrecer y agendar el servicio.
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  duracion INT UNSIGNED NOT NULL DEFAULT 30,
  -- Indica si el servicio puede seleccionarse en nuevas reservas.
  activo TINYINT(1) NOT NULL DEFAULT 1,
  -- Identificador principal y nombre no repetido dentro del catálogo.
  PRIMARY KEY (id_serv),
  UNIQUE KEY servicio_nombre_unique (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservas principales con cliente, barbero, fecha, estado, precio y notas.
CREATE TABLE IF NOT EXISTS cita (
  -- Identificador de la reserva.
  id_cita INT NOT NULL AUTO_INCREMENT,
  -- Cliente y barbero relacionados con la atención.
  id_clte INT NOT NULL,
  id_barbero INT NOT NULL,
  -- Fecha y hora reservadas, estado actual y método de pago si se registró.
  fecha_hora DATETIME NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  metodo_pago VARCHAR(30) DEFAULT NULL,
  -- Importe acordado y observaciones asociadas a la cita.
  precio DECIMAL(10,2) DEFAULT NULL,
  notas VARCHAR(500) DEFAULT NULL,
  -- Claves e índices usados para identificar la reserva y buscar agendas por fecha o estado.
  PRIMARY KEY (id_cita),
  KEY cita_fecha_idx (fecha_hora),
  KEY cita_barbero_fecha_idx (id_barbero, fecha_hora),
  KEY cita_estado_idx (estado),
  CONSTRAINT cita_cliente_fk FOREIGN KEY (id_clte) REFERENCES cliente (id_clte),
  CONSTRAINT cita_barbero_fk FOREIGN KEY (id_barbero) REFERENCES barbero (id_barbero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relaciona cada cita con sus servicios y conserva el precio aplicado al reservar.
CREATE TABLE IF NOT EXISTS cita_servicio (
  -- Identificador de cada asociación entre una cita y un servicio.
  id_cs INT NOT NULL AUTO_INCREMENT,
  -- Referencias a la cita y al servicio incluidos en la reserva.
  id_cita INT NOT NULL,
  id_serv INT NOT NULL,
  -- Unidades reservadas y precio conservado al momento de la compra.
  cantidad INT NOT NULL DEFAULT 1,
  precio DECIMAL(10,2) DEFAULT NULL,
  -- Índices y claves que conectan esta tabla con la reserva y el catálogo.
  PRIMARY KEY (id_cs),
  KEY cita_servicio_cita_idx (id_cita),
  KEY cita_servicio_servicio_idx (id_serv),
  CONSTRAINT cita_servicio_cita_fk FOREIGN KEY (id_cita) REFERENCES cita (id_cita),
  CONSTRAINT cita_servicio_servicio_fk FOREIGN KEY (id_serv) REFERENCES servicio (id_serv)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guarda la guía de uso editable que se muestra desde la aplicación.
CREATE TABLE IF NOT EXISTS manual_usuario (
  -- Identificador del documento, normalmente se mantiene un único manual.
  id_manual TINYINT UNSIGNED NOT NULL,
  -- Título, contenido editable y fecha de la última actualización.
  titulo VARCHAR(120) NOT NULL DEFAULT 'Manual de usuario',
  contenido MEDIUMTEXT NOT NULL,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Clave principal del registro de manual.
  PRIMARY KEY (id_manual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guarda los datos y la ruta del tutorial de video administrable.
CREATE TABLE IF NOT EXISTS video_tutorial (
  -- Identificador del recurso de video configurado.
  id_video TINYINT UNSIGNED NOT NULL,
  -- Título, descripción y nombre del archivo que reproduce la aplicación.
  titulo VARCHAR(120) NOT NULL DEFAULT 'Video explicativo',
  descripcion VARCHAR(2000) NOT NULL DEFAULT '',
  archivo VARCHAR(100) DEFAULT NULL,
  -- Fecha que se actualiza al guardar cambios en el tutorial.
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Clave principal del registro de video.
  PRIMARY KEY (id_video)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conserva los informes generados para descargarlos y consultarlos después.
CREATE TABLE IF NOT EXISTS reporte_generado (
  -- Identificador de cada reporte archivado.
  id_reporte BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- Momento de generación y usuario que preparó el informe.
  generado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generado_por VARCHAR(120) NOT NULL,
  -- Totales y monto que se resumen en el informe.
  total_citas INT UNSIGNED NOT NULL DEFAULT 0,
  total_clientes INT UNSIGNED NOT NULL DEFAULT 0,
  ingresos DECIMAL(14,2) NOT NULL DEFAULT 0,
  -- Detalle serializado del reporte, conservado para volver a consultarlo.
  datos_json LONGTEXT NOT NULL,
  -- Clave principal e índice cronológico para listar informes recientes.
  PRIMARY KEY (id_reporte),
  KEY reporte_generado_fecha_idx (generado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registra errores y sugerencias con su origen, prioridad, estado y cliente opcional.
CREATE TABLE IF NOT EXISTS registro_calidad (
  -- Identificador y clasificación del registro recibido.
  id_registro BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo ENUM('error', 'sugerencia') NOT NULL,
  origen ENUM('aplicacion', 'cliente', 'administrador') NOT NULL,
  -- Resumen, detalle y severidad usados para revisar el reporte.
  titulo VARCHAR(120) NOT NULL,
  detalle TEXT NOT NULL,
  severidad ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
  -- Estado de atención y cliente asociado cuando el reporte proviene de una cuenta.
  estado ENUM('nuevo', 'en_revision', 'en_proceso', 'resuelto') NOT NULL DEFAULT 'nuevo',
  id_cliente INT DEFAULT NULL,
  -- Fechas de creación y última actualización del seguimiento.
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Clave, índices para organizar la cola y relación opcional con el cliente.
  PRIMARY KEY (id_registro),
  KEY registro_calidad_estado_fecha_idx (estado, creado_en),
  KEY registro_calidad_tipo_fecha_idx (tipo, creado_en),
  CONSTRAINT registro_calidad_cliente_fk FOREIGN KEY (id_cliente)
    REFERENCES cliente (id_clte) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Importa los datos del volcado anterior con las definiciones de tabla de este esquema.
-- Carga los perfiles de barbero importados y conserva sus estados de actividad.
INSERT IGNORE INTO `barbero` (`id_barbero`, `nombre`, `apellido`, `telefono`, `email`, `especialidad`, `activo`) VALUES
(2, 'maicol', 'adjda', '121212', 'dadada@gmail.com', 'dcss', 1),
(3, 'tigre', 'mayor', '123424234234', 'dasfsf@gmail.com', 'de todo', 1),
(4, 'steveen', 'perez', '1234567890', 'st@gmail.com', 'de todo', 1),
(5, '123', '123', '123', '123@gmail.com', '123', 1),
(6, 'Barbero', 'Prueba', '0000000000', 'barbero.prueba.20261105.1123@barberx.local', 'Servicios generales', 1);

-- Importa clientes y sus contraseñas ya almacenadas como hashes.
INSERT IGNORE INTO `cliente` (`id_clte`, `nombre`, `apellido`, `telefono`, `email`, `password_hash`, `fecha_registro`) VALUES
(6, 'maik', 'marica', '313131332', 'maik@gmail.com', '$2y$10$MB1QRCaG01QB0lOvGEeBReYbhOvynX8ZVUWZ0EHIWKhMMzwMAXGdO', '2026-10-22 14:39:13'),
(8, 'asda', 'asd', '12343234234234', 'asdasd@gmail.com', '$2y$10$6a1ubm8v/xQ3BsjHmWCeA.b.cCkJi4K9DcGMuywoh0LpY5jfqEr5e', '2026-10-26 11:27:23'),
(9, 'xcv', 'cvbvc', '12343234234234', 'asdasvxcd@gmail.com', '$2y$10$NAMk99YHCiom4Agorh07XeaBiJUxVy9oiEbjIkIis/nna9B5avKVq', '2026-10-26 12:35:45'),
(10, 'xcvdf', 'cvbvcdsf', '12343234234234', 'asdasdsfvxcd@gmail.com', '$2y$10$c9bU2H7LhTm8NLNw0k0I8.QwNmjmDV6OKsDdZpGzwQYtpGTMkR/fW', '2026-10-26 12:37:26'),
(12, 'jaime', 'barreiro', '12345678', 'jaima@gmail.com', '$2y$10$5G.3JHg3NpPq4cO17U45XuABYQopxp8iVsq3T4m77TB/V/m0QFhM.', '2026-10-26 13:57:07'),
(13, 'jaime', 'barreiro', '12345678', 'jaime@gmail.com', '$2y$10$pTZWKcMYXkcMKpAlTrv5EOqbKjgEuGyiScs7kskKYAYvG.Df5HEaW', '2026-10-26 13:59:46'),
(15, 'jefferson', 'murcia', '3112321322', 'jefferson@gmail.com', '$2y$10$BmBOv8UT.QdhQoh4fU7cx.749KorRtyymZGcAdYBExDLrncvZQ.n2', '2026-10-26 19:23:03'),
(16, 'maicol', 'tovar', '3243214q3', 'maicol.tovarco@inemneiva.edu.co', '$2y$10$ln7eTHgLCDZipl6W0m2uquoowyT2.oS06ijG9z/pN0ypU.MuLLtwy', '2026-10-27 12:03:30'),
(17, 'maicol', 'sriben', '3243214q3', 'maik231@gmail.com', '$2y$10$Cg4hSw3U5QET8hn1SYffkOcfPQW.9lyJKbfMGPhoP1FCeU27KdW0.', '2026-10-27 12:09:58'),
(18, 'stiben', 'correa', '3243214q3', 'stiben12@gmail.com', '$2y$10$hdqaUt9a7/8uaDoUOzq7Leaqduxbq6q88csGHQSqC/Em.L8f0hP1e', '2026-10-27 12:13:55'),
(19, 'pene', 'correa', '3243214q3', 'spene12@gmail.com', '$2y$10$ArZF7aMNj5u/ByreCh6mDuPHG4upkMNnQC3nFw8EiiPnReW0jR6IW', '2026-10-27 12:30:42'),
(20, 'nicolas', 'tovar', '12345678', 'nicolas@gmail.com', '$2y$10$bxr306Ha37CYzD.wORwGTOxtG1AOyIqlYIzan1WLMd18Bbtlhl1Ty', '2026-10-27 12:42:56'),
(21, 'nicolas', 'tovar', '12345678', 'maicol@gmail.com', '$2y$10$ivI8RSGuK7R4lpFXpudbFelXfiosPLu95GsBEhaS2VeY6ibjxETbi', '2026-10-27 12:51:20'),
(22, 'stibenn', 'tovar', '554548445', 'tovar@gmail.com', '$2y$10$aLQEvlYa0SaK9apyjzzgtueH/r4YaAA9CUCvGn38qMRbTJr4VGHHC', '2026-10-27 13:48:08'),
(23, 'maicol', 'correa', '3243214q3', 'tovarcorreamaicolstiben.inem@gmail.com', '$2y$10$5IbDFeYKMEfYVef8kMm3DOAExoaDYSwnQpWbhXMqW/Qj0Lg3HjNUm', '2026-10-27 16:07:52'),
(24, 'maicol', 'correa', '3243214q3', 'jhonatantovar.88@gmail.com', '$2y$10$ng04Uj.iLrZqKiuDsVUQcuCP7PD.T44o2cfLWBt3LLnUORzKMqF2C', '2026-10-29 11:24:56'),
(25, 'maicol', 'correa', '121212', 'jessicatatianacorreacastro@gmail.com', '$2y$10$kQO026D4hCWT4zyD0KldsOfLHqJLfvridO8Mv5PfjdkO1c1YEDc8W', '2026-10-29 12:43:46'),
(26, 'maicol', 'correa', '3243214q3', 'maicoql@gmail.com', '$2y$10$EUPZpoZwWmbgWeySnb0ZKuGw.1xSgZ8trs8wtK.dgSrVZj5NpMBV2', '2026-10-29 14:33:39'),
(27, 'Ana', 'García', '123456', 'ana@ejemplo.com', '$2y$10$K1zBgqxWGdSJOyMlBHykae37JjLExotLbi/UN5PhWX8ssqQZ6A/nS', '2026-10-29 15:35:02'),
(28, 'stiben', 'correa', '3243214q3', 'holao@gmail.com', '$2y$10$3Z5iQQv5Epx9/DdQ1NeFXeQwVnb9C8z/iblU0pZJFLaiCu4TiOMXS', '2026-10-29 15:59:53'),
(29, 'stiben', 'correa', '3243214q3', 'holkjkohjao@gmail.com', '$2y$10$WHcJIF5eZcyKhln4IHQCLeDaU52U8TUMETNTpw5u0gftXrHAG0GRW', '2026-10-29 16:22:04'),
(30, 'stiben', 'correa', '3243214q3', 'ssasahjao@gmail.com', '$2y$10$Nv1a5UDm7Jzyp5FY0BxL8OxdtO8zS59njxnRq3.qvkRJR0eFDRF6q', '2026-10-30 01:54:39'),
(31, 'jajajaja', 'jejeje', '544566', 'jiji@gmail.com', '$2y$10$3l1LEy8EyOs.HEa22a7zauSGKYYtZOSsp64vutbu7W5J.YBoyMv/G', '2026-11-03 13:56:59'),
(32, 'jajajaja', 'jejeje', 'admin', 'jippp@gmail.com', '$2y$10$8vfQythHtCZpoCpvMny.QuS6CbPvjXDTSGVWHt0CKl8G.guKB99XS', '2026-11-09 20:00:39'),
(33, 'jajajaja', 'jejeje', 'admin', 'll@gmail.com', '$2y$10$GolWq2TRidce6HA746hZr.aFIGz/ce8bS4XBoDlmYQQ1SPp6RV8NS', '2026-11-09 20:03:36');

-- Carga los servicios históricos y vigentes del catálogo con sus precios y tiempos.
INSERT IGNORE INTO `servicio` (`id_serv`, `nombre`, `descripcion`, `precio`, `duracion`, `activo`) VALUES
(1, 'Corte clásico (registro anterior)', 'Servicio anterior conservado solo para consultar el historial.', 25000.00, 40, 1),
(2, 'Corte fade (degradado)', 'Degradado bajo, medio o alto integrado con el largo superior; incluye perfilado de patillas y nuca.', 30000.00, 45, 1),
(3, 'Afeitado clásico con navaja', 'Preparación de la piel, espuma y afeitado preciso con navaja para un acabado suave y definido.', 20000.00, 35, 1),
(4, 'Corte + barba', 'Servicio combinado de corte personalizado y perfilado de barba, con acabado limpio en los contornos.', 42000.00, 65, 1),
(5, 'Corte clásico a tijera o máquina', 'Corte tradicional personalizado a tijera o máquina, con laterales, nuca y contornos definidos.', 25000.00, 40, 1),
(6, 'Perfilado y diseño de barba', 'Recorte y diseño de barba según el rostro, con definición de mejillas, cuello y contornos.', 18000.00, 30, 1);

-- Vincula a los barberos importados con sus credenciales y permisos de acceso.
INSERT IGNORE INTO `cuenta_barbero` (`id_barbero`, `password_hash`, `autorizada_por_admin`, `creado_en`) VALUES
(2, '$2y$10$0kV3q5MIIys1UwPJS/DgxeBxJjiGBOZinjcwHnxoIsZFGZp0LHlPy', 1, '2026-11-05 16:05:29'),
(3, '$2y$10$cItTXN/.YjToL2zXgvR6meIJIk.CfoP5dj0A25FeHq0wO0NfPWblS', 1, '2026-11-05 16:05:23'),
(4, '$2y$10$GXtk3l68EzHqm4vpAPxcMuOHE.kJyRBUOytumOAuhP0uEJgMimZvW', 1, '2026-11-05 16:06:59'),
(5, '$2y$10$K/vAEVbJLff4jbha09TD1emHxL0gnvxVhi3O.oKMFTF7TdxW7KcRq', 1, '2026-11-05 16:21:20'),
(6, '$2y$10$dCVSNC.s5/UTpO5tnVQTnesqJsEdNEGgqpO5x3OBYcvFZ5A9Fsl9a', 1, '2026-11-05 16:26:15');

-- Importa las citas históricas con sus responsables, fecha, estado, cobro y notas.
INSERT IGNORE INTO `cita` (`id_cita`, `id_clte`, `id_barbero`, `fecha_hora`, `estado`, `metodo_pago`, `precio`, `notas`) VALUES
(1, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(2, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(3, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(4, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(5, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(6, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(7, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(8, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(9, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(10, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(11, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(12, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(13, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(14, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(15, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, 'hola'),
(16, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, NULL),
(17, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, NULL),
(18, 15, 2, '2026-10-27 18:58:00', 'Pendiente', NULL, 18000.00, NULL),
(19, 15, 2, '2026-10-27 18:58:00', 'Cancelada', NULL, 18000.00, NULL),
(20, 15, 2, '2026-10-27 18:06:00', 'Pendiente', NULL, 18000.00, NULL),
(21, 15, 2, '2026-10-27 18:06:00', 'Pendiente', NULL, 18000.00, NULL),
(22, 17, 2, '2026-10-28 11:10:00', 'Cancelada', NULL, 25000.00, 'corte en v'),
(23, 18, 2, '2026-10-30 03:10:00', 'Completada', NULL, 25000.00, 'corte en v'),
(24, 24, 2, '2026-10-30 08:27:00', 'Pendiente', NULL, 25000.00, 'ajsjcka'),
(25, 28, 2, '2026-10-29 23:43:00', 'Pendiente', NULL, 18000.00, 'hola'),
(26, 30, 2, '2026-10-30 13:45:00', 'Pendiente', NULL, 20000.00, 'hola'),
(27, 30, 2, '2026-10-30 14:30:00', 'Pendiente', NULL, 20000.00, 'hhola'),
(28, 30, 2, '2026-10-30 18:15:00', 'Pendiente', NULL, 18000.00, 'hola'),
(29, 30, 2, '2026-11-03 15:15:00', 'Pendiente', NULL, 25000.00, 'hola'),
(30, 30, 2, '2026-11-03 16:00:00', 'Pendiente', NULL, 20000.00, 'dsdgdthyjhg'),
(31, 30, 2, '2026-11-03 18:15:00', 'Cancelada', NULL, 25000.00, 'dgshfjgh'),
(32, 30, 2, '2026-11-04 07:00:00', 'Completada', NULL, 42000.00, 'jadejsr'),
(33, 30, 3, '2026-11-04 18:15:00', 'Cancelada', NULL, 25000.00, 'adighifjgo'),
(34, 32, 5, '2026-11-10 07:45:00', 'Completada', NULL, 30000.00, 'hols'),
(35, 33, 5, '2026-11-10 07:00:00', 'Pendiente', NULL, 30000.00, 'hols');

-- Asocia cada cita importada con el servicio y el precio histórico correspondiente.
INSERT IGNORE INTO `cita_servicio` (`id_cs`, `id_cita`, `id_serv`, `cantidad`, `precio`) VALUES
(1, 1, 3, 1, 18000.00),
(2, 2, 3, 1, 18000.00),
(3, 3, 3, 1, 18000.00),
(4, 4, 3, 1, 18000.00),
(5, 5, 3, 1, 18000.00),
(6, 6, 3, 1, 18000.00),
(7, 7, 3, 1, 18000.00),
(8, 8, 3, 1, 18000.00),
(9, 9, 3, 1, 18000.00),
(10, 10, 3, 1, 18000.00),
(11, 11, 3, 1, 18000.00),
(12, 12, 3, 1, 18000.00),
(13, 13, 3, 1, 18000.00),
(14, 14, 3, 1, 18000.00),
(15, 15, 3, 1, 18000.00),
(16, 16, 3, 1, 18000.00),
(17, 17, 3, 1, 18000.00),
(18, 18, 3, 1, 18000.00),
(19, 19, 3, 1, 18000.00),
(20, 20, 3, 1, 18000.00),
(21, 21, 3, 1, 18000.00),
(22, 22, 5, 1, 25000.00),
(23, 23, 5, 1, 25000.00),
(24, 24, 5, 1, 25000.00),
(25, 25, 6, 1, 18000.00),
(26, 26, 3, 1, 20000.00),
(27, 27, 3, 1, 20000.00),
(28, 28, 6, 1, 18000.00),
(29, 29, 5, 1, 25000.00),
(30, 30, 3, 1, 20000.00),
(31, 31, 5, 1, 25000.00),
(32, 32, 4, 1, 42000.00),
(33, 33, 1, 1, 25000.00),
(34, 34, 2, 1, 30000.00),
(35, 35, 2, 1, 30000.00);

-- Conserva reportes anteriores con sus totales y el detalle JSON original.
INSERT IGNORE INTO `reporte_generado` (`id_reporte`, `generado_en`, `generado_por`, `total_citas`, `total_clientes`, `ingresos`, `datos_json`) VALUES
(1, '2026-10-27 16:36:28', 'Administrador', 23, 15, 25000.00, '{\"citas\":{\"total\":23,\"pendientes\":20,\"confirmadas\":0,\"completadas\":1,\"canceladas\":2},\"ingresos\":25000,\"clientes\":15,\"servicios\":[{\"servicio\":\"Arreglo de barba con navaja\",\"citas\":21,\"completadas\":0,\"ingresos\":0},{\"servicio\":\"Corte clásico\",\"citas\":2,\"completadas\":1,\"ingresos\":25000},{\"servicio\":\"Corte cl├ísico\",\"citas\":0,\"completadas\":0,\"ingresos\":0},{\"servicio\":\"Corte degradado\",\"citas\":0,\"completadas\":0,\"ingresos\":0},{\"servicio\":\"Corte y barba\",\"citas\":0,\"completadas\":0,\"ingresos\":0}]}'),
(2, '2026-10-29 11:24:09', 'Administrador', 23, 15, 25000.00, '{\"citas\":{\"total\":23,\"pendientes\":20,\"confirmadas\":0,\"completadas\":1,\"canceladas\":2},\"ingresos\":25000,\"clientes\":15,\"servicios\":[{\"servicio\":\"Arreglo de barba con navaja\",\"citas\":21,\"completadas\":0,\"ingresos\":0},{\"servicio\":\"Corte clásico\",\"citas\":2,\"completadas\":1,\"ingresos\":25000},{\"servicio\":\"Corte cl├ísico\",\"citas\":0,\"completadas\":0,\"ingresos\":0},{\"servicio\":\"Corte degradado\",\"citas\":0,\"completadas\":0,\"ingresos\":0},{\"servicio\":\"Corte y barba\",\"citas\":0,\"completadas\":0,\"ingresos\":0}]}');

-- Guarda la guía inicial que la aplicación puede mostrar o actualizar.
INSERT IGNORE INTO `manual_usuario` (`id_manual`, `titulo`, `contenido`, `actualizado_en`) VALUES
(1, 'Manual de usuario BARBER X', 'BARBER X\nMANUAL DE USUARIO\nSistema web de gesti├│n de barber├¡a\nVersi├│n 1.0 | Octubre de 2026\nGu├¡a para clientes y administradores\n\nAPRENDICEZ:\nMaicol stiben tovar correa\nJefferson valderama\nSteveen Perez\n\n1. Introducci├│n\nBARBER X es una aplicaci├│n web para apoyar la gesti├│n b├ísica de una barber├¡a. Permite que los clientes creen una cuenta, inicien sesi├│n y consulten los servicios disponibles. El perfil de administraci├│n permite gestionar los registros de clientes, barberos y recepcionistas.\nEste manual explica c├│mo ingresar al sistema, utilizar sus opciones principales y resolver problemas comunes. La interfaz utiliza un dise├▒o oscuro con detalles dorados y puede adaptarse a pantallas de computador, tableta y celular.\n\n2. Objetivo del manual\nOrientar al usuario para que pueda utilizar BARBER X de forma correcta, desde el registro o inicio de sesi├│n hasta la consulta de servicios y la administraci├│n de personas autorizadas.\n\n3. Requisitos para utilizar el sistema\nUn navegador web actualizado, como Google Chrome o Microsoft Edge.\nPara ejecutar el proyecto localmente: un entorno de servidor como XAMPP con Apache, PHP y MySQL habilitados.\nLa base de datos MySQL llamada barber_x y las tablas que utiliza la aplicaci├│n.\nLos archivos del proyecto ubicados dentro de la carpeta p├║blica de XAMPP, normalmente htdocs.\nConexi├│n correcta entre PHP y MySQL configurada en backend/repositories/DatabaseRepository.php.\nImportante: los archivos entregados incluyen el script database/schema.sql, que crea las tablas recepcionista y cuenta_cliente y agrega servicios de ejemplo. El propio script indica que las tablas cliente, barbero y servicio ya deben existir; por tanto, antes de usarlo debe estar instalada la estructura completa de esas tablas.\n\n4. C├│mo iniciar el sistema\nAbra el panel de control de XAMPP.\nInicie los servicios Apache y MySQL.\nCopie la carpeta del proyecto dentro de C:\\\\xampp\\\\htdocs\\\\. Mantenga las rutas relativas de los archivos.\nAbra phpMyAdmin desde http://localhost/phpmyadmin.\nSeleccione o cree la base de datos barber_x e importe el archivo database/schema.sql. Verifique previamente que las tablas cliente, barbero y servicio existan.\nRevise backend/repositories/DatabaseRepository.php: el servidor est├í configurado como localhost, la base de datos como barber_x y el usuario como root. La contrase├▒a est├í vac├¡a en el archivo entregado; aj├║stela si su instalaci├│n de MySQL utiliza otra.\nAbra el sistema desde una direcci├│n local como http://localhost/nombre-de-la-carpeta/frontend/index.html. Reemplace nombre-de-la-carpeta por el nombre real de la carpeta del proyecto.\nNo abra frontend/index.html haciendo doble clic desde el explorador de archivos: las funciones PHP y las solicitudes a la API necesitan ejecutarse desde el servidor local.\n\nInicio de sesi├│n\n\n5.1 Ingresar como cliente\nEn la pantalla de bienvenida, escriba su correo electr├│nico en el campo ÔÇ£Usuario o correo electr├│nicoÔÇØ.\nEscriba la contrase├▒a registrada.\nPulse ÔÇ£Iniciar sesi├│nÔÇØ.\nSi los datos son correctos, se abrir├í el espacio del cliente.\nSi aparece un mensaje de error, compruebe que el correo y la contrase├▒a est├®n escritos correctamente. La cuenta de cliente se autentica con el correo y la contrase├▒a que se definieron durante el registro.\n\n5.2 Crear una cuenta de cliente\nEn la pantalla de acceso, pulse ÔÇ£Reg├¡strate aqu├¡ÔÇØ.\nComplete nombre, apellido, correo electr├│nico, tel├®fono y contrase├▒a.\nLa contrase├▒a debe tener al menos 8 caracteres.\nPulse ÔÇ£Crear cuenta de clienteÔÇØ.\nSi el registro es v├ílido, el sistema crea o vincula el registro del cliente y abre su sesi├│n.\nEl correo debe tener un formato v├ílido y no puede estar asociado a otra cuenta. Si el sistema indica que ya existe una cuenta, intente iniciar sesi├│n con ella o utilice otro correo.\n\n5.3 Ingresar como administrador\nEn la pantalla de acceso, el administrador debe escribir el usuario configurado y su contrase├▒a autorizada. El c├│digo reconoce el identificador ÔÇ£adminÔÇØ, pero la contrase├▒a v├ílida depende del hash configurado en sesion.php. Solicite al responsable del proyecto las credenciales correctas; no se debe asumir una contrase├▒a por defecto.\n\nEspacio del cliente\n\n6.1 Consultar servicios\nDespu├®s de iniciar sesi├│n, el cliente ve un saludo y la secci├│n ÔÇ£Nuestros serviciosÔÇØ. All├¡ se muestran los servicios activos que est├ín guardados en la base de datos, ordenados por nombre. Cada tarjeta presenta el nombre, una descripci├│n, el precio y la duraci├│n.\n\n6.2 Servicios de ejemplo\nLos valores anteriores corresponden a los datos de ejemplo incluidos en database/schema.sql. El precio y la duraci├│n reales pueden cambiar seg├║n los datos vigentes en la base de datos.\nEn los archivos revisados no aparece una opci├│n de reservar citas desde la pantalla del cliente; esta versi├│n permite consultar los servicios, no confirmar una reserva desde esa vista.\n\n7. Panel de administraci├│n\nEl panel de administraci├│n presenta un men├║ lateral con tres secciones: Clientes, Barberos y Recepcionistas. Seleccione una secci├│n para ver sus registros. En la parte superior se muestran contadores y un campo de b├║squeda.\n\n7.1 Consultar y buscar registros\nSeleccione Clientes, Barberos o Recepcionistas en el men├║.\nRevise la lista que aparece en la tabla.\nUse el campo de b├║squeda para filtrar por nombre o correo electr├│nico.\nLos contadores resumen el total y algunos datos de los registros de la secci├│n seleccionada.\n\n7.2 Crear un registro\nPulse ÔÇ£Agregar barberoÔÇØ o ÔÇ£Agregar recepcionistaÔÇØ, seg├║n corresponda.\nComplete nombre, apellido, correo y tel├®fono.\nPara un barbero, indique tambi├®n su especialidad.\nCuando est├® disponible, seleccione el estado Activo o Inactivo.\nPulse ÔÇ£GuardarÔÇØ. Si desea salir sin guardar, pulse ÔÇ£CancelarÔÇØ o cierre el formulario.\n\n7.3 Editar un registro\nBusque a la persona en la tabla.\nPulse el bot├│n con el s├¡mbolo de l├ípiz en su fila.\nModifique los datos necesarios.\nGuarde los cambios y compruebe que la lista se actualice.\n\n7.4 Eliminar un registro\nLocalice el registro que desea retirar.\nPulse el bot├│n de eliminar (s├¡mbolo de papelera o borrado) en la fila correspondiente.\nConfirme la acci├│n si la interfaz solicita confirmaci├│n.\nAdvertencia: eliminar puede ser una acci├│n irreversible y podr├¡a afectar informaci├│n relacionada. Verifique cuidadosamente el registro antes de continuar.\n\n7.5 Estados y validaciones\nLos campos nombre, apellido, tel├®fono y correo son obligatorios en el formulario de administraci├│n.\nEl correo debe ser v├ílido y no debe repetirse dentro de la misma categor├¡a.\nLos barberos requieren una especialidad.\nLos registros de barberos y recepcionistas pueden marcarse como activos o inactivos.\nSolo una sesi├│n con rol de administrador puede crear, consultar, editar o eliminar registros desde el m├│dulo de administraci├│n.\n\n8. Cerrar sesi├│n\nPulse ÔÇ£Cerrar sesi├│nÔÇØ en la parte superior de la pantalla.\nEl sistema termina la sesi├│n actual.\nPara volver a utilizar el sistema, inicie sesi├│n de nuevo.\nCierre sesi├│n cuando termine de utilizar el sistema, especialmente si comparte el computador con otras personas.\n\n9. Soluci├│n de problemas\n\n10. Recomendaciones de uso y seguridad\nNo comparta su contrase├▒a ni utilice credenciales de administrador en cuentas de uso com├║n.\nUse contrase├▒as de al menos 8 caracteres y evite reutilizar contrase├▒as personales.\nMantenga una copia de seguridad de la base de datos antes de modificar tablas o eliminar registros.\nRegistre informaci├│n real, completa y actualizada.\nEn un despliegue p├║blico, cambie las credenciales de ejemplo, configure una contrase├▒a segura para MySQL y utilice HTTPS.\nSi ocurre un error, anote el mensaje que aparece y comun├¡quelo al encargado del sistema.\n\n11. Alcance de la versi├│n documentada\nEste manual se elabor├│ a partir de los archivos entregados: frontend/index.html, styles.css, backend/repositories/DatabaseRepository.php, database/schema.sql, personas.php, servicios.php y sesion.php. La versi├│n documentada incluye registro e inicio de sesi├│n de clientes, consulta de servicios y administraci├│n de clientes, barberos y recepcionistas.\nLos archivos proporcionados no muestran un flujo funcional para que el cliente reserve una cita ni un m├│dulo de pagos. Aunque el proyecto est├í orientado a la gesti├│n de una barber├¡a y la base de datos hace referencia a citas, estas funciones no se describen como acciones disponibles en la interfaz revisada.\n\n12. Glosario\nAdministrador: Usuario autorizado para gestionar los registros del sistema.\nCliente: Persona que crea una cuenta e ingresa para consultar los servicios.\nBarbero: Persona que presta los servicios de barber├¡a y puede tener una especialidad registrada.\nRecepcionista: Integrante del personal registrado para apoyar la recepci├│n.\nServicio activo: Servicio que est├í habilitado para aparecer en la consulta del cliente.\nBase de datos: Lugar donde se almacenan los registros que utiliza la aplicaci├│n.\nSesi├│n: Estado temporal que permite reconocer al usuario despu├®s de iniciar sesi├│n.', '2026-10-29 15:33:22');

-- Importa el video configurado y su fecha original sin reemplazar una edición vigente.
INSERT IGNORE INTO `video_tutorial` (`id_video`, `titulo`, `descripcion`, `archivo`, `actualizado_en`) VALUES
(1, 'Video explicativo de BARBER X', 'Conoce las principales opciones de la pagina en este video.', 'tutorial.mp4', '2026-10-27 15:03:08');

-- Inserta el registro inicial del video tutorial sin duplicarlo en reimportaciones.
INSERT INTO video_tutorial (id_video, titulo, descripcion, archivo)
VALUES (1, 'Video explicativo de BARBER X', 'Conoce las principales opciones de la pagina en este video.', 'tutorial.mp4')
ON DUPLICATE KEY UPDATE id_video = VALUES(id_video);

-- Carga la guía de usuario inicial; futuras ediciones se realizan desde el módulo Manual.
INSERT INTO manual_usuario (id_manual, titulo, contenido)
VALUES (1, 'Manual de usuario BARBER X', 'BARBER X\nMANUAL DE USUARIO\nSistema web de gestión de barbería\nVersión 1.0 | Octubre de 2026\nGuía para clientes y administradores\n\nAPRENDICEZ:\nMaicol stiben tovar correa\nJefferson valderama\nSteveen Perez\n\n1. Introducción\nBARBER X es una aplicación web para apoyar la gestión básica de una barbería. Permite que los clientes creen una cuenta, inicien sesión y consulten los servicios disponibles. El perfil de administración permite gestionar los registros de clientes, barberos y recepcionistas.\nEste manual explica cómo ingresar al sistema, utilizar sus opciones principales y resolver problemas comunes. La interfaz utiliza un diseño oscuro con detalles dorados y puede adaptarse a pantallas de computador, tableta y celular.\n\n2. Objetivo del manual\nOrientar al usuario para que pueda utilizar BARBER X de forma correcta, desde el registro o inicio de sesión hasta la consulta de servicios y la administración de personas autorizadas.\n\n3. Requisitos para utilizar el sistema\nUn navegador web actualizado, como Google Chrome o Microsoft Edge.\nPara ejecutar el proyecto localmente: un entorno de servidor como XAMPP con Apache, PHP y MySQL habilitados.\nLa base de datos MySQL llamada barber_x y las tablas que utiliza la aplicación.\nLos archivos del proyecto ubicados dentro de la carpeta pública de XAMPP, normalmente htdocs.\nConexión correcta entre PHP y MySQL configurada en backend/repositories/DatabaseRepository.php.\nImportante: los archivos entregados incluyen el script database/schema.sql, que crea las tablas recepcionista y cuenta_cliente y agrega servicios de ejemplo. El propio script indica que las tablas cliente, barbero y servicio ya deben existir; por tanto, antes de usarlo debe estar instalada la estructura completa de esas tablas.\n\n4. Cómo iniciar el sistema\nAbra el panel de control de XAMPP.\nInicie los servicios Apache y MySQL.\nCopie la carpeta del proyecto dentro de C:\\\\xampp\\\\htdocs\\\\. Mantenga las rutas relativas de los archivos.\nAbra phpMyAdmin desde http://localhost/phpmyadmin.\nSeleccione o cree la base de datos barber_x e importe el archivo database/schema.sql. Verifique previamente que las tablas cliente, barbero y servicio existan.\nRevise backend/repositories/DatabaseRepository.php: el servidor está configurado como localhost, la base de datos como barber_x y el usuario como root. La contraseña está vacía en el archivo entregado; ajústela si su instalación de MySQL utiliza otra.\nAbra el sistema desde una dirección local como http://localhost/nombre-de-la-carpeta/frontend/index.html. Reemplace nombre-de-la-carpeta por el nombre real de la carpeta del proyecto.\nNo abra frontend/index.html haciendo doble clic desde el explorador de archivos: las funciones PHP y las solicitudes a la API necesitan ejecutarse desde el servidor local.\n\nInicio de sesión\n\n5.1 Ingresar como cliente\nEn la pantalla de bienvenida, escriba su correo electrónico en el campo “Usuario o correo electrónico”.\nEscriba la contraseña registrada.\nPulse “Iniciar sesión”.\nSi los datos son correctos, se abrirá el espacio del cliente.\nSi aparece un mensaje de error, compruebe que el correo y la contraseña estén escritos correctamente. La cuenta de cliente se autentica con el correo y la contraseña que se definieron durante el registro.\n\n5.2 Crear una cuenta de cliente\nEn la pantalla de acceso, pulse “Regístrate aquí”.\nComplete nombre, apellido, correo electrónico, teléfono y contraseña.\nLa contraseña debe tener al menos 8 caracteres.\nPulse “Crear cuenta de cliente”.\nSi el registro es válido, el sistema crea o vincula el registro del cliente y abre su sesión.\nEl correo debe tener un formato válido y no puede estar asociado a otra cuenta. Si el sistema indica que ya existe una cuenta, intente iniciar sesión con ella o utilice otro correo.\n\n5.3 Ingresar como administrador\nEn la pantalla de acceso, el administrador debe escribir el usuario configurado y su contraseña autorizada. El código reconoce el identificador “admin”, pero la contraseña válida depende del hash configurado en sesion.php. Solicite al responsable del proyecto las credenciales correctas; no se debe asumir una contraseña por defecto.\n\nEspacio del cliente\n\n6.1 Consultar servicios\nDespués de iniciar sesión, el cliente ve un saludo y la sección “Nuestros servicios”. Allí se muestran los servicios activos que están guardados en la base de datos, ordenados por nombre. Cada tarjeta presenta el nombre, una descripción, el precio y la duración.\n\n6.2 Servicios de ejemplo\nLos valores anteriores corresponden a los datos de ejemplo incluidos en database/schema.sql. El precio y la duración reales pueden cambiar según los datos vigentes en la base de datos.\nEn los archivos revisados no aparece una opción de reservar citas desde la pantalla del cliente; esta versión permite consultar los servicios, no confirmar una reserva desde esa vista.\n\n7. Panel de administración\nEl panel de administración presenta un menú lateral con tres secciones: Clientes, Barberos y Recepcionistas. Seleccione una sección para ver sus registros. En la parte superior se muestran contadores y un campo de búsqueda.\n\n7.1 Consultar y buscar registros\nSeleccione Clientes, Barberos o Recepcionistas en el menú.\nRevise la lista que aparece en la tabla.\nUse el campo de búsqueda para filtrar por nombre o correo electrónico.\nLos contadores resumen el total y algunos datos de los registros de la sección seleccionada.\n\n7.2 Crear un registro\nPulse “Agregar barbero” o “Agregar recepcionista”, según corresponda.\nComplete nombre, apellido, correo y teléfono.\nPara un barbero, indique también su especialidad.\nCuando esté disponible, seleccione el estado Activo o Inactivo.\nPulse “Guardar”. Si desea salir sin guardar, pulse “Cancelar” o cierre el formulario.\n\n7.3 Editar un registro\nBusque a la persona en la tabla.\nPulse el botón con el símbolo de lápiz en su fila.\nModifique los datos necesarios.\nGuarde los cambios y compruebe que la lista se actualice.\n\n7.4 Eliminar un registro\nLocalice el registro que desea retirar.\nPulse el botón de eliminar (símbolo de papelera o borrado) en la fila correspondiente.\nConfirme la acción si la interfaz solicita confirmación.\nAdvertencia: eliminar puede ser una acción irreversible y podría afectar información relacionada. Verifique cuidadosamente el registro antes de continuar.\n\n7.5 Estados y validaciones\nLos campos nombre, apellido, teléfono y correo son obligatorios en el formulario de administración.\nEl correo debe ser válido y no debe repetirse dentro de la misma categoría.\nLos barberos requieren una especialidad.\nLos registros de barberos y recepcionistas pueden marcarse como activos o inactivos.\nSolo una sesión con rol de administrador puede crear, consultar, editar o eliminar registros desde el módulo de administración.\n\n8. Cerrar sesión\nPulse “Cerrar sesión” en la parte superior de la pantalla.\nEl sistema termina la sesión actual.\nPara volver a utilizar el sistema, inicie sesión de nuevo.\nCierre sesión cuando termine de utilizar el sistema, especialmente si comparte el computador con otras personas.\n\n9. Solución de problemas\n\n10. Recomendaciones de uso y seguridad\nNo comparta su contraseña ni utilice credenciales de administrador en cuentas de uso común.\nUse contraseñas de al menos 8 caracteres y evite reutilizar contraseñas personales.\nMantenga una copia de seguridad de la base de datos antes de modificar tablas o eliminar registros.\nRegistre información real, completa y actualizada.\nEn un despliegue público, cambie las credenciales de ejemplo, configure una contraseña segura para MySQL y utilice HTTPS.\nSi ocurre un error, anote el mensaje que aparece y comuníquelo al encargado del sistema.\n\n11. Alcance de la versión documentada\nEste manual se elaboró a partir de los archivos entregados: frontend/index.html, styles.css, backend/repositories/DatabaseRepository.php, database/schema.sql, personas.php, servicios.php y sesion.php. La versión documentada incluye registro e inicio de sesión de clientes, consulta de servicios y administración de clientes, barberos y recepcionistas.\nLos archivos proporcionados no muestran un flujo funcional para que el cliente reserve una cita ni un módulo de pagos. Aunque el proyecto está orientado a la gestión de una barbería y la base de datos hace referencia a citas, estas funciones no se describen como acciones disponibles en la interfaz revisada.\n\n12. Glosario\nAdministrador: Usuario autorizado para gestionar los registros del sistema.\nCliente: Persona que crea una cuenta e ingresa para consultar los servicios.\nBarbero: Persona que presta los servicios de barbería y puede tener una especialidad registrada.\nRecepcionista: Integrante del personal registrado para apoyar la recepción.\nServicio activo: Servicio que está habilitado para aparecer en la consulta del cliente.\nBase de datos: Lugar donde se almacenan los registros que utiliza la aplicación.\nSesión: Estado temporal que permite reconocer al usuario después de iniciar sesión.')
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), contenido = VALUES(contenido);

-- Las siguientes actualizaciones normalizan nombres y precios de servicios heredados.
-- Si ya existe el nombre vigente, desactiva el servicio antiguo; si no, conserva su historial renombrándolo.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Corte clásico a tijera o máquina'
SET legacy.activo = 0
WHERE legacy.nombre = 'Corte clásico' AND actual.id_serv IS NOT NULL AND actual.activo = 1;
-- Evita crear una segunda versión cuando el nombre actual todavía no está en el catálogo.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Corte clásico a tijera o máquina'
SET legacy.nombre = 'Corte clásico a tijera o máquina'
WHERE legacy.nombre = 'Corte clásico' AND actual.id_serv IS NULL;

-- Sustituye el nombre anterior del corte degradado sin duplicar el servicio vigente.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Corte fade (degradado)'
SET legacy.activo = 0
WHERE legacy.nombre = 'Corte degradado' AND actual.id_serv IS NOT NULL AND actual.activo = 1;
-- Renombra el corte degradado solo cuando el catálogo aún no tiene su nombre vigente.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Corte fade (degradado)'
SET legacy.nombre = 'Corte fade (degradado)'
WHERE legacy.nombre = 'Corte degradado' AND actual.id_serv IS NULL;

-- Si ya existe el nombre vigente, desactiva el perfilado de barba heredado para evitar duplicarlo.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Perfilado y diseño de barba'
SET legacy.activo = 0
WHERE legacy.nombre = 'Arreglo de barba' AND actual.id_serv IS NOT NULL AND actual.activo = 1;
-- Renombra el perfilado de barba únicamente cuando todavía no existe el nombre actual.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Perfilado y diseño de barba'
SET legacy.nombre = 'Perfilado y diseño de barba'
WHERE legacy.nombre = 'Arreglo de barba' AND actual.id_serv IS NULL;

-- Desactiva el afeitado heredado si el catálogo ya contiene su versión vigente.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Afeitado clásico con navaja'
SET legacy.activo = 0
WHERE legacy.nombre = 'Arreglo de barba con navaja' AND actual.id_serv IS NOT NULL AND actual.activo = 1;
-- Conserva el registro y sus referencias renombrándolo si no existe la versión actual.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Afeitado clásico con navaja'
SET legacy.nombre = 'Afeitado clásico con navaja'
WHERE legacy.nombre = 'Arreglo de barba con navaja' AND actual.id_serv IS NULL;

-- Desactiva el servicio combinado anterior cuando ya existe su nombre actualizado.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Corte + barba'
SET legacy.activo = 0
WHERE legacy.nombre = 'Corte y barba' AND actual.id_serv IS NOT NULL AND actual.activo = 1;
-- Renombra el servicio combinado heredado si no hay otra fila con el nombre actual.
UPDATE servicio legacy
LEFT JOIN servicio actual ON actual.nombre = 'Corte + barba'
SET legacy.nombre = 'Corte + barba'
WHERE legacy.nombre = 'Corte y barba' AND actual.id_serv IS NULL;

-- Marca como inactivo el registro cuyo texto quedó dañado por una codificación antigua.
UPDATE servicio
SET nombre = 'Corte clásico (registro anterior)', activo = 0
WHERE HEX(nombre) = '436F72746520636CE2949CC3AD7369636F';

-- Completa el catálogo con los servicios de ejemplo si todavía no existen.
INSERT INTO servicio (nombre, descripcion, precio, duracion, activo)
VALUES
  ('Corte clásico a tijera o máquina', 'Corte tradicional personalizado a tijera o máquina, con laterales, nuca y contornos definidos.', 25000.00, 40, 1),
  ('Corte fade (degradado)', 'Degradado bajo, medio o alto integrado con el largo superior; incluye perfilado de patillas y nuca.', 30000.00, 45, 1),
  ('Perfilado y diseño de barba', 'Recorte y diseño de barba según el rostro, con definición de mejillas, cuello y contornos.', 18000.00, 30, 1),
  ('Afeitado clásico con navaja', 'Preparación de la piel, espuma y afeitado preciso con navaja para un acabado suave y definido.', 20000.00, 35, 1),
  ('Corte + barba', 'Servicio combinado de corte personalizado y perfilado de barba, con acabado limpio en los contornos.', 42000.00, 65, 1)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- Refresca el texto inicial del manual para incluir los módulos y opciones actuales.
UPDATE manual_usuario
SET contenido = REPLACE(
  REPLACE(
    contenido,
    'ordenados por nombre. Cada tarjeta presenta el nombre, una descripción, el precio y la duración.',
    'presentados en el mismo orden del formulario de citas. Cada tarjeta muestra el nombre, la descripción, el precio y la duración.'
  ),
  'En los archivos revisados no aparece una opción de reservar citas desde la pantalla del cliente; esta versión permite consultar los servicios, no confirmar una reserva desde esa vista.',
  'Para agendar una cita, el cliente elige un servicio activo, un barbero disponible, una fecha y una hora disponible. El sistema verifica el horario del barbero y confirma si la reserva se realizó.'
)
WHERE id_manual = 1;

-- Sincroniza el texto del manual con los contenidos vigentes de la aplicación.
UPDATE manual_usuario
SET contenido = REPLACE(
  REPLACE(
    contenido,
    'Guía para clientes y administradores',
    'Guía para clientes, barberos y administradores'
  ),
  '5.2 Crear una cuenta de cliente',
  '5.2 Crear una cuenta de cliente\nPara crear una cuenta de barbero, el administrador debe registrar primero al barbero con su correo en la sección Barberos. En la pantalla de registro, seleccione Barbero, escriba ese correo y defina una contraseña de al menos 8 caracteres. La cuenta quedará asociada al registro y solo podrá ver sus propias citas, estadísticas y agenda diaria o semanal.\n\n5.2 Crear una cuenta de cliente'
)
WHERE id_manual = 1;

-- Actualiza en la guía los detalles de Anexos y el uso de los reportes.
UPDATE manual_usuario
SET contenido = REPLACE(
  contenido,
  'Para crear una cuenta de barbero, el administrador debe registrar primero al barbero con su correo en la sección Barberos. En la pantalla de registro, seleccione Barbero, escriba ese correo y defina una contraseña de al menos 8 caracteres. La cuenta quedará asociada al registro y solo podrá ver sus propias citas, estadísticas y agenda diaria o semanal.',
  'Solo el administrador puede crear una cuenta de barbero. En la sección Barberos, registre sus datos y defina una contraseña de al menos 8 caracteres; para cambiarla, edite el registro y escriba una nueva contraseña. Entregue la contraseña directamente al barbero. La cuenta solo podrá ver sus propias citas, estadísticas y agenda diaria o semanal.'
)
WHERE id_manual = 1;

-- Elimina del manual inicial las instrucciones de la tabla y el rol ya retirados.
UPDATE manual_usuario
SET contenido = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(contenido,
          'registros de clientes, barberos y recepcionistas',
          'registros de clientes y barberos'),
        'tres secciones: Clientes, Barberos y Recepcionistas',
        'dos secciones: Clientes y Barberos'),
      'Seleccione Clientes, Barberos o Recepcionistas',
      'Seleccione Clientes o Barberos'),
    'Agregar barbero” o “Agregar recepcionista”',
    'Agregar barbero'),
  'barberos y recepcionistas pueden marcarse como activos o inactivos',
  'los barberos pueden marcarse como activos o inactivos')
WHERE id_manual = 1;

-- Corrige instrucciones antiguas del manual sobre tablas y opciones fuera de uso.
UPDATE manual_usuario
SET contenido = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(contenido,
        'script database/schema.sql, que crea las tablas recepcionista y cuenta_cliente y agrega servicios de ejemplo. El propio script indica que las tablas cliente, barbero y servicio ya deben existir; por tanto, antes de usarlo debe estar instalada la estructura completa de esas tablas.',
        'script database/schema.sql crea las tablas actuales y los servicios de ejemplo que necesita el sistema.'),
      'Seleccione Clientes, Barberos o Recepcionistas en el menú.',
      'Seleccione Clientes o Barberos en el menú.'),
    'Pulse “Agregar barbero” o “Agregar recepcionista”, según corresponda.',
    'Pulse “Agregar barbero”.'),
  'administración de clientes, barberos y recepcionistas.',
  'administración de clientes y barberos.')
WHERE id_manual = 1;

UPDATE manual_usuario
SET contenido = REPLACE(
  contenido,
  'Recepcionista: Integrante del personal registrado para apoyar la recepción.',
  ''
)
WHERE id_manual = 1;

-- Limpia también manuales heredados con codificaciones o textos anteriores.
UPDATE manual_usuario
SET contenido = REGEXP_REPLACE(
  REGEXP_REPLACE(
    REPLACE(contenido,
      'clientes, barberos y recepcionistas.',
      'clientes y barberos.'),
    CONCAT('Pulse[^', CHAR(10), ']*Agregar recepcionista[^', CHAR(10), ']*'),
    'Pulse Agregar barbero.'),
  CONCAT('Recepcionista:[^', CHAR(10), ']*'),
  '')
WHERE id_manual = 1;

-- Migra columnas faltantes en instalaciones existentes y crea restricciones necesarias.
DELIMITER $$
CREATE PROCEDURE migrar_esquema_barber_x()
BEGIN
  -- Agrega el hash de contraseña a clientes de instalaciones antiguas.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cliente' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE cliente ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER email;
  END IF;

  -- Si el hash de cliente no es VARCHAR(255), amplía la columna sin borrar su contenido.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cliente' AND column_name = 'password_hash'
      AND (LOWER(data_type) <> 'varchar' OR character_maximum_length <> 255)
  ) THEN
    ALTER TABLE cliente MODIFY password_hash VARCHAR(255) DEFAULT NULL;
  END IF;

  -- Asegura que las credenciales de barbero también admitan hashes de hasta 255 caracteres.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cuenta_barbero' AND column_name = 'password_hash'
      AND (LOWER(data_type) <> 'varchar' OR character_maximum_length <> 255)
  ) THEN
    ALTER TABLE cuenta_barbero MODIFY password_hash VARCHAR(255) NOT NULL;
  END IF;

  -- Añade el indicador de autorización requerido para las cuentas de barbero.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cuenta_barbero' AND column_name = 'autorizada_por_admin'
  ) THEN
    ALTER TABLE cuenta_barbero
      ADD COLUMN autorizada_por_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash;
  END IF;
  -- Retira cuentas aún no autorizadas para respetar el acceso concedido por administración.
  DELETE FROM cuenta_barbero WHERE autorizada_por_admin = 0;

  -- Migra credenciales heredadas a cliente y elimina la tabla ya reemplazada.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'cuenta_cliente'
  ) THEN
    UPDATE cliente c
    INNER JOIN cuenta_cliente cc ON cc.id_clte = c.id_clte
    SET c.email = cc.email, c.password_hash = cc.password_hash
    WHERE c.password_hash IS NULL;
    DROP TABLE cuenta_cliente;
  END IF;

  -- Incorpora precio y notas a citas antiguas cuando todavía no existen.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cita' AND column_name = 'precio'
  ) THEN
    ALTER TABLE cita ADD COLUMN precio DECIMAL(10,2) DEFAULT NULL;
  END IF;

  -- Comprueba si la columna de notas existe y la agrega a las citas antiguas si falta.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cita' AND column_name = 'notas'
  ) THEN
    ALTER TABLE cita ADD COLUMN notas VARCHAR(500) DEFAULT NULL;
  END IF;

  -- Consulta los índices declarados y crea el índice de agenda si falta.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cita' AND index_name = 'cita_barbero_fecha_idx'
  ) THEN
    CREATE INDEX cita_barbero_fecha_idx ON cita (id_barbero, fecha_hora);
  END IF;

  -- Añade a las relaciones cita-servicio la tarifa histórica que se cobró en la reserva.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'cita_servicio' AND column_name = 'precio'
  ) THEN
    ALTER TABLE cita_servicio ADD COLUMN precio DECIMAL(10,2) DEFAULT NULL;
  END IF;
END$$
-- Ejecuta la migración y elimina su procedimiento auxiliar al terminar.
CALL migrar_esquema_barber_x()$$
DROP PROCEDURE migrar_esquema_barber_x$$
DELIMITER ;
