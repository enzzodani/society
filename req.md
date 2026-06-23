## 2. Advanced Analytics Integration & "Peladas" Tab Overhaul

### 2.1 Session-Specific Leaderboards (Match Ranking Integration)
- **Current State:** Clicking a match card under "Sessões Anteriores" currently opens a deep dive containing individual game accordions, lineups, and live match events. 
- **Requirement:** Inside this specific Session modal, integrate a secondary tab, toggle, or container labeled **"Classificação da Pelada"** (Session Leaderboard). This view must render the specific ranking calculated solely for that block of matches, displaying points, G+A, and individual session ratings matching the app's internal logic.

### 2.2 Time-Filter Component Unification
- **Current State:** The **Estatísticas dos Jogadores** view possesses an excellent time-range filter component (`Última Pelada`, `Mês`, `Temporada`, `Ano`, `Personalizado`) at the top right.
- **Requirement:** Duplicate and implement this exact filter bar at the top of the main **Peladas** tab dashboard. All collective group charts (Evolução Geral, Frequência de Gols) and session statistics must re-render dynamically relative to the active time filter.

### 2.3 Group & Lineup Optimization Analytics
- **Requirement:** Utilize the **Peladas** screen dashboard exclusively for group-level trends, squad patterns, and historically outstanding milestones derived from the wiki database, ensuring it never overlaps with individual player analytics. Append new tracking components for:
  - **Wiki Metrics:** Integrate **Dynamic Duos (Duplas Dinâmicas)** historical logs.
  - **Tactical Lineup Optimizer:** Calculate the most dominant, highly winning multi-player combinations across history:
    * **Futsal Mode:** The best-performing combination of exactly **4 players** who win the highest percentage of matches together.
    * **Society Mode:** The best-performing combination of exactly **5 players** who win the highest percentage of matches together.
  - **Dominant Franchise:** The structural combination of players that won the highest percentage of games within the selected time filter.

### 2.4 Clutch Performers Leaderboard
- **Metric Definition:** "Clutch Goals" are defined explicitly as goals scored within the final 2 minutes of a match (specifically anytime from the 6:00 minute mark onwards).
- **UI Component:** Implement a dedicated ranking table component within the advanced metrics section.
- **Table Structure:**
  | # | Jogador (Player) | Gols Clutch (Clutch Goals) |
  | :--- | :--- | :--- |

  ## 2. Player Stats / Profile Modal UI Optimization

### 2.1 Relational Metrics List-to-Grid Conversion
- **Current Behavior:**Advanced personal relational statistics (such as synergy, partner combinations, and rivalries) are currently rendered as a single-column, heavy vertical list. This configuration layout triggers excess vertical scrolling to see metrics at the bottom of the player card.
- **Requirement:** Refactor the entire vertical list container showcased in the player profile modal into a compact, multi-column grid system consisting of squared metric blocks/cards.
- **Target Layout Design:**
  - Convert each item row into an independent, well-aligned square data block.
  - Implement a responsive grid arrangement (e.g., 2-column layout on mobile, 3 or 4-column layout on desktop viewports) to effectively use screen width.
  - Retain all native iconography, visual themes, category titles, and quantitative data formats (e.g., `4 assist.`, `19 jogos`, `8 vit.`).
  - **Metrics to include inside the unified grid:**
    * **Mais o Assistiu** (Most Assisted By)
    * **Mais Assistiu** (Most Assists To)
    * **Mais Jogou Junto** (Most Matches Played With)
    * **Mais Venceu Junto** (Most Wins With)
    * **Mais Perdeu Junto** (Most Losses With)
    * **Mais Enfrentou** (Most Head-to-Head Matches)
    * **Maior Freguês (Contra)** (Highest Win Rate Against)
    * *Other active relational properties (Carrasco, Rival Equilibrado)*
- **Goal:** Maximize immediate information density and put all synergy indicators within view at a single glance without scrolling.