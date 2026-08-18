# September — Personal OS (V0)

Pensada per fer-se servir tot l'any, no només fins l'1 de setembre. PWA
local, sense comptes ni backend. Totes les dades es guarden al
`localStorage` del navegador del mòbil — si desinstal·les l'app o esborres
dades del navegador, es perden. No hi ha sincronització entre dispositius
en aquesta versió (per això existeix l'exportar/importar, més avall).

## Què inclou aquesta V0

- **Inici** — pantalla d'estat (no d'acció): el context narratiu, els
  pilars llegits de dades reals, i la decisió d'aquesta setmana, tot
  d'un cop en obrir l'app. És la pestanya per defecte.
- **Avui** — hàbits (editables des de la mateixa app) amb finestra de
  consistència **en punts visuals** (no text "X/7") acolorits segons el
  valor. Son com a targeta pròpia amb **barra visual** de la franja
  objectiu (23:30–00:30) i marcador d'on cau l'hora real. Comptador de
  sessions de focus del dia.
- **Focus** — defineixes assignatura/objectiu/durada, o bé prems
  **"només 2 minuts"** per començar a l'instant sense triar res.
  Temporitzador com a **anell circular** que es buida amb el temps.
  Botó "he perdut el focus" — en tocar-lo apareixen uns xips opcionals
  per etiquetar el motiu (mòbil/soroll/cansament/tasca poc clara/altra);
  amb el temps, "Motius d'interrupció" mostra el patró agregat.
  Registre final (temps real, completada, comprensió 🟢🟡🔴,
  dificultat, interrupcions). Secció "Per assignatura" que agrupa
  totes les sessions.
- **Setmana** — pes (amb tendència ↑→↓ un cop hi ha una setmana
  anterior). **Els pilars ja no són sliders subjectius**: Físic i
  Fortalesa es llegeixen dels hàbits ja registrats (entrenaments,
  consistència mitjana), Coneixement es llegeix de les sessions de
  focus reals. Comunicació i el factor "roba/estil" d'Aura són
  comptadors concrets; el factor "grooming" es dedueix de l'hàbit de
  cura personal; "confiança" es va fondre amb Comunicació perquè
  mesuraven el mateix. Mòbil: una valoració ràpida (lleuger/normal/
  excessiu) en comptes d'hores exactes, que ningú compta bé de
  memòria. **Bucle de decisions**: cada revisió acaba triant UNA cosa
  concreta a fer diferent la setmana vinent; la revisió següent
  mostra aquesta decisió i pregunta si la mantens, la modifiques o
  l'elimines.

## "Dia N" — pensada per durar

A dalt de tot hi ha un comptador de dia (des que vas obrir l'app per
primer cop, sense caducitat) en comptes d'un compte enrere que deixaria
de tenir sentit l'1 de setembre. Mentre encara falten dies per l'1 de
setembre, hi surt també una insígnia petita amb els dies que en queden
— desapareix sola un cop passada la data, sense que calgui tocar res.

## Desplegar-la (GitHub Pages — gratuït, sense terminal)

Fes-ho des de l'ordinador (és més còmode per pujar fitxers); l'últim pas
és des del mòbil.

1. **Compte**: si no en tens, [github.com](https://github.com) → *Sign up*
   → correu, contrasenya, nom d'usuari → verifica el correu.
2. **Repositori nou**: icona **+** (dalt a la dreta) → *New repository* →
   nom, p. ex. `september-os` → marca'l com a **Public** (amb compte
   gratuït, Pages només funciona amb repositoris públics — no passa res,
   el que es fa públic és el codi de la plantilla, no les teves dades:
   aquestes es queden sempre al teu mòbil, mai pugen a GitHub) → *Create
   repository*.
3. **Pujar els fitxers**: descomprimeix `september-os-v0.zip`. A la
   pàgina del repositori, busca el botó **"Add file"** (a dalt a la
   dreta, al costat del botó verd "Code") → **"Upload files"**.
   Arrossega **els fitxers de dins** la carpeta `project-september`
   (`index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, les
   icones, el `README.md`) — no la carpeta sencera; han de quedar a
   l'arrel del repositori, no dins d'una subcarpeta. Baixa i clica
   *Commit changes*.
4. **Activar Pages**: pestanya *Settings* del repositori → *Pages* (menú
   de l'esquerra) → a *Build and deployment* tria *Deploy from a
   branch* → branch `main`, carpeta `/ (root)` → *Save*.
5. **Esperar i comprovar**: torna a *Settings → Pages* al cap d'un o dos
   minuts; hi apareixerà l'enllaç, alguna cosa com
   `https://<el-teu-usuari>.github.io/september-os/`.

*(Més endavant, si vols, es pot fer amb `git` des de terminal en comptes
del navegador — més ràpid un cop t'hi acostumes, però no cal per començar.)*

## Instal·lar-la al mòbil (Android)

1. Obre l'enllaç anterior a Chrome del mòbil.
2. Toca el menú (⋮) → **"Afegir a la pantalla d'inici"** (o espera el
   prompt automàtic d'instal·lació que sol sortir als pocs segons).
3. A partir d'aquí s'obre a pantalla completa, com una app normal, amb
   icona pròpia — i funciona sense connexió un cop carregada un primer cop.

## Rutina d'avui (context per al pilar Físic)

A Avui, la targeta "Rutina d'avui" deixa pujar un JSON amb la teva
rutina setmanal (`rutina-exemple.json` d'aquest zip és una plantilla
llesta per editar). L'app només ha d'entendre aquest format propi —
no intenta llegir Excel ni cap altre format, perquè un parser
d'Excel real es trenca amb qualsevol canvi d'estructura del full i
acaba sent més feina de mantenir que la que estalvia. Un cop
importat, es queda guardat (no cal tornar-lo a pujar) i cada dia et
mostra automàticament què toca segons el dia de la setmana.

L'estructura de dades (`state.context`) està pensada perquè altres
pilars hi puguin afegir el seu propi context més endavant (per
exemple, un pla d'estudi per Coneixement) sense haver-ho de
redissenyar — però de moment només Físic el fa servir de veritat.

L'exercici marcat com a "fet" no cal registrar-lo per separat: la
targeta té un botó "Marca 'Entrenament' com a fet" que reutilitza
l'hàbit que ja existeix — no hi ha cap dada nova, només una drecera.

## Context (Avui)

Una targeta que, quan hi ha alguna cosa rellevant, mostra fets
concrets ja registrats: el resum d'ahir, quants dies fa que no marques
un hàbit, el motiu d'interrupció més freqüent (a partir de 3 mostres),
la decisió d'aquesta setmana. **Deliberadament no és un motor de
correlacions ni de detecció de patrons** — amb pocs dies d'ús,
"detectar patrons" seria inventar-se'ls. Només diu fets reals en
frases, no estadística.

## Aura, simplificada

Ja no demana res directament excepte el grooming (que ve de l'hàbit
"Cura personal"). Es va treure el comptador de "roba/estil" i es va
descartar la idea de sumar factors en un "índex de presència": sumar
Físic + Comunicació + hàbits en un sol número hauria estat exactament
la puntuació inventada que es va eliminar dels sliders, només amagada
darrere d'una fórmula. Aura remet als pilars que ja es veuen a la
mateixa pantalla, sense duplicar-los.

## Horari (i notificacions de veritat)

Nova targeta a Avui, `horari-exemple.json` com a plantilla. A
diferència de la rutina (només Físic), l'horari és blocs de tot el
dia (classes, EOI, acadèmia, gimnàs...) — pensat per quan comenci el
curs. Un cop carregat, el botó **"Exportar a calendari (.ics)"**
genera un fitxer de calendari estàndard amb els blocs com a events
setmanals repetits.

Importa aquest .ics al Calendari del mòbil (Google Calendar, Calendari
d'Android...) perquè **les notificacions les faci el sistema
operatiu, no la PWA**. Ho vam comprovar abans de construir res:
cap PWA pot garantir-te un avís a una hora concreta si l'app està
tancada, ni amb backend propi ni sense — la "Periodic Background
Sync API" de Chrome existeix, però l'interval el decideix el
navegador, no tu. El calendari del mòbil sí que ho fa de manera
fiable, i és zero feina extra reutilitzar-lo en comptes de
reinventar-lo.

## Coses a saber

- **Sense integració amb Excel** (decisió presa): és independent del full de
  gimnàs i del pla creatiu.
- **Mòbil (Útil/Oci/Automàtic) és entrada manual per ara** — cap app normal
  (aquesta inclosa) té accés al Screentime d'altres apps sense permisos
  natius especials. Mires el resum del teu mòbil un cop per setmana i
  l'apuntes a la pantalla Setmana.
## Còpia de seguretat

A la pantalla **Setmana**, avall de tot: **"Exportar dades"** descarrega un
`.json` amb tot (hàbits, sessions de focus, setmanes). **"Importar còpia de
seguretat"** el torna a carregar — substitueix TOTES les dades actuals, et
demana confirmació abans de fer-ho. Fes-ho servir si canvies de mòbil o
navegador; res se sincronitza sol.

## Sobre el mòbil: per què no és automàtic

Una PWA (com qualsevol pàgina web) no té accés al Screentime/Digital
Wellbeing d'altres apps — ni per llegir-lo ni per calcular-lo. Això
requereix un permís especial (`PACKAGE_USAGE_STATS` a Android) que
només es pot concedir a una app nativa real, mai a una web obert al
navegador. És per això que es va reduir a una valoració ràpida
setmanal (lleuger/normal/excessiu) en comptes d'hores exactes —
aquestes sí que és factible que les recordis prou bé, a diferència
d'hores precises per categoria. Automatitzar-ho de veritat és l'únic
motiu real per sortir de la PWA cap a una app nativa (V3, i només si
V0/V1 demostren ser útils).

## Sobre gràfics mensuals/trimestrals

Les setmanes ja es guarden amb data (clau = dilluns de cada setmana), així
que agrupar-les per mes o trimestre més endavant és només una qüestió de
com es mostren, no de com es guarden — no calen canvis a les dades. La
pantalla de gràfics en si (una 4a pestanya "Pilars") encara no està
construïda: amb zero setmanes registrades ara mateix, dibuixar-la abans
de tenir dades reals seria treball especulatiu. És la primera cosa a fer
en V1, en quant hi hagi almenys 3-4 setmanes registrades.

## Roadmap (recordatori)

- V1 (setembre): revisió setmanal auto-generada, gràfics de tendència per
  pilar, ajust d'hàbits a l'horari real de curs.
- V2: anàlisi de patrons, mode escriptori, fotos de progrés.
- V3: widget natiu + capa d'IA — només si V0/V1 demostren ser útils.
