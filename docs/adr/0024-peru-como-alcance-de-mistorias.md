# ADR 0024: El Perú como alcance de Mistorias

## Estado

Aceptado

## Contexto

Mistorias nació mirando la educación desde Arequipa: el Misti está en el símbolo,
`/acerca` decía «desde Arequipa» y la política de temas del repositorio de contenido
excluía `arequipa` por ser «el lugar desde el que mira la marca, presente en toda
historia».

El alcance cambió: Mistorias cuenta la educación de todo el Perú. Arequipa deja de
ser el límite y pasa a ser el origen. Dos cosas dependían de que fuera el límite:

- El texto público y los documentos de marca que decían «desde Arequipa».
- La regla de temas. Un tema que aplica a todo el sitio no separa nada (ver
  `TEMAS.md` en `mistorias-contenido`); con el nuevo alcance eso vale para `peru` y
  ya no para `arequipa`, que distingue unas historias de otras igual que `piura` o
  `junin`.

## Decisión

1. **El alcance es el Perú.** `/acerca` dice que Mistorias mira la educación «en todo
   el Perú, nacido en Arequipa». La guía editorial y la identidad visual de
   `mistorias-esencia-de-marca` dicen lo mismo.
2. **`peru` no es un tema; `arequipa` sí.** `peru` sigue excluido porque es el alcance
   de todo el sitio. `arequipa` sale de la lista de exclusiones y se usa, como
   cualquier otro lugar, en toda historia que la mencione. `/contenido` deja de
   listarla entre los temas que no se verán.
3. **Las historias ya publicadas se etiquetan.** Las diez que nombran Arequipa
   llevan ahora el tema `arequipa`; las dos que no la nombran quedan igual. El sitio
   ya genera `/temas/arequipa/` sin tocar código.
4. **El Misti se queda en el símbolo.** Es la memoria del origen, no una promesa de
   alcance; cambiar el símbolo no hace falta para cambiar el alcance.
5. **Los registros históricos no se reescriben.** Este ADR reemplaza lo que el
   [ADR 0006](0006-sistema-de-diseno-del-sitio.md) dice sobre `arequipa` como tema
   excluido; ese texto queda como el registro de lo que se decidió entonces. El
   [ADR 0002](0002-astro-como-framework.md) solo cambia el dato de audiencia
   («Perú, América Latina»).

## Consecuencias

- Quien publique una historia pregunta por el lugar: si la historia nombra Arequipa,
  el tema `arequipa` va; si nombra otra región, va esa.
- Una historia que nombra Arequipa solo de pasada también lleva el tema. Es la regla
  más simple de aplicar y de auditar, a costa de que la página del tema reúna algunas
  historias donde Arequipa no es el eje. Si eso empieza a restar, se puede pedir que
  sea el eje, como hoy con `docentes`.
- El máximo de siete temas por historia sigue valiendo: una historia con seis temas y
  Arequipa llega justo al tope.
- Nada cambia en el build ni en las rutas.
