"""Configuration package for Conveyor C01 Digital Twin.

Provides typed access to YAML configuration, provenance metadata, and
backward-compatible constants.
"""

from app.config.loader import (
    load_conveyor_config,
    load_provenance,
    get_parameter_provenance,
    ConveyorConfig,
    ProvenanceRegistry,
    ProvenanceItem,
)

# Load configuration singleton
_cfg = load_conveyor_config()

# ==============================================================================
# Backward-Compatible Named Constants (Derived directly from conveyor.yaml)
# ==============================================================================
TENSION_NORMAL_MAX = _cfg.tension.warning_tension_n / 1000.0  # 165 kN
TENSION_WARNING_MAX = _cfg.tension.warning_tension_n / 1000.0
TENSION_CRITICAL_SPAN = (_cfg.tension.critical_tension_n - _cfg.tension.warning_tension_n) / 1000.0

VIB_NORMAL_MAX = 3.0
VIB_WARNING_MAX = 6.0
VIB_CRITICAL_SPAN = 6.0

TEMP_NORMAL_MAX = 70.0
TEMP_WARNING_MAX = 85.0
TEMP_CRITICAL_SPAN = 30.0

TRACKING_NORMAL_MAX = 2.0
TRACKING_WARNING_MAX = 5.0
TRACKING_CRITICAL = 10.0

JOINT_HEALTH_WARNING = 80.0
JOINT_HEALTH_CRITICAL = 60.0
JOINT_HEALTH_HIGH_RISK = 40.0

SPEED_DEV_WARNING = 0.05
SPEED_DEV_CRITICAL = 0.15

TICK_INTERVAL = 0.5  # seconds for WebSocket broadcast loop
PHYSICS_SUB_STEP = 0.05  # seconds (20 Hz internal physics engine)

BELT_MAX_SPEED = 5.0  # m/s
BELT_SPEED_LAG = 0.1
MOTOR_RATED_RPM = _cfg.drive.motor_rated_rpm
GEARBOX_RATIO = _cfg.drive.gearbox_ratio
PULLEY_RADIUS = _cfg.drive.pulley_diameter_m / 2.0

NUM_JOINTS = _cfg.joints.number_of_joints

# Material & Conveyor Physics
IRON_ORE_BULK_DENSITY = _cfg.material.density_kg_per_m3
MATERIAL_NORMAL_TPH = _cfg.material.throughput_tph
MATERIAL_MAX_TPH = _cfg.material.max_throughput_tph
COAL_NORMAL_TPH = MATERIAL_NORMAL_TPH
COAL_MAX_TPH = MATERIAL_MAX_TPH
COAL_MOISTURE_BASE = _cfg.material.moisture_pct_nominal

BELT_WIDTH_M = _cfg.geometry.belt_width_m
BELT_THICKNESS_M = _cfg.geometry.belt_thickness_m
BELT_LINEAR_MASS_QB = _cfg.belt.mass_kg_per_m
IDLER_ROTATING_MASS_QR = _cfg.idlers.carrying_mass_kg_per_idler / _cfg.geometry.idler_spacing_m
IDLER_RETURN_MASS_QR = _cfg.idlers.return_mass_kg_per_idler / _cfg.geometry.return_idler_spacing_m
IDLER_SPACING_A0 = _cfg.geometry.idler_spacing_m
CONVEYOR_LENGTH_L = _cfg.geometry.conveyor_length_m
CONVEYOR_LIFT_H = _cfg.geometry.lift_height_m
CEMA_FRICTION_FACTOR_F = _cfg.idlers.rolling_resistance_f
BELT_MODULUS_E = _cfg.belt.elastic_modulus_pa / 1e6  # MPa
STEEL_CORD_RATING_KN_M = _cfg.belt.tensile_strength_pa * _cfg.geometry.belt_thickness_m / 1000.0
JOINT_SPLICE_STRENGTH_MPA = _cfg.joints.ultimate_splice_strength_pa / 1e6

STRESS_NORMAL_MAX_MPA = 11.5
STRESS_WARNING_MAX_MPA = _cfg.joints.stress_warning_pa / 1e6
STRESS_CRITICAL_MPA = _cfg.joints.stress_critical_pa / 1e6
MINER_DAMAGE_WARNING = _cfg.joints.fatigue_warning_damage
MINER_DAMAGE_CRITICAL = _cfg.joints.fatigue_critical_damage
MAX_ALLOWABLE_SAG_PCT = _cfg.belt.max_allowable_sag_pct

SMART_THROTTLE_STRESS_TRIGGER_MPA = STRESS_WARNING_MAX_MPA
SMART_THROTTLE_MAX_DERATE_PCT = 35.0

DATABASE_URL = "sqlite+aiosqlite:///./conveyor_twin.db"
WS_PING_INTERVAL = 20
WS_PING_TIMEOUT = 10
