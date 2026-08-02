# Blind Journal

Blind Journal is an interactive, frontend-only simulation of a production-style zero-knowledge encrypted journal.

The application lets someone create an account, unlock a vault, and manage dated plain-text journal entries while a synchronized system view explains what would happen across the client, cryptographic worker, HTTPS connection, server, and database in a real deployment.

Everything physically runs in one browser. The client/server separation and its security controls are therefore modeled boundaries, not real isolation. Within that model, the simulated server receives only authentication material, session metadata, and encrypted records; journal dates and journal text remain encrypted outside the unlocked client.

## Project status

The project foundation is complete:

- Next.js and React are configured.
- TypeScript strict mode and additional indexed-access checks are enabled.
- Radix Themes and Radix Icons are installed and provide the UI system.
- XState, TanStack Query, Zod, MSW, Dexie, libsodium, Motion, and Vitest are installed.
- The MSW browser worker has been generated.
- The Blind Journal vector identity, browser icons, Apple touch icon, maskable PWA icons, and web app manifest are configured.

Application behavior has not been implemented yet. Work is intentionally divided into reviewable phases in the [build guide](docs/BUILD_GUIDE.md).

## Goals

- Demonstrate a credible zero-knowledge client architecture without operating a backend.
- Keep journal dates and content encrypted in the simulated database.
- Keep password derivation and unlocked key material away from React state.
- Validate every simulated request, response, and persisted envelope at runtime.
- Model opaque sessions, CSRF protection, authorization, rate limiting, HTTPS, and security headers.
- Drive the visualization from real application events rather than canned animation.
- Preserve a client API boundary that can later target a real server without rewriting the UI or client cryptography.

## Non-goals

- Claiming that browser modules create genuine client/server isolation.
- Protecting data from malicious browser extensions, a compromised browser, or arbitrary script execution while the vault is unlocked.
- Hiding all metadata. The simulated server can still observe account identifiers, encrypted-record counts and sizes, revisions, request timing, and access patterns.
- Building a real database or production authentication service.
- Supporting rich text, attachments, sharing, or multi-user collaboration.
- Pursuing broad end-to-end or snapshot-test coverage.

## Technology

The repository currently pins the following runtime and package-manager baseline:

- Node.js 24 or newer
- PNPM 11.18.0 through Corepack
- Next.js 16.2.12
- React 19.2.4
- TypeScript 5 in strict mode

Primary libraries:

| Responsibility | Library |
| --- | --- |
| UI system and styling | Radix Themes (`@radix-ui/themes`) |
| Interface icons | Radix Icons (`@radix-ui/react-icons`) |
| Workflow orchestration | XState 5 and `@xstate/react` |
| Request and mutation state | TanStack Query 5 |
| Simulated-server input validation | Zod 4 |
| Simulated HTTP | MSW 2 |
| Simulated server database | Dexie 4 and IndexedDB |
| Password KDF | Argon2id through `libsodium-wrappers-sumo` |
| Symmetric cryptography | Native Web Crypto API |
| Motion | Motion for React |
| System visualization | Radix Themes layout with Motion for React |
| Focused unit tests | Vitest 4 |

The exact installed versions are recorded in `package.json` and `pnpm-lock.yaml`.

## Architecture

```text
Journal UI
    |
    +--> XState workflow actors
    |
    +--> TanStack Query --> client API --> fetch('/api/...')
                                              |
                                              v
                                      MSW request handlers
                                              |
                                              v
                                  simulated server services
                                              |
                                              v
                                       Dexie / IndexedDB

Journal UI --> crypto worker client --> dedicated Web Worker
                                          |
                                          +--> Argon2id
                                          +--> HKDF
                                          +--> AES-256-GCM

Every boundary --> redacted semantic events --> synchronized visualization
```

The journal UI may communicate with the simulated backend only through the client API and `fetch`. It must never import Dexie or simulated-server services directly.

### Project structure

```text
app/                    Next.js routes, layouts, providers, and route errors
api/                    Browser HTTP client and API-facing types, grouped by endpoint area
components/             Reusable and journal interface components
features/               Client-only feature workflows and UI
local-server/           Simulated server rules, request validation, and response construction
messages/               JSON catalogs as messages/{locale}/{feature}.json
mocks/                  MSW setup, thin transport handlers, and local fixtures
public/                  Brand/PWA assets and the generated MSW worker
tests/                   Shared test setup and test-only MSW server
workers/                 Dedicated cryptographic Web Worker when that phase begins
```

The browser boundary is intentionally simple. `api/` is the source of truth for handwritten request, response, and domain types. Client endpoint functions in that directory are the only production-facing code that knows how to make HTTP requests. They do not import MSW or the simulated server.

`local-server/` is explicitly simulated-server code. It imports the API request types and uses Zod at the runtime boundary, with schemas typed as `z.ZodType<RequestType>` so schema changes remain checked against the API type. Response-only schemas are not added when they would merely duplicate a handwritten type: the simulated server constructs typed responses with `satisfies`, and the client consumes the agreed response shape.

`mocks/handlers.ts` contains transport adapters only. Each MSW handler delegates the incoming `Request` to `local-server/`; it does not contain business rules. A future real backend can implement the same API types and behavior while the browser endpoint functions and client cryptography remain unchanged.

## State ownership

| State | Owner |
| --- | --- |
| Authentication, unlock, lock, save, and playback workflows | XState actors |
| API requests, mutations, and unlocked journal query data | TanStack Query |
| Form fields, editor drafts, and local display controls | React component state |
| Unwrapped vault key and derived cryptographic keys | Crypto Worker |
| Accounts, ciphertext, sessions, and rate-limit records | Dexie behind the simulated server |
| Sanitized timeline and playback position | Simulation actor |

Passwords and raw keys must never enter XState events, query keys, browser logs, or visualization records. Decrypted query data is memory-only and is cleared whenever the vault locks or the session ends.

## Getting started

Corepack will select the PNPM version pinned by the project:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

MSW uses a Service Worker. `localhost` is treated as a secure development context by browsers; deployed builds must use HTTPS.

### Styling policy

Use Radix Themes components, responsive props, variants, and design tokens for application UI. Do not recreate Radix components or introduce a parallel utility-CSS system. Global CSS is limited to Radix’s documented setup and document-level integration that its component API cannot express; any such CSS should consume Radix theme tokens.

### Branding and PWA assets

The transparent vector source of truth is `public/brand/blind-journal-mark.svg`. The repository also includes a 1024px transparent PNG, an opaque maskable source, 192px and 512px install icons, `app/favicon.ico`, `app/icon.svg`, and `app/apple-icon.png`. `app/manifest.ts` publishes them through Next.js’s App Router metadata conventions.

The project intentionally does not register a second offline-caching Service Worker: MSW owns the root Service Worker scope for the simulation. The current Next.js PWA guidance does not require offline support for installation, so the manifest and install assets remain valid without introducing a competing worker.

## Commands

```bash
pnpm dev          # Start the Next.js development server
pnpm lint         # Run Biome's linter
pnpm quality      # Run Biome's linter and formatter checks
pnpm i18n:check   # Find missing, unused, or inconsistent translations
pnpm typecheck    # Run TypeScript without emitting files
pnpm test         # Run the focused Vitest suite once
pnpm test:watch   # Run Vitest in watch mode
pnpm check        # Run lint, typecheck, and tests
pnpm build        # Create a production Next.js build
pnpm start        # Serve a completed production build
```

## Security model

Blind Journal treats the following as real implementation requirements even though the server is simulated:

- Per-account, versioned Argon2id parameters and a random salt
- HKDF domain separation for independent key purposes
- A random vault key wrapped by password-derived key material
- AES-256-GCM with a fresh 96-bit IV for every encryption
- Authenticated additional data binding account, entry, revision, and schema version
- Runtime validation at every transport and persistence boundary
- Opaque, expiring, revocable sessions
- Authorization on every simulated server operation
- CSRF token and origin validation for cookie-authenticated mutations
- Generic login failures and decoy parameters for unknown usernames
- No plaintext journal records or reusable session tokens in persistent browser storage
- No raw HTML rendering of journal content
- A restrictive production Content Security Policy and other browser security headers

Some properties can only be represented visually in this frontend-only build. In particular, JavaScript cannot create a genuine `HttpOnly` cookie, and no server secret stored in downloaded browser code is actually secret. Those limitations must always be labeled in the UI and documentation.

## Documentation

- [Build guide and implementation phases](docs/BUILD_GUIDE.md)
- [Next.js documentation](https://nextjs.org/docs)
- [MSW browser integration](https://mswjs.io/docs/integrations/browser/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## Working agreement

Implementation proceeds one explicitly approved phase or task at a time. The build guide describes the intended result, but it does not authorize implementing later phases automatically.
