# Accesibilidad

Mistorias existe para que una persona entienda en pocos minutos un problema
educativo real. Si una historia no se puede leer, recorrer o escuchar, esa
promesa no se cumple para esa persona. Por eso la accesibilidad no es una
revisión al final: es parte de cómo se diseña, se escribe y se construye el
sitio. Es el principio de **claridad** de la
[esencia de marca](https://github.com/mistorias/mistorias-esencia-de-marca)
—"hacer accesible lo complejo"— llevado al código.

Queremos que cualquier persona pueda leer, navegar y contribuir a este sitio,
incluidas las personas con discapacidad y quienes usan tecnologías de apoyo
(lectores de pantalla, navegación solo con teclado, ampliación de pantalla).

Este documento explica a qué nos comprometemos, qué pedimos a quien contribuye
y cómo reportar una barrera si te encontraste con una.

## Prioridades

- **Meta de accesibilidad:** trabajamos hacia
  [WCAG 2.2 nivel AA](https://www.w3.org/TR/WCAG22/). Es una meta que guía el
  trabajo, **no** una declaración de conformidad verificada: el sitio no ha
  pasado por una evaluación formal.
- **Teclado:** todo elemento interactivo se alcanza y se usa solo con teclado,
  en un orden lógico y con un anillo de foco visible. El sitio no envía
  JavaScript, así que cada control es un elemento nativo (`<a>`, `<button>`,
  `<details>`) y el navegador ya resuelve el foco y la activación.
- **Lector de pantalla:** HTML semántico, un solo `h1` por página, encabezados
  en orden (las tarjetas reciben su nivel por parámetro), regiones `header`/`nav`/`main`/`footer`, un enlace para
  saltar al contenido y `lang="es"` declarado. Cada tarjeta de historia tiene un
  solo enlace, para que nadie escuche el mismo destino dos veces.
- **Lectura:** lenguaje claro, una línea de lectura de 65 caracteres, contraste
  medido en modo claro y oscuro, enlaces dentro de las historias siempre
  subrayados para que no se distingan solo por color, y texto de enlace que dice a dónde lleva.
- **Imágenes:** toda imagen de una historia lleva texto alternativo; si falta,
  el sitio no se publica.
- **Adaptación:** el diseño se ajusta al ancho y al alto disponibles, respeta el
  tamaño de letra y el zoom de cada persona, y atiende `prefers-color-scheme` y
  `prefers-reduced-motion`.

El detalle técnico de estas decisiones está en
[ADR 0006](docs/adr/0006-sistema-de-diseno-del-sitio.md) (sistema de diseño),
[ADR 0005](docs/adr/0005-imagenes-en-historias.md) (imágenes),
[ADR 0015](docs/adr/0015-tarjeta-como-enlace-unico-accesible.md) (tarjetas) y
[ADR 0022](docs/adr/0022-enlaces-externos-en-pestana-nueva-con-aviso.md)
(enlaces externos).

## Qué pedimos a quien contribuye

Para no retroceder en lo ya logrado:

### Código y diseño

- **Recorrido con teclado** en todo cambio que toque algo interactivo:
  - El orden de tabulación es lógico: no salta, no se atasca y llega a todos
    los controles.
  - El foco siempre se ve (`--grosor-foco`) y contrasta con el fondo.
  - Todo funciona con Tab, Shift+Tab, Enter y Espacio.
  - Se puede entrar y salir de cualquier panel desplegable.
- **Revisión con lector de pantalla** en componentes nuevos o cambios grandes:
  - Se puede navegar por encabezados y regiones.
  - Cada control tiene un nombre que dice qué hace.
  - Las listas se anuncian como listas.
  - El orden de lectura tiene sentido y nada se repite ni se salta.
- **Contraste en los dos temas.** Los colores salen solo de los tokens de
  `src/styles/tokens.css`, donde cada contraste está anotado. Un color nuevo
  llega con su contraste medido.
- **Capturas** en celular vertical, celular horizontal y escritorio, en modo
  claro y oscuro, cuando el cambio es visual (ver
  [CLAUDE.md](CLAUDE.md#visual-verification-for-ui-changes)).
- **Sin componentes interactivos a medida.** Si un elemento nativo resuelve el
  caso, se usa ese.

La plantilla de PR incluye estas comprobaciones en su sección
**Accesibilidad**.

### Contenido

- Encabezados en orden, sin saltarse niveles.
- Listas escritas como listas, no como párrafos con guiones.
- Texto de enlace que se entiende fuera de contexto: nada de "clic aquí" ni
  "leer más" sueltos (ver [docs/ENLACES.md](docs/ENLACES.md)).
- Texto alternativo que dice lo que la imagen aporta a la historia; el
  [árbol de decisión de W3C](https://www.w3.org/WAI/tutorials/images/decision-tree/)
  ayuda a decidirlo. Un gráfico con datos lleva esos datos también en el texto.
- Tablas con encabezados de columna.
- El color nunca es la única forma de transmitir un significado.

### Lo que el build ya bloquea

Algunas reglas no dependen de la memoria de nadie: si se rompen, el sitio no se
construye.

- Una imagen de historia sin texto alternativo.
- HTML crudo dentro de una historia.
- Un SVG en línea (el símbolo de la marca o la ilustración de portada) con
  colores fijos, que se volvería invisible en modo oscuro.

## Reportar una barrera de accesibilidad

Si algo te impidió leer, navegar o usar el sitio, queremos saberlo. Un reporte
de accesibilidad es un aporte de conocimiento, no una queja.

Puedes avisarnos por cualquiera de estos caminos:

1. **El formulario de [mistorias.pe/reportar](https://mistorias.pe/reportar/)**,
   sin cuenta de GitHub.
2. **Un correo** a [support@mistorias.pe](mailto:support@mistorias.pe).
3. **Un issue** en este repositorio con la plantilla
   [Reporte de incidencia](https://github.com/mistorias/mistorias-web/issues/new?template=reporte-de-incidencia.md).

Si puedes, cuéntanos:

- Qué intentabas hacer y qué pasó.
- En qué página (el enlace basta).
- Tu sistema operativo, navegador y tecnología de apoyo, con versiones si las
  conoces.
- Una captura o grabación, solo si te sientes cómoda o cómodo compartiéndola.

**No necesitas** contarnos ningún diagnóstico ni dato personal, ni asignar una
severidad: eso lo hacemos nosotros al revisar el reporte.

### Severidad

La usamos para decidir qué se atiende primero:

- **Crítica:** impide completar una tarea central; por ejemplo, no puedes leer
  una historia o llegar a su contenido.
- **Seria:** la tarea se puede completar, pero con mucha dificultad o con un
  rodeo.
- **Moderada:** una molestia o una experiencia inconsistente.
- **Menor:** un detalle con poco impacto en el uso.

### Qué puedes esperar

- Te respondemos con respeto y te agradecemos el reporte.
- Te explicamos qué vamos a hacer, qué limitaciones conocemos y de qué depende
  la solución.
- Si hay una forma alternativa de llegar al contenido mientras se corrige, te
  la contamos.
- Te avisamos cuando cambie el estado o el plazo.
- Antes de cerrar, podemos pedirte que confirmes que la barrera desapareció.

### Plazos

Mistorias es un proyecto pequeño, así que nos comprometemos solo a lo que
podemos cumplir:

- **Primera respuesta:** dentro de 7 días.
- **Crítica:** corrección dentro de 30 días.
- **Seria:** corrección dentro de 60 días.
- **Moderada y menor:** corrección dentro de 90 días.

Los plazos corren desde que llega el reporte. Si no podemos cumplir uno, lo
decimos, explicamos por qué y damos una fecha nueva.

## Responsable

La accesibilidad está a cargo de quien mantiene el proyecto. Eso incluye:

- Revisar y clasificar los reportes.
- Llevar registro de las barreras conocidas y del trabajo pendiente.
- Mantener este documento al día.

Si la responsabilidad pasa a otra persona, este documento se actualiza en el
mismo cambio.

## Entornos de uso

El sitio es HTML estático sin JavaScript, así que debería funcionar en
cualquier navegador actual. Lo que revisamos de forma habitual:

- **Escritorio y celular:** Chromium, en celular vertical (390×844), celular
  horizontal (844×390) y escritorio (1440×900), en modo claro y oscuro.
- **Entrada:** teclado, puntero y táctil.

No hemos probado de forma sistemática cada combinación de navegador y lector
de pantalla (VoiceOver, NVDA, JAWS, TalkBack). Si usas una y algo falla, tu
reporte nos ayuda justamente ahí.

## Limitaciones conocidas

- **No hay revisión automática de accesibilidad en CI.** Las reglas que el
  build bloquea (arriba) son las únicas automáticas; el resto depende de la
  revisión de cada PR.
- **La verificación visual es manual.** No hay pruebas de regresión visual.
- **Los formularios solo funcionan en mistorias.pe.** En la versión de trabajo
  publicada en GitHub Pages, el formulario de reporte muestra un aviso y ofrece
  el correo en su lugar.

Si encuentras una barrera que no está en esta lista, repórtala.

## Mejorar este documento

La accesibilidad es una práctica continua, no un arreglo de una sola vez. Si
tienes una sugerencia para este documento o para cómo trabajamos, abre un issue
o un PR. Para una barrera concreta en el sitio, usa los caminos de
[Reportar una barrera](#reportar-una-barrera-de-accesibilidad).
