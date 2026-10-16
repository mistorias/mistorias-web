# ADR 0027: Los identificadores internos de los componentes van en inglés

## Estado

Aceptado. Reemplaza la parte de [docs/IDIOMA.md](../IDIOMA.md) que extendía la
excepción del castellano a las variables de los componentes.

## Contexto

`docs/IDIOMA.md` pone el código en inglés y hace una excepción para los
componentes, páginas y layouts de Astro. Esa excepción alcanzaba al nombre del
archivo, a las props y también a las variables de adentro (`grupos`, `enlace`),
con la idea de no partir el vocabulario de [CONTEXT.md](../../CONTEXT.md).

En la práctica, el interior de un `.astro` quedó mezclado. Variables en
castellano (`historias`, `esPrimera`, `redondeoDe`) convivían con nombres en
inglés que llegan de `src/lib/` y del esquema de contenido (`stories`, `theme`,
`base`, `neighbors`). Leer un componente obligaba a cambiar de idioma de una
línea a la siguiente, y decidir el idioma de una variable nueva dependía de qué
tan "del dominio" pareciera. Ese criterio es difuso, y cada quien lo resolvía
distinto.

## Decisión

El castellano se queda en la **interfaz** del componente:

- el nombre del archivo,
- sus props (las de un componente; ver abajo el caso de las páginas),
- los parámetros de ruta que nacen del nombre del archivo (`[tema]`, `[autor]`).

Es lo que se nombra cuando alguien usa el componente, y ahí el vocabulario de
CONTEXT.md comunica mejor.

Una página no tiene interfaz en ese sentido: nadie la usa como componente, y sus
props las llena solo su propio `getStaticPaths`. Por eso las props de una página
también van en inglés. Sus parámetros de ruta siguen en castellano, porque nacen
del nombre del archivo.

Todo lo de adentro va en inglés, como en `src/lib/`. Eso incluye variables,
funciones, parámetros, tipos y claves de objetos locales. Cuando una prop recibe
una variable, cada lado conserva su idioma: `<QuipuDeHistorias anos={years} />`.

No cambian las clases CSS, las custom properties, los valores de texto de una
prop (`redondeo="arriba"`), los `id` del HTML ni el texto para el lector, porque
ninguno de ellos es un identificador.

## Consecuencias

- Un `.astro` se lee en un solo idioma, salvo las props, y una variable nueva ya
  no exige decidir si es "del dominio".
- La frontera queda en un lugar que se ve: lo que aparece en `<Componente prop=…>`
  va en castellano, y todo lo demás en inglés.
- El cambio exige renombrar unos 140 identificadores en 31 archivos. Se hace en
  commits solo de renombre, uno por zona, y se verifica que el HTML generado
  quede idéntico.
- Los tests de componentes usan en castellano solo las props que pasan por
  nombre.
