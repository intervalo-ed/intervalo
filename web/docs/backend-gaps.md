# Backend gaps blocking the new web frontend

These are the holes in the FastAPI backend that the new Next.js frontend (`web/`) bumps into. Numbered roughly by how badly they hurt; (1)–(4) block real features, (5)–(8) are nice-to-haves.

## 1. `GET /courses` — list courses

Today every endpoint hardcodes `course_id=1` (`backend/main.py:190, 236, 260, 302`; `backend/session_store.py:899`). Even when we keep multi-course-ready URLs (`/learn/[course]/...`), the frontend cannot enumerate which courses exist or render a course picker.

**Proposed shape:**
```
GET /courses → [{ id: number, slug: string, name: string, description: string }]
```

## 2. `GET /course/{id}/catalog` — belt → topic → skill hierarchy

The catalog (belts, topics, skills, tooltips, stripe thresholds) lives in `backend/content/analisis-1/catalog.json` and is **not** exposed via the API. The frontend currently mirrors it at build time via a script (`web/scripts/sync-catalog.ts`) reading the JSON directly from disk — fragile in deploy environments where the backend repo isn't co-located.

Exposing this would let us delete that script entirely.

**Proposed shape:**
```
GET /course/{id}/catalog → {
  belts: [{
    key: string,
    stripe_thresholds: [number, number],
    promotion_threshold: number,
    topics: [{ key: string, skills: string[], tooltip: string }]
  }]
}
```

## 3. `POST /session/start-item` — single-item practice session

Required for the **Practicar** button on `/learn/[course]/[belt]/[topic]/[item]`. Today only `/session/start-zen` exists, and its granularity is *whole belt* — too coarse to power "practice this one item."

**Proposed shape:**
```
POST /session/start-item
Body: { course_id: number, belt: string, topic: string, skill: string, count: number }
Response: SessionStartResponse  (same shape as /session/start-zen)
```

The response should mirror `start-zen`. SM-2 update semantics for these answers TBD — see (7).

## 4. `GET /session/{id}` — fetch in-progress session state

`POST /session/start` returns the full exercise list inline. There is no `GET` to retrieve that list later, so a hard refresh on `/session/[id]` cannot recover the questions. Today the frontend masks this by stashing the start response in `sessionStorage`; if storage is cleared or the session is opened in a new tab, the user sees an "expired" screen instead of resuming.

**Proposed shape:**
```
GET /session/{id} → {
  session_id: string,
  user_name: string,
  total: number,
  exercises: SessionExercise[],
  current_index: number,   // optional: server can track answered count
  finished: boolean,
}
```

## 5. Belt promotion calculation in summary

`belt_progress` in `GET /session/{id}/summary` is hardcoded to `{graduated: 0, total: 0, stripes: 0, promoted: false}` (`backend/session_store.py:981–984`). The data exists — `item_states` rows have a `phase` field and the catalog has thresholds — but the math isn't wired up.

Without this we can't show the "you earned a stripe" or "you got promoted to azul" UX.

## 6. `GET /sessions` — session history

For a future "past sessions" / streak view. Not blocking the v1, but called out so it's on the radar.

**Proposed shape:**
```
GET /sessions?limit=20&before={iso_date} → [{
  id: string, started_at: string, finished_at: string,
  total: number, correct: number, xp_earned: number,
  belt_on_start: string, belt_on_finish: string,
}]
```

## 7. Zen-mode SM-2 semantics — confirm intent

Zen-mode answers are recorded to the `answers` table but **do not update SM-2 state** in `item_states` (`backend/session_store.py:340–424`). UI implications:

- Should zen XP show up in `level_info`? (Today it does — `xp_earned` fires regardless.)
- Should zen-streak feed the daily streak counter we'll build?
- If a user only ever plays zen, their `/user/progress` skill_states stay empty — is that intentional?

Need a one-line decision per question to keep the dashboard math honest.

## 8. Stable per-exercise IDs across sessions

`SessionExercise.id` is generated as `ex_000`, `ex_001`, … each time `/session/start*` is called — not the underlying `external_id` from the `exercises` table. This blocks any future "share this exact problem" URL, error reporting tied to an exercise, or analytics on per-exercise difficulty.

Cheap fix: surface the real `external_id` (or both, if there's a reason for the ephemeral one) in `SessionExercise.id`.

---

**Frontend behavior in the meantime:** the `web/` app is being built so each gap above is masked with a clearly-labeled fallback (TODO comments, `sessionStorage`, generated catalog), and no data layer is duplicated where the API will eventually own it.
