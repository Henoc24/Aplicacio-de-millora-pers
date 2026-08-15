# September — Personal OS (V0)

Pensada per fer-se servir tot l'any, no només fins l'1 de setembre. PWA
local, sense comptes ni backend. Totes les dades es guarden al
`localStorage` del navegador del mòbil — si desinstal·les l'app o esborres
dades del navegador, es perden. No hi ha sincronització entre dispositius
en aquesta versió (per això existeix l'exportar/importar, més avall).

## Què inclou aquesta V0

- **Avui** — hàbits (editables des de la mateixa app — afegeix'n o
  elimina'n quan et calgui, p. ex. quan comenci el curs) amb finestra de
  consistència (X/7 dies), Son com a targeta pròpia (hora + franja
  objectiu 23:30–00:30), comptador de sessions de focus del dia.
- **Focus** — defineixes assignatura/objectiu/durada (sense valor per
  defecte — la poses cada vegada), temporitzador, botó "he perdut el
  focus", registre final (temps real, completada, comprensió 🟢🟡🔴,
  **dificultat**, interrupcions). Secció "Per assignatura" que agrupa
  totes les sessions per veure quines assignatures estàs descuidant.
  Últimes 8 sessions visibles.
- **Setmana** — pes, autoavaluació 1-10 dels pilars (Físic, Fortalesa,
  Coneixement, Comunicació), **Aura desagregada en 3 factors**
  (grooming/imatge, roba/estil, confiança — en comptes d'un sol número
  inventat), **comunicació com a accions concretes** (persones noves
  amb qui has parlat, vegades que has expressat una opinió o parlat en
  grup), interaccions socials, hores de mòbil (útil/oci/automàtic)
  manual, notes opcionals. Llista de setmanes anteriors per veure
  tendència.

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
