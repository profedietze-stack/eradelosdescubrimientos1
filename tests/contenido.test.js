import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GLOSARIO } from '../data/glosario.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

/** El texto que el alumno llega a leer: los datos, la interfaz y la portada. */
function textosDelJuego() {
  const out = [];
  const mirar = (dir) => {
    for (const nombre of readdirSync(dir)) {
      if (['node_modules', '.git', 'dist', 'files_zip_extracted', 'tests'].includes(nombre)) continue;
      const ruta = join(dir, nombre);
      try {
        if (readdirSync(ruta)) { mirar(ruta); continue; }
      } catch { /* es un archivo */ }
      if (['.js', '.html'].includes(extname(nombre)) && !nombre.endsWith('.bak')) {
        out.push([ruta.slice(RAIZ.length), readFileSync(ruta, 'utf8')]);
      }
    }
  };
  mirar(RAIZ);
  return out;
}

/**
 * La Santa María no era una carabela.
 *
 * Era una **nao**: más ancha, más pesada y de mayor calado. Carabelas eran las otras dos, la
 * Pinta y la Niña, y por eso podían acercarse a la costa donde la capitana no. No es una
 * curiosidad de manual: es la razón por la que la Santa María encalló en La Española la noche
 * del 24 de diciembre y las otras dos volvieron a España.
 *
 * Y el juego ya lo sabía. Su propio glosario dice «Santa María: **Nao** capitana de Colón», y
 * en un evento acierta al hablar de «las dos carabelas que quedan —Pinta y Niña—». Lo que
 * había eran nueve lugares diciendo «las tres carabelas», uno de ellos justo al lado de la
 * palabra correcta.
 *
 * Dicho de otro modo: el alumno que abra el glosario lee una cosa y el que juegue, otra.
 */
describe('las naves de Colón', () => {
  it('el glosario sabe que la Santa María es una nao', () => {
    expect(GLOSARIO['Santa María']).toMatch(/\bnao\b/i);
  });

  it('y ningún texto del juego la mete en el grupo de las carabelas', () => {
    const malos = textosDelJuego()
      .flatMap(([ruta, txt]) =>
        [...txt.matchAll(/tres carabelas/gi)].map(() => ruta))
      .filter((v, i, a) => a.indexOf(v) === i);

    expect(malos, 'la Santa María era una nao, no una carabela').toEqual([]);
  });

  /**
   * Y al revés: que se siga diciendo carabelas de las dos que sí lo eran. Si alguien
   * «arreglara» esto borrando la palabra de todas partes, el juego perdería el término.
   */
  it('la Pinta y la Niña siguen llamándose carabelas', () => {
    const todo = textosDelJuego().map(([, t]) => t).join('\n');
    expect(todo).toMatch(/carabela/i);
    expect(GLOSARIO['Pinta']).toMatch(/carabela/i);
    expect(GLOSARIO['Niña']).toMatch(/carabela/i);
  });
});

/**
 * El mito de la Tierra plana, que es el error canónico sobre Colón.
 *
 * En 1492 la esfericidad de la Tierra era conocimiento corriente entre gente instruida y
 * entre navegantes: se veía todos los días en el casco de un barco que desaparece en el
 * horizonte antes que su vela, y Eratóstenes había medido el contorno del planeta mil
 * setecientos años antes.
 *
 * Lo que se discutía era el **tamaño**, y ahí está lo que vale la pena enseñar: Colón no usó
 * la medida de Eratóstenes sino otras mucho menores, y por eso creyó que Asia estaba a un mes
 * de viaje. Se equivocó en la cuenta, no en la forma.
 *
 * El juego decía que los marineros temían «que la Tierra tiene un borde más allá del cual
 * todo cae al vacío», y en otro evento que Aristóteles «había calculado» la esfericidad —
 * argumentó que era esférica; quien la midió fue Eratóstenes. El miedo real de la tripulación
 * de Palos era otro, más concreto y mejor: que los vientos del este no los dejaran volver.
 */
describe('la forma de la Tierra', () => {
  const todo = textosDelJuego().map(([, t]) => t).join('\n');

  it('el juego no repite el mito de la Tierra con un borde', () => {
    expect(todo).not.toMatch(/borde más allá del cual|Tierra (es|era) plana|cae al vacío/i);
  });

  it('y atribuye la medición del planeta a quien la hizo', () => {
    // Aristóteles argumentó la esfericidad; Eratóstenes midió el contorno.
    expect(todo).not.toMatch(/Aristóteles hab[íi]a calculado/i);
    expect(todo).toMatch(/Erat[óo]stenes/i);
  });

  /** Y que quede lo que sí se discutía, que es la parte que enseña. */
  it('conserva la discusión real: el tamaño del océano', () => {
    expect(todo).toMatch(/qu[ée] tan ancho|ancho .{0,12}oc[ée]ano|medidas? .{0,20}menores/i);
  });
});

/**
 * Las fechas y los nombres, comprobados contra el glosario del propio juego.
 *
 * El glosario es la capa de referencia: es lo que el alumno abre cuando quiere estar seguro.
 * Cuando el relato y el glosario dicen cosas distintas, el que se equivoca es el relato — y
 * el alumno no tiene forma de saber a cuál creerle.
 *
 * Tres desacuerdos había, y el primero es el dato más famoso de todo el tema:
 *
 * - Un evento fechaba el grito de «¡Tierra!» el **2 de octubre**. Fue el **12**, y así lo
 *   decía el glosario dos archivos más allá.
 * - Otro llamaba a San Salvador «hoy llamada Watling Island». Es al revés: Watling fue el
 *   nombre desde el siglo XVII, y en 1925 la isla recuperó el que le puso Colón.
 * - Y La Navidad figuraba como «primer asentamiento europeo en América». Español sí; europeo
 *   no, que los nórdicos estuvieron en Terranova quinientos años antes.
 */
describe('las fechas y los nombres', () => {
  const todo = textosDelJuego().map(([, t]) => t).join('\n');

  it('el avistamiento de tierra es el 12 de octubre en todos lados', () => {
    expect(GLOSARIO['San Salvador']).toMatch(/12 de octubre de 1492/);
    expect(GLOSARIO['Rodrigo de Triana']).toMatch(/12 de octubre de 1492/);
    // El «2 de octubre» sólo puede aparecer como parte de «12 de octubre».
    const sueltos = [...todo.matchAll(/(.)2 de octubre de 1492/g)].filter((m) => m[1] !== '1');
    expect(sueltos.map((m) => m[0])).toEqual([]);
  });

  it('San Salvador no se presenta como si hoy se llamara Watling', () => {
    expect(todo).not.toMatch(/hoy llamada Watling/i);
    expect(GLOSARIO['Watling Island']).toMatch(/1925/);
  });

  it('La Navidad es el primer asentamiento español, no el primero europeo', () => {
    expect(todo).not.toMatch(/primer asentamiento europeo/i);
    expect(GLOSARIO['La Navidad']).toMatch(/asentamiento español/i);
  });
});

/**
 * Un guardado editado a mano no puede volver la partida imposible de perder.
 *
 * `cargarPartida` mete el guardado en el estado con un `Object.assign` sin mirar la forma —
 * y en un aula el segundo día alguien abre la consola. El saneo estaba después, en el clamp
 * de cada turno, y ese clamp era `Math.max(0, Math.min(100, Math.round(v)))`, que **deja
 * pasar el NaN**: las dos comparaciones con NaN son falsas, así que sale intacto.
 *
 * Lo grave no es la barra rota. La derrota se comprueba con `moral <= 15`, y `NaN <= 15` es
 * falso: con un indicador en NaN el juego deja de poder perderse. Nada de lo que el alumno
 * decide importa, y no hay un solo error en pantalla que lo delate.
 */
describe('los indicadores aguantan un guardado editado', () => {
  it('cualquier basura cae en un número usable', async () => {
    const { clampIndicador } = await import('../js/utils.js');
    for (const basura of ['ochenta', NaN, undefined, {}, [1, 2], Infinity, -Infinity, null]) {
      const v = clampIndicador(basura);
      expect(Number.isFinite(v), `clampIndicador(${JSON.stringify(basura)}) = ${v}`).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('los números de verdad siguen pasando enteros y acotados', async () => {
    const { clampIndicador } = await import('../js/utils.js');
    expect(clampIndicador(80)).toBe(80);
    expect(clampIndicador('80')).toBe(80);
    expect(clampIndicador(79.6)).toBe(80);
    expect(clampIndicador(-50)).toBe(0);
    expect(clampIndicador(1e9)).toBe(100);
  });

  /** Y con eso la derrota vuelve a poder dispararse, que es el punto. */
  it('un indicador roto ya no vuelve la partida ingananble', async () => {
    const { clampIndicador } = await import('../js/utils.js');
    const moral = clampIndicador('ochenta');   // antes: NaN
    expect(moral <= 15).toBe(true);            // antes: false, y no se perdía nunca
  });
});
