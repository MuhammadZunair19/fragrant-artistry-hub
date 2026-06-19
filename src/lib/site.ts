export const SITE = {
  brand: "VÉNÉRÉ",
  tagline: "Maison de Parfum",
  description:
    "VÉNÉRÉ — a Paris-based maison de parfum. Cinematic compositions in extrait and eau de parfum, hand-finished and shipped worldwide.",
  established: "Est. 1994 · Grasse",
  boutique: {
    line1: "12 Rue de l'Ancienne Comédie",
    line2: "75006 Paris, France",
    phone: "+33 (0)1 45 44 12 12",
  },
};

export const NAV_LEFT = [
  { label: "Fragrances", to: "/fragrances" },
  { label: "Maisons", to: "/maisons/venere" },
  { label: "Discover", to: "/collections/noir-series" },
] as const;

export const NAV_RIGHT = [
  { label: "Journal", to: "/journal" },
  { label: "Account", to: "/account" },
] as const;
