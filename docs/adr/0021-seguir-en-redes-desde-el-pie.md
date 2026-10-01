# ADR 0021: Seguir a Mistorias en redes desde el pie

## Estado

Aceptado

## Contexto

El [issue #148](https://github.com/mistorias/mistorias-web/issues/148) pide que quien
lee pueda seguir a Mistorias en Instagram, Facebook y X, sin que sea invasivo, sin
JavaScript y con un texto que invite de verdad. Compartir una historia queda fuera
de alcance.

Había que decidir cuatro cosas: dónde va, con qué se hace, cómo se ve y qué dice.

## Decisión

### Dónde: una franja al inicio del pie

La invitación va en el pie, en la misma franja que el nombre de la marca y la nota
de misión. Una línea (`--color-borde`) la separa de los enlaces de transparencia.
Aparece cuando la lectura ya terminó y no compite con ella.

Se descartaron:

- **Un botón fijo en una esquina.** Choca con el panel de fuente de `DatoConFuente`,
  que ya está fijo al borde inferior del viewport (ADR 0010), y en móvil tapa texto
  mientras se lee. Es justo lo que el issue pide evitar.
- **La cabecera.** Ahí competiría con la navegación principal y pondría a las redes
  por delante de las historias.

### Con qué: enlaces simples, sin AddToAny

Cada red es un `<a>` con un SVG en línea. AddToAny, la referencia del issue, carga
JavaScript y rastreo de terceros, y la CSP del sitio tiene `script-src 'none'`. Un
enlace directo no envía datos de quien lee a nadie hasta que hace clic, y así
mantiene la transparencia que el sitio promete.

- Las URLs viven solo en `src/lib/social/profiles.ts`. Los glifos vienen de
  [Simple Icons](https://simpleicons.org) (CC0) y se escriben como markup de
  `RedesSociales.astro`, no con `set:html`, así que no hay archivo que pasar por
  `inline-svg-gate.ts`.
- La "f" de Facebook es solo la letra. El ícono original es un disco relleno con la
  letra calada, y dentro del aro se habría visto como un botón macizo al lado de dos
  trazos.
- Los enlaces llevan `rel="me"`, que declara que esos perfiles son de Mistorias, y
  abren en una pestaña nueva avisándolo: es el estándar de todo enlace externo del
  sitio, en el [ADR 0022](0022-enlaces-externos-en-pestana-nueva-con-aviso.md). La
  primera versión de este ADR los abría en la misma pestaña; se cambió porque quien
  sigue a Mistorias desde el pie no debe perder su lugar en la historia.

### Cómo se ve: aros en `--color-acento`

Solo el glifo, dentro de un aro de 44px con fondo transparente. Línea y glifo van
en `--color-acento`, que es el Wine Red en modo claro y su tinte aclarado en modo
oscuro, así que queda dentro de la paleta en los dos temas sin un token nuevo. El
blanco que mencionaba el issue desaparece sobre el fondo claro.

- Al pasar el puntero, el aro se rellena y el glifo toma `--color-superficie`.
- El anillo de foco global sigue el círculo.
- Cada enlace se anuncia como «Mistorias en Instagram» (`.sr-only`) seguido del
  aviso de pestaña nueva, y la lista va rotulada por la frase que invita.

### Qué dice: la misión y la invitación, en una sola nota

> No queremos solo informarte: cada semana, una historia para que veas, entiendas y
> quieras transformar la educación. **Síguenos y no te pierdas la próxima.**

La nota de misión (issue #32) ahora termina en la invitación, resaltada en
`--color-acento`, justo al lado de los íconos. «Cada semana» refleja el ritmo real
de publicación, el mismo que muestra el quipu (ADR 0020).

### Disposición y la excepción a las container queries

En fila, una grilla de tres columnas (nombre, nota, redes) con
`align-items: center`. Las redes se centran contra el alto de la nota, tenga las
líneas que tenga, y como cada pieza vive en su columna, la nota nunca queda debajo
de los íconos.

A 390px las tres columnas no caben: a la nota le quedarían unos 110px, cerca de 15
caracteres por línea. Bajo 36rem de franja, todo se apila y se centra.

Ese corte lo decide una **container query** sobre la propia franja, no una media
query de viewport. El límite es el ancho de la franja, no un dispositivo (ADR 0006).

ADR 0012 descartó las container queries en la portada porque `container-type`
aplica `contain: layout` y desancla el panel `position: fixed` de `DatoConFuente`.
Esa razón no aplica aquí: el pie no contiene nada fijo. **Quien agregue algo
`position: fixed` dentro del pie debe revisar esta decisión.**

## Consecuencias

- El pie gana una franja que ocupa algo más de alto que la nota sola.
- Cambiar el usuario de una red se corrige en `profiles.ts`.
- Agregar una red requiere su glifo en `RedesSociales.astro` y su entrada en
  `profiles.ts`. El tipo `SocialNetwork` obliga a hacer las dos cosas.
- La nota de misión y la invitación ahora son un solo texto. Para editar una hay que
  leer la otra.
