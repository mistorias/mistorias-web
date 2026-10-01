/**
 * Perfiles de Mistorias en redes sociales.
 *
 * Es la única fuente de estas URLs: el pie las lee de acá, así que si una red
 * cambia de usuario se corrige en un solo lugar (issue #148). Son enlaces
 * externos y no pasan por `routes.ts`: no dependen de la `base` del despliegue.
 *
 * `label` es el nombre de la red tal como la conoce quien lee; el componente
 * que la dibuja arma con él el nombre accesible del enlace.
 */

export type SocialNetwork = "instagram" | "facebook" | "x";

export type SocialProfile = {
  readonly network: SocialNetwork;
  readonly label: string;
  readonly url: string;
};

export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  {
    network: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/mistorias.pe",
  },
  {
    network: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/mistorias.pe/",
  },
  { network: "x", label: "X", url: "https://x.com/mistoriaspe" },
];
