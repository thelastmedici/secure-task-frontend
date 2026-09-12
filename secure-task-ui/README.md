# SecureFlow UI

A secure task and document management frontend built with React + Vite + TypeScript.

## Overview

SecureFlow is a mock enterprise workflow dashboard for managing:
- tasks
- documents
- notifications
- audit logs
- users and roles
- settings

The app includes a sidebar navigation, topbar search, metrics cards, task/document tables, detail pages, and a login screen.

## Tech Stack

- React
- TypeScript
- Vite
- Lucide React

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev -- --host 0.0.0.0
```

Then open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173/
```

## Build for production

```bash
npm run build
```

## Project Structure

```text
secure-task-ui/
├── index.html
├── package.json
├── tsconfig.json
├── src/
│   ├── components/
│   ├── data/
│   ├── layouts/
│   ├── pages/
│   ├── types/
│   ├── main.tsx
│   └── styles.css
└── README.md
```

## Notes

This is a frontend prototype/mock implementation. Many actions are UI-only and use local mock data rather than a real backend or authentication service.
