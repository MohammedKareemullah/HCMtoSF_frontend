# SAP HCM → SuccessFactors Migration Assessment – UI

React 18 + Vite + Tailwind + Recharts. Three pages wired to the backend endpoints:

| Route | Page |
|---|---|
| `/` | Key HCM Overview |
| `/hcm-core` | HCM Core Processes (tiles link onward) |
| `/personnel-administration` | Personnel Administration |

## Run
```bash
npm install
cp .env.example .env      # backend defaults to http://localhost:4000
npm run dev               # http://localhost:5173  (/api is proxied -> no CORS setup needed)
npm run build             # production bundle in dist/
```
For a production build served from a different origin set `VITE_API_BASE` (backend must send CORS headers).

## Logo
Put your logo at `public/ktern-logo.png`. If missing, the app falls back to the hosted copy from the mock-up, then to text.

## Notes
- All endpoints are listed in `src/api/client.js`.
- `/api/headcount/employees` is paginated server-side with `?page=&pageSize=` (10/25/50). Please confirm the backend reads those query names.
- Other large lists (infotype catalogue, field visibility, dependencies, routines) are paginated client-side.
- OM, Payroll and Time Management tiles route to placeholder pages until their endpoints exist.
