<!--
Título: Conventional Commits en estilo preemptive, igual que los commits.
Si el cambio rompe compatibilidad, va marcado con `!` tras el tipo
(`feat!: ...`), igual que en el commit que lo introduce.
Borra los comentarios y las secciones que no apliquen.
-->

## Qué

<!-- Una línea: qué cambia. -->

## Por qué

<!-- El problema que resuelve o el requerimiento que cumple. Enlaza issue, ADR o discusión. -->

## Cómo verificar

- [ ] `pnpm test` pasa
- [ ] `pnpm build` pasa
- [ ] <!-- Pasos concretos para ver el cambio funcionando -->

## Comprobaciones

### Alcance

- [ ] Hace una sola cosa y se lee de corrido; si es grande, se explica por qué no se dividió

### Funcionalidad

<!-- Feature nuevo: describe cada caso así. Otros cambios: basta el checkbox. -->

- **Dado** [contexto inicial]
  **Cuando** [acción]
  **Entonces** [resultado observable]
- [ ] Sin regresiones en lo existente

### Accesibilidad

- [ ] Se recorre con teclado y el foco es visible
- [ ] Contraste correcto en modo claro y oscuro
- [ ] Un lector de pantalla no repite ni se salta información

### Seguridad

- [ ] No agrega HTML crudo, scripts ni relaja la CSP
- [ ] No expone datos personales, claves ni URLs privadas

## Capturas

<!--
Solo si cambia la UI. Recorta a lo que cambió: sin pestañas, barras del
navegador, datos personales ni nada ajeno al cambio.
-->

## Relacionado

<!-- Closes #XX -->
