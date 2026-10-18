"""Local API for the real-estate chatbot prototype.

Leads are saved only after explicit consent. Run locally; do not expose this
development server to the public internet without authentication and hardening.
"""
from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("LEADS_DB_PATH", BASE_DIR / "leads.sqlite3"))

app = FastAPI(title="Real Estate Chatbot API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=40)
    purpose: Optional[str] = Field(default=None, max_length=80)
    budget: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=160)
    timeline: Optional[str] = Field(default=None, max_length=80)
    project_interest: Optional[str] = Field(default=None, max_length=160)
    consent: bool


def connect_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db() -> None:
    with connect_db() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                purpose TEXT,
                budget TEXT,
                location TEXT,
                timeline TEXT,
                project_interest TEXT,
                consent INTEGER NOT NULL CHECK (consent = 1)
            )
            """
        )


@app.on_event("startup")
def startup() -> None:
    initialize_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "real-estate-chatbot-api"}


@app.post("/api/leads", status_code=201)
def create_lead(lead: LeadIn) -> dict[str, int | str]:
    if not lead.consent:
        raise HTTPException(status_code=400, detail="Consent is required to save a lead.")
    initialize_db()
    with connect_db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO leads (
                created_at, name, phone, purpose, budget, location, timeline,
                project_interest, consent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                lead.name.strip(),
                lead.phone.strip(),
                lead.purpose,
                lead.budget,
                lead.location,
                lead.timeline,
                lead.project_interest,
            ),
        )
        lead_id = int(cursor.lastrowid)
    return {"id": lead_id, "status": "saved"}
