Football App & Website: Season Update
& Rating System Requirements
This document outlines the technical requirements for the upcoming season updates, data
management, and the refactoring of the player rating system. It is designed to be followed by
the development team or AI assistant for implementation.
1. Season Data Backup & Export (App)
Current State: The current synchronization and export logic pushes all data stored in local
memory to Firebase or local files.
Requirement: Implement a scoped backup and export feature specific to defined seasons.
● Date Range Filtering: The export function must accept a start and end date (the season
range defined in the "Manage Season" screen).
● Selective Data Extraction: Only export data
that fall within this defined date range.
● Storage Independence: Once a season is exported/backed up, it should be securely
stored as an archive. The app can then safely clear or separate this data from the "active"
memory to prevent performance degradation over time.
2. Dynamic Season Display (Website)
Current State: The website defaults to showing the latest chronological season (e.g., August to
December).
Requirement: The website must intelligently select the default season filter based on the
current real-world date.
● Date Awareness: The frontend must compare today's date (e.g., July 10, 2026) against
the start and end dates of the available seasons in the configuration payload.
● Default Selection: If today's date falls within a season's range (e.g., the March-July or
July-August season), that season must be automatically selected as the default view.
● Fallback: If the current date does not fall within any defined season, default to the most
recently completed season.
● Manual Override: Users must retain the ability to manually change the season via the
existing filter dropdown.
3. Rating System Overhaul (App & Website)
Current State: The rating system uses a Bayesian calculation with a fixed prior and a slight
weight increase (2x) for the last 3 games.
Requirement: Make the current season ratings more volatile to reflect recent form while
preserving historical data.
● Historical Data Preservation: Modify the site data generator to separate
historical_ratings from current_season_ratings. Display the historical averages on the
individual player profiles, but use ONLY the current season's data for the active ranking

table.
● Seasonal Reset: At the start of a new season (e.g., Winter Season), active ratings must
reset to the base value.
● Increased Volatility: Replace or adjust the Bayesian algorithm. Consider using an
Exponential Moving Average (EMA) where the most recent 5 or 7 matches account for
60-70% of the player's total rating. Once a player surpasses the minimum game
threshold, the "prior" baseline should be completely phased out to allow maximum
volatility based strictly on current performance.
● Minimum Game Threshold: Strictly enforce a minimum number of games (e.g., 5
games) for a player to appear in the active global ranking. Players below this threshold
should be tagged as "Unranked" or "In Placement".
4. Additional Feature Suggestions

Provides immediate context for
why a player's volatile rating is
rising or falling.

"Hot Streak" & "Cold Streak"
Tags

Increases engagement and
creates narratives around
player form during the active
season.


Opponent Strength Multiplier
(Elo-lite)

Factor in the average rating of
the opposing team when
calculating the match rating.
Beating a highly-rated team
yields a higher bonus.

Makes the volatile rating more
accurate by rewarding standout
performances in difficult
matches.