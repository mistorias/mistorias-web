/**
 * Envuelve en un `<section class="first-section">` el tramo que va desde el
 * primer `h2` del texto hasta antes del siguiente `h2`.
 *
 * Existe para que `ProgresoDeLectura.astro` mida solo la primera sección de
 * la historia: CSS no puede medir un tramo entre dos elementos sueltos,
 * necesita una caja que lo contenga. Depende de la estructura (dos `h2`), no
 * de sus títulos, porque el esquema no los garantiza (ver ADR 0035). Si no
 * hay dos `h2`, no envuelve nada y el cordón no se dibuja.
 */

export const FIRST_SECTION_CLASS = "first-section";

// Solo lo que este módulo lee de un nodo hast: el tipo completo no es
// dependencia directa del proyecto.
type Node = {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    value?: string;
    children?: readonly Node[];
};
type Root = { children: readonly Node[] };

// Las operaciones del `ctx` de Sätteri que usa el plugin. El árbol que recibe
// es de solo lectura: los cambios se piden al `ctx`, que los aplica después.
type Context = {
    replaceNode(node: Node, newNode: Node): void;
    removeNode(node: Node): void;
};

const isH2 = (node: Node) => node.type === "element" && node.tagName === "h2";

/**
 * Posición de la primera sección entre los hijos: `start` es el primer `h2` y
 * `end` el siguiente, que queda afuera. `undefined` si no hay dos `h2`.
 */
export function firstSectionRange(
    children: readonly Node[]
): { start: number; end: number } | undefined {
    const start = children.findIndex(isH2);
    if (start === -1) return undefined;

    const end = children.findIndex((node, index) => index > start && isH2(node));
    if (end === -1) return undefined;

    return { start, end };
}

/**
 * Copia un nodo, con todo su subárbol, a un objeto común. Sätteri entrega
 * nodos perezosos que apuntan a su propio árbol: puestos tal cual como hijos
 * de un nodo nuevo, se pierden sus hijos y solo queda el primero.
 */
export function toPlainNode(node: Node): Node {
    const { type, tagName, properties, value, children } = node;
    return {
        type,
        ...(tagName !== undefined && { tagName }),
        ...(properties !== undefined && { properties: { ...properties } }),
        ...(value !== undefined && { value }),
        ...(children !== undefined && { children: children.map(toPlainNode) })
    };
}

export function wrapFirstSection(root: Root, ctx: Context): void {
    const range = firstSectionRange(root.children);
    if (range === undefined) return;

    const [first, ...rest] = root.children.slice(range.start, range.end);
    ctx.replaceNode(first, {
        type: "element",
        tagName: "section",
        properties: { className: [FIRST_SECTION_CLASS] },
        children: [first, ...rest].map(toPlainNode)
    });
    rest.forEach((node) => ctx.removeNode(node));
}

/**
 * Plugin de hast para Sätteri, el procesador de Markdown de Astro: se registra
 * en `markdown.processor` de `astro.config.mjs`. Corre en `after`, una vez por
 * documento, porque necesita ver a los hermanos juntos.
 */
export const firstSectionPlugin = {
    name: "first-section",
    after: wrapFirstSection
};
