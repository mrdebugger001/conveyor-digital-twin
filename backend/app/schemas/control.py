from pydantic import BaseModel
from typing import Literal


class SpeedCommand(BaseModel):
    target_speed: float


class ModeCommand(BaseModel):
    mode: Literal["LIVE", "SIMULATION", "PLAYBACK"]
