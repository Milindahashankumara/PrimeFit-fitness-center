# PrimeFit Fitness Center

Local development

1. Start MongoDB locally or use the MongoDB container from `docker-compose.yml`.
2. Start the backend from `fitness_center-backend`:

```bash
npm install
npm run start
```

3. Start the frontend from `fitness_center-frontend`:

```bash
npm install
npm run dev
```

4. If you use Docker, run the root `docker-compose.yml` to start the frontend, backend, and database together.

Environment variables

- `fitness_center-backend/.env.example` contains the backend variables for local use.
- `fitness_center-frontend` uses `NEXT_PUBLIC_API_URL` for the API base URL.
