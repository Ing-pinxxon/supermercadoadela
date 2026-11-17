-- Usuario de la base SOLO para la API del catálogo.
--
-- Para qué: que la API de Java no pueda leer ni cambiar las tablas de caja,
-- fiados y tareas, aunque tuviera un error. Solo es dueña de su esquema
-- «catalogo». Si alguien sacara su clave, tampoco llegaría a las cuentas.
--
-- Cómo: en https://console.neon.tech → tu proyecto → SQL Editor, pega esto,
-- cambia CAMBIA_ESTA_CLAVE por una clave larga inventada (solo letras y
-- números) y dale Run. Se corre una sola vez. Si tu base no se llama
-- «neondb» (sale arriba en el editor), cambia ese nombre en el paso 2.

-- 1. El usuario, con su propia clave.
CREATE ROLE catalogo_api WITH LOGIN PASSWORD 'CAMBIA_ESTA_CLAVE';

-- 2. Puede conectarse a la base y es dueño únicamente del esquema del catálogo.
GRANT CONNECT ON DATABASE neondb TO catalogo_api;
CREATE SCHEMA IF NOT EXISTS catalogo AUTHORIZATION catalogo_api;

-- 3. Nada sobre las tablas de la app (caja, fiados, tareas), ni las de hoy
--    ni las que se creen después.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM catalogo_api;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM catalogo_api;
REVOKE CREATE ON SCHEMA public FROM catalogo_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM catalogo_api;

-- 4. Comprobación: esto tiene que dar «permission denied».
--    SET ROLE catalogo_api; SELECT 1 FROM public.movimiento LIMIT 1; RESET ROLE;
