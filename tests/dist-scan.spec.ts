import { describe, expect, it } from "vitest";
import { scanBuiltHtml } from "../src/lib/security/dist-scan";

const rules = (html: string) => scanBuiltHtml(html).map((violation) => violation.rule);

describe("scanBuiltHtml", () => {
  it("acepta una página sin scripts, sin manejadores y con recursos propios", () => {
    const html = `<html><head><link rel="canonical" href="https://mistorias.pe/"><link rel="stylesheet" href="/_astro/a.css"></head>
      <body><a href="/historias/">Historias</a><img src="/_astro/x.jpg" srcset="/_astro/x.webp 1x, /_astro/y.webp 2x">
      <a href="https://example.org" target="_blank" rel="noopener noreferrer">fuera</a>
      <form action="/gracias/" method="POST"></form></body></html>`;

    expect(scanBuiltHtml(html)).toEqual([]);
  });

  it("rechaza una etiqueta script, incluso en mayúsculas", () => {
    expect(rules("<SCRIPT>alert(1)</SCRIPT>")).toEqual(["script"]);
    expect(rules('<script type="application/ld+json">{}</script>')).toEqual(["script"]);
  });

  it("rechaza un manejador de evento en cualquier etiqueta", () => {
    expect(rules('<button onclick="x()">a</button>')).toEqual(["event-handler"]);
    expect(rules('<img src="/a.jpg" onerror = "x()">')).toEqual(["event-handler"]);
  });

  it("no confunde un atributo que solo contiene 'on' con un manejador", () => {
    expect(rules('<a href="/a" data-reason="x">a</a>')).toEqual([]);
  });

  it("rechaza URL javascript: en href, src o action", () => {
    expect(rules('<a href="javascript:void(0)">a</a>')).toEqual(["javascript-url"]);
    expect(rules("<form action='  javascript:x()'></form>")).toEqual(["javascript-url"]);
  });

  it("exige noopener y noreferrer en cada target=_blank", () => {
    expect(rules('<a href="https://a.org" target="_blank">a</a>')).toEqual(["blank-without-noopener"]);
    expect(rules('<a href="https://a.org" target="_blank" rel="noopener">a</a>')).toEqual(["blank-without-noopener"]);
    expect(rules('<a href="https://a.org" target="_blank" rel="me noopener noreferrer">a</a>')).toEqual([]);
    expect(rules('<a href="https://a.org" target="_self">a</a>')).toEqual([]);
  });

  it("rechaza recursos que la CSP bloquearía por venir de otro origen", () => {
    expect(rules('<link rel="stylesheet" href="https://cdn.example/a.css">')).toEqual(["external-resource"]);
    expect(rules('<link rel="preload icon" href="//cdn.example/f.ico">')).toEqual(["external-resource"]);
    expect(rules('<img src="https://cdn.example/a.jpg">')).toEqual(["external-resource"]);
    expect(rules('<img src="/a.jpg" srcset="/a.webp 1x, https://cdn.example/b.webp 2x">')).toEqual(["external-resource"]);
    expect(rules('<iframe src="https://www.youtube.com/embed/x"></iframe>')).toEqual(["external-resource"]);
    expect(rules('<form action="https://forms.example/post"></form>')).toEqual(["external-resource"]);
    expect(rules('<object data="https://a.org/x.swf"></object>')).toEqual(["external-resource"]);
  });

  it("deja pasar enlaces y rel=canonical externos, que no cargan nada", () => {
    expect(rules('<link rel="canonical" href="https://mistorias.pe/">')).toEqual([]);
    expect(rules('<a href="https://a.org">a</a>')).toEqual([]);
  });

  it("acepta URL sin comillas y con comillas simples", () => {
    expect(rules("<img src=https://cdn.example/a.jpg>")).toEqual(["external-resource"]);
    expect(rules("<img src='/a.jpg'>")).toEqual([]);
  });

  it("acumula todas las infracciones de una misma página", () => {
    const html = '<script></script><a href="https://a.org" target="_blank">a</a><img src="https://x.y/a.jpg">';

    expect(rules(html)).toEqual(["script", "blank-without-noopener", "external-resource"]);
  });
});
