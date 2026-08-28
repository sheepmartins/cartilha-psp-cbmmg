/* =========================================================
   Primeiros Socorros Psicológicos — CBMMG
   Scrollytelling (GSAP + ScrollTrigger) e componentes de UI

   Modelo: cada dobra ocupa a altura da tela e fica presa
   durante a rolagem; o conteúdo avança em blocos, trocados
   no mesmo lugar. Abaixo de 960x560 tudo empilha e rola
   normalmente.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?flat=1 desliga o deck e rende a pagina linear, para revisao e comparacao
  var flat = /[?&]flat=1/.test(location.search);
  if (flat) document.documentElement.classList.add("is-flat");
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------------------------------------------------------
     0. Ilustração ausente -> placeholder legível
     --------------------------------------------------------- */
  $$('img.art').forEach(function (img) {
    var mark = function () { img.classList.add('is-missing'); };
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener('error', mark);
  });

  /* ---------------------------------------------------------
     0.1 Recuo lateral exato (100vw inclui a barra de rolagem)
     --------------------------------------------------------- */
  function setEdge() {
    var w = document.documentElement.clientWidth;
    var gutter = w >= 768 ? 32 : 20;
    var edge = Math.max(gutter, (w - 1236) / 2 + gutter);
    document.documentElement.style.setProperty('--edge', Math.round(edge) + 'px');
  }
  setEdge();
  window.addEventListener('resize', setEdge);

  /* ---------------------------------------------------------
     0.2 Corte da faixa lilás do Modelo
     A faixa deve terminar no meio das ilustrações. A posição delas
     depende do fluxo, então não dá para expressar em CSS puro —
     medimos e publicamos em --modelo-cut.
     --------------------------------------------------------- */
  function setModeloCut() {
    var modelo = $('#modelo');
    var art = modelo && $('.mcard__art', modelo);
    if (!modelo || !art) return;
    var palco = modelo.closest('.stage');
    var pt = palco ? parseFloat(getComputedStyle(palco).paddingTop) || 0 : 0;
    var m = modelo.getBoundingClientRect();
    var a = art.getBoundingClientRect();
    if (!a.height) return;                       // imagem ainda não carregou
    var meio = a.top + a.height / 2;             // meio vertical da ilustração
    var corte = (meio - m.top) + pt;             // ::after começa em -pt
    modelo.style.setProperty('--modelo-cut', Math.round(corte) + 'px');
  }
  window.addEventListener('resize', setModeloCut);

  /* ---------------------------------------------------------
     1. Drawer / sumário
     --------------------------------------------------------- */
  var drawer = $('#drawer'), scrim = $('#scrim'),
      btnMenu = $('#btnMenu'), btnClose = $('#btnClose');

  function openNav() {
    drawer.classList.add('is-open');
    scrim.hidden = false;
    document.body.classList.add('nav-open');
    btnMenu.setAttribute('aria-expanded', 'true');
    btnClose.focus();
  }
  function closeNav() {
    drawer.classList.remove('is-open');
    scrim.hidden = true;
    document.body.classList.remove('nav-open');
    btnMenu.setAttribute('aria-expanded', 'false');
  }
  btnMenu.addEventListener('click', openNav);
  btnClose.addEventListener('click', closeNav);
  scrim.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) { closeNav(); btnMenu.focus(); }
  });

  /* ---------------------------------------------------------
     2. Barra de progresso
     --------------------------------------------------------- */
  var bar = $('#progress');
  function updateProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0).toFixed(2) + '%';
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { updateProgress(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  updateProgress();

  /* ---------------------------------------------------------
     3. Checklist persistente
     --------------------------------------------------------- */
  var CHAVE = 'psp-cbmmg-checklist';
  var caixas = $$('#checks input[type="checkbox"]');
  var status = $('#checksStatus');
  var btnReset = $('#btnReset');

  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (e) { return {}; } }
  function gravar(o) { try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) {} }
  function atualizar() {
    var n = caixas.filter(function (c) { return c.checked; }).length;
    status.textContent = n + ' de ' + caixas.length + ' concluídos';
  }
  var estado = ler();
  caixas.forEach(function (c) {
    if (estado[c.dataset.k]) c.checked = true;
    c.addEventListener('change', function () {
      var e = ler(); e[c.dataset.k] = c.checked; gravar(e); atualizar();
    });
  });
  atualizar();
  btnReset.addEventListener('click', function () {
    caixas.forEach(function (c) { c.checked = false; });
    gravar({}); atualizar();
  });

  /* ---------------------------------------------------------
     4. Navegação do sumário
     Numa página com dobras presas, rolar até uma âncora dentro
     de um bloco não funciona: o bloco só existe em um ponto da
     rolagem daquela dobra. Então calculamos o destino.
     --------------------------------------------------------- */
  var stepScroll = {};   // id do alvo -> posição de rolagem

  function irPara(hash) {
    var alvo = document.querySelector(hash);
    if (!alvo) return false;
    var y = stepScroll[hash.slice(1)];
    if (typeof y !== 'number') {
      y = window.scrollY + alvo.getBoundingClientRect().top - 70;
    }
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
    return true;
  }

  $$('.toc a, a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#' || !document.querySelector(href)) return;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      closeNav();
      irPara(href);
      history.replaceState(null, '', href);
    });
  });

  /* ---------------------------------------------------------
     5. Scrollspy do sumário
     --------------------------------------------------------- */
  var tocLinks = {};
  $$('.toc a').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id) tocLinks[id] = a;
  });
  function marcarToc(id) {
    var l = tocLinks[id];
    if (!l) return;
    $$('.toc a').forEach(function (a) { a.classList.remove('is-active'); });
    l.classList.add('is-active');
  }

  /* =========================================================
     6. Coreografia
     ========================================================= */
  if (!hasGSAP) return;   // offline: página estática, tudo visível

  gsap.registerPlugin(ScrollTrigger);

  /* 6.1 — Fluxograma: prepara os nós */
  var flow = $('#fluxograma');
  var flowNodes = [];
  if (flow && !reduced) {
    flow.classList.add('is-anim');
    flowNodes = $$('.fx, .fx__split, .fx__branch', flow).sort(function (a, b) {
      return (+a.dataset.step || 99) - (+b.dataset.step || 99);
    });
    gsap.set(flowNodes, { opacity: 0, y: 22, scale: .95 });
  }
  function flowFallback() {
    if (!flowNodes.length) return;
    gsap.to(flowNodes, {
      opacity: 1, y: 0, scale: 1, duration: .5, ease: 'power2.out', stagger: .12,
      scrollTrigger: { trigger: flow, start: 'top 82%', once: true }
    });
  }

  /* 6.3 — Ilustração de duas variantes (Como e Quando -> Cuidar) */
  var artA = $('#artScribble'), artB = $('#artFlowers');
  function setVariante(idx) {
    if (!artA || !artB) return;
    artA.classList.toggle('is-on', idx === 0);
    artB.classList.toggle('is-on', idx > 0);
  }

  /* 6.4 — Monta uma dobra em modo scrollytelling */
  var mm = gsap.matchMedia();

  if (!flat) mm.add('(min-width: 960px) and (min-height: 560px)', function () {
    var deck = $('#deck');
    if (!deck) return;
    var dobras = $$('[data-scrolly]', deck);
    var undo = [];

    deck.classList.add('is-deck');

    /* Monta a lista global de blocos da página inteira. Cada bloco é um
       "slot" de rolagem — inclusive quando o próximo bloco pertence a
       outra dobra. É isso que elimina a rolagem entre dobras. */
    var slots = [];
    dobras.forEach(function (dobra, fi) {
      dobra.classList.add('is-pinned');
      var blocos = $$('.fstep', dobra);
      if (!blocos.length) return;

      // indicador de blocos (só faz sentido com mais de um)
      var dotEls = [];
      if (blocos.length > 1) {
        var dots = document.createElement('div');
        dots.className = 'dobra__dots';
        dots.setAttribute('aria-hidden', 'true');
        blocos.forEach(function () {
          var d = document.createElement('span');
          d.className = 'dobra__dot';
          dots.appendChild(d);
        });
        dobra.appendChild(dots);
        dotEls = $$('.dobra__dot', dots);
        dotEls[0].classList.add('is-on');
        undo.push(function () { dots.remove(); });
      }

      blocos.forEach(function (bloco, bi) {
        slots.push({ dobra: dobra, bloco: bloco, fi: fi, bi: bi, dots: dotEls, blocos: blocos });
      });

      // estado inicial: dobra 0 visível, primeiro bloco de cada dobra visível
      gsap.set(dobra, { autoAlpha: fi === 0 ? 1 : 0 });
      gsap.set(blocos, { autoAlpha: 0, y: 44 });
      gsap.set(blocos[0], { autoAlpha: 1, y: 0 });

      undo.push(function () {
        dobra.classList.remove('is-pinned');
        gsap.set(dobra, { clearProps: 'all' });
        gsap.set(blocos, { clearProps: 'all' });
      });
    });

    var T = slots.length;
    if (!T) return;

    var snapPoints = [];
    for (var s = 0; s < T; s++) snapPoints.push((s + 0.5) / T);

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: deck,
        start: 'top top',
        end: '+=' + (T * 100) + '%',
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.5,
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.15, max: 0.45 },
          delay: 0.05,
          ease: 'power1.inOut'
        },
        onUpdate: function (self) {
          var k = Math.max(0, Math.min(T - 1, Math.floor(self.progress * T)));
          var slot = slots[k];
          if (slot.dots.length) {
            slot.dots.forEach(function (d, i) { d.classList.toggle('is-on', i === slot.bi); });
          }
          if (slot.dobra.id === 'pinduo') setVariante(slot.bi);
          marcarToc(slot.bloco.id || slot.dobra.id);
        }
      }
    });

    tl.to({}, { duration: 1 });      // duração total = 1
    var seg = 1 / T;
    var X = seg * 0.34;              // duração de cada transição

    for (var k = 1; k < T; k++) {
      var ant = slots[k - 1], cur = slots[k];
      var at = k * seg - X * 0.62;

      if (ant.dobra === cur.dobra) {
        // troca de bloco dentro da mesma dobra
        tl.to(ant.bloco, { autoAlpha: 0, y: -44, duration: X, ease: 'power1.in' }, at);
        tl.fromTo(cur.bloco, { autoAlpha: 0, y: 44 },
          { autoAlpha: 1, y: 0, duration: X, ease: 'power1.out' }, at + X * 0.22);
      } else {
        // troca de DOBRA — mesma linguagem, sem a página rolar
        tl.to(ant.dobra, { autoAlpha: 0, duration: X, ease: 'power1.inOut' }, at);
        tl.fromTo(cur.dobra, { autoAlpha: 0 },
          { autoAlpha: 1, duration: X, ease: 'power1.inOut' }, at + X * 0.18);
      }

      // fundo do fechamento: lilás -> branco
      if (cur.dobra.id === 'fim' && cur.bi === 1) {
        tl.fromTo(cur.dobra, { backgroundColor: '#f0eafa' },
          { backgroundColor: '#ffffff', duration: X, ease: 'none' }, at);
      }
    }

    // fluxograma monta nó a nó dentro do slot do bloco que o contém
    if (flowNodes.length && flow) {
      var alvo = flow.closest('.fstep');
      var fk = -1;
      slots.forEach(function (sl, i) { if (sl.bloco === alvo) fk = i; });
      if (fk >= 0) {
        var base = fk * seg + seg * 0.18;
        var per = (seg * 0.58) / flowNodes.length;
        flowNodes.forEach(function (node, i) {
          tl.fromTo(node, { opacity: 0, y: 22, scale: .95 },
            { opacity: 1, y: 0, scale: 1, duration: per * 1.7, ease: 'power2.out' },
            base + per * i);
        });
      }
    }

    // ilustração da zona crítica percorre a tela ao longo dos slots da dobra
    var art = $('#criticaArt');
    if (art) {
      var ini = -1, fim = -1;
      slots.forEach(function (sl, i) {
        if (sl.dobra.id === 'evento') { if (ini < 0) ini = i; fim = i; }
      });
      if (ini >= 0) {
        tl.fromTo(art, { x: '58vw' },
          { x: '-58vw', ease: 'none', duration: (fim - ini + 1) * seg }, ini * seg);
      }
    }

    // posições de rolagem para o sumário navegar direto a um bloco
    function mapearBlocos() {
      var st = tl.scrollTrigger;
      if (!st) return;
      slots.forEach(function (sl, i) {
        var y = st.start + (st.end - st.start) * ((i + 0.5) / T);
        if (sl.bloco.id) stepScroll[sl.bloco.id] = y;
        if (sl.bi === 0 && sl.dobra.id) stepScroll[sl.dobra.id] = y;
      });
    }
    mapearBlocos();
    ScrollTrigger.addEventListener('refresh', mapearBlocos);

    return function () {
      ScrollTrigger.removeEventListener('refresh', mapearBlocos);
      deck.classList.remove('is-deck');
      undo.forEach(function (f) { f(); });
    };
  });

  /* 6.5 — Sem fixação: blocos empilhados, fade-in na rolagem normal.
     Vale para mobile, telas baixas e o modo ?flat=1 de revisão. */
  mm.add(flat ? '(min-width: 1px)' : '(max-width: 959px), (max-height: 559px)', function () {
    flowFallback();

    var fades = [];
    $$('.fstep').forEach(function (st) {
      var kids = Array.prototype.slice.call(st.children);
      if (!kids.length || reduced) return;
      fades.push(gsap.fromTo(kids,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: .6, ease: 'power2.out', stagger: .07,
          scrollTrigger: { trigger: st, start: 'top 88%', once: true }
        }));
    });

    // scrollspy simples
    var spy = null;
    if ('IntersectionObserver' in window) {
      var alvos = Object.keys(tocLinks)
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
      spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) marcarToc(en.target.id); });
      }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
      alvos.forEach(function (t) { spy.observe(t); });
    }

    return function () {
      fades.forEach(function (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
      if (spy) spy.disconnect();
    };
  });

  /* 6.6 — Recalcula quando fontes/imagens carregam */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); setModeloCut(); });
  ScrollTrigger.addEventListener('refresh', setModeloCut);
  setModeloCut();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); setModeloCut(); });
  }
  // Nada de ScrollTrigger.refresh() em visibilitychange: com o deck preso,
  // um refresh no meio da rolagem reposiciona a página e dá um salto.
  // O ScrollTrigger já trata resize sozinho.

  /* 6.7 — Rede de segurança
     Se a página abrir numa aba em segundo plano, o navegador suspende o
     requestAnimationFrame e o ScrollTrigger não roda. Garante que o
     primeiro bloco de cada dobra nunca fique preso invisível. */
  function revealStragglers() {
    var deck = $('#deck');
    if (deck && deck.classList.contains('is-deck')) {
      // no deck só a primeira dobra deve estar visível na carga
      var primeira = $('[data-scrolly]', deck);
      if (primeira && parseFloat(getComputedStyle(primeira).opacity) < 0.05) {
        gsap.set(primeira, { autoAlpha: 1 });
      }
    }
    $$('[data-scrolly]').forEach(function (dobra) {
      var primeiro = $('.fstep', dobra);
      if (primeiro && parseFloat(getComputedStyle(primeiro).opacity) < 0.05) {
        gsap.set(primeiro, { autoAlpha: 1, y: 0 });
      }
    });
    if (!document.querySelector('.is-pinned') && flowNodes.length) {
      var algum = flowNodes[0];
      if (parseFloat(getComputedStyle(algum).opacity) < 0.05) {
        var r = flow.getBoundingClientRect();
        if (r.top < window.innerHeight) {
          gsap.set(flowNodes, { opacity: 1, y: 0, scale: 1 });
        }
      }
    }
  }
  setTimeout(revealStragglers, 2500);
  window.addEventListener('load', function () { setTimeout(revealStragglers, 1200); });

  /* 6.8 — Âncora na carga inicial */
  if (location.hash) {
    window.addEventListener('load', function () {
      setTimeout(function () { irPara(location.hash); }, 350);
    });
  }
})();
