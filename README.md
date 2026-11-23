# BARBER X

Sistema web para la gestión de una barbería. Permite administrar clientes,
barberos, servicios, citas, reportes y contenido de ayuda; los clientes pueden
registrarse, reservar y gestionar sus citas.

# INTEGRANTES
- Steveen Perez Polania
- Maicol Stiben Correa Tovar
- jefferson Andres Valderrama Murcia

## Tecnologías y requisitos

- **Interfaz:** HTML5, CSS y JavaScript nativo, sin framework ni gestor de
  paquetes de frontend.
- **Servidor:** PHP **8.0 o posterior**. El código usa expresiones `match` y
  tipos unión, disponibles desde PHP 8.0. El entorno revisado tiene PHP 8.2.12.
- **Base de datos:** MySQL o MariaDB, mediante PDO con el controlador
  `pdo_mysql`. El esquema usa InnoDB y `utf8mb4`; no fija una versión concreta
  del servidor.
- **Video:** la extensión PHP `fileinfo` se usa para comprobar que los archivos
  cargados sean MP4.
- **Servidor local:** XAMPP con Apache, PHP y MySQL/MariaDB.
- **Navegador:** uno moderno con soporte para JavaScript, `fetch` y sesiones web.
- **Git:** opcional; se puede copiar la carpeta del proyecto en vez de clonarlo.

No hay dependencias de Composer ni npm en el proyecto.

## Arquitectura

El sistema separa presentación, lógica de aplicación y persistencia. Los
controladores reciben las peticiones HTTP, los servicios aplican reglas y
autorización, y el repositorio encapsula PDO y las operaciones SQL.

```text
Frontend (HTML/CSS/JavaScript)
    → Controllers (HTTP/JSON)
        → Services (reglas y permisos)
            → Repositories (PDO)
                → MySQL/MariaDB
```

Los controladores están en `backend/controllers/`, los servicios en
`backend/services/` y la clase de acceso a datos en
`backend/repositories/ConexionBaseDatos.php`.

## Estructura del proyecto

```text
barber_x/
├── .gitignore
├── README.md
├── index.html
├── backend/
│   ├── config/
│   │   └── .htaccess
│   ├── controllers/
│   │   ├── ApiResponse.php
│   │   ├── barberos.php
│   │   ├── calidad.php
│   │   ├── citas.php
│   │   ├── manual.php
│   │   ├── personas.php
│   │   ├── reportes.php
│   │   ├── servicios.php
│   │   ├── sesion.php
│   │   └── video.php
│   ├── repositories/
│   │   ├── .htaccess
│   │   └── ConexionBaseDatos.php
│   └── services/
│       ├── .htaccess
│       ├── barberos.php
│       ├── calidad.php
│       ├── calidad_logger.php
│       ├── citas.php
│       ├── manual.php
│       ├── personas.php
│       ├── reportes.php
│       ├── servicios.php
│       ├── sesion.php
│       └── video.php
├── database/
│   └── schema.sql
├── docs/
│   ├── .htaccess
│   └── documentos/
│       ├── DOCUMENTACION_TECNICA.md
│       ├── modelo_entidad_relacion.svg
│       ├── PAC.docx
│       └── SRS_Barber_X.docx
└── frontend/
    ├── favicon.svg
    ├── css/
    │   ├── components.css
    │   ├── modules.css
    │   ├── responsive.css
    │   └── styles.css
    ├── images/
    │   └── manual/
    │       ├── paso-1.png
    │       ├── paso-2.png
    │       ├── paso-3.png
    │       ├── paso-4.png
    │       ├── paso-5.png
    │       ├── paso-6.png
    │       └── paso-7.png
    └── js/
        ├── appointments.js
        ├── barbers.js
        ├── common.js
        ├── manual.js
        ├── people.js
        ├── quality.js
        ├── reports.js
        ├── services.js
        ├── session.js
        └── video.js
```

El `index.html` principal está en la raíz. Su elemento `<base>` apunta a
`frontend/`, donde están los estilos, scripts e imágenes.

## Módulos

| Módulo | Función |
|---|---|
| Sesión | Consulta e inicia/cierra sesiones; permite el autorregistro de clientes. |
| Personas | Permite al administrador consultar, crear, editar y eliminar clientes y barberos. Al crear un barbero también gestiona su cuenta autorizada. |
| Barberos | Proporciona a usuarios autenticados la lista de barberos activos para las reservas. |
| Servicios | Presenta el catálogo; los usuarios no administradores ven los servicios activos y el administrador puede crearlos o editarlos. |
| Citas | Consulta agendas y horarios, crea citas para clientes, permite cancelar o reprogramar citas propias y deja al administrador actualizar estados. Los horarios se ofrecen de 7:00 a 20:00 en intervalos de 45 minutos. |
| Reportes | Presenta indicadores de citas, clientes, actividad por servicio e ingresos de citas completadas; permite guardar reportes, consultar hasta 100 registros históricos y descargar archivos `.xls`. |
| Calidad | Permite enviar errores y sugerencias. El administrador puede consultar hasta 200 registros y cambiar su estado. Los errores de aplicación también se envían al registro de PHP. |
| Manual y documentos | Muestra el manual almacenado en la base de datos; el administrador puede editarlo o eliminarlo. El controlador también sirve los documentos permitidos de `docs/documentos/`. |
| Video | Permite a usuarios autenticados consultar el tutorial; el administrador puede cargar, actualizar o eliminar el video MP4 y sus metadatos. |

## Instalación local en XAMPP

1. Instala XAMPP con Apache, PHP y MySQL/MariaDB. Comprueba que PHP tenga
   habilitados PDO MySQL (`pdo_mysql`) y `fileinfo`.
2. Copia la carpeta del proyecto dentro de `C:\xampp\htdocs\`. En la ubicación
   actual, el archivo principal está en
   `C:\xampp\htdocs\ST\barber_x\index.html`.
3. Abre el panel de XAMPP e inicia **Apache** y **MySQL**.
4. Abre `http://localhost/phpmyadmin/` y usa la opción **Importar** para
   seleccionar `database/schema.sql`. El script crea y selecciona la base
   `barber_x`, crea sus tablas y carga registros de ejemplo.
   **Precaución:** el esquema elimina la tabla heredada `recepcionista` si
   existe y contiene operaciones de migración. Haz una copia de seguridad antes
   de importarlo en una base que ya tenga datos.
5. Revisa `backend/repositories/ConexionBaseDatos.php`: la conexión está
   configurada para `localhost`, base `barber_x`, usuario `root` y contraseña
   vacía, como en la configuración local habitual de XAMPP. Si tu instalación
   usa otros datos, cambia esos valores en el archivo. No uses esta
   configuración local sin asegurarla en un servidor público.
6. Para comprobar la conexión, confirma en phpMyAdmin que existe `barber_x` y
   sus tablas. Después abre la aplicación y registra una cuenta de cliente; el
   registro se guarda en MySQL.
7. Con el proyecto en su ubicación actual, abre
   `http://localhost/ST/barber_x/`. Si lo copiaste con otro nombre bajo
   `htdocs`, usa `http://localhost/<nombre-de-carpeta>/`. No abras `index.html`
   directamente desde el explorador de archivos: la API necesita Apache y PHP.

Para cargar videos, el servicio admite archivos MP4 de hasta 220 MB. Si PHP
rechaza la carga antes de que llegue a la aplicación, revisa los límites
`upload_max_filesize` y `post_max_size` de PHP.

## Roles y datos de ejemplo

- **Administrador (`admin`):** gestiona personas, servicios, citas, reportes,
  calidad, manual y video. El esquema no crea una fila de administrador; el
  identificador se comprueba en `backend/services/sesion.php` contra un hash.
  No se incluye aquí una contraseña ni se debe asumir una clave por defecto.
- **Cliente:** puede registrarse desde la interfaz, consultar servicios y
  gestionar sus propias citas, además de enviar sugerencias o errores.
- **Barbero:** su cuenta la crea y autoriza el administrador; debe estar activo
  y autorizado para iniciar sesión. Consulta su agenda, sin acceso a los datos
  de contacto ni a las notas de los clientes.

`database/schema.sql` incluye registros de ejemplo en las tablas `cliente`,
`barbero` y `cuenta_barbero`; las contraseñas de esas cuentas se almacenan como
hashes. Para consultarlos en phpMyAdmin, selecciona `barber_x`, abre la pestaña
**SQL** y ejecuta, por ejemplo:

```sql
SELECT id_clte, nombre, apellido, email FROM cliente ORDER BY id_clte;

SELECT b.id_barbero, b.nombre, b.apellido, b.email, cb.autorizada_por_admin
FROM barbero AS b
LEFT JOIN cuenta_barbero AS cb ON cb.id_barbero = b.id_barbero
ORDER BY b.id_barbero;
```

Las consultas omiten los hashes y no revelan contraseñas.

## Seguridad observada

- `backend/config/.htaccess`, `backend/services/.htaccess`,
  `backend/repositories/.htaccess` y `docs/.htaccess` contienen
  `Require all denied` para bloquear el acceso HTTP directo a esas carpetas.
  La API se expone mediante los archivos de `backend/controllers/`.
- Las contraseñas se generan con `password_hash()` y se validan con
  `password_verify()`. Las sentencias que reciben valores usan consultas PDO
  preparadas con parámetros.
- Las sesiones configuran cookies `HttpOnly`, `SameSite=Lax` y `Secure` cuando
  se usa HTTPS.
- Los documentos no se sirven por una ruta de archivo arbitraria: el
  controlador `backend/controllers/manual.php` permite una lista fija de
  recursos, comprueba que el archivo exista y lo entrega como descarga o en
  línea. La ruta de documentos permitidos no exige una sesión; la API del
  manual almacenado sí requiere autenticación.
- `backend/services/calidad_logger.php` registra errores en el log estándar
  configurado en PHP y, cuando hay conexión, en la tabla de calidad.

Apache debe permitir el uso de `.htaccess` para que esas reglas se apliquen.

## Solución de problemas

- **Apache o MySQL no inicia:** puede haber otro servicio usando los puertos
  habituales de Apache (80/443) o MySQL (3306). Detén el servicio en conflicto
  o cambia el puerto en la configuración de XAMPP; si cambias el de Apache,
  usa ese puerto en la URL.
- **Error de conexión:** comprueba que MySQL esté iniciado, que hayas importado
  `database/schema.sql`, que exista `barber_x` y que los valores de conexión en
  `backend/repositories/ConexionBaseDatos.php` coincidan con tu instalación.
- **Error o acceso inesperado en carpetas protegidas:** confirma que Apache
  permita `.htaccess` (por ejemplo, `AllowOverride All` o `AllowOverride
  AuthConfig`) y tenga activa la autorización de acceso requerida por
  `Require all denied`.
- **Página sin estilos o API no encontrada:** sirve el proyecto desde Apache,
  usando la URL de la carpeta bajo `htdocs`. El punto de entrada es la raíz
  `index.html`; los recursos del frontend permanecen dentro de `frontend/`.
- **No se puede subir un video:** verifica que sea MP4, que no supere 220 MB,
  que `upload_max_filesize` y `post_max_size` de PHP permitan la carga y que
  Apache pueda escribir los archivos de video.

## Documentos del proyecto

- [Documentación técnica](docs/documentos/DOCUMENTACION_TECNICA.md)
- [Especificación de requisitos (SRS)](docs/documentos/SRS_Barber_X.docx)
- [Plan de aseguramiento de calidad (PAC)](docs/documentos/PAC.docx)
- [Modelo entidad-relación](docs/documentos/modelo_entidad_relacion.svg)
