# Primeiros Socorros Psicológicos — CBMMG

Versão web da *Cartilha Técnica de Orientação Inicial entre Pares* do Corpo de
Bombeiros Militar de Minas Gerais, implementada a partir do design do Figma
(`No07t0HlhpqJvdI8g41yOD`, nó `17:9855`).

Todo o conteúdo textual é o do design, sem alterações. Cores, medidas e ordem
dos elementos seguem os tokens e a diagramação do arquivo original.

## Acesso

**<https://sheepmartins.github.io/cartilha-psp-cbmmg/>**

Publicado pelo GitHub Pages a partir da raiz da branch `main`: todo `push` para
`main` republica o site em cerca de um minuto. Não há etapa de build — o que
está versionado é exatamente o que é servido.

## Como executar localmente

Sem dependências de build (não requer Node/npm). O servidor é um script
PowerShell que usa apenas o .NET presente no Windows.

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
```

Depois abra <http://localhost:8080>.

## Estrutura

```
Cartilha/
├── index.html            página única, 10 dobras + referências
├── serve.ps1             servidor estático local
├── assets/
│   ├── css/style.css     tokens do Figma, layout e componentes
│   ├── js/app.js         scrollytelling (GSAP) e componentes
│   ├── fonts/            (vazio) — ver "Tipografia"
│   └── img/              ilustrações e brasões
└── .claude/launch.json   configuração de preview
```

## Scrollytelling

**A página nunca rola.** Todas as dobras vivem empilhadas dentro de um único
container (`#deck`), preso por um só `ScrollTrigger`. A rolagem não move a
página: ela apenas avança o conteúdo, bloco a bloco. Quando o último bloco de
uma dobra termina, a dobra inteira dá lugar à próxima **no mesmo lugar**, com a
mesma linguagem de transição — não há rolagem entre dobras.

O deck trata a página como uma sequência linear de **21 blocos** distribuídos
por 10 dobras. Cada bloco ocupa um "slot" de uma tela de rolagem; a troca de
dobra é simplesmente o slot em que o bloco seguinte pertence a outra dobra.

Implementado com **GSAP 3.12 + ScrollTrigger** via CDN
(`pin: true`, `scrub: 0.5`, `snap` por slot). Um gatilho para a página toda.

> Detalhe importante: **não chame `ScrollTrigger.refresh()` em
> `visibilitychange`**. Com o deck preso, um refresh no meio da rolagem
> reposiciona a página e provoca um salto. O ScrollTrigger já trata resize
> sozinho.

| # | Dobra | Blocos | Efeito próprio |
|---|---|---|---|
| 1 | Capa | 1 | — |
| 2 | Sobre este Guia | 1 | — |
| 3 | Como e Quando / Cuidar de quem salva | 2 | Ilustração fixa; a variante troca de `head-scribble` para `head-flowers` em crossfade |
| 4 | PSP / Modelo | 2 | O retângulo lilás expande do painel lateral (38% × 88%) para a faixa completa (100% × 100%) |
| 5 | Olhar | 3 | O fluxograma monta nó a nó dentro do 3º bloco |
| 6 | Escutar | 3 | — |
| 7 | Zona Crítica | 2 | A ilustração percorre a tela da direita para a esquerda (+58vw → −58vw) |
| 8 | Conectar | 3 | — |
| 9 | Checklist / Apoio | 2 | Componente "Olhe, Escute, Conecte" fixo à esquerda |
| 10 | Cuidar também é Proteger | 2 | O fundo passa de lilás para branco entre os blocos |

Dobras com mais de um bloco exibem pontos indicadores à direita.

A única seção fora do deck é o acordeão de **Referências Bibliográficas**, que
vem depois e rola normalmente — não é uma dobra.

### Divisão dos blocos

| Dobra | Bloco 1 | Bloco 2 | Bloco 3 |
|---|---|---|---|
| Olhar | Mudanças de Comportamento + Queda no Desempenho | Prejuízo no Bem-estar + Comunicação Pessimista + "Observe com cuidado" | Fluxograma + "Risco Imediato!" |
| Escutar | Frases que podem Ajudar + Prejudicar | "Não force a conversa" + O que Fazer | O que Evitar + "Limite do apoio" |
| Conectar | Canais de encaminhamento + "Conectar não é Abandonar" | Privacidade, Sigilo e Responsabilidade + preservado/evitado | Quando o sigilo não deve ser mantido + "SIGILO NÃO É OMISSÃO!" |
| Zona Crítica | Após um Evento Crítico + Orientações para Líderes | Sinais de Alerta + "NÃO ESPERE AGRAVAR" | — |
| Checklist | Checklist Rápido de Bolso | Apoio Emergencial + Instituições de Apoio | — |

### Ilustrações

No modo fixado a arte é dimensionada por **flex**, não por limites em `vh`: o
texto ocupa o que precisa e a ilustração recebe exatamente a altura restante,
com `object-fit: contain`. Nas dobras Olhar / Escutar / Conectar ela preenche a
largura do painel, como no Figma.

Dois detalhes que exigem atenção ao mexer no layout:

- `min-height: 0` nos itens de grid e `flex-basis: 0` na imagem. Sem isso o
  `min-height: auto` padrão impede o encolhimento e o painel fica mais alto que
  a tela.
- Na Zona Crítica a ilustração cruza a coluna de texto durante o percurso, então
  há um véu em gradiente (`.critica__col::before`) atrás do texto para preservar
  a legibilidade.

### Limites e degradação

A fixação só entra acima de **960×700px**. Abaixo disso (mobile, telas baixas)
os blocos empilham e rolam normalmente, com fade-in por bloco; o fluxograma
revela na rolagem comum. No modo fixado o ritmo vertical é comprimido com `vh`
para que cada bloco caiba na tela — a 1280×700px o bloco mais apertado ainda
sobra 58px.

Com `prefers-reduced-motion` as animações de opacidade do fluxograma são
desligadas. Sem acesso ao CDN da GSAP a página fica estática, com todo o
conteúdo visível. Há ainda uma rede de segurança: se a página abrir numa aba em
segundo plano (onde o navegador suspende o `requestAnimationFrame`), um
temporizador garante que o primeiro bloco de cada dobra não fique invisível.

### Topbar fixa, não sticky

A barra superior é `position: fixed`. Com `sticky` ela ocupava 63px do fluxo,
o deck começava abaixo disso e só prendia depois que o usuário rolasse esses
63px — uma rolagem morta no começo da página. Fixa, o deck começa em y=0 e
prende de imediato. Os recuos internos (`--stage-pt`) é que reservam o espaço
da barra.

### Painéis de fundo

Os painéis lilás (PSP, Checklist) e a faixa do Modelo são `::after` do bloco,
com recuos negativos iguais a `--stage-pt` / `--stage-pb`. Isso os faz sangrar
até a borda da dobra: se ficassem no fundo do próprio bloco, parariam no
padding do palco e sobrava uma faixa branca.

A faixa do Modelo tem `height: 67vh` de propósito — no Figma ela cobre título e
ilustrações e termina na altura dos círculos numerados, deixando os rótulos e
os textos sobre o branco.

### Navegação

Numa página com dobras presas, rolar até uma âncora não funciona: o bloco só
existe em um ponto da rolagem daquela dobra. Por isso o sumário calcula a
posição de rolagem correspondente a cada bloco (`stepScroll`) e navega até lá.

## Sistema de design

As cores vêm dos tokens do Figma e não foram alteradas. Sobre elas há três
escalas, definidas no `:root` do `style.css`.

| Escala | Valores |
|---|---|
| Tipografia (`--step-0..8`) | 11 · 13 · ~~14~~ · 16 · 18 · 21 · 25 · 31 · 40 px (razão ~1,20) |
| Espaçamento (`--space-1..7`) | 4 · 8 · 12 · 16 · 24 · 32 · 48 px |
| Raio (`--radius-*`) | sm 8 · md 12 · lg 16 · xl 24 · pill 999 px |
| Medida de linha (`--measure`) | 68ch |

O degrau de **14px está riscado de propósito**: a pedido, nenhum texto usa mais
esse tamanho. O piso do texto é 16px, inclusive em legendas (`--fs-small`) e no
patamar compacto do deck. O token continua definido, mas sem uso.

### Papéis e patamares

Em vez de `clamp(…, vh, …)` contínuo — que gerava valores arbitrários como
15,8px e 15,3px — a compressão do deck usa **papéis** (`--fs-body`, `--fs-grp`,
`--sp-block`, `--pad-card`…) que trocam de degrau num único ponto de corte:

```
altura ≥ 850px  →  patamar confortável (padrão do :root)
altura < 850px  →  patamar compacto, um degrau abaixo, só dentro de .is-pinned
```

Assim a dobra continua cabendo em 100vh, mas sempre em valores da escala.

### Regras de superfície

- **Cartão elevado** (`.checks`, `.inst`, `.fone`, `.acc`): raio 16 + borda
  `--outline` + `--shadow-sm`. Os quatro são idênticos.
- **Callout** (`.note`): raio 24, sem borda, cor sólida. A caixa ocupa a largura
  da coluna, como no Figma; só o **texto** é limitado a `--measure`.
- **Tipografia de display** (capa, títulos das dobras, `.shout`, `.fim__title`)
  permanece fluida em `vw`/`vh` de propósito: precisa caber em painéis de altura
  variável. É a única família fora da escala discreta.

### Alvos de toque

`min-height: 44px` em links e rótulos está dentro de `@media (pointer:coarse)`.
No desktop, forçar 44px inflava o bloco de Apoio Emergencial e estourava a dobra
em telas de 700px.

## Componentes de interface

- **Checklist** — caixas com estado salvo em `localStorage`, contador e botão de limpar.
- **Apoio emergencial** — cartões com telefone clicável (`tel:`) e brasão da instituição.
- **Instituições de apoio** — cartões com link externo e telefone.
- **Resumo Olhe / Escute / Conecte** — componente tipo alerta, com aba vertical colorida.
- **Referências bibliográficas** — acordeão (`<details>`), fechado por padrão.
- **PSP É / PSP NÃO É** — containers com as cores do design.

## Tipografia

Corpo de texto em **16px** (token `Body/Regular/Medium` do Figma), família
**Source Sans 3**.

Os títulos usam **Creato Display**, que é comercial e não está em CDN aberta.
O CSS já tem as regras `@font-face` apontando para `assets/fonts/`: basta soltar
os arquivos abaixo na pasta que os títulos passam a usar a fonte original.

```
assets/fonts/CreatoDisplay-Regular.woff2
assets/fonts/CreatoDisplay-Bold.woff2
assets/fonts/CreatoDisplay-Black.woff2
```

Enquanto não estiverem lá, o fallback é **Figtree** (Google Fonts).

## Acessibilidade — pontos em aberto

Cinco combinações do design não atingem o mínimo WCAG AA (4.5:1). Foram
**mantidas como no Figma**, à espera de decisão:

| Elemento | Cores | Contraste | Mínimo |
|---|---|---|---|
| Callout "ORIENTAÇÕES PARA LÍDERES" | branco sobre `#f59e0b` | 2.15 | 4.5 |
| Callout "Conectar não é Abandonar" | branco sobre `#53b685` | 2.50 | 4.5 |
| Título "OLHAR" (Modelo) | `#53b6d3` sobre branco | 2.33 | 4.5 |
| Título "CONECTAR" (Modelo) | `#53b685` sobre branco | 2.50 | 4.5 |
| Callout "Risco Imediato!" | branco sobre `#f6143e` | 4.13 | 4.5 |

Sugestão, mantendo a identidade: `#f59e0b` → `#a86a00`, `#53b685` → `#2e6b4d`
(token `Verde/700`), `#53b6d3` → `#005771` (token `blue-800`),
`#f6143e` → `#b71533` (token `Magenta/600`).

## Aviso

Os telefones e canais de apoio podem sofrer alterações ao longo do tempo.
Esta cartilha não substitui atendimento especializado.
