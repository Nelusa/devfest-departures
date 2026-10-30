# DevFest Departures

**Live demo:** https://nelusa.github.io/devfest-departures/

Živá odjezdová tabule DevFest agendy, kterou si appka sama odposlouchává z Enigma vysílání a před očima dešifruje — ciphertext se split-flap efektem „proklape" na program, a nahoře vždy vidíš, co běží **TEĎ** a co je **DÁL**.

## Jak to funguje

- Každých 60 s stáhne `GET /api/transmissions` (posledních 10 zpráv), každou dešifruje Enigmou I (rotory I-II-III, reflektor B, rings AAA, plugboard DE VF ST) z jejího `start`.
- Program se akumuluje v `localStorage` (deduplikace podle času + sálu), takže se tabule postupně zaplní celým dnem.
- Délka přednášky = do začátku další v sále, max. 45 min. Časy v Europe/Prague.
- Offline / CORS chyba → „SIGNAL LOST", tabule běží z cache a zprávu jde dešifrovat ručně.
- Demo jiného času: `?time=13:20`.

## Vývoj

```bash
npm install
npm run dev
npm test
npm run build
```

Logika je v čistých funkcích bez Reactu: [`src/lib/enigma.ts`](src/lib/enigma.ts), [`src/lib/agenda.ts`](src/lib/agenda.ts).

## Deploy

Push do `main` → GitHub Action postaví a nasadí na GitHub Pages (Settings → Pages → Source: GitHub Actions). `base` se nastaví podle názvu repa.
