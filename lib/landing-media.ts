/**
 * Capturas de la landing en /public/imagenes para landing/
 * Cambia solo los nombres de archivo aquí al reemplazar imágenes.
 */
const DIR = "imagenes para landing";

function publicFile(name: string): string {
  return encodeURI(`/${DIR}/${name}`);
}

export const landingMedia = {
  hero: {
    laptopSrc: publicFile("menu_carrusel_mobil.png"),
    laptopAlt: "Menú con carrusel de productos en GodCode",
    phoneSrc: publicFile("home_menu_mobil.jpg"),
    phoneAlt: "Menú digital en el celular del cliente",
  },
  features: {
    menu: {
      src: publicFile("menu.png"),
      alt: "Menú digital con categorías y productos",
    },
    pos: {
      src: publicFile("caja.png"),
      alt: "Punto de venta y caja registradora",
    },
    inventory: {
      src: publicFile("iventario.png"),
      alt: "Inventario y stock por sucursal",
    },
  },
} as const;

/** Carrusel “Así se ve tu tienda” — orden = orden de los puntos */
export const landingPhoneCarouselSlides = [
  {
    id: "menu-mobile",
    src: publicFile("menu_mobil.jpg"),
    label: "Menú digital",
    sub: "Categorías, productos y banners desde el celular",
  },
  {
    id: "cart",
    src: publicFile("card_mobil.jpg"),
    label: "Carrito y checkout",
    sub: "Resumen de pedido, extras y pago integrado",
  },
  {
    id: "orders",
    src: publicFile("reporte_mobil.jpg"),
    label: "Panel y reportes",
    sub: "Ventas, estados y seguimiento desde el móvil",
  },
  {
    id: "pos",
    src: publicFile("caja_mobil.jpg"),
    label: "Punto de venta",
    sub: "Cobra en tu local rápido y sin complicaciones",
  },
  {
    id: "inventory",
    src: publicFile("iventario_mobil.jpg"),
    label: "Inventario",
    sub: "Stock por sucursal con alertas automáticas",
  },
] as const;
