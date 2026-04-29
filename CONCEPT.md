# DoelenApp — Concept & Paginabeschrijving

Persoonlijke gezondheids- en levensmonitoring app, bereikbaar als PWA via het iPhone thuisscherm.
Alleen voor persoonlijk gebruik. Data wordt lokaal opgeslagen in de browser (IndexedDB).

---

## Technische basis

| Onderdeel | Keuze |
|-----------|-------|
| Type | Progressive Web App (PWA) — installeerbaar via Safari op iPhone |
| Framework | React + Vite |
| Styling | Tailwind CSS |
| Data-opslag | IndexedDB (localforage) — lokaal in de browser |
| Grafieken | Recharts |
| Hosting | GitHub Pages (gratis) |
| Repository | github.com/ljmoudenhoven-cyber/DoelenApp |

---

## Pagina 1 — Home (Hoofdpagina)

### Wat doet deze pagina?
Het centrale dashboard. Hier zie je alle taken die vandaag op je agenda staan, afkomstig uit de andere pagina's.

### Functionaliteit
- **Datum van vandaag** bovenaan
- **Takenlijst** met alle taken die vandaag gepland zijn:
  - Taak openen → invulformulier afhankelijk van het type taak
  - Taak afvinken → verdwijnt uit de lijst, data wordt opgeslagen
  - Taak overslaan → reden invullen verplicht
- **Te late taken** (onderaan, aparte sectie):
  - 1–7 dagen te laat → oranje
  - Meer dan 7 dagen te laat → rood
  - Bijschrift met aantal dagen te laat

### Wanneer verschijnen taken?
| Taak | Dag |
|------|-----|
| Lichaamsmetingen invullen | Elke maandag |
| Hardlopen (trainingsdag) | Elke maandag + vrijdag |
| Leesvoortgang invullen | Elke zondag |
| Nieuw boek toevoegen | 1e van de maand |
| Boekreview invullen | Laatste dag van de maand |

### Verbeterpunten / ideeën voor later
- Weergave van een motiverende quote of weekoverzicht
- Notificaties op de juiste dag (beperkt mogelijk op iOS als PWA)
- Mogelijkheid om zelf extra taken toe te voegen

---

## Pagina 2 — Fysiek

### Wat doet deze pagina?
Lichamelijke gezondheid bijhouden via wekelijkse metingen en visualisaties.

### Functionaliteit
- **Wekelijkse meting** (elke maandag via takenlijst):
  - Gewicht (kg)
  - Vetpercentage (%)
  - Buikomvang (cm)
  - BMI → automatisch berekend op basis van gewicht en lengte
- **Grafieken** per meting: trendlijn over tijd
- **Doellijn** zichtbaar in grafieken (ingesteld via Instellingen)
- **Lengte** eenmalig instellen bij eerste opstart

### Huidige staat
- Meetformulier werkt via taak op hoofdpagina
- Grafieken worden zichtbaar zodra er 2+ metingen zijn
- Doellijn zichtbaar zodra doelen zijn ingesteld

### Verbeterpunten / ideeën voor later
- Statistieken: hoeveel kg afgevallen t.o.v. start, % richting doel
- Optie om historische meting te verwijderen of corrigeren
- Foto-tijdlijn (optioneel: vooruitgang in foto's bijhouden)
- Weekgemiddelde versus maandgemiddelde weergave

---

## Pagina 3 — Sport

### Wat doet deze pagina?
Hardloopvoortgang bijhouden richting het doel: **10 km in minder dan 55 minuten op 12 augustus 2026**.

### Trainingsschema
- 2 trainingsdagen per week: **maandag** en **vrijdag**
- Startpunt: gevorderd beginner (~4 km)
- Progressief oplopend richting 10 km (elke ~2 weken ~10% meer)
- Vrijdag = kortere herstelrun (~75% van maandagafstand)
- Schema loopt tot en met 12 augustus 2026

### Functionaliteit
- **Taak per trainingsdag** op hoofdpagina met doelaafstand
- **Invulformulier bij taak**:
  - Gelopen afstand (km)
  - Tijd (minuten:seconden)
  - Gemiddelde hartslag (bpm) — optioneel
  - Tempo (min/km) → automatisch berekend
- **Persoonlijke records** (automatisch bijgewerkt):
  - Snelste 1 km (tempo)
  - Snelste 5 km (tempo)
  - Langste afstand ooit
  - Langste duurloop (tijd)
- **Grafiek**: afstand over tijd, met doellijn 10 km
- **Afteller**: dagen tot 12 augustus 2026
- **Overzicht recente trainingen**

### Verbeterpunten / ideeën voor later
- Grafiek van tempo over tijd (sneller worden zichtbaar)
- Hartslag grafiek (herstelcapaciteit volgen)
- Schema aanpassen als je een week mist (inhaalplan)
- Andere sporten toevoegen (fietsen, zwemmen)
- Wekelijks totaal (km per week)

---

## Pagina 4 — Lezen

### Wat doet deze pagina?
Maandelijks een boek lezen bijhouden: voortgang, reviews en een bibliotheek van gelezen boeken.

### Functionaliteit
- **1e van de maand**: taak om nieuw boek toe te voegen (titel + aantal pagina's)
- **Elke zondag**: taak om leesvoortgang in te vullen (huidige pagina)
- **Laatste dag van de maand**: taak om boekreview in te vullen
  - Beoordeling (1–5 sterren)
  - Mening over het boek
  - Wat heb je geleerd?
- **Huidig boek weergave**:
  - Voortgangsbalk (% gelezen)
  - Pagina X van Y
  - Resterende dagen in de maand
- **Bibliotheek**: overzicht alle gelezen boeken
  - Maand gelezen
  - Sterrenbeoordeling
  - Review en geleerde lessen uitklappen

### Verbeterpunten / ideeën voor later
- Gemiddeld aantal pagina's per dag berekenen
- Waarschuwing als je achterloopt op schema (bijv. 50% van maand voorbij maar maar 30% gelezen)
- Favoriete boek markeren
- Genre of categorie toevoegen per boek
- Jaaroverzicht: hoeveel boeken gelezen, hoeveel pagina's totaal

---

## Pagina 5 — Export

### Wat doet deze pagina?
Alle verzamelde data exporteren als CSV-bestanden voor gebruik buiten de app (bijv. analyse met Claude).

### Wat wordt geëxporteerd?
| Bestand | Inhoud |
|---------|--------|
| `levensapp-metingen-DATUM.csv` | Datum, gewicht, vetpercentage, buikomvang, BMI |
| `levensapp-sport-DATUM.csv` | Datum, afstand, tijd, tempo, hartslag |
| `levensapp-lezen-DATUM.csv` | Maand, boek, pagina's, beoordeling, review, geleerde lessen |
| `levensapp-overgeslagen-DATUM.csv` | Datum, taak, reden, datum overgeslagen |

### Hoe gebruiken?
1. Klik op "Exporteer alle data"
2. CSV-bestanden worden gedownload naar je iPhone
3. Deel de bestanden met Claude via de chat voor persoonlijke analyses

### Verbeterpunten / ideeën voor later
- Keuze welke categorieën je exporteert
- Export als één gecombineerd bestand
- Datumfilter (bijv. alleen afgelopen 3 maanden)

---

## Instellingen (eenmalig bij eerste opstart)

- **Lichaamslengte** (cm) — verplicht, voor BMI-berekening
- **Doelgewicht** (kg) — optioneel
- **Doelvetpercentage** (%) — optioneel
- **Doelbuikomvang** (cm) — optioneel

Doelen zijn zichtbaar als stippellijn in de grafieken op de Fysiek-pagina.

---

## Ontwikkelstrategie

De app wordt **stap voor stap** per pagina verder uitgewerkt en verfijnd:

1. **Home** — taaksysteem volledig werkend ✅
2. **Fysiek** — basisformulier + grafieken ✅ | verfijning volgt
3. **Sport** — schema + formulier + records ✅ | verfijning volgt
4. **Lezen** — boekbeheer + bibliotheek ✅ | verfijning volgt
5. **Export** — CSV-export ✅ | uitbreidingen volgen

Per sessie: jij geeft feedback en input, Claude programmeert en pusht naar GitHub.
Na elke push wordt de app automatisch bijgewerkt via GitHub Actions.
