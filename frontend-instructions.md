# Fantasy UFC Frontend Implementation Guide

This guide details the core real-time draft, trade, and Saturday Lockdown mechanics implemented on the backend. Please use this reference when integrating the frontend.

## 1. Socket.IO & Real-time Draft Flow

### Connection & Registration
When a user logs in and joins the draft room, initialize the socket and register their user ID.
```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"]
});

// 1. Register the logged-in User ID so the backend knows who this socket belongs to
socket.emit("register", currentUser.id);

// 2. Join the League Draft Room
socket.emit("join_draft", currentLeagueId);
```

> **Draft Recovery:** If a user refreshes their browser mid-draft, they should emit `join_draft` again. The backend will respond with the current state (who is on the clock, time remaining, and pick history) so the UI can reconstruct the state instantly.

### Making a Pick
Instead of sending an HTTP request for draft picks, you emit directly over the socket. This ensures the transaction is lightning-fast and respects the Saturday Lockdown rules instantly.
```typescript
// Making a pick
socket.emit("make_pick", {
  leagueId: currentLeagueId,
  fighterId: selectedFighterId
});
```

### Listening for Draft Events
The backend will broadcast events for you to update the UI:

> **Pro-Tip for Timers:** The `draft:pick` and `turn_update` events include an `endsAt` field (ISO Timestamp). Do not use a local `setTimeout(60)`. Instead, calculate:
> ```typescript
> const remaining = Math.max(0, new Date(data.endsAt).getTime() - Date.now());
> ```
> This ensures every user sees the exact same countdown regardless of when they loaded the page.

```typescript
// A successful pick was made
socket.on("draft:pick", (data) => {
  console.log(`Fighter ${data.fighter.name} picked by team ${data.teamId}`);
  // -> Update the Draft Board UI
  // -> Advance the turn timer to the next user
});

// An auto-pick occurred because a user's timer expired
socket.on("draft:autopick", (data) => {
  console.log(`Auto-picked Fighter ${data.fighter.name} for team ${data.teamId}`);
  // -> Update the UI and notify the user they are now on auto-pilot
});

// The draft timer was extended (Public Leagues only, if not enough players)
socket.on("draft:timer_extended", (data) => {
  // data.newDraftTime contains the extended UTC timestamp
  console.log(data.message); 
});

// Errors (e.g. system is locked, or another user just picked that fighter)
socket.on("draft:error", (error) => {
  alert(error.message); 
});
```

## 2. API Endpoints & 3NF Integrity

### Fighter Catalog (Division Updates)
The API has been updated to use `divisionId` (UUID) instead of a `division` string.
*   **Search**: `GET /api/v1/fighter?divisionId=<UUID>&searchTerm=<Name>`
*   **Create/Update**: The payload now expects `{ "divisionId": "<UUID>" }`.

> **Fighter List Priority (Best Available):** Always sort the fighter list by `rank` ASC. If `rank` is null, they should appear at the bottom. This matches the "Auto-Pick" logic used by the backend when a user's timer expires.

### Roster Management: Dropping a Fighter
Dropping a fighter ensures their previously earned points stay with the team via a 3NF relational historical record (`DroppedFighter` table).
```http
DELETE /api/v1/team/:teamId/fighter/:fighterId
Authorization: Bearer <token>
```
*   If this is called during a **Saturday Lockdown**, it returns a `423 Locked` error.

### Trading Framework
Trades now use a normalized `TradeItem` structure instead of basic arrays. 

> **Veto Tracking:** When fetching trade offers (`GET /api/v1/trade/:leagueId`), the payload includes the veto relationships. Calculate the veto count, and if it exceeds your league threshold (e.g. >= 4), the frontend should badge the trade as "Blocked by League" or "VETOED". 

**Creating a Trade**:
```http
POST /api/v1/trade/:leagueId
```
**Payload**:
```json
{
  "receiverId": "user_123",
  "senderFighterIds": ["fighter_A", "fighter_B"],
  "receiverFighterIds": ["fighter_C"],
  "message": "Let's make a deal"
}
```
*   *Note*: The backend automatically converts this into `TradeItem` relational records (`SENDER_OFFERS`, `RECEIVER_OFFERS`). 

**Accepting a Trade**:
```http
PATCH /api/v1/trade/offer/:tradeId/accept
```
*   If accepted, the players instantly swap rosters.
*   If called during a **Saturday Lockdown**, it returns a `423 Locked` error.

## 3. The "Saturday Lockdown"
Gabriel (Admin) can toggle a global lockdown during UFC events. 

*   **Socket Interception**: If the system is locked, emitting `make_pick` returns an immediate `draft:error`.
*   **API Interception**: All roster mutating HTTP routes (Trades, Drops) are guarded. If blocked, the API returns:
    ```json
    {
      "success": false,
      "message": "System is locked: UFC event in progress. Please try again later.",
      "errorMessages": []
    }
    ```
*   **Real-time Broadcast**: If Gabriel locks the system while users are online, the socket fires the following event. Use this to disable trade/drop buttons globally on the frontend:
    ```typescript
    socket.on("system:lockdown", (data) => {
       if (data.locked) {
           // Disable roster moves
       }
    });
    ```

## 4. Swagger Documentation
The Swagger API documentation is now restricted to the `development` environment for security. 
When running locally:
1. Ensure your `.env` contains `NODE_ENV=development`.
2. Visit `http://localhost:<PORT>/api-docs`.
