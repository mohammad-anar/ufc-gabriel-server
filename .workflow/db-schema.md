# Fantasy UFC League — Prisma Database Schema Design

> **Version:** 1.0  
> **Database:** PostgreSQL 15+  
> **ORM:** Prisma 6.x  
> **Author:** Shariar Sultan Fahim  
> **Date:** 2026-04-22

---

## Table of Contents

1. [Overview](#overview)
2. [ER Diagram](#er-diagram)
3. [Domain Breakdown](#domain-breakdown)
4. [Enums](#enums)
5. [Models](#models)
6. [Complete `schema.prisma`](#complete-schemaprisma)
7. [Indexing Strategy](#indexing-strategy)
8. [Migration Plan](#migration-plan)
9. [Environment Setup](#environment-setup)

---

## Overview

The Fantasy UFC League backend requires a data model that supports:

| Domain | Responsibility |
|---|---|
| **Auth & Users** | Registration, login, roles (USER / ADMIN), profile management |
| **Fighter Catalog** | UFC fighter roster with stats, divisions, rankings |
| **Events & Bouts** | UFC events with fight cards, bout results, scoring criteria |
| **Leagues & Teams** | User-created leagues with invite codes, team rosters |
| **Draft System** | Snake-draft room state, pick history, round tracking |
| **Scoring & Points** | Per-bout scoring breakdown, team point aggregation, leaderboards |

### Design Principles

- **Normalize to 3NF** — eliminate redundancy; denormalize only for proven read bottlenecks
- **Explicit relations** — all FKs use `@relation` with `fields`, `references`, `onDelete`
- **Index FK columns** — PostgreSQL does NOT auto-index FK columns
- **Enums for stable sets** — `TEXT + CHECK` pattern via Prisma enums
- **`cuid()` IDs** — globally unique, URL-safe, sortable
- **Audit columns** — every table gets `createdAt` + `updatedAt`
- **Soft delete** — `deletedAt` on entities that need recovery (users, leagues)

---

## ER Diagram

```mermaid
erDiagram
    User ||--o{ LeagueMember : "joins"
    User ||--o{ Team : "owns"
    User ||--o{ League : "creates"
    User ||--o{ Notification : "receives"

    League ||--o{ LeagueMember : "has"
    League ||--o{ Team : "contains"
    League ||--|{ LeagueScoringSettings : "configures"
    League ||--o{ DraftSession : "runs"

    Team ||--o{ TeamFighter : "rosters"
    Team ||--o{ DraftPick : "makes"
    Team ||--o{ TeamBoutScore : "earns"

    Fighter ||--o{ TeamFighter : "assigned to"
    Fighter ||--o{ BoutFighter : "competes in"

    Event ||--o{ Bout : "contains"

    Bout ||--|{ BoutFighter : "features"
    Bout ||--o{ TeamBoutScore : "generates"

    DraftSession ||--o{ DraftPick : "records"
    DraftSession ||--o{ DraftOrder : "sequences"
```

---

## Domain Breakdown

### 1. Auth & Users

| Model | Purpose |
|---|---|
| `User` | Account identity, credentials, role, profile |
| `Notification` | In-app notifications (draft start, results, invites) |

### 2. Fighter Catalog

| Model | Purpose |
|---|---|
| `Fighter` | UFC fighter master record with career stats |

### 3. Events & Bouts

| Model | Purpose |
|---|---|
| `Event` | UFC event (e.g. UFC 310, Fight Night) |
| `Bout` | Individual fight within an event |
| `BoutFighter` | Join table linking fighters to a bout with result data |

### 4. Leagues & Teams

| Model | Purpose |
|---|---|
| `League` | User-created fantasy league with config |
| `LeagueMember` | Many-to-many join between users and leagues |
| `Team` | A user's team within a specific league |
| `TeamFighter` | Fighters on a team's active roster |

### 5. Draft System

| Model | Purpose |
|---|---|
| `DraftSession` | Draft room state, round tracking, timer config |
| `DraftOrder` | The sequence in which teams pick |
| `DraftPick` | Historical record of each pick |

### 6. Scoring & Points

| Model | Purpose |
|---|---|
| `LeagueScoringSettings` | Configurable point values per league |
| `TeamBoutScore` | Per-bout scoring breakdown for each team |

---

## Enums

```prisma
enum Role {
  USER
  ADMIN
}

enum LeagueStatus {
  DRAFTING
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum EventStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

enum DraftStatus {
  WAITING
  OPEN
  DRAFTING
  COMPLETED
}

enum BoutResult {
  KO_TKO
  SUBMISSION
  DECISION_UNANIMOUS
  DECISION_SPLIT
  DECISION_MAJORITY
  DRAW
  NO_CONTEST
  DQ
}

enum NotificationType {
  DRAFT_STARTING
  DRAFT_PICK
  RESULTS_POSTED
  LEAGUE_INVITE
  TRADE_OFFER
  SYSTEM
}
```

---

## Models

### `User`

The central identity model. Supports both regular users and admins.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `email` | `String @unique` | Login identifier |
| `username` | `String @unique` | Display name, URL-safe |
| `passwordHash` | `String` | bcrypt hash |
| `name` | `String` | Full display name |
| `avatarUrl` | `String?` | Profile picture CDN URL |
| `bio` | `String?` | Short bio |
| `phone` | `String?` | Contact number |
| `location` | `String?` | City / Country |
| `timezone` | `String @default("UTC")` | IANA timezone |
| `role` | `Role @default(USER)` | USER or ADMIN |
| `isVerified` | `Boolean @default(false)` | Email verification |
| `lastLoginAt` | `DateTime?` | Last successful login |
| `deletedAt` | `DateTime?` | Soft delete |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

---

### `Fighter`

Master roster of UFC fighters. Managed by admins.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `name` | `String` | Official fight name |
| `nickname` | `String @default("")` | e.g. "The Last Stylebender" |
| `nationality` | `String` | Country code or full name |
| `division` | `String` | Weight class (Lightweight, etc.) |
| `rank` | `Int?` | Division ranking (null = unranked) |
| `isChampion` | `Boolean @default(false)` | Current division champion |
| `avatarUrl` | `String?` | Fighter headshot |
| `age` | `Int?` | Current age |
| `height` | `String?` | e.g. "6'4\"" |
| `reach` | `String?` | e.g. "84\"" |
| `wins` | `Int @default(0)` | Total career wins |
| `losses` | `Int @default(0)` | Total career losses |
| `draws` | `Int @default(0)` | Total career draws |
| `koWins` | `Int @default(0)` | KO/TKO wins |
| `submissionWins` | `Int @default(0)` | Submission wins |
| `decisionWins` | `Int @default(0)` | Decision wins |
| `titleDefenses` | `Int @default(0)` | Successful title defenses |
| `formerChampionDivisions` | `String[]` | PG array of divisions |
| `isActive` | `Boolean @default(true)` | Active on roster |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

---

### `Event`

A UFC event (PPV, Fight Night, etc.)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `name` | `String` | e.g. "UFC 310" |
| `location` | `String` | Venue + City |
| `date` | `DateTime` | Event date |
| `posterUrl` | `String?` | Poster image CDN |
| `status` | `EventStatus @default(UPCOMING)` | lifecycle state |
| `hasResults` | `Boolean @default(false)` | Quick flag for filtering |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

---

### `Bout`

An individual fight within an event.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `eventId` | `String` | FK → Event |
| `weightClass` | `String` | Division for this bout |
| `rounds` | `Int @default(3)` | 3 or 5 rounds |
| `isMainEvent` | `Boolean @default(false)` | Main event flag |
| `isCoMainEvent` | `Boolean @default(false)` | Co-main flag |
| `isTitleFight` | `Boolean @default(false)` | Championship bout |
| `winnerId` | `String?` | FK → Fighter (null before result) |
| `result` | `BoutResult?` | How the fight ended |
| `isChampionVsChampion` | `Boolean @default(false)` | Champ vs champ flag |
| `isWinnerAgainstRanked` | `Boolean @default(false)` | Ranked opponent flag |
| `order` | `Int @default(0)` | Card position |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

---

### `BoutFighter`

Join table linking exactly 2 fighters to a bout. Stores corner/side info.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `boutId` | `String` | FK → Bout |
| `fighterId` | `String` | FK → Fighter |
| `corner` | `Int` | 1 = red, 2 = blue |
| `createdAt` | `DateTime @default(now())` | — |

> **Constraint:** `@@unique([boutId, fighterId])` prevents duplicate assignments.

---

### `League`

A fantasy league created by a user (the manager).

 ![alt text](image.png) form value will be, league Name, league size default 10, leagueType public private the private league have a passcode. draft type is snake draft, draft date and time. draft time is 60 seconds per pick. share link and copy link with invite code.

there is a button name join a League, the user can join a league by entering the code and passcode if the league is private or just enter the code if the league is public. if league size is full then the user cannot join the league. get all active league with pagination and filter with private and public.![alt text](image-1.png) there is drafting rooms that meaning how many people are online and not in any drafting. there is full rooms which is how many online user are in a system generated league. if systemgenerated league is full than instant pick will start.
always there have a systemgenerated league running. which is not drafting. but drafting may have many. 

![alt text](image-2.png) also user can get my joined league. 

when user click a join league then it will join a system generated league or if have any system generated league which is not full yet, then he will join this league. and then start a count down from 5 min. the league size will be 10. after 5 minutes if the league is full then instant start the draft and if not full then wait for 5 minutes or untill the league is full.





| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `name` | `String` | League display name |
| `code` | `String @unique` | 6-char join code |
| `passcode` | `String?` | Optional private league password |
| `managerId` | `String` | FK → User (creator) |
| `memberLimit` | `Int @default(8)` | Max teams |
| `rosterSize` | `Int @default(5)` | Fighters per team |
| `status` | `LeagueStatus @default(DRAFTING)` | Lifecycle |
| `draftTime` | `DateTime?` | Scheduled draft start |
| `deletedAt` | `DateTime?` | Soft delete |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

---

### `LeagueMember`

Many-to-many join between User and League.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `leagueId` | `String` | FK → League |
| `userId` | `String` | FK → User |
| `joinedAt` | `DateTime @default(now())` | — |

> **Constraint:** `@@unique([leagueId, userId])` prevents duplicate joins.

---

### `LeagueScoringSettings`

One-to-one scoring configuration per league. Mirrors the 6 criteria from the frontend.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `leagueId` | `String @unique` | FK → League (1:1) |
| `winPoints` | `Int @default(1)` | Base win points |
| `finishBonus` | `Int @default(1)` | KO/TKO/SUB bonus |
| `winningChampionshipBout` | `Int @default(1)` | Title fight win pts |
| `championVsChampionWin` | `Int @default(1)` | Champ vs champ pts |
| `winningAgainstRankedOpponent` | `Int @default(1)` | Ranked opponent pts |
| `winningFiveRoundFight` | `Int @default(1)` | 5-round win pts |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

---

### `Team`

A user's roster within a specific league.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `name` | `String` | Team display name |
| `leagueId` | `String` | FK → League |
| `ownerId` | `String` | FK → User |
| `totalPoints` | `Int @default(0)` | Denormalized leaderboard value |
| `rank` | `Int?` | Current league standing |
| `iconGlyph` | `String?` | Team icon emoji / glyph |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

> **Constraint:** `@@unique([leagueId, ownerId])` — one team per user per league.

---

### `TeamFighter`

Fighters currently on a team's active roster.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `teamId` | `String` | FK → Team |
| `fighterId` | `String` | FK → Fighter |
| `acquiredAt` | `DateTime @default(now())` | When picked/traded |

> **Constraint:** `@@unique([teamId, fighterId])` prevents duplicates.

---

### `DraftSession`

State for a live draft room.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `leagueId` | `String @unique` | FK → League (1:1) |
| `status` | `DraftStatus @default(WAITING)` | Room state |
| `currentRound` | `Int @default(1)` | Active round |
| `currentPickIndex` | `Int @default(0)` | Index into DraftOrder |
| `secondsPerPick` | `Int @default(60)` | Timer config |
| `totalRounds` | `Int` | Total rounds (= rosterSize) |
| `startedAt` | `DateTime?` | When draft actually started |
| `completedAt` | `DateTime?` | When draft concluded |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @updatedAt` | — |

---

### `DraftOrder`

Defines the pick order for each round (supports snake draft).

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `draftSessionId` | `String` | FK → DraftSession |
| `teamId` | `String` | FK → Team |
| `round` | `Int` | Round number |
| `pickPosition` | `Int` | Position within round |
| `overallPick` | `Int` | Global pick number |

> **Constraint:** `@@unique([draftSessionId, overallPick])` ensures no collisions.

---

### `DraftPick`

Historical record of every pick made.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `draftSessionId` | `String` | FK → DraftSession |
| `teamId` | `String` | FK → Team |
| `fighterId` | `String` | FK → Fighter |
| `round` | `Int` | Round picked |
| `pickNumber` | `Int` | Overall pick number |
| `pickedAt` | `DateTime @default(now())` | Timestamp |

> **Constraint:** `@@unique([draftSessionId, fighterId])` — a fighter can only be picked once per draft.

---

### `TeamBoutScore`

Per-bout scoring breakdown for a team's fighter. Created when results are posted.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `teamId` | `String` | FK → Team |
| `boutId` | `String` | FK → Bout |
| `fighterId` | `String` | FK → Fighter |
| `winPoints` | `Int @default(0)` | Earned from win |
| `finishBonus` | `Int @default(0)` | Earned from finish |
| `championshipPoints` | `Int @default(0)` | Title fight win |
| `champVsChampPoints` | `Int @default(0)` | C-v-C win |
| `rankedOpponentPoints` | `Int @default(0)` | Ranked opponent win |
| `fiveRoundPoints` | `Int @default(0)` | 5-round win |
| `totalPoints` | `Int @default(0)` | Sum of all above |
| `createdAt` | `DateTime @default(now())` | — |

> **Constraint:** `@@unique([teamId, boutId, fighterId])` prevents duplicate scoring.

---

### `Notification`

In-app notifications for users.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Primary key |
| `userId` | `String` | FK → User |
| `type` | `NotificationType` | Category |
| `title` | `String` | Headline |
| `message` | `String` | Body text |
| `isRead` | `Boolean @default(false)` | Read state |
| `metadata` | `Json?` | Flexible payload (link, IDs) |
| `createdAt` | `DateTime @default(now())` | — |

---

## Complete `schema.prisma`

```prisma
// ──────────────────────────────────────────────
// Fantasy UFC League — Prisma Schema
// ──────────────────────────────────────────────

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────

enum Role {
  USER
  ADMIN
}

enum LeagueStatus {
  DRAFTING
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum EventStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

enum DraftStatus {
  WAITING
  OPEN
  DRAFTING
  COMPLETED
}

enum BoutResult {
  KO_TKO
  SUBMISSION
  DECISION_UNANIMOUS
  DECISION_SPLIT
  DECISION_MAJORITY
  DRAW
  NO_CONTEST
  DQ
}

enum NotificationType {
  DRAFT_STARTING
  DRAFT_PICK
  RESULTS_POSTED
  LEAGUE_INVITE
  TRADE_OFFER
  SYSTEM
}

// ─── Auth & Users ────────────────────────────

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  username     String    @unique
  passwordHash String
  name         String
  avatarUrl    String?
  bio          String?
  phone        String?
  location     String?
  timezone     String    @default("UTC")
  role         Role      @default(USER)
  isVerified   Boolean   @default(false)
  lastLoginAt  DateTime?
  deletedAt    DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  managedLeagues  League[]       @relation("LeagueManager")
  leagueMemberships LeagueMember[]
  teams           Team[]
  notifications   Notification[]

  @@index([email])
  @@index([username])
  @@index([role])
  @@map("users")
}

// ─── Fighter Catalog ─────────────────────────

model Fighter {
  id                     String   @id @default(cuid())
  name                   String
  nickname               String   @default("")
  nationality            String
  division               String
  rank                   Int?
  isChampion             Boolean  @default(false)
  avatarUrl              String?
  age                    Int?
  height                 String?
  reach                  String?
  wins                   Int      @default(0)
  losses                 Int      @default(0)
  draws                  Int      @default(0)
  koWins                 Int      @default(0)
  submissionWins         Int      @default(0)
  decisionWins           Int      @default(0)
  titleDefenses          Int      @default(0)
  formerChampionDivisions String[]
  isActive               Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  teamFighters TeamFighter[]
  boutFighters BoutFighter[]
  draftPicks   DraftPick[]
  boutScores   TeamBoutScore[]
  wonBouts     Bout[]         @relation("BoutWinner")

  @@index([division])
  @@index([rank])
  @@index([isChampion])
  @@index([isActive])
  @@index([division, rank])
  @@map("fighters")
}

// ─── Events & Bouts ──────────────────────────

model Event {
  id         String      @id @default(cuid())
  name       String
  location   String
  date       DateTime
  posterUrl  String?
  status     EventStatus @default(UPCOMING)
  hasResults Boolean     @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  bouts Bout[]

  @@index([date])
  @@index([status])
  @@map("events")
}

model Bout {
  id                    String      @id @default(cuid())
  eventId               String
  weightClass           String
  rounds                Int         @default(3)
  isMainEvent           Boolean     @default(false)
  isCoMainEvent         Boolean     @default(false)
  isTitleFight          Boolean     @default(false)
  winnerId              String?
  result                BoutResult?
  isChampionVsChampion  Boolean     @default(false)
  isWinnerAgainstRanked Boolean     @default(false)
  order                 Int         @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  event        Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  winner       Fighter?       @relation("BoutWinner", fields: [winnerId], references: [id], onDelete: SetNull)
  boutFighters BoutFighter[]
  boutScores   TeamBoutScore[]

  @@index([eventId])
  @@index([winnerId])
  @@index([eventId, order])
  @@map("bouts")
}

model BoutFighter {
  id        String @id @default(cuid())
  boutId    String
  fighterId String
  corner    Int    // 1 = red corner, 2 = blue corner

  createdAt DateTime @default(now())

  // Relations
  bout    Bout    @relation(fields: [boutId], references: [id], onDelete: Cascade)
  fighter Fighter @relation(fields: [fighterId], references: [id], onDelete: Cascade)

  @@unique([boutId, fighterId])
  @@index([boutId])
  @@index([fighterId])
  @@map("bout_fighters")
}

// ─── Leagues & Teams ─────────────────────────

model League {
  id          String       @id @default(cuid())
  name        String
  code        String       @unique
  passcode    String?
  managerId   String
  memberLimit Int          @default(8)
  rosterSize  Int          @default(5)
  status      LeagueStatus @default(DRAFTING)
  draftTime   DateTime?
  deletedAt   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  manager         User                  @relation("LeagueManager", fields: [managerId], references: [id], onDelete: Cascade)
  members         LeagueMember[]
  teams           Team[]
  scoringSettings LeagueScoringSettings?
  draftSession    DraftSession?

  @@index([managerId])
  @@index([code])
  @@index([status])
  @@map("leagues")
}

model LeagueMember {
  id       String @id @default(cuid())
  leagueId String
  userId   String

  joinedAt DateTime @default(now())

  // Relations
  league League @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([leagueId, userId])
  @@index([leagueId])
  @@index([userId])
  @@map("league_members")
}

model LeagueScoringSettings {
  id                          String @id @default(cuid())
  leagueId                    String @unique
  winPoints                   Int    @default(1)
  finishBonus                 Int    @default(1)
  winningChampionshipBout     Int    @default(1)
  championVsChampionWin       Int    @default(1)
  winningAgainstRankedOpponent Int    @default(1)
  winningFiveRoundFight       Int    @default(1)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  league League @relation(fields: [leagueId], references: [id], onDelete: Cascade)

  @@map("league_scoring_settings")
}

model Team {
  id          String @id @default(cuid())
  name        String
  leagueId    String
  ownerId     String
  totalPoints Int    @default(0)
  rank        Int?
  iconGlyph   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  league       League          @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  owner        User            @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  teamFighters TeamFighter[]
  draftPicks   DraftPick[]
  draftOrders  DraftOrder[]
  boutScores   TeamBoutScore[]

  @@unique([leagueId, ownerId])
  @@index([leagueId])
  @@index([ownerId])
  @@index([leagueId, totalPoints(sort: Desc)])
  @@map("teams")
}

model TeamFighter {
  id         String @id @default(cuid())
  teamId     String
  fighterId  String

  acquiredAt DateTime @default(now())

  // Relations
  team    Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  fighter Fighter @relation(fields: [fighterId], references: [id], onDelete: Cascade)

  @@unique([teamId, fighterId])
  @@index([teamId])
  @@index([fighterId])
  @@map("team_fighters")
}

// ─── Draft System ────────────────────────────

model DraftSession {
  id               String      @id @default(cuid())
  leagueId         String      @unique
  status           DraftStatus @default(WAITING)
  currentRound     Int         @default(1)
  currentPickIndex Int         @default(0)
  secondsPerPick   Int         @default(60)
  totalRounds      Int

  startedAt   DateTime?
  completedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  league     League       @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  draftPicks DraftPick[]
  draftOrder DraftOrder[]

  @@map("draft_sessions")
}

model DraftOrder {
  id             String @id @default(cuid())
  draftSessionId String
  teamId         String
  round          Int
  pickPosition   Int
  overallPick    Int

  // Relations
  draftSession DraftSession @relation(fields: [draftSessionId], references: [id], onDelete: Cascade)
  team         Team         @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([draftSessionId, overallPick])
  @@index([draftSessionId])
  @@index([teamId])
  @@map("draft_orders")
}

model DraftPick {
  id             String @id @default(cuid())
  draftSessionId String
  teamId         String
  fighterId      String
  round          Int
  pickNumber     Int

  pickedAt DateTime @default(now())

  // Relations
  draftSession DraftSession @relation(fields: [draftSessionId], references: [id], onDelete: Cascade)
  team         Team         @relation(fields: [teamId], references: [id], onDelete: Cascade)
  fighter      Fighter      @relation(fields: [fighterId], references: [id], onDelete: Cascade)

  @@unique([draftSessionId, fighterId])
  @@index([draftSessionId])
  @@index([teamId])
  @@index([fighterId])
  @@map("draft_picks")
}

// ─── Scoring & Points ────────────────────────

model TeamBoutScore {
  id                   String @id @default(cuid())
  teamId               String
  boutId               String
  fighterId            String
  winPoints            Int    @default(0)
  finishBonus          Int    @default(0)
  championshipPoints   Int    @default(0)
  champVsChampPoints   Int    @default(0)
  rankedOpponentPoints Int    @default(0)
  fiveRoundPoints      Int    @default(0)
  totalPoints          Int    @default(0)

  createdAt DateTime @default(now())

  // Relations
  team    Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  bout    Bout    @relation(fields: [boutId], references: [id], onDelete: Cascade)
  fighter Fighter @relation(fields: [fighterId], references: [id], onDelete: Cascade)

  @@unique([teamId, boutId, fighterId])
  @@index([teamId])
  @@index([boutId])
  @@index([fighterId])
  @@map("team_bout_scores")
}

// ─── Notifications ───────────────────────────

model Notification {
  id       String           @id @default(cuid())
  userId   String
  type     NotificationType
  title    String
  message  String
  isRead   Boolean          @default(false)
  metadata Json?

  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

---

## Indexing Strategy

### Primary Access Patterns & Index Coverage

| Query Pattern | Index Used |
|---|---|
| Login by email | `users.email` (unique) |
| User profile by username | `users.username` (unique) |
| Fighters by division | `fighters.division` |
| Fighters by division + rank | `fighters.[division, rank]` (composite) |
| Current champions | `fighters.isChampion` |
| Events by date | `events.date` |
| Events by status | `events.status` |
| Bouts in an event (ordered) | `bouts.[eventId, order]` (composite) |
| Teams in a league (leaderboard) | `teams.[leagueId, totalPoints DESC]` |
| Draft picks in session | `draft_picks.draftSessionId` |
| Unread notifications | `notifications.[userId, isRead]` (composite) |
| Join league by code | `leagues.code` (unique) |

### Indexes NOT Added (by design)

- **No index on `deletedAt`** — soft-deleted rows are rare; queries filter on `deletedAt IS NULL` inline
- **No full-text index on `Fighter.name`** — use `ILIKE` for small catalogs; add `pg_trgm` GIN index if needed later

---

## Migration Plan

### Initial Setup

```bash
# 1. Initialize Prisma
npx prisma init --datasource-provider postgresql

# 2. Copy the schema above into prisma/schema.prisma

# 3. Create initial migration
npx prisma migrate dev --name init_fantasy_ufc

# 4. Generate Prisma Client
npx prisma generate

# 5. Seed data (optional)
npx prisma db seed
```

### Recommended `seed.ts` Structure

```
prisma/
├── schema.prisma
├── migrations/
│   └── 20260422_init_fantasy_ufc/
│       └── migration.sql
└── seed.ts          ← Admin user + sample fighters + default scoring
```

### Future Migrations Checklist

- [ ] Add `TradeOffer` model for inter-team trading
- [ ] Add `Season` model for multi-season league support
- [ ] Add `FighterEventSnapshot` for point-in-time stat captures
- [ ] Add `WaiverClaim` model for free agent pickup priority

---

## Environment Setup

### `.env` Configuration

```env
# PostgreSQL connection (development)
DATABASE_URL="postgresql://postgres:password@localhost:5432/fantasy_ufc_dev?schema=public"

# PostgreSQL connection (production — use connection pooler)
# DATABASE_URL="postgresql://user:pass@host:5432/fantasy_ufc?connection_limit=10&pool_timeout=10"
```

### Prisma Client Singleton (Next.js)

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

> [!IMPORTANT]
> **Review the schema carefully before running migrations.** Key decisions to confirm:
> - `cuid()` vs `uuid()` for IDs
> - `memberLimit` and `rosterSize` defaults
> - Whether `Team.totalPoints` denormalization is acceptable vs. real-time aggregation
> - Whether `Notification.metadata` as `Json` is sufficient or needs a typed structure



This is the meegint with my client to breakdown the features and functionalities.

"Anar
Anar
01:29
Hi, Gabriel, how are you?
Gabriel
Gabriel
01:32
Hi, I'm doing alright. How are you?
Anar
Anar
01:35
Yeah.
I'm also good.
Oh, actually, just meeting about the clarification on the functionalities of this, project.
You sent the dog, but, some, we cannot understand something, that's why I call you, call you to this meeting.
Gabriel
Gabriel
01:59
Wait, I just turned on the, captions. Can you, repeat that? Because it's a little… Boom.
It's a little, like… staticky.
Anar
Anar
02:10
Sorry?
What I want to spend.
Okay.
We need some clarification about the feature and functionalities,
Because the Figma is not, fully completed, OHC.
Because, there is no match filled, we think, there is, some mismatch, in the fields.
Oh…
Gabriel
Gabriel
02:42
Okay, so what do you,
Like, where… what are you confused about in the…
Anar
Anar
02:50
Okay, it is better if you, can you explain the features and the functionality, the purpose of the project again? Because we are the developer, we will develop the database, this, with your requirement.
Can I do this?
Gabriel
Gabriel
03:08
Yeah, I… So you know the, document I sent?
Anar
Anar
03:14
Okay, you can share your screen and let us know what you need, you know, what are the functionalities.
Gabriel
Gabriel
03:24
Okay.
Anar
Anar
03:27
Okay.
Gabriel
Gabriel
03:28
Share window… True.
So you can see this?
Anar
Anar
03:35
Yes, yes, I can see.
Gabriel
Gabriel
03:38
You understand all the login, right? So…
Anar
Anar
03:41
Yes, yes, the authentication is, fully understandable.
Gabriel
Gabriel
03:46
The login, the create account…
Shariar Sultan
Shariar Sultan
03:49
It's pretty sweet.
Gabriel
Gabriel
03:50
Not bad.
Shariar Sultan
Shariar Sultan
03:50
Can you go over the, league feature, like, how a league is being created, and is it being managed, and how a player will join the league, and then the draft, how is that working, and from the dashboard, how are you giving the scores and stuff, and the results? You know, the main core feature.
Gabriel
Gabriel
04:07
Okay, so… from the homepage… Let's start from the homepage. So the…
The homepage has teams, leagues, and articles. The teams… the… Like, the leaks,
To create a league, join a league, and then the articles.
So if they create a leak, it redirects to…
If they press Create a League, it redirects to the… Create a leak page… Like, here.
Anar
Anar
04:46
Okay.
Gabriel
Gabriel
04:48
If they… See, this is for if they already have a team, but if they don't have a team.
then…
There would be nothing here. But if they have a team, it would direct… like, you would press on their team.
Shariar Sultan
Shariar Sultan
05:04
So…
Gabriel
Gabriel
05:05
In their league.
Shariar Sultan
Shariar Sultan
05:06
The leagues are the team, right?
Gabriel
Gabriel
05:09
This is the league, like, this league is called Mercy MMA, and then this is their team, the user's team.
Shariar Sultan
Shariar Sultan
05:16
Okay, okay.
Gabriel
Gabriel
05:17
And then this is another league that they are in, and then their team name in this league.
Shariar Sultan
Shariar Sultan
05:21
Okay, go ahead.
Gabriel
Gabriel
05:23
And then… If they press that, it would go to… Like, this is a simplified…
My team. But yeah, it'll go to, like, this page.
Shariar Sultan
Shariar Sultan
05:37
Okay, so this page will show the… all the teams he owns, okay?
Gabriel
Gabriel
05:41
And, like, if they have multiple teams, it would be a drop-down.
More so. Like, this is like a one-off, but it would…
Shariar Sultan
Shariar Sultan
05:48
Okay, so this is one team and, like, team's details, like, the fighter's name on team.
So, if he has multiple teams, then it will be a table of showing the team names, and then he can click on the team name, and then get onto this page, showing all the players in his team.
Right?
Gabriel
Gabriel
06:06
Yeah, like, multiple teams.
Shariar Sultan
Shariar Sultan
06:07
Yeah, I woke up in.
Gabriel
Gabriel
06:09
Yeah, but this is one, one team.
Shariar Sultan
Shariar Sultan
06:12
Where we got this. Can you go over the, creating a leak, or… and the full creating a leak feature, and the joining league, and the draft?
Gabriel
Gabriel
06:20
Okay, so creating a league.
The… if they create a league.
They write their league name, how many participants, which,
By default, we'll be, like, 10.
Shariar Sultan
Shariar Sultan
06:36
Okay, so these participants are real, peoples.
Gabriel
Gabriel
06:40
Yeah, okay, okay. Yeah, it's other users, other users.
That's how the participants, and then… yeah, public or private depends on if they're… like, if it's public, then there's no,
Like, passcode.
Shariar Sultan
Shariar Sultan
06:54
Yeah, and the private will be requiring an invite.
Gabriel
Gabriel
06:57
Good.
Shariar Sultan
Shariar Sultan
06:58
password, I think.
Gabriel
Gabriel
06:59
Yeah, if it has private, then there would be, like, a passcode option.
Shariar Sultan
Shariar Sultan
07:03
Okay.
Gabriel
Gabriel
07:05
Yeah, snake draft, that just means it goes 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, and then…
The second round is 10, 9, 8…
7, 6, 5, 4, 3, 2, 1, and then the third round is 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, and…
Shariar Sultan
Shariar Sultan
07:22
So it's just vice versa.
Gabriel
Gabriel
07:24
Yeah, it's like, yeah.
And then…
The… they set the draft date, whatever date they want the draft to be on, and then the time…
Like, the time of the draft.
Shariar Sultan
Shariar Sultan
07:39
Okay.
Gabriel
Gabriel
07:40
And then they pick a time limit for each pick, like… Like, the first pick…
Shariar Sultan
Shariar Sultan
07:48
Everyone gets 60, like, if it's 60 seconds, then everyone gets 60 seconds for their pick, and it continues.
Gabriel
Gabriel
07:55
Yeah, we'll typically…
Shariar Sultan
Shariar Sultan
07:56
That is, like, 10 minutes, then it will take, like, 600 seconds in total.
Gabriel
Gabriel
08:02
Wait, repeat that? Repeat that?
Shariar Sultan
Shariar Sultan
08:03
Okay, so, if it's 60 seconds, then each…
Each user gets 60 seconds to pick their, fighters.
Gabriel
Gabriel
08:11
there.
Shariar Sultan
Shariar Sultan
08:12
Yeah, okay.
Gabriel
Gabriel
08:16
So, yeah, it would usually.
Shariar Sultan
Shariar Sultan
08:17
Okay, so… okay, so they created the league here, then?
Gabriel
Gabriel
08:22
It will usually be, like, I feel like in typical… typically in fantasy, it's, like, 2 minutes, but yeah. So there's, like, an option for 60 seconds, but…
Yeah.
Shariar Sultan
Shariar Sultan
08:33
Okay.
Gabriel
Gabriel
08:34
And then this invite code stuff, like…
I mean, I guess you just copy the… they give you a code, you can copy and send it to a friend, I guess, or…
invite by email, but that's not too… I don't know, I don't know what that is. And then they…
Create the league, and the league shows up… the created leagues will show up right here, if they will have a passcode…
See, these are, like, the zero out of.
Shariar Sultan
Shariar Sultan
09:06
Yes, yes, how many members are already in the league?
Gabriel
Gabriel
09:08
Yeah, if they join… so this is a member who's not in the league yet, if he presses join, then…
Shariar Sultan
Shariar Sultan
09:15
Then they can join the league.
Gabriel
Gabriel
09:17
Yeah, and if there's a passcode, you enter the passcode for a private.
Shariar Sultan
Shariar Sultan
09:22
Yeah, yeah.
Gabriel
Gabriel
09:24
And then, here is the… Like, the, the rooms, like, drafting rooms that are just.
Shariar Sultan
Shariar Sultan
09:31
pages and statistics, like how many drafts are there and stuff. Okay, so after we… after a user joins a leak, then what happens?
Gabriel
Gabriel
09:41
Like, this is, like,
These are not created leagues, though. These are just rooms, like, it depends how, like…
How much traffic is on the, like,
How much traffic is on the account, but these are just, like, default leagues that…
like, there would be, like, if there's no real person on, they could just be, like, one. But if people keep coming, then there would be a lot of rooms, and then they would keep filling up, and then…
These for, like, drafting now, like, you don't want to wait for a, like, time.
Creatively, you want a draft now, so…
you join these leagues, and then there's, like, a… it literally just starts in 5 minutes, like, it sends them to…
this page, and…
Shariar Sultan
Shariar Sultan
10:29
Wait, wait a moment, so,
There, like, there was, like, 35 people there, not in any league or, like, just online. And when, like, they created a joiner league, the system.
Gabriel
Gabriel
10:42
Oh, no, no, no, the 35, this is, like, if there was a, like… if there's 35 rooms, and, like, 7 rooms are full, that means that… There's, like, 70… there's, like…
27.
Okay. There's, like, over 70, over, like, probably 100 people online.
Shariar Sultan
Shariar Sultan
11:02
Yes, bye.
Gabriel
Gabriel
11:03
And they're joining these rooms, but in, like, the beginning, there wouldn't be that many rooms. It would just be, like, one room, and then if that room fills up, then there would be another room, and, like, yeah, these rooms, they… they fill up, and then a league just…
Like, rend… like, it starts, like, the 5 minutes is the max, and then it goes down, and then the.
Shariar Sultan
Shariar Sultan
11:25
So, they don't need to, like, create a league and then join it. It starts automatically.
When there are enough people online.
Gabriel
Gabriel
11:32
Yeah, these leagues are not created, they're just, like, they're just… you can just press…
Shariar Sultan
Shariar Sultan
11:38
They have to, like, press on the join a league, right? And then they can join it, and…
Gabriel
Gabriel
11:42
Press Join a League here? Yes, they just automatically enter one of these rooms.
And then, when it fills up, that's when the draft just… and the timer is always maxed at, 5 minutes, and when the room is filled up… So this is, like.
Shariar Sultan
Shariar Sultan
11:59
default leak settings that you can set from dashboard or something, I guess.
Gabriel
Gabriel
12:03
It's default settings.
Yeah. Okay. No, yeah.
Got it.
Yeah, and then they press… they can press Edit Draft Rankings, and that basically sends them into…
Like, a little bit of… It could send them into this page with everything blank.
Shariar Sultan
Shariar Sultan
12:25
Okay.
Gabriel
Gabriel
12:25
Or, or, like…
It's just where people can set up their queue, and, like, search for fighters, and basically set up, like, search for fighters here, and set up their queue before the league… before the draft even starts.
Oh…
Shariar Sultan
Shariar Sultan
12:41
So this is the… this is the bit we are confused about, like, how is this draft system working, and, the queue…
And stuff, can you explain it?
Gabriel
Gabriel
12:53
Explain the… how the draft works?
Shariar Sultan
Shariar Sultan
12:55
Yeah, yeah, yeah.
Gabriel
Gabriel
12:56
Okay, let's go down to…
Darn.
Shariar Sultan
Shariar Sultan
13:03
So, this…
Gabriel
Gabriel
13:08
Alright.
Is this… Alright, so…
Shariar Sultan
Shariar Sultan
13:17
Okay.
Gabriel
Gabriel
13:19
the draft. There's this list of fighters that are added through the administration… like, the administrative panel.
Shariar Sultan
Shariar Sultan
13:27
Yeah, dashboard, the dashboard.
Gabriel
Gabriel
13:29
And, yeah, it shows, like, their profiles. You press them, it shows their profile. Okay.
This… it would be empty to start.
But if the first team, like, it's like a, this is user 1, user 2, user 3, user 4, User 5, User.
Shariar Sultan
Shariar Sultan
13:46
So that's the user's queue, okay?
Gabriel
Gabriel
13:49
Yeah, these are the, like… Users.
Shariar Sultan
Shariar Sultan
13:52
You were. So, to repeat their fighter.
Gabriel
Gabriel
13:56
It's the order, the draft order, basically.
Shariar Sultan
Shariar Sultan
13:58
Yeah, yeah, okay.
Gabriel
Gabriel
13:59
And usually it would be up to 10, and then the round 2 would start. Like, it would be 1, 2, 3, 4, 5, 7, 8, 9, 10, then round 2 would start, and then it would be…
Shariar Sultan
Shariar Sultan
14:07
the one.
Gabriel
Gabriel
14:08
you know.
Yeah, 10 to 1, yeah. Yeah, yeah, okay.
Yeah, so… The first person.
They're… all of these are red.
And…
Like, okay, first, it's like a countdown to when the draft starts, and then this is when… then the draft starts, and then the first person… all they… they could put people in their queue before it starts, but once it starts, if they press any of these red buttons, that means they draft that fighter.
Okay. And then it comes up here, like, they draft the fighter, they come up here,
They have one fighter drafted.
And then the next person… the next person, when it's this person's turn, all of these are blue, and it… you press this, it adds to queue, but once they… once they drafted their player.
Once they drafted their fighter, then they're red, and they're on the clock.
Which is, it's more, it's more,
Let me go to a on-the-clock page. So, they're on the clock, and then…
all these are red, and you press it, and it's on their team, and once a person is… once a fighter is drafted, they cannot be drafted again by anyone else. They're gone… they're gone from this list, and they're on the team. And then it's the next person.
They have a countdown, and…
Shariar Sultan
Shariar Sultan
15:40
So each one… each player keeps speaking the fighters on this way.
Gabriel
Gabriel
15:45
Each user just keeps picking fighters or adding them to the queue. Okay. Yeah. You basically just pick a fighter or add them to the queue, or view them, or search them. Like, you have to search to see who you want to pick, the nationalities, the divisions, but yeah.
Shariar Sultan
Shariar Sultan
16:01
Okay, so each, each user is on a timer to pick the fighter, like, the.
Gabriel
Gabriel
16:06
Exactly.
Shariar Sultan
Shariar Sultan
16:07
Same timer, so if they have to pick it…
Gabriel
Gabriel
16:09
Live? Yeah, it's like a live…
Live draft, you're on a timer, you pick, the next person's on the timer.
Shariar Sultan
Shariar Sultan
16:17
Okay, so once the timer runs out, and if a user does not pick their fighter, what will happen?
Gabriel
Gabriel
16:22
Okay, so…
If the timer runs out, and they're, like, not even on the page, because they're just somewhere else, or they disconnected, and it would automatically just… and the timer runs out, it would automatically just pick… like, this is a rank for…
The best available, and it will automatically just pick the person at the top, because, like, if he's gone, then he's gone, then it will pick this person at the top.
Shariar Sultan
Shariar Sultan
16:45
Okay, okay, got it.
Gabriel
Gabriel
16:46
and then…
But if they are gone, and their timer runs out, the system would automatically just turn them to auto-pick, because that means they're not there, and they would have to get online to turn off auto-pick. Because auto-pick means that they just pick, like, right away, once it's their turn, they pick the top person, whoever's at the top of the rank, and then their fighter's here.
Shariar Sultan
Shariar Sultan
17:07
Okay, I understand.
So, okay, so the draft end… draft… after the draft is completed, then what?
Gabriel
Gabriel
17:14
After the draft is completed,
All, all 10 users pick their 20 fighters, they go to team.
They go to my team, and then that also sends them to.
Shariar Sultan
Shariar Sultan
17:29
team, like, the team details. They can see all the fighters.
Gabriel
Gabriel
17:32
The team, yeah, where they see all their fighters, and they're, yeah. And then… yeah.
Shariar Sultan
Shariar Sultan
17:39
Okay, so, like, how the result will be calculated, or, like…
How do we deduct who won?
the draft.
Gabriel
Gabriel
17:49
No one wins the draft, they… After…
Shariar Sultan
Shariar Sultan
17:54
Cross.
Gabriel
Gabriel
17:54
So that.
Shariar Sultan
Shariar Sultan
17:55
The draft is to make their team for the league, right?
Gabriel
Gabriel
17:58
Yes, the draft is to make their…
Teams. Team for the league, but no… but all these points would be empty. It would be 000 across the board. Okay. That means the draft started, and the draft… I mean, the… that means the league started. After the draft happens, the league starts. Okay.
The league would last for a year, and…
the fighters would fight in real life, and I would put the…
Shariar Sultan
Shariar Sultan
18:27
Oh, okay, so I… we were confused, like, how the result will be coming. So, you will put the result from the dashboard for each league, manually?
Gabriel
Gabriel
18:35
Yeah, I'll put the result from real life fights, from the real life UFC.
Shariar Sultan
Shariar Sultan
18:39
Oh, oh go, go, go, great.
Gabriel
Gabriel
18:40
And I put the results into the, dashboard, and then they… go to…
Shariar Sultan
Shariar Sultan
18:46
August. So, my question is, like, what will happen, like, if…
Two fighters don't fight each other in real life.
And it is in this league.
Is it possible, like, a scenario where two fighters doesn't fight each other in real life, but it's in the league?
Gabriel
Gabriel
19:03
Wait, what do you mean? The fighters?
The fighters don't fight in real life.
Shariar Sultan
Shariar Sultan
19:11
Yeah, like, for some reason, they… they didn't fight, or they retired or something.
But it is in the league.
The player is in the league, but they didn't fight in real life.
So…
Gabriel
Gabriel
19:22
At least I've been in the.
Shariar Sultan
Shariar Sultan
19:23
scenario.
Gabriel
Gabriel
19:24
So, if someone drafts someone who does not fight in a year, like.
Shariar Sultan
Shariar Sultan
19:28
Yeah?
Gabriel
Gabriel
19:28
They would just have zero points, like… Oh, okay.
would just be 000, and yeah, on the leaderboard, it would just be 0… like, for that fighter, but their other fighters will fight, and then…
Shariar Sultan
Shariar Sultan
19:42
Okay, got it.
Gabriel
Gabriel
19:43
That one fighter would just have zero.
Shariar Sultan
Shariar Sultan
19:47
Yeah, okay, I understand.
Wait a moment…
Gabriel
Gabriel
19:52
But yeah…
But if they see that they're not fighting, they could just drop them. They would probably drop them and then just pick up someone else in the free agents.
Shariar Sultan
Shariar Sultan
20:05
Yeah, so the… so there, there was something you mentioned in your document, the free agent.
Kinda like that, like, can they change the team on the… okay, so, once the league is started, can they change their player?
the fighter.
Gabriel
Gabriel
20:21
Oh, yes, once the league has started… they can…
They can drop a fighter, but if a fighter already fought, and they dropped the fighter.
That fighter goes back down to zero points. They don't have any points anymore. Everyone in the free agents have zero points, and once you pick up a fighter, then you… they start with zero points, and then…
Like, this would limit… people would just keep…
Shariar Sultan
Shariar Sultan
20:49
Okay, so let's say one fighter already fought, and he has some score, but then the user drops him from the team, then the fighter goes through the free agents, and he has no score now. So if other players…
Gabriel
Gabriel
20:59
Those are the.
Shariar Sultan
Shariar Sultan
21:00
So, yeah. So if any other player picks him, then he will still have zero scores. The previous score is gone.
Gabriel
Gabriel
21:07
Yes, if another, user picks that fighter, he would have zero points. But, if they…
If they go to this, like.
If you go to the opposing team, another team, this would be a drop-down showing all the teams in the league.
Okay. If you go to the team and you propose a trade for one of their fighters, and then you pick what fighter you want to trade for, and there's a message, and there will usually be, like.
and then you can send the trade offer, and usually there will be, like, a… you can… other users can veto if it's not fair, and they're just trying to cheat, and the… it doesn't make sense, the trade, but if they… if the trade does go through, they do trade their points, too. Like, that… that way…
Trade Fighters?
Shariar Sultan
Shariar Sultan
21:53
So user… so let's say user A is offering user B for a trade.
And they are sending messages with the trade offer, but the other 18 players, like, there are 20 teams, right? So 2 teams are trying to trade, and the other.
Gabriel
Gabriel
22:08
They have two teams.
Shariar Sultan
Shariar Sultan
22:08
can veto.
this.
Gabriel
Gabriel
22:11
Well, there, there's, there's 10, usually there'll be 10 teams, 20 people on… 20 fighters on the team.
Shariar Sultan
Shariar Sultan
22:18
Okay, so 10 teams. So the other 8 teams can veto this trade offer. So, should we, like, put some kind of, like, a voting system where they can, like, yes or no?
If they say… most Majority says yes, then it will go through, and if Majority says no, then it will not go through, right?
Gabriel
Gabriel
22:35
Yes, it would be like, if 4 people say, like, no, then it's not going through. But…
That's only if it's, like, very unfair of a trade. Like…
Shariar Sultan
Shariar Sultan
22:46
But how can you determine that, that it's very unfair of trade?
like…
they can veto. If we put an option to vote, they can, like, choose whatever they want, like, they can put it and know if it is a fair trade.
like, we can't stop them making decisions. Or do we want to, like, control it from the dashboard or stuff?
Like, you have the final say.
Gabriel
Gabriel
23:14
I mean, that would be easy to start, like, leagues, but, like, for me to have con… for me to, like, be, like, monitoring every single league, if it's, like.
Shariar Sultan
Shariar Sultan
23:23
That would vary.
Gabriel
Gabriel
23:24
later.
Yeah, so, like, the teams would have to… like, if they send a trade, it doesn't have to be a yes option to, like, okay, this trade can go through, but if…
They… if other users see the trade, and then they're like, oh, this is clearly unfair, there can be a veto option.
But they don't have to… there doesn't have to be a non-veto button for every trade, like, if no one cares, then the trade can just go through. But if someone…
Shariar Sultan
Shariar Sultan
23:53
Okay, got it.
Yeah. Okay, we can do something similar, don't worry.
Okay, so that's it. Then, let me just see if I have any other question.
Wait a moment, please.
Gabriel
Gabriel
24:07
Okay.
Yeah, no problem.
Shariar Sultan
Shariar Sultan
24:09
Oh, it's all.
If you can come to the dashboard, like, I saw a lot of your comments, and I don't think that has been resolved.
Like, can you go to the dashboard?
Gabriel
Gabriel
24:21
Go to the… what's the dashboard?
Shariar Sultan
Shariar Sultan
24:23
Yeah, it's zoom out, zoom out, it's top left corner.
Top left, mode left, like, zoom out mode. It's on the… Yeah, yeah. So, yeah.
Gabriel
Gabriel
24:32
Over here.
Shariar Sultan
Shariar Sultan
24:33
Yeah, yeah. So, like, if you can, like, see my cursor, And, yeah, so…
So, here you say that, yeah, so you don't understand, like, why I need to edit, so I also don't understand why you need to edit a player's name, so I think this is, like, unnecessary, right?
You can, like, check the status and role, I think, but player name change is not, like, your treasury.
Gabriel
Gabriel
24:59
Cause users, users create their accounts, so I don't know…
Shariar Sultan
Shariar Sultan
25:03
Yeah, so there's a… so do you want to be able to change the league's name? Like, do you have… do you want to have any control over the leagues? Like, the league's, time or, like, stuff? Do you want to…
Gabriel
Gabriel
25:14
Like…
Shariar Sultan
Shariar Sultan
25:16
What controls do you want over the leagues?
Gabriel
Gabriel
25:18
No, I do not need control over, like, when the league starts. They can create the leagues and then have them start.
Shariar Sultan
Shariar Sultan
25:25
Okay.
Gabriel
Gabriel
25:26
I could, like, view the leagues and see… I guess,
Like, I have some control. Not really, like, I don't need…
the leaks can start, and I can see them, and monitor them, and see how it's going, and…
But there's no real reason for me to delete a league, or.
Shariar Sultan
Shariar Sultan
25:49
Oh, yeah, I don't… I haven't it.
Gabriel
Gabriel
25:50
I don't see a real reason to…
Shariar Sultan
Shariar Sultan
25:52
Okay, so if we, like, think any of it is, needed in the… in… from our end, then we will add it, or otherwise it will… we'll keep it, like, normally, and then if we go, like, the fighter database here, you said, for the next page, like, the fighter points are not the same for the website round. So, like.
The, I, this is the total fighters. You will add fighters here, right?
Gabriel
Gabriel
26:15
Yes.
Shariar Sultan
Shariar Sultan
26:16
Okay, so these fighters will be shown in the drafting stage, where players and big fighters.
Gabriel
Gabriel
26:23
Yeah, with half-fers.
Shariar Sultan
Shariar Sultan
26:24
Yeah, okay. So, in the drafting stage, there is a ranking for fighters, right? So, 1, 2, 3, 4. So, that ranking, how will that be, like, calculated, based on, like.
Will you put a rank manually? Or, like…
Gabriel
Gabriel
26:38
I would… Yes, it would be like I move them up, ranks, down ranks.
Shariar Sultan
Shariar Sultan
26:42
Oh, okay, so…
Gabriel
Gabriel
26:44
Create the rings.
Shariar Sultan
Shariar Sultan
26:45
Okay, so these points, points column is not necessary, I think, as the total points will not be counted, right?
Gabriel
Gabriel
26:52
Meaning, including pest.
It'd be league to league, yeah, exactly.
Shariar Sultan
Shariar Sultan
26:56
Okay, so you will, like, add fighter's name, fighters' images, then, like, nationality, division, and then, like, their rank and stuff, right?
Gabriel
Gabriel
27:04
Yes. Okay.
Shariar Sultan
Shariar Sultan
27:06
Okay.
So… okay, so this is the, the next page is, like, Fighter's profile creation page, and then if we go to… okay, so if we come to the draft management page in the next… next…
Screen?
Gabriel
Gabriel
27:21
Okay.
Shariar Sultan
Shariar Sultan
27:22
Okay, so, so this is the live drop. Can you explain what's happening here? Like.
Gabriel
Gabriel
27:30
I guess if… if… if I have… if I am admin, and I go to a league, and… and they are, like, I guess…
In the sake that…
not everyone's ready, I guess. I could have the control to pause them. Like, that's not typical, but in the startup league, I guess.
Shariar Sultan
Shariar Sultan
27:50
So, like, this is, like, okay, so in the… okay, so if you are visiting a draft, leagues details, and it is in the draft stage, like, drafting draft is happening, then you will see, like, this interface, or, like, you will see the, like, teams, and which player is picking which fighter and stuff, right?
Gabriel
Gabriel
28:09
Yeah.
Shariar Sultan
Shariar Sultan
28:10
Oh, okay.
Gabriel
Gabriel
28:11
That's what this would be. Yeah, that's what this would be.
Shariar Sultan
Shariar Sultan
28:14
Okay, and you want to be able to, like, reset this and reset?
Gabriel
Gabriel
28:18
Yeah, I don't know what reset would mean, like…
Shariar Sultan
Shariar Sultan
28:21
The reset will mean, I guess, the draft is fully reset. Like, the players who picked fighters will be gone and start from the beginning. Draft will start again.
Gabriel
Gabriel
28:30
Okay, I mean, yeah, I guess…
Shariar Sultan
Shariar Sultan
28:31
Wait, do you need this?
Gabriel
Gabriel
28:34
I don't think so, I don't think so.
Shariar Sultan
Shariar Sultan
28:40
Like, yeah.
Gabriel
Gabriel
28:40
But I wouldn't… I wouldn't use it often, I would say. I wouldn't use any of this often, maybe…
Yeah, I wouldn't use any of this often.
Shariar Sultan
Shariar Sultan
28:49
Okay, so…
Gabriel
Gabriel
28:50
In a perfect… in a perfect world, I would not use any of this. Like, this is not necessary, but…
Shariar Sultan
Shariar Sultan
28:55
Yeah.
Gabriel
Gabriel
28:57
Yeah.
Shariar Sultan
Shariar Sultan
28:58
Okay.
Okay, so this is the fight result page, the next screen.
Like, here you were, like, editing the, leaks.
Gabriel
Gabriel
29:08
Yeah, this is important because,
I guess it can… it can be a way to automatically…
put the points in, because I would be like.
I would make the… what is the… the event management right here? I would…
that would be, this is the event, and once the event comes, then I can just put in all of the points that they have, whoever wins.
Save them, and… Yeah… and then…
Shariar Sultan
Shariar Sultan
29:42
Oh, it was…
Gabriel
Gabriel
29:43
ott.
Shariar Sultan
Shariar Sultan
29:43
Okay, so…
here, like, event is happening on, like, this Saturday, and, like, these 8 fighters are fighting, and then you will put the score for these 8 fighters, and the fighters…
This score will affect all the leagues these fighters are in. You want to say that, right?
Gabriel
Gabriel
30:03
Yes, all…
Shariar Sultan
Shariar Sultan
30:04
You don't want to go to, like, each league and manually put a score for Alex, like, in every league.
Gabriel
Gabriel
30:10
I can't, I can't…
Shariar Sultan
Shariar Sultan
30:11
And it will just take it from here to all the links.
Gabriel
Gabriel
30:15
Yes, if someone has the winner, it would implement the… because only the winner gets points, so… it would…
all the leagues who own… I mean, all the users who own that fighter, and I put this point…
Shariar Sultan
Shariar Sultan
30:29
And so all the users, you get the point.
Gabriel
Gabriel
30:32
Yes, they would get the point and stack onto… if they have points prior, it would stack onto that, it would add.
Shariar Sultan
Shariar Sultan
30:39
Okay, so you were saying the event management… from the event management, this event will be created? Okay, so let me see the event management.
So here you are creating an event, like, it's a real-life event, right? So you are creating this as a real-life event?
Gabriel
Gabriel
30:53
Yeah, it's a real-life event, and I'm just putting in all the details, all the fighters…
Shariar Sultan
Shariar Sultan
30:58
Okay, okay.
Okay, got it.
And then, after the event is finished, you are putting in the score.
Gabriel
Gabriel
31:08
Once the event is finished, yeah, like, once I set the event, and then once the event… because events happen every Saturday, mostly, and then once the event… like, during the event day,
all of… I would say all of the, like, action, like, dropping fighters and adding fighters, that's all locked for, like, the day of the fights. And then…
Shariar Sultan
Shariar Sultan
31:33
Oh, okay, okay.
Gabriel
Gabriel
31:34
I just… I just add in the… after every fight, I… or after every event, I add in the points, and then I submit them. It goes to the leagues, and then the next day, they can add and drop and add and drop.
Shariar Sultan
Shariar Sultan
31:45
So, like, let's say the Saturday is a fight, so, every Saturday of the week, drafting, create, drafting and, dropping and, exchanging fighters, like, creating fighters, all is, like, offline and stuff.
Gabriel
Gabriel
32:00
I could… well, I could… I could add fighters. I mean, like, for the leagues, like, for the users, they cannot add and drop things.
Shariar Sultan
Shariar Sultan
32:08
Yeah, I'm saying for the users, like, they can drop or add or, like, trade fighters from that team.
On Saturday.
Gabriel
Gabriel
32:17
Yeah, they cannot add or drop fighters or trade, yes.
Shariar Sultan
Shariar Sultan
32:21
Okay.
So, what is this coding system settings, and how will this be used on your product app?
Gabriel
Gabriel
32:29
Orion.
Shariar Sultan
Shariar Sultan
32:30
for… okay.
Gabriel
Gabriel
32:32
I mean, I know the scoring system…
Shariar Sultan
Shariar Sultan
32:35
So, is this necessary? Like, is this…
Gabriel
Gabriel
32:37
Tonight.
Shariar Sultan
Shariar Sultan
32:37
Being used anywhere.
Gabriel
Gabriel
32:40
Not really, it just… the scoring really just needs to show them how to win. But, like, for me, I don't need this.
Shariar Sultan
Shariar Sultan
32:47
Okay, cool.
Gabriel
Gabriel
32:48
implement all the scoring, and I know the scoring.
Shariar Sultan
Shariar Sultan
32:51
Okay, so this is for the, like, main website, so the users can see how the scoring is working.
Gabriel
Gabriel
32:58
Yeah, that would be on the website. There's a scoring tab on the website where they can see…
Shariar Sultan
Shariar Sultan
33:02
Okay, so I think that this is where you can change the scoring, and this will affect the website, okay?
Got it.
Gabriel
Gabriel
33:09
Okay.
Shariar Sultan
Shariar Sultan
33:10
Okay, then, there's, like, what is this? About privacy policy terms and conditions, right?
Okay, so we can add this, no worry, and this is admin profile… So… okay, nothing here.
And then the notification. So, the notification tab, like, you will, what kind… which, which notification do you need, like…
Gabriel
Gabriel
33:34
Like, I put a,
a comment that I really don't need notifications, they would need notifications, because if someone.
Shariar Sultan
Shariar Sultan
33:42
They will get notification real time, so if you don't need it, we can just drop it.
Gabriel
Gabriel
33:47
Yeah, I don't really need notifications.
Shariar Sultan
Shariar Sultan
33:50
Okay.
Gabriel
Gabriel
33:54
Yeah, like, if I can see all the stuff on the, like…
Shariar Sultan
Shariar Sultan
33:59
Yeah, he will be able to see, like, everything on the.
Gabriel
Gabriel
34:03
Like, here? Here?
Shariar Sultan
Shariar Sultan
34:05
Yeah, yeah, yeah.
Gabriel
Gabriel
34:06
see, like, the activity and stuff, I don't.
Shariar Sultan
Shariar Sultan
34:08
Yeah, you will be able to see everything here, controlling.
Gabriel
Gabriel
34:12
Yeah.
Shariar Sultan
Shariar Sultan
34:13
Okay, so… I guess I have… I asked all the questions I had. Mr. Anal, do you have any questions? So, I'm the front end, and he's the back-end dev, so…
Gabriel
Gabriel
34:26
Okay.
Anar
Anar
34:28
Okay, for now, I think I have no question, but if some question arise, then I will ask you.
Gabriel
Gabriel
34:36
Yeah, yeah, if anytime, any questions, don't just assume things, I can definitely explain.
Anar
Anar
34:43
Yes, you know, the database is complicated. If any mismatch, then the system will not work properly.
That's why if, any question arise, I will ask you.
Gabriel
Gabriel
34:57
Okay. Thank you.
Anar
Anar
34:58
Oh, okay.
Shariar Sultan
Shariar Sultan
34:59
Thank you for your time and explaining everything. This system is a bit complicated, as this is a new territory for us, you know?
Gabriel
Gabriel
35:07
Philly.
Shariar Sultan
Shariar Sultan
35:08
Yeah.
Gabriel
Gabriel
35:09
Yeah, a fantasy… a fantasy draft is… it is pretty complicated of a website, because it's the live… the live part, the live draft…
Yeah.
Shariar Sultan
Shariar Sultan
35:17
Yeah, so making it live is not the issue, like, we are… we are not properly get… understanding the whole, you know, big picture of the, you know, workflow.
Gabriel
Gabriel
35:27
Oh, you're saying?
You're saying, like, the whole understanding of how, like, the website…
Shariar Sultan
Shariar Sultan
35:31
Yeah, yeah, yeah, how everything is working together, so that's why we had so many questions to understand, so we can, like, implement it properly without any issues, you know?
Gabriel
Gabriel
35:40
If you do want to go through, like, how it goes, on ESPN website, because, like, the MLB baseball just started, so on ESPN, you could go through, like.
The fantasy baseball, let's to see how everything is going on there.
Okay. And this would just be for UFC, but that's the MLB baseball.
Shariar Sultan
Shariar Sultan
36:08
Okay, so I'll check that out. Okay, so…
Gabriel
Gabriel
36:11
Yeah.
Shariar Sultan
Shariar Sultan
36:12
Okay, so thank you for your time.
Gabriel
Gabriel
36:14
I could show right now, like…
Shariar Sultan
Shariar Sultan
36:15
Okay, okay, sure, sure.
Sure.
Gabriel
Gabriel
36:17
So… ESPN… Baseball.
Fantasy…
Okay, fantasy… Baseball…
So, this is all my teams, and then this is create and join. If I was to…
Join a public league… I could join a public league.
It will all be Roto. My thing will all be Roto, there wouldn't be this option. It's all a snake, no salary, so it's… this is not really necessary, and then it sends me into the…
Like, this time, these are all the other users, and…
This is the time until, if these slots aren't filled, when this time, it just restarts to 5 minutes.
Shariar Sultan
Shariar Sultan
37:09
Okay.
Gabriel
Gabriel
37:10
Oh, let's see what happens if I press this… so I can…
I can rank my own rankings, and… Exclude? I can…
I don't usually do this, but… Yeah…
Shariar Sultan
Shariar Sultan
37:34
So the system is, like, closed.
How it's working.
Gabriel
Gabriel
37:39
Yeah, but you can see, once it's done…
I'm probably gonna leave this, but once it's done, it will reset to 5, because this is just all the leaks that…
This is just a leak room, like…
Shariar Sultan
Shariar Sultan
37:50
All the players are not here yet, so…
Gabriel
Gabriel
37:54
It resets to 5. And then… but I'll leave this league, and I can just go to one of my teams…
This is my team that… And then these are…
There… there's no… there's none of this, like, bench and starting or any positions, it's just 20 fighters.
There's all the point system.
Yes. And there's trades and acquisitions, add player, drop player, in the…
Add player, that's, like, the free agents.
And you add,
In the opposing teams, it comes up like this. You can go to an opposing team, and…
if you press them, you can… interested in them, or trade, but I don't need interested in them, or just the proposed trade button, and then… yeah. But this… this website can show you a lot about how it works.
Like, boys.
more basic, because this is advanced, and advanced.
Shariar Sultan
Shariar Sultan
38:57
So, we'll check this out, and let's see, we'll start working on the app, and if we have any more questions in the future, we can just ask you. So, thank you for explaining everything and giving us your time. So, I hope, yeah, we'll drop it, you know?
Gabriel
Gabriel
39:12
Thank you.
Shariar Sultan
Shariar Sultan
39:14
Oh, thank you.
Gabriel
Gabriel
Right."


This is the client doc.
"
Explanation of user flow 

Login Page

User → navigates to Login Page
System → displays email input field, password input field, “Remember Me” checkbox, and login button

User → enters email
User → enters password
User → (optional) selects “Remember Me”

User → clicks “Login”

System → validates input fields are not empty
System → sends authentication request

IF credentials are valid:
    System → creates user session
    System → stores session (persistent if “Remember Me” selected)
    System → redirects to Home Page

IF credentials are invalid:
    System → displays error message “Incorrect email or password”

User → clicks “Forgot Password?”
System → redirects to Forgot Password Page

User → clicks “Create an Account”
System → redirects to Create Account Page

Crate Account Page

User → navigates to Create Account Page
System → displays username, email, password, confirm password fields, Terms checkbox, Create Account button

User → enters username
User → enters email
User → enters password
User → confirms password
User → selects Terms & Services checkbox

User → clicks “Create Account”

System → validates all fields

IF valid:
    System → creates user account
    System → logs user in
    System → redirects to Home Page

IF invalid:
    System → displays field-specific error messages

User → clicks “Already have an account? Login”
System → redirects to Login Page

Forgot Password Page 

User → enters email
User → clicks “Confirm”

System → checks if email exists

IF email exists:
    System → generates verification code
    System → sends code to email
    System → redirects to Verify Code Page

IF email does not exist:
    System → displays generic success message

Verify Code Page 

User → enters verification code
User → clicks confirm

System → validates code and expiration

IF valid:
    System → redirects to Create New Password Page

IF invalid:
    System → displays error message

User → clicks “Resend Code”
System → generates new code and sends email

User → clicks “Back to Login”
System → redirects to Login Page

Create New Password Page

User → enters new password
User → confirms password
User → clicks “Reset Password”

System → validates passwords

IF valid:
    System → updates password
    System → redirects to Login Page

IF invalid:
    System → displays error message

Home Page 

User → lands on Home Page
System → loads user data (teams, leagues, articles)

User → clicks “Create a League”
System → redirects to Create League Page

User → clicks “Join a Public League”
System → redirects to Leagues Page

User → clicks a Team
System → redirects to My Team Page

User → clicks an Article
System → opens article page or content view

Rankings Page 

User → navigates to Rankings Page
System → displays fighters list, filters, search bar

User → enters text in search field
User → clicks “Search”

System → filters fighters based on search query

User → selects division filter
System → updates fighter list

User → selects rank dropdown
System → updates fighter list

User → selects nationality dropdown
System → updates fighter list

User → clicks “Reset Filters”
System → resets all filters

User → clicks “Load More Fighters”
System → loads additional fighters

User → clicks pagination button
System → loads selected page

User → clicks fighter name
System → displays fighter profile (modal or page)


Leagues Page

System → displays:
    → List of created leagues
    → “Create League” button
    → “Enter a Room Here And Draft Now” button
    → “Drafting Soon” created leagues section
    → “Join” button 
    → “Enter Passcode” button 

--------------------------------------------------

User → clicks “Create League”
System → redirects to Create League Page

--------------------------------------------------

User → clicks “Enter a Room Here And Draft Now”
System → redirects to Draft Lobby Page (of an automatic league that starts once lobby fills)

User → sees “Drafting Soon” created leagues
User → clicks “Join”
System → redirects to Draft Lobby Page (of a Created League)

User → clicks “enters passcode”
System → displays:
    → Passcode input field
    → User inputs passcode
    → User clicks “Join” button

System → checks passcode

IF passcode is valid:
    System → adds user to that league
    System → redirects user to Draft Lobby (that created league)

IF passcode is invalid:
    System → displays error message
    System → does NOT allow entry

User → clicks Next Page
System → loads more leagues

--------------------------------------------------
Create League Page 

System → displays:
    → League name field
    → League size dropdown (example: 6, 8, 10 users)
    → Public / Private toggle
    → Draft date selector
    → Draft time selector
    → Pick time limit dropdown
    → (If private) Passcode field
    → Create League button

--------------------------------------------------

User → enters league name
User → selects league size
User → selects public or private
User → selects draft date
User → selects draft time
User → selects pick time limit

IF private:
    User → creates passcode

--------------------------------------------------

User → clicks “Create League”

System → validates:
    → league name not empty
    → league size selected
    → draft date/time selected
    → IF private → passcode created

--------------------------------------------------

IF valid:
    System → creates league
    System → assigns user as League Owner
    System → creates empty teams (based on league size)
    System → assigns first team to creator
    System → redirects to Draft Lobby

IF invalid:
    System → displays error

Draft Lobby

System → displays:
    → Countdown timer until draft start
    → “Edit Pre-Draft Rankings” button

--------------------------------------------------

IMPORTANT:
All users in this league will be in THIS SAME lobby

--------------------------------------------------

User → waits for countdown

System → continuously updates countdown

--------------------------------------------------

User → clicks “Edit Pre-Draft Rankings”
System → redirects to Pre-Draft Rankings Page 

Pre Draft Ranking Page

User → searches fighter
System → filters fighter list

User → clicks blue “+”
System → adds fighter to user's queue

--------------------------------------------------

Queue Behavior:
    → This is a PRIORITY LIST
    → Top fighter = highest priority

--------------------------------------------------

User → clicks UP button
System → moves fighter higher in queue

User → clicks DOWN button
System → moves fighter lower in queue

User → clicks DELETE
System → removes fighter from queue

--------------------------------------------------

User → clicks “Save Ranking”

System → saves queue to database

IMPORTANT:
This queue will be used IF:
    → user misses their turn
    → OR user enables autodraft


--------------------------------------------------

WHEN countdown reaches 0:
   IF lobby isn't full:
    System → adds 5 minutes to countdown
  IF lobby is full:
 System → locks lobby
 System → redirects to “Enter The Draft” page 
User → clicks “Enter The Draft

System → displays:
    → List of all fighters
    → Search bar
    → Filters (division, ranking type)
    → Queue (user’s personal list)
    → Empty Pick History 
    → Drafting Order
    → Empty Roster
   → Toggle autopick off
   → countdown until draft starts

--------------------------------------------------

All users can:
    → click blue “+” to add fighters to queue
    → click fighter name to view profile

ONCE countdown (until draft starts) is over:
System → shows countdown for User #1
System → selects User #1 as “ON THE CLOCK”

System → highlights:
    → current user name (red)
    → their turn timer

--------------------------------------------------

IF user IS ON THE CLOCK:

    System → changes all “+” buttons to RED

    User → clicks RED “+” on a fighter

    System → does:
        → adds fighter to that user’s team
        → removes fighter from available list
        → records pick in draft history
        → moves turn to next user

--------------------------------------------------

IF user is NOT ON THE CLOCK:

    System → keeps “+” buttons BLUE

    User → clicks BLUE “+”
    System → adds fighter to queue ONLY (NOT draft)

--------------------------------------------------

User → clicks fighter name

System → opens fighter profile popup

IF user ON THE CLOCK:
    System → shows “Draft Fighter” button

IF NOT:
    System → shows “Add to Queue” button

Each user has limited time (based on league settings)

IF timer runs out:

    System → checks user queue

    IF queue NOT empty:
        System → drafts highest fighter in queue

    IF queue empty:
        System → drafts best available fighter (based on rank)

    System → moves to next user

System → continues turn-by-turn

Repeat until:
    → 20 rounds complete
    → every user has 20 fighters

System → shows popup:
    “Your draft is complete”

User → clicks “Go to My Team”

System → redirects to My Team Page

System → displays:
    → user’s fighters (20 total)
    → each fighter has (0 to start) points

--------------------------------------------------

User → clicks “-” on fighter

System → does:
    → removes fighter from team
    → removes ALL points that fighter earned 
    → moves fighter to Free Agent pool
    → creates empty roster spot

--------------------------------------------------

User → clicks fighter name
System → shows fighter profile

--------------------------------------------------

User → clicks My Team dropdown
System → shows ALL teams user owns

User → selects team
System → loads that team
System → displays:
    → My Team fighters
    → their points
User → clicks fighter name
System → shows fighter profile


--------------------------------------------------

User → clicks “Free Agents”
System → redirects to Free Agents Page

System → displays:
    → all fighters NOT on any team


User → clicks fighter name
System → shows fighter profile

User → uses filters (division, nationality)
System → filters fighters

User → searches fighter
System → updates results

User → clicks “+” on fighter

System → checks:
    → Does user have empty roster spot?

IF NO:
    System → show error “Team Full”

IF YES:
    System → adds fighter to team
    System → sets fighter points = 0

--------------------------------------------------


User → clicks “Opposing Team” dropdown
System → shows all other teams

User → selects opponent
System → loads Opposing Team Page

System → displays:
    → opponent’s fighters
    → their points
User → clicks fighter name
System → shows fighter profile

User → clicks “Propose Trade”

System → opens trade popup:
    → list of user’s fighters
    → selection area
    → optional message field
    → Send button
    → Cancel button

User → selects fighters to give
User → enters message (optional)

User → clicks “Send Trade Offer”

System → does:
    → saves trade request
    → sends notification to other user

User → clicks Cancel
System → closes popup



--------------------------------------------------


User → clicks “Leaderboard”
System → loads Leaderboard

System → displays:
    → all teams ranked by total points

System → updates rankings automatically when:
    → fighters earn points
    → fighters are removed

User → views rankings only (no interaction)


--------------------------------------------------

RULE 1:
A fighter can ONLY be on ONE team at a time

RULE 2:
When drafted → fighter removed from global pool

RULE 3:
When dropped → fighter returns to Free Agents

RULE 4:
Free agent fighters ALWAYS start at 0 points

RULE 5:
Draft must be REAL-TIME for all users

RULE 6:
Each user MUST end draft with exactly 20 fighters
"