# Mini Trello — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS + Zod + react-hook-form + shadcn-style components (Radix primitives). 

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, custom design tokens (see `tailwind.config.ts`) |
| Components | shadcn-style — hand-written Radix UI primitives (`src/components/ui`), not pulled via the `shadcn` CLI (its registry, `ui.shadcn.com`, isn't reachable from this build sandbox — the components here are the same well-known Radix + Tailwind pattern, just added by hand) |
| Forms & validation | `react-hook-form` + `zod` (`@hookform/resolvers/zod`) — every schema in `src/lib/validations.ts` mirrors a `@NotBlank`/`@Size`/`@Email` rule on the matching backend DTO, so the client shows the same message the server would return in `fieldErrors` |
| HTTP | `axios`, JWT attached via interceptor (`src/lib/api-client.ts`), auto-redirects to `/login` on 401 |
| Toasts | `sonner` |