import math
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class BearingGeometry:
    designation: str
    pitch_diameter_mm: float
    ball_diameter_mm: float
    num_elements_z: int
    contact_angle_deg: float = 0.0


@dataclass
class BearingCharacteristicFrequencies:
    shaft_speed_rpm: float
    shaft_frequency_fr_hz: float
    ftf_cage_hz: float
    bpfo_outer_race_hz: float
    bpfi_inner_race_hz: float
    bsf_ball_spin_hz: float
    two_bsf_hz: float


# Catalog of standard conveyor bearings
STANDARD_BEARINGS: Dict[str, BearingGeometry] = {
    "SKF_6205": BearingGeometry(
        designation="SKF 6205-2RS",
        pitch_diameter_mm=39.04,
        ball_diameter_mm=7.94,
        num_elements_z=9,
        contact_angle_deg=0.0,
    ),
    "SKF_6203": BearingGeometry(
        designation="SKF 6203-2RS",
        pitch_diameter_mm=28.50,
        ball_diameter_mm=6.75,
        num_elements_z=8,
        contact_angle_deg=0.0,
    ),
    "SKF_22220": BearingGeometry(
        designation="SKF 22220 EK (Pulley Pillow Block)",
        pitch_diameter_mm=140.0,
        ball_diameter_mm=20.0,
        num_elements_z=16,
        contact_angle_deg=10.0,
    ),
}


class BearingFrequencyCalculator:
    """Calculates theoretical defect frequencies from rolling element kinematic equations."""

    def __init__(self, geometry: Optional[BearingGeometry] = None):
        self.geometry = geometry or STANDARD_BEARINGS["SKF_6205"]

    def calculate(self, shaft_speed_rpm: float) -> BearingCharacteristicFrequencies:
        fr = max(0.0, shaft_speed_rpm / 60.0)
        dp = self.geometry.pitch_diameter_mm
        d = self.geometry.ball_diameter_mm
        z = self.geometry.num_elements_z
        alpha_rad = math.radians(self.geometry.contact_angle_deg)

        cos_a = math.cos(alpha_rad)
        ratio = (d / dp) * cos_a

        # 1. Fundamental Train Frequency (Cage)
        ftf = 0.5 * fr * (1.0 - ratio)

        # 2. Ball Pass Frequency Outer Race
        bpfo = 0.5 * z * fr * (1.0 - ratio)

        # 3. Ball Pass Frequency Inner Race
        bpfi = 0.5 * z * fr * (1.0 + ratio)

        # 4. Ball Spin Frequency
        bsf = 0.5 * (dp / d) * fr * (1.0 - (ratio ** 2))

        return BearingCharacteristicFrequencies(
            shaft_speed_rpm=round(shaft_speed_rpm, 1),
            shaft_frequency_fr_hz=round(fr, 2),
            ftf_cage_hz=round(ftf, 2),
            bpfo_outer_race_hz=round(bpfo, 2),
            bpfi_inner_race_hz=round(bpfi, 2),
            bsf_ball_spin_hz=round(bsf, 2),
            two_bsf_hz=round(2.0 * bsf, 2),
        )
