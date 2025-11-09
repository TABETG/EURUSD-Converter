from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal, Optional, Deque

import asyncio
import os
import random

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")

app = FastAPI(title="EURUSD-Converter API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@dataclass
class State:
    real_rate: float = 1.10
    fixed_rate: Optional[float] = None
    last_updated: datetime = datetime.now(timezone.utc)
    history: Deque[dict] = field(default_factory=lambda: deque(maxlen=5))

state = State()

def effective_rate() -> float:
    return state.fixed_rate if state.fixed_rate and state.fixed_rate > 0 else state.real_rate

async def rate_random_walk():
    while True:
        state.real_rate = max(0.0001, state.real_rate + random.uniform(-0.05, 0.05))
        state.last_updated = datetime.now(timezone.utc)
        await asyncio.sleep(3)

@app.on_event("startup")
async def _startup():
    asyncio.create_task(rate_random_walk())

class RateResponse(BaseModel):
    real_rate: float
    fixed_rate: Optional[float] = None
    effective_rate: float
    last_updated: str

class FixRateRequest(BaseModel):
    rate: float = Field(gt=0)

class ConversionItem(BaseModel):
    real_rate: float
    input_amount: float
    input_ccy: Literal["EUR", "USD"]
    output_amount: float
    output_ccy: Literal["EUR", "USD"]
    fixed_rate_used: Optional[float] = None
    deactivated_fixed_due_to_2pct: bool = False
    at: str

def _deactivate_if_out_of_bounds(real_r: float, fixed_r: Optional[float]) -> bool:
    if fixed_r is None:
        return False
    if abs(fixed_r - real_r) / real_r > 0.02:
        state.fixed_rate = None
        return True
    return False

@app.get("/rate", response_model=RateResponse)
def get_rate():
    return RateResponse(
        real_rate=state.real_rate,
        fixed_rate=state.fixed_rate,
        effective_rate=effective_rate(),
        last_updated=state.last_updated.isoformat(),
    )

@app.post("/fix-rate")
def fix_rate(body: FixRateRequest):
    state.fixed_rate = body.rate
    return {"ok": True, "fixed_rate": state.fixed_rate}

@app.delete("/fix-rate")
def delete_fix_rate():
    state.fixed_rate = None
    return {"ok": True}

@app.get("/convert", response_model=ConversionItem)
def convert(
    amount: float = Query(..., ge=0),
    mode: Literal["EUR", "USD"] = "EUR",
):
    real_r = state.real_rate
    fx = effective_rate()
    deactivated = _deactivate_if_out_of_bounds(real_r, state.fixed_rate)
    fx = real_r if deactivated else fx

    if mode == "EUR":
        output = amount * fx
        input_ccy, output_ccy = "EUR", "USD"
    else:
        output = amount / fx
        input_ccy, output_ccy = "USD", "EUR"

    item = ConversionItem(
        real_rate=round(real_r, 6),
        input_amount=amount,
        input_ccy=input_ccy,
        output_amount=round(output, 6),
        output_ccy=output_ccy,
        fixed_rate_used=None if deactivated else state.fixed_rate,
        deactivated_fixed_due_to_2pct=deactivated,
        at=datetime.now(timezone.utc).isoformat(),
    )
    state.history.appendleft(item.model_dump())
    return item

@app.get("/history")
def history():
    return list(state.history)
