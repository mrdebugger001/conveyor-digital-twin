# Belt tension thresholds (kN) - demo values, calibrate against real specs
TENSION_NORMAL_MAX = 150.0
TENSION_WARNING_MAX = 165.0
TENSION_CRITICAL_SPAN = 30.0  # from warning to critical

# Vibration thresholds (mm/s)
VIB_NORMAL_MAX = 3.0
VIB_WARNING_MAX = 6.0
VIB_CRITICAL_SPAN = 6.0

# Temperature thresholds (°C)
TEMP_NORMAL_MAX = 70.0
TEMP_WARNING_MAX = 85.0
TEMP_CRITICAL_SPAN = 30.0

# Tracking deviation thresholds (mm)
TRACKING_NORMAL_MAX = 2.0
TRACKING_WARNING_MAX = 5.0
TRACKING_CRITICAL = 10.0

# Joint health thresholds (%)
JOINT_HEALTH_WARNING = 80.0
JOINT_HEALTH_CRITICAL = 60.0
JOINT_HEALTH_HIGH_RISK = 40.0

# Speed deviation thresholds (%)
SPEED_DEV_WARNING = 0.05
SPEED_DEV_CRITICAL = 0.15

# Simulation tick rate
TICK_INTERVAL = 0.5  # seconds

# Belt/motor physics
BELT_MAX_SPEED = 5.0  # m/s
BELT_SPEED_LAG = 0.1  # first-order lag factor per tick
MOTOR_RATED_RPM = 1450.0
GEARBOX_RATIO = 12.5
PULLEY_RADIUS = 0.5  # m

# Number of joints on C01
NUM_JOINTS = 24

# Database
DATABASE_URL = "sqlite+aiosqlite:///./conveyor_twin.db"

# WebSocket
WS_PING_INTERVAL = 20
WS_PING_TIMEOUT = 10
