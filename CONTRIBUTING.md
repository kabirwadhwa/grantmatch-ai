# Contributing to GrantMatch AI

Thank you for your interest in contributing to **GrantMatch AI**! We welcome contributions from developers, civil society technologists, NGO practitioners, and researchers worldwide.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat all contributors and community members with respect and professionalism.

---

## Development Workflow

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm 9+
- Git

### 2. Fork and Clone
```bash
git clone https://github.com/your-username/grantmatch-ai.git
cd grantmatch-ai
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment
```bash
cp .env.example .env
```
By default, the platform runs with SQLite and the built-in mock/curated discovery provider, so no external API keys are required for local development.

### 5. Initialize Database & Seed
```bash
npm run db:push
npm run db:seed
```

### 6. Run the Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).

---

## Testing & Quality Assurance

Before opening a pull request, ensure all tests pass and the production build completes without errors:

```bash
# Run unit & security test suite
npm test

# Verify production build and types
npm run build
```

---

## Architectural Principles

1. **Deterministic Scoring First**: Never replace deterministic scoring with opaque LLM evaluation. LLMs are used for extraction, nuanced condition resolution, and explanation synthesis.
2. **SSRF Hardening**: Any new web scraping or network call must pass through `safeFetch` or `validateSafeUrl` to prevent SSRF vulnerabilities.
3. **Official URLs Only**: Every opportunity indexed must have a verifiable source domain and URL. Never invent or synthesize fake funding opportunities.
4. **Zero-Key Accessibility**: The application must remain operable in demo/fallback mode even if external API keys are missing.

---

## Submitting Pull Requests

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Commit your changes with clear semantic commit messages (e.g. `feat: add provider`, `fix: geography mapping`)
3. Push to your fork: `git push origin feat/my-feature`
4. Open a Pull Request against `main`.
