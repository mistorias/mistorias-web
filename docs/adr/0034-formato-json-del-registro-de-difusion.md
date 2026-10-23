# ADR 0034: El registro de difusión se escribe en JSON

## Estado

Aceptado.

## Contexto

El [ADR 0032](0032-registro-de-difusion-en-la-carpeta-de-la-historia.md) ubica
el registro de difusión en redes en `stories/<slug>/difusion.json`. Falta
decidir el formato del archivo. Las condiciones son estas:

- Lo **escribe un bot** (mistorias-redes-sociales) y casi nunca una persona: una
  persona lo lee en el PR que lo trae.
- Lo **validan dos repos**: este, en el gate de carpetas, y redes-sociales, que
  lo lee para no difundir dos veces.
- Comparte la carpeta con `principal.jpg`, dentro de `stories/`, donde el glob
  de la colección es `stories/**/*.md`.

## Opciones

| Formato             | A favor                                                                                       | En contra                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JSON**            | Node y el navegador lo leen sin dependencias; sin ambigüedad de tipos; un bot lo escribe sin errores | Más ruidoso de leer a mano (comillas, llaves); no admite comentarios                                                                              |
| YAML                | Más legible a mano; admite comentarios                                                        | Suma un parser en dos repos; trampas de tipos: `no` se lee como `false`, una fecha sin comillas se convierte sola, la indentación cambia el sentido |
| Markdown con frontmatter | Igual que las historias                                                                  | El glob `stories/**/*.md` lo cargaría como una historia más y el esquema de historias lo rechazaría; un frontmatter de una línea por campo no soporta la lista de posts |

## Decisión

**JSON.** El archivo lo escribe y lo lee código, y el costo de leerlo a mano en
un PR es bajo frente a las ambigüedades que YAML trae en dos repos. Las claves
van en inglés, como las claves de frontmatter ([docs/IDIOMA.md](../IDIOMA.md)),
y los valores de dominio en castellano (`difundido`, `fallido`), con el mismo
precedente que `authorship` (`escrito-con-ia`).

## Consecuencias

- No hace falta ninguna dependencia nueva: `JSON.parse` y el esquema zod de
  `src/lib/content/story-broadcast.ts` alcanzan.
- Lo que haría falta comentar en el archivo va en el contrato de
  mistorias-contenido (`docs/registro-de-difusion.md`), no en el JSON.
- Si algún día una persona tuviera que editar estos registros con frecuencia,
  habría que reabrir esta decisión.
