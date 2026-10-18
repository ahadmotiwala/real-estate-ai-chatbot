# Real Estate AI Chatbot

A first-stage prototype for Rising Star Properties, focused on Karachi property enquiries and consent-based lead qualification.

## Current prototype

- Responsive React/Vite chat interface.
- Guided qualification for property type, budget, purpose, and preferred handover.
- Conversation summary in the browser.
- Fictional sample inventory in `data/projects.json` (not real listings).
- Local FastAPI backend in `backend/main.py`.
- SQLite lead storage after explicit customer consent.
- API health check and a basic lead-list endpoint for local development.
- Guardrails in the UI and sample data warning against presenting unverified prices, plans, or availability as facts.

## Important limitations

This is **not production-ready**. The chat responses are rule-based, not powered by an AI model. The language selector is currently a UI placeholder; it does not translate the conversation. The lead API is for local development and has **no authentication** on its lead-list endpoint. Do not expose the backend publicly or enter real customer information until authentication, deployment security, privacy handling, and tests have been added. It does not yet notify salespeople or connect to WhatsApp.

All sample projects are fictional. Replace them with verified information before any customer-facing use.

## Run the website locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

To build the website:

```bash
npm run build
```

## Run the local lead API

Requirements: Python 3.10 or newer.

From the repository root:

```bash
python -m venv .venv
```

Activate the environment, then run:

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Check `http://127.0.0.1:8000/api/health` for a health response. Interactive API documentation is at `http://127.0.0.1:8000/docs`.

Lead records are stored in `backend/leads.db`, which is excluded from version control.

## Next milestones

1. Replace fictional inventory with verified project information.
2. Improve ad-source/project context and conversational alternatives.
3. Add automated tests and validate frontend/backend locally.
4. Add authentication and a private sales-lead dashboard before handling real leads.
5. Add genuine Urdu and Roman Urdu responses.
6. Evaluate free/local AI model options.
7. Consider WhatsApp integration after the website flow is reliable.

## Privacy and security

- Contact details should only be submitted with clear customer consent.
- Do not use real customer details in a public demo.
- Do not deploy the local API as-is: the lead-list endpoint has no authentication.
- Never commit the local SQLite database or secrets.
