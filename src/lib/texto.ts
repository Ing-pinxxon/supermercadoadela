/**
 * Agrupar lo que está escrito de formas distintas.
 *
 * En la tienda nadie escribe igual dos veces: «Mac pollo», «Macpollo» y
 * «Mac Pollo» son el mismo proveedor, y «Doña Rosa» y «dona rosa» la misma
 * persona. La clave es el nombre en minúsculas, sin tildes y sin nada que no
 * sea letra o número.
 *
 * Hay dos versiones de lo mismo, y tienen que dar igual: `clave()` para cuando
 * el texto ya está en JavaScript, y `claveSql()` para agrupar dentro de una
 * consulta. Si se cambia una, se cambia la otra.
 */

const CON_TILDE = "áéíóúüñÁÉÍÓÚÜÑ";
const SIN_TILDE = "aeiouunAEIOUUN";

export function clave(texto: string): string {
  let sinTildes = "";
  for (const letra of texto) {
    const i = CON_TILDE.indexOf(letra);
    sinTildes += i === -1 ? letra : SIN_TILDE[i];
  }
  return sinTildes.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** La misma normalización, pero para agrupar dentro de una consulta. */
export function claveSql(columna: string): string {
  return `regexp_replace(
    lower(translate(${columna}, '${CON_TILDE}', '${SIN_TILDE}')),
    '[^a-z0-9]', '', 'g')`;
}
