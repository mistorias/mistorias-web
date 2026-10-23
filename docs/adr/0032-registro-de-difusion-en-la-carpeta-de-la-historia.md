# ADR 0032: El registro de difusión en redes vive en la carpeta de la historia

## Estado

Aceptado. Amplía el gate de carpetas del
[ADR 0005](0005-imagenes-en-historias.md), que hasta ahora solo admitía
`principal.jpg`.

## Contexto

mistorias-redes-sociales difunde cada historia publicada en Facebook, Instagram
y X a través de Buffer, con un flujo automático
([su ADR 0003](https://github.com/mistorias/mistorias-redes-sociales/blob/main/docs/adr/0003-flujo-de-difusion-automatica.md)).
"Difusión" es el término para los posts en redes; "Publicación" sigue siendo
poner el sitio en producción (ver [CONTEXT.md](../../CONTEXT.md)).
Lo que salió en cada red —texto, fecha, id de Buffer, enlace con UTM— se
registra en mistorias-contenido para auditarlo, evitar publicar dos veces y
cruzarlo con las métricas.

El registro podía vivir en una carpeta aparte (`difusiones/<slug>.json`) o en
la carpeta que ya tiene la historia (`stories/<slug>/`). Una carpeta aparte
repite la lista de slugs en un segundo lugar, que puede desincronizarse de
`stories/` sin que nada lo note. La carpeta de la historia ya existe para eso:
reúne lo que pertenece a una historia.

El gate `story-asset-folders.ts` rechaza cualquier archivo que no sea
`principal.jpg` dentro de esa carpeta. Lo hace por una razón que sigue vigente:
que ahí no entre nada sin revisar, en especial un `.md` que escaparía al gate
anti-HTML (hallazgo del ADR 0005).

## Decisión

- El registro vive en `stories/<slug>/difusion.json`. El contrato editorial
  (quién lo escribe y para qué sirve cada campo) está en
  [docs/registro-de-difusion.md](https://github.com/mistorias/mistorias-contenido/blob/main/docs/registro-de-difusion.md)
  de mistorias-contenido.
- La allow list del gate pasa a tener dos nombres exactos: `principal.jpg` y
  `difusion.json`. Sigue siendo una lista literal: una variante
  (`Difusion.json`, `difusion.yml`) se rechaza igual que antes.
- `difusion.json` se valida contra un esquema estricto
  (`src/lib/content/story-broadcast.ts`): tiene que ser JSON, sin campos que
  el esquema no declare, y con `story` igual al nombre de su carpeta. Admitir el
  archivo sin validarlo reabriría el agujero que el gate cierra.
- El formato es JSON; el porqué y sus trade-offs están en el
  [ADR 0034](0034-formato-json-del-registro-de-difusion.md).
- La web no lo lee ni lo renderiza. Validarlo aquí es el precio de compartir la
  carpeta, no una dependencia del sitio.

## Consecuencias

- Una carpeta de historia puede existir solo con `difusion.json`, sin
  imagen. `story-image-requirements.ts` mira si existe `principal.jpg`, no la
  carpeta, así que no cambia.
- El esquema vive en este repo, pero quien escribe el archivo es
  mistorias-redes-sociales. Un cambio de esquema exige coordinar los dos repos:
  primero se amplía aquí y después se escribe allá. Si no, el PR diario
  `contenido/actualizar` falla.
- Este cambio tiene que fusionarse **antes** que el primer `difusion.json`
  en mistorias-contenido.
