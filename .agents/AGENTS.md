# Antigravity Custom Rules – Google Meridian Ads Pipeline

These project-scoped rules are persistently loaded by the Antigravity AI assistant for all operations within this workspace.

## 1. Ausführliche Berichterstattung & Verständlichkeit (Detailed & Crystal-Clear Reports)
- **Regel:** Der Assistent muss nach jedem Modell- und Insights-Durchlauf immer einen ausführlichen, umfassenden und für den Endnutzer absolut glasklaren Bericht ausgeben.
- **Erklärungen von Fachbegriffen:** Jede statistische Kennzahl muss laienverständlich erklärt werden:
  - **R-hat-Wert (Konvergenz):** Was bedeutet dieser Wert? Wie zeigt er, ob das mathematische Modell valide und vertrauenswürdig ist (Werte unter 1.1)?
  - **Sättigung (Diminishing Returns):** Was bedeutet Sättigung? Erklärung des Gesetzes des abnehmenden Grenzertrags und des Unterschieds zwischen durchschnittlichem ROI (Gesamtrendite) und marginalem ROI (Ertrag des nächsten zusätzlich investierten Euros).
  - **Conversion-Grundlage:** Auf welcher mathematischen Grundlage (z. B. höherer mROI) ist in bestimmten Kanälen mit mehr Conversions zu rechnen?
- **Ultra-konkrete Empfehlungen:** Der Bericht darf nicht vage bleiben. Er muss genau vorgeben, was zu tun ist:
  - In welcher **Kampagne** (z. B. Search-Branded, PMax-Asset-Group), in welcher **Anzeige** oder bei welchem **Targeting** (z. B. Custom Intent Audiences, Demografien) Anpassungen vorgenommen werden sollen.
  - Mit welcher konkreten Budgetänderung (in EUR) und mit welchem exakten Ergebnis (Outcome in Conversions oder Uplift) zu rechnen ist.

## 2. Echtzeit-Protokollierung (Real-time Background Logging)
- **Regel:** Während Hintergrund-Tasks laufen (wie Datenextraktion, GPU-Modellberechnungen in Colab oder Report-Generierung), muss der Assistent dem Nutzer in Echtzeit protokollieren und anzeigen, welcher Schritt im Hintergrund gerade ausgeführt wird, anstatt ihn im Dunkeln zu lassen.

## 3. Kennzeichnung von echten vs. modellierten Daten (Data Authenticity & Transparency)
- **Regel:** Bei allen ausgegebenen Zahlen, Spends, ROIs und Conversions muss explizit gekennzeichnet werden, ob es sich um **echte Daten** (direkt aus dem Google Ads API Account bezogen) oder um **modellierte/simulierte Daten** (z. B. simulierte Conversions oder Kontrollvariablen) handelt.
- **Einschränkung:** Modellierte/simulierte Testdaten dürfen niemals als Ersatz für echte Ads-Kanal-Daten verwendet werden, wenn echte Daten zur Verfügung stehen oder erwartet werden.
