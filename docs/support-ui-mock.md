# Support UI mock

The support screens use the normal `Screen → View model → Repository → Service` architecture. `src/api/support.ts` currently implements the service in browser `localStorage`, scoped by the signed-in account ID. No requests reach the backend and no notifications are sent. Case updates and replies can be tried on the seeded demonstration cases. The event and platform inboxes are **demonstrations**, not authorization-gated real staff consoles.

Routes:

- `/support`: user requests and illustrative organizer/platform inboxes
- `/support/new`: new request; optionally provide `eventId`, `orderId`, or `ticketId` in the query string
- `/support/:caseId`: conversation and (on demo staff cases) status/assignment controls

For the real integration, replace `src/api/support.ts` with REST calls for listing/getting/creating cases, loading/adding messages, updating status, and assigning cases. Preserve its exported types and service function signatures or adapt only the repository. The backend must derive the requesting identity from the bearer token, validate referenced entities, verify requester/event-organizer/platform-admin access, and enforce who may change case status or assignment. The mock's sample staff cases must not be treated as proof that the signed-in user has any staff authority. Event-to-organizer routing, actual staff identity, unread counts, notifications, and server pagination still depend on the backend contract.

Delete this file after integration.
