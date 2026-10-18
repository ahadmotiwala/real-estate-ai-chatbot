from __future__ import annotations

import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("LEADS_DB_PATH", str(ROOT / "leads.db")))

app = FastAPI(
    title="Rising Star Properties Lead API",
    version="0.1.0",
    description="Local prototype API. Do not expose publicly without authentication and deployment hardening.",
)

# Local development origins only. Add a real frontend origin explicitly when deploying.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect_db()) as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                purpose TEXT,
                budget TEXT,
                location TEXT,
                timeline TEXT,
                project_interest TEXT,
                source_ad TEXT,
                notes TEXT,
                consent INTEGER NOT NULL CHECK (consent = 1),
                created_at TEXT NOT NULL
            )
            """
        )
        db.commit()


@app.on_event("startup")
def on_startup() -> None:
    initialize_db()


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=40)
    purpose: Optional[str] = Field(default=None, max_length=120)
    budget: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=160)
    timeline: Optional[str] = Field(default=None, max_length=120)
    project_interest: Optional[str] = Field(default=None, max_length=200)
    source_ad: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=2000)
    consent: bool

    @field_validator("name", "phone")
    @classmethod
    def trim_required_fields(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "rising-star-lead-api"}


@app.post("/api/leads", status_code=201)
def create_lead(lead: LeadCreate) -> dict[str, object]:
    if not lead.consent:
        raise HTTPException(
            status_code=400,
            detail="Customer consent is required before saving contact details.",
        )

    created_at = datetime.now(timezone.utc).isoformat()
    values = lead.model_dump()
    values["consent"] = 1
    values["created_at"] = created_at

    with closing(connect_db()) as db:
        cursor = db.execute(
            """
            INSERT INTO leads (
                name, phone, purpose, budget, location, timeline,
                project_interest, source_ad, notes, consent, created_at
            ) VALUES (
                :name, :phone, :purpose, :budget, :location, :timeline,
                :project_interest, :source_ad, :notes, :consent, :created_at
            )
            """,
            values,
        )
        db.commit()
        lead_id = cursor.lastrowid

    return {"id": lead_id, "created_at": created_at, "saved": True}


@app.get("/api/leads")
def list_leads(limit: int = Query(default=100, ge=1, le=500)) -> dict[str, object]:
    # Local prototype endpoint only: no authentication is implemented yet.
    with closing(connect_db()) as db:
        rows = db.execute(
            """
            SELECT id, name, phone, purpose, budget, location, timeline,
                   project_interest, source_ad, notes, consent, created_at
            FROM leads
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return {"leads": [dict(row) for row in rows], "count": len(rows)}
