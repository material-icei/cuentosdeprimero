/* =========================================================
   EL MISTERIO DE LAS HUELLAS BRILLANTES · 1º A · COLEGIO ICEI
   Lógica del libro: tamaño, efecto flipbook (StPageFlip),
   navegación con cruce de caminos A / B y controles.
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Referencias del DOM ---------- */
  const $ = (sel) => document.querySelector(sel);
  const escenario = $('#escenario');
  const soporte = $('#soporte');
  const libroEl = $('#libro');
  const paginasEl = document.querySelectorAll('#libro .page');
  const btnAnterior = $('#btnAnterior');
  const btnSiguiente = $('#btnSiguiente');
  const btnInicio = $('#btnInicio');
  const btnPantalla = $('#btnPantalla');
  const btnEmpezar = $('#btnEmpezar');
  const bienvenida = $('#bienvenida');
  const indicador = $('#indicador');
  const barraProgreso = $('#barraProgreso');
  const aviso = $('#aviso');

  /* ---------- Configuración ---------- */
  const PROPORCION = 600 / 800;   // ancho / alto de cada página (3:4)
  const TOTAL = paginasEl.length;

  // Índices de las páginas especiales (se leen del atributo data-rol del HTML)
  const indice = (rol) => Array.prototype.findIndex.call(paginasEl, (p) => p.dataset.rol === rol);
  const P = {
    CRUCE: indice('cruce'),
    A_INICIO: indice('a-inicio'),
    A_FIN: indice('a-fin'),
    B_INICIO: indice('b-inicio'),
    B_FIN: indice('b-fin'),
    CREDITOS: indice('creditos'),
    ULTIMA: TOTAL - 1
  };

  let libro = null;            // instancia de StPageFlip
  let apaisado = true;         // true = dos páginas, false = una página
  let anchoPagina = 0;
  let ultimoFinal = 'A';       // para volver desde los créditos al final que se leyó

  /* =========================================================
     1. TAMAÑO: el libro ocupa el mayor espacio posible
        sin desbordar la pantalla.
     ========================================================= */
  function calcularTamano() {
    const estilo = getComputedStyle(escenario);
    const ancho = escenario.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    const alto = escenario.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);

    // Alto de página posible con dos páginas o con una sola
    const altoDoble = Math.min(alto, (ancho / 2) / PROPORCION);
    const altoSimple = Math.min(alto, ancho / PROPORCION);

    // Si con dos páginas el libro queda muy chico, se muestra una sola página
    apaisado = altoDoble >= altoSimple * 0.8 && ancho >= 520;

    const altoPagina = Math.floor(apaisado ? altoDoble : altoSimple);
    anchoPagina = Math.floor(altoPagina * PROPORCION);
    soporte.style.width = (apaisado ? anchoPagina * 2 : anchoPagina) + 'px';

    // StPageFlip pasa a una página cuando el ancho es menor que 2 × minWidth
    return apaisado ? Math.floor(anchoPagina * 0.9) : anchoPagina + 1;
  }

  function ajustar() {
    const minWidth = calcularTamano();
    if (libro) {
      libro.getSettings().minWidth = minWidth;
      libro.update();
      actualizarUI();
    }
    return minWidth;
  }

  /* =========================================================
     2. CREAR EL LIBRO CON EFECTO DE VOLTEO 3D
     ========================================================= */
  function crearLibro() {
    const minWidth = ajustar();

    libro = new St.PageFlip(libroEl, {
      width: 600,
      height: 800,
      size: 'stretch',
      minWidth: minWidth,
      maxWidth: 3000,
      minHeight: 200,
      maxHeight: 4000,
      autoSize: true,
      showCover: true,          // tapa y contratapa como hojas duras
      usePortrait: true,        // una sola página en pantallas angostas
      drawShadow: true,         // sombras y profundidad
      maxShadowOpacity: 0.55,
      flippingTime: 900,        // volteo suave
      useMouseEvents: false,    // la navegación la controla el cuento (por el cruce A/B)
      mobileScrollSupport: false,
      startZIndex: 0
    });

    libro.loadFromHTML(paginasEl);

    libro.on('flip', () => {
      const v = visibles();
      if (v.includes(P.A_FIN)) ultimoFinal = 'A';
      if (v.includes(P.B_FIN)) ultimoFinal = 'B';
      actualizarUI();
    });
    libro.on('changeOrientation', () => { ajustar(); });
    libro.on('init', actualizarUI);

    actualizarUI();
  }

  /* Páginas visibles en este momento (una o dos) */
  function visibles(i) {
    if (i === undefined) i = libro ? libro.getCurrentPageIndex() : 0;
    const dosPaginas = libro && libro.getOrientation() === 'landscape';
    if (!dosPaginas) return [i];
    if (i === 0) return [0];                                   // tapa sola
    if (i === P.ULTIMA && TOTAL % 2 === 0) return [i];          // contratapa sola
    const izquierda = i % 2 === 1 ? i : i - 1;
    return [izquierda, izquierda + 1];
  }

  /* =========================================================
     3. NAVEGACIÓN (con el cruce de caminos)
     ========================================================= */
  function ocupado() {
    return !libro || libro.getState() !== 'read';
  }

  function irA(pagina) {
    if (ocupado()) return;
    centrarTapa(visibles(pagina));
    libro.flip(pagina);
  }

  function siguiente() {
    if (ocupado()) return;
    const v = visibles();
    if (v.includes(P.ULTIMA)) return;

    if (v.includes(P.CRUCE)) {                    // hay que elegir un camino
      llamarAtencion();
      return;
    }
    if (v.includes(P.A_FIN)) {                    // del final A se salta a los créditos
      ultimoFinal = 'A';
      irA(P.CREDITOS);
      return;
    }
    centrarTapa(visibles(Math.min(v[v.length - 1] + 1, P.ULTIMA)));
    libro.flipNext();
  }

  function anterior() {
    if (ocupado()) return;
    const v = visibles();
    if (v.includes(0)) return;

    if (v.includes(P.B_INICIO)) { irA(P.CRUCE); return; }      // el camino B vuelve al cruce
    if (v.includes(P.CREDITOS)) {                              // vuelve al último final leído
      irA(ultimoFinal === 'A' ? P.A_FIN : P.B_FIN);
      return;
    }
    centrarTapa(visibles(Math.max(v[0] - 1, 0)));
    libro.flipPrev();
  }

  /* Botones dentro de las páginas: A / B, otro final, créditos, inicio */
  function accionPagina(destino) {
    const mapa = { A: P.A_INICIO, B: P.B_INICIO, creditos: P.CREDITOS, inicio: 0 };
    if (destino in mapa) irA(mapa[destino]);
  }

  libroEl.addEventListener('click', (e) => {
    const camino = e.target.closest('[data-camino]');
    const ir = e.target.closest('[data-ir]');
    if (camino) {
      camino.classList.add('elegido');
      accionPagina(camino.dataset.camino);
    } else if (ir) {
      accionPagina(ir.dataset.ir);
    }
  });

  /* En pantallas anchas, la tapa cerrada se ve centrada (como un libro real) */
  function centrarTapa(v) {
    let desplazamiento = 0;
    if (apaisado && v.length === 1) {
      desplazamiento = v[0] === 0 ? -anchoPagina / 2 : anchoPagina / 2;
    }
    soporte.style.transform = `translateX(${desplazamiento}px)`;
  }

  /* =========================================================
     4. INTERFAZ: botones, indicador y progreso
     ========================================================= */
  function actualizarUI() {
    if (!libro) return;
    const v = visibles();
    const primera = v[0];
    const ultima = v[v.length - 1];

    btnAnterior.disabled = primera === 0;
    btnSiguiente.disabled = ultima === P.ULTIMA;
    btnSiguiente.classList.toggle('espera', v.includes(P.CRUCE));

    indicador.textContent = (v.length > 1 ? `${primera + 1}-${ultima + 1}` : `${primera + 1}`) + ` / ${TOTAL}`;

    const progreso = Math.round((ultima / P.ULTIMA) * 100);
    barraProgreso.style.width = progreso + '%';
    barraProgreso.parentElement.setAttribute('aria-valuenow', progreso);

    centrarTapa(v);
  }

  let temporizadorAviso = null;
  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.add('ver');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove('ver'), 2600);
  }

  function llamarAtencion() {
    mostrarAviso('¡ELEGÍ UN CAMINO: A o B!');
    const opciones = document.querySelector('.opciones');
    opciones.classList.remove('llamar');
    void opciones.offsetWidth;                 // reinicia la animación
    opciones.classList.add('llamar');
  }

  /* ---------- Pantalla completa ---------- */
  function alternarPantallaCompleta() {
    const doc = document;
    const enPantalla = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (!enPantalla) {
      const el = doc.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } else {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    }
  }
  function alCambiarPantalla() {
    const enPantalla = !!(document.fullscreenElement || document.webkitFullscreenElement);
    document.body.classList.toggle('pantalla-completa', enPantalla);
    btnPantalla.title = enPantalla ? 'Salir de pantalla completa' : 'Pantalla completa';
    setTimeout(ajustar, 150);
  }
  // iPhone no permite pantalla completa en páginas web: se oculta el botón
  if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
    btnPantalla.style.display = 'none';
  }

  /* ---------- Gestos táctiles (deslizar) ---------- */
  let toqueX = null, toqueY = null;
  escenario.addEventListener('touchstart', (e) => {
    toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY;
  }, { passive: true });
  escenario.addEventListener('touchend', (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    const dy = e.changedTouches[0].clientY - toqueY;
    toqueX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx < 0 ? siguiente() : anterior();
    }
  });

  /* ---------- Eventos ---------- */
  btnSiguiente.addEventListener('click', siguiente);
  btnAnterior.addEventListener('click', anterior);
  btnInicio.addEventListener('click', () => irA(0));
  btnPantalla.addEventListener('click', alternarPantallaCompleta);
  document.addEventListener('fullscreenchange', alCambiarPantalla);
  document.addEventListener('webkitfullscreenchange', alCambiarPantalla);

  document.addEventListener('keydown', (e) => {
    if (!bienvenida.classList.contains('oculta')) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); empezar(); }
      return;
    }
    if (e.key === 'ArrowRight') siguiente();
    if (e.key === 'ArrowLeft') anterior();
    if (e.key === 'Home') irA(0);
  });

  let esperaResize = null;
  window.addEventListener('resize', () => {
    clearTimeout(esperaResize);
    esperaResize = setTimeout(ajustar, 120);
  });

  function empezar() {
    bienvenida.classList.add('oculta');
    setTimeout(() => irA(1), 450);            // abre el libro en la primera página
  }
  btnEmpezar.addEventListener('click', empezar);

  /* ---------- Inicio ---------- */
  crearLibro();
})();
