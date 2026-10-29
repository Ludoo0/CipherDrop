# CipherDrop

CipherDrop creates private, self-expiring messages. Message text and attachments are encrypted in the browser before they are sent to the server. Share the link and password separately.

## Stack

- Backend: Node.js, Express, TypeScript, PostgreSQL and Redis
- Frontend: React, Vite and TypeScript, built with Bun and served by Nginx
- Encryption: browser Web Crypto (AES-GCM, PBKDF2 and HKDF) for new messages; CryptoJS remains for opening legacy messages

## Run with Docker Compose

1. Install Docker Compose and Bun (Bun is needed for local frontend development; the container build includes it).
2. Copy `.env.example` to the repository root as `.env`.
3. Set `SESSION_SECRET` to a random value with at least 32 characters, set a long `DB_PASSWORD`, and point `BASE_URL` at the public site address.
4. Run `docker compose up --build -d`.
5. Open <http://localhost:8001>.

The site and its service ports are bound to localhost by default. `COOKIE_SECURE=false` is set for the local HTTP example; change it to `true` behind HTTPS before exposing the site publicly. When upgrading an existing Postgres volume, keep its current database password in `.env` so the application can reconnect.

## Local development

Run PostgreSQL and Redis, then configure the backend variables from `.env.example` in `backend/.env` (use `DB_HOST=localhost` and `REDIS_URL=redis://localhost:6379`). Start the backend with `npm run dev` from `api`.

For the frontend, run `bun install` and `bun run dev` from `web`. Vite proxies `/api` requests to `http://localhost:8000`; override this with `API_PROXY_TARGET` if needed.

## API compatibility

Existing routes remain available. Secret reads can use the original `GET /secrets/:id?controlmessage=…` route or the safer `POST /secrets/:id` route with `{ "controlmessage": "…" }` in the JSON body. The React app uses POST so the control value is not exposed in the URL. `GET /secrets/exists/:id` now also returns the encryption version and public salt needed by the browser to read new messages.

New messages use a versioned authenticated encryption format. Existing CryptoJS-encrypted messages remain readable and are not rewritten by the server.

## License

MIT. See [LICENSE](LICENSE).
