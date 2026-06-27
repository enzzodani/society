# Target Specification: Live Match State Synchronization & Advanced Session Rules

This document outlines the architectural requirements for enabling real-time session tracking on the web dashboard and configuration enhancements for multi-win rule sets in the mobile application.

---

## 1. Mobile Application (App) Requirements

### 1.1 Non-Blocking Automated DB Synchronization
- **Requirement:** Automate the data synchronization payload dispatch immediately following the conclusion of each individual match, rather than relying on a manual post-session sync button click.
- **Performance Constraint:** The sync event **must not** block the application's Main Thread or cause UI/UX micro-stutters.
- **Implementation Strategy:**
  * Execute the database JSON generation and subsequent network transmission asynchronously using background threads or non-blocking network promises (e.g., Worker threads or `useEffect`/Asynchronous task queues where appropriate).
  * The network payload should contain the entire database state JSON file (safe for immediate scale as the total volume tracks under 6 months of absolute operational footprint).

### 1.2 "Sequence Mode" Configuration on Session Creation
- **Current Behavior:** When a specific team achieves a 3-game winning streak, the application triggers a reactive prompt suggesting either a "dual team exit" or "splitting the winning team."
- **Requirement:** Migrate this decision-making logic directly to the initial Session Configuration Panel (where game time, player count, and sub-modes are declared).
- **UI Elements to Add:**
  * **Max Consecutive Wins (Number Input/Dropdown):** Defines the threshold limit integer (e.g., `3`).
  * **Streak Resolution Action (Selector/Dropdown):**
    * *Option A:* **Split Team** (Automatically invoke the pre-existing system algorithm to mix up the winning roster).
    * *Option B:* **Dual Exit** (Both the winning team and losing team exit the pitch to let the next waiting queues cycle in).
- **System Rule Enforcement:** Once declared at session startup, eliminate the mid-session manual prompts. The core match-lifecycle controller must automate the chosen action immediately when the threshold condition is met.

---

## 2. Web Application (Site) Requirements

### 2.1 Live "In-Progress" Dashboard Tracker
- **Requirement:** Enhance the main Dashboard panel layout to conditionally render a prominent **"Pelada em Andamento" (Live Match Session)** container whenever an active state flag is captured in the database payload.
- **Required UI Widgets:**
  * **Current Pitch State:** Clear visual block rendering the names/rosters of the two lineups currently actively playing.
  * **Queue Management Lineup:** A prioritized queue list demonstrating the exact sequential order of substitute teams waiting to sub in.

### 2.2 Network-Efficient Queuing Data Contract
- **Constraint:** Real-time point-by-point score casting is omitted for this iteration to avoid over-saturating network calls during live actions. Only structural game-state metadata shifts are synced.
- **Architectural Solution for Layouts:**
  * The mobile application already processes queue/lineup tracking schemas internally. To bridge this data over the wire without re-calculating structures from scratch on the client, append a computed layout mapping array onto the database output block.
  * Implement a structured structural property mapping onto the configuration payload:
    ```json
    {
      "active_session": true,
      "mode_format": "futsal", 
      "player_count_per_team": 4,
      "queues": [
        ["PlayerID_1", "PlayerID_2", "PlayerID_3", "PlayerID_4"],
        ["PlayerID_5", "PlayerID_6", "PlayerID_7"]
      ]
    }
    ```
  * **Parser Logic:** The client-side dashboard framework must read this structure dynamically based on the game profile type parameters. If `mode_format` is `"futsal"`, parse index blocks to display structural groups of 4. If `"society"`, map structures to scale blocks of 5 seamlessly.