# IssueFlow

IssueFlow is a lightweight issue-tracking application for organizing projects and the issues associated with them. It includes a React client and an Express API backed by MongoDB.

## Features

- Register an account and log in with an email address and password.
- JWT-protected application routes and API operations.
- Create, list, view, update, and delete projects.
- Create, list, view, update, and delete issues within a project.
- Set issue status (`open`, `in-progress`, `resolved`, or `closed`) and priority (`low`, `medium`, or `high`).
- Scope projects to their authenticated owner, and scope issues to an owned project.
- View a dashboard summary of projects and their issues. Issue totals are shown only when issue lists for all accessible projects have loaded successfully.

## Tech Stack

- **Frontend:** React, Vite, JavaScript, React Router, Tailwind CSS 4 with the Vite plugin.
- **Backend:** Node.js, Express 5, MongoDB, and Mongoose.
- **Authentication:** `bcryptjs` for password hashing and `jsonwebtoken` for JWT creation and verification.

## Project Structure

```text
client/
  src/
    config/       API URL configuration
    context/      Shared authentication state
    lib/          Shared API request helper
    pages/        Authentication, dashboard, project, and issue UI
  .env.example
  package.json
server/
  config/         Environment loading and MongoDB connection
  controllers/    Health, authentication, project, and issue handlers
  middleware/     Authentication, not-found, and error handling
  models/         User, Project, and Issue Mongoose models
  routes/         Health, authentication, project, and nested issue routes
  .env.example
  package.json
```

## Prerequisites

- Node.js **20.19 or newer** and npm. Mongoose 9 requires Node.js 20.19 or newer, and React Router 7 requires Node.js 20 or newer.
- A MongoDB instance available locally or remotely. The provided server example URI uses a local MongoDB instance at `127.0.0.1:27017`.

## Getting Started

After cloning, open the repository root and ensure MongoDB is running or your remote MongoDB instance is reachable. In the first terminal, run these commands from the repository root to install and configure the backend:

```sh
cd server
npm install
cp .env.example .env
```

Edit the generated `server/.env` with your MongoDB URI and a strong random JWT secret, then start the API:

```sh
npm run dev
```

The backend listens on port `5001` by default.

In a second terminal, starting again from the repository root, install and configure the frontend:

```sh
cd client
npm install
cp .env.example .env
npm run dev
```

Vite serves the client at `http://localhost:5173` by default. The server's default `CLIENT_ORIGIN` matches that address. To run a production client build, use `npm run build` from `client/`.

## Environment Variables

Use the examples in `server/.env.example` and `client/.env.example` as templates. The real `.env` files are local configuration and must not be committed.

| Variable | Location | Purpose |
| --- | --- | --- |
| `MONGO_URI` | `server/.env` | Required MongoDB connection URI. The example connects to a local `issueflow` database; use your own MongoDB URI. |
| `JWT_SECRET` | `server/.env` | Required secret used to sign and verify JWTs. Replace the example value with a strong, randomly generated secret. |
| `PORT` | `server/.env` | Optional API port; defaults to `5001`. |
| `CLIENT_ORIGIN` | `server/.env` | Optional allowed browser origin for CORS; defaults to `http://localhost:5173`. Set it to the exact frontend origin. |
| `VITE_API_URL` | `client/.env` | Optional API base URL; defaults to `http://localhost:5001`. This is public frontend configuration. Do not put secrets in `VITE_` variables. |

## API Overview

The health route and authentication registration/login routes are public. `/api/auth/me`, all project routes, and all nested issue routes require an `Authorization: Bearer <token>` header. Errors use a JSON `{ "message": "..." }` response.

| Method | Path | Access | Response shape |
| --- | --- | --- | --- |
| `GET` | `/` | Public | `{ "message": "IssueFlow API is running" }` |
| `POST` | `/api/auth/register` | Public | `{ "token", "user" }` |
| `POST` | `/api/auth/login` | Public | `{ "token", "user" }` |
| `GET` | `/api/auth/me` | Bearer token | `{ "user" }` |
| `POST` | `/api/projects` | Bearer token | `{ "project" }` |
| `GET` | `/api/projects` | Bearer token | `{ "projects" }` |
| `GET` | `/api/projects/:id` | Bearer token | `{ "project" }` |
| `PATCH` | `/api/projects/:id` | Bearer token | `{ "project" }` |
| `DELETE` | `/api/projects/:id` | Bearer token | `{ "message" }` |
| `POST` | `/api/projects/:projectId/issues` | Bearer token | `{ "issue" }` |
| `GET` | `/api/projects/:projectId/issues` | Bearer token | `{ "issues" }` |
| `GET` | `/api/projects/:projectId/issues/:issueId` | Bearer token | `{ "issue" }` |
| `PATCH` | `/api/projects/:projectId/issues/:issueId` | Bearer token | `{ "issue" }` |
| `DELETE` | `/api/projects/:projectId/issues/:issueId` | Bearer token | `{ "message" }` |

Registration returns HTTP `201`; project and issue creation also return HTTP `201`. The `user` value is a safe profile with `id`, `name`, `email`, and `createdAt`; it does not include the password. Project lists are limited to the authenticated owner and sorted newest first. Issue operations first check access to the parent project, and issue reads and mutations are scoped to that project. Issue lists are sorted newest first.

## Validation and Error Handling

- Registration requires a non-empty name, a valid email, and a password of at least 8 characters and at most 72 UTF-8 bytes. Duplicate email registration returns `409`.
- Project names are trimmed, required, and limited to 120 characters. Optional descriptions are trimmed and limited to 2,000 characters.
- Issue titles are trimmed, required, and limited to 160 characters. Optional descriptions are trimmed and limited to 5,000 characters. Status and priority values are restricted to the enums listed above.
- Project and issue request bodies reject unknown fields. Ownership and issue-to-project association are determined by the backend, not accepted from clients.
- Invalid request fields or MongoDB IDs return `400`; missing or invalid authentication returns `401`; inaccessible or missing projects/issues return `404`.
- Express uses centralized not-found and error middleware. Error responses use `{ "message": "..." }`; production responses hide internal details for server errors.

## Current Limitations

- No automated test suite or `test` script is configured in either package.
- The client stores JWTs in browser `sessionStorage`, which is accessible to JavaScript.
- The dashboard gathers issue counts by requesting each project's issue list; if any such request fails, issue totals are marked unavailable rather than shown as partial counts.
- Deleting a project does not cascade-delete its associated issues in the current backend.
