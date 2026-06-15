# Frontend Code Guidelines

## Structure

- `src/App.tsx`: application entry export only.
- `src/app`: application shell, routing, app-level configuration, and page composition.
- `src/shared`: reusable UI, form options, utilities, and cross-feature helpers.
- `src/api.ts`: API client and backend contract types.
- `src/legacy`: archived legacy code, excluded from lint and format checks.

## Commands

- `npm run typecheck`: run TypeScript checks.
- `npm run lint`: run ESLint rules for TypeScript, React Hooks, Fast Refresh, and accessibility.
- `npm run lint:fix`: apply safe ESLint fixes.
- `npm run format`: format files with Prettier.
- `npm run format:check`: verify Prettier formatting.
- `npm run build`: type-check and create a production build.

## React Practices

- Keep `src/App.tsx` thin; add app-level code under `src/app`.
- Put reusable visual primitives in `src/shared/ui`.
- Keep page-specific state near the page that owns it.
- Prefer typed props and payload helpers over untyped object literals.
- Keep side effects in `useEffect` focused on external synchronization or subscriptions.
- New forms should connect visible labels to controls with `htmlFor` / `id`.
