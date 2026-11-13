# La esmeralda perdida · 1º B · Colegio ICEI

Cuento interactivo de "elegí tu propia aventura", con efecto flipbook y dos finales.
Lo escribieron e imaginaron Six Seven 67, Mendoza y Gato con Sombrero de 1º B.

## Archivos
- `index.html`: estructura y las 24 páginas del libro (los textos se editan acá).
- `style.css`: diseño, animaciones y adaptación a Chromebook y celular.
- `script.js`: navegación, cruce A/B, pantalla completa y efecto flipbook.
- `lib/page-flip.browser.js`: biblioteca StPageFlip 2.0.7 (licencia MIT), incluida localmente.
- `img/`: dibujos originales de los chicos (`dibujo-*.jpg`) e ilustraciones de las escenas (`*.svg`).

## Publicar con GitHub Pages
1. Subir todo el contenido de esta carpeta (respetando `img/` y `lib/`) a la raíz del repositorio.
2. En el repositorio: Settings → Pages → Branch `main` / carpeta `/ (root)` → Save.
3. El cuento queda en `https://USUARIO.github.io/REPOSITORIO/`.

## Cómo funciona el cruce
La página marcada con `data-rol="cruce"` pide elegir A o B. Desde el final A, la flecha
"siguiente" lleva a los créditos; desde el camino B, "anterior" vuelve al cruce.
Si se agregan páginas, conviene mantener la cantidad total par y los atributos `data-rol`.
