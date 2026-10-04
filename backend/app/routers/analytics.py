from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
import numpy as np

from app.twin.state_store import twin_store
from app.config.loader import load_provenance, load_conveyor_config
from app.data import CWRULoader, PaderbornLoader, BeltDriveDatasetLoader, NASAIMSLoader
from app.ml.vibration.calibration import ModelCalibrator
from app.schemas.twin import TwinResidualsResponse, VibrationAnalyticsResponse, CalibrationRequest, CalibrationResponse

router = APIRouter(prefix="/api", tags=["analytics"])

_cwru = CWRULoader()
_paderborn = PaderbornLoader()
_belt_drive = BeltDriveDatasetLoader()
_nasa_ims = NASAIMSLoader()


@router.get("/twin/residuals", response_model=TwinResidualsResponse)
async def get_physics_residuals():
    """Retrieve current physics residuals (measured - predicted) and sensor hardware health states."""
    residuals = await twin_store.get_residual_state()
    if not residuals:
        raise HTTPException(status_code=503, detail="Residual engine initializing")
    return residuals


@router.get("/vibration/features", response_model=VibrationAnalyticsResponse)
async def get_vibration_features():
    """Retrieve statistical time-domain, spectral, and demodulated envelope vibration ML metrics."""
    vib_data = await twin_store.get_vibration_analytics()
    if not vib_data:
        raise HTTPException(status_code=503, detail="Vibration ML engine initializing")
    return vib_data


@router.get("/data/provenance")
async def get_data_provenance():
    """Retrieve data provenance classifications and uncertainty tags for all conveyor parameters."""
    try:
        prov = load_provenance()
        return prov.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load provenance: {str(e)}")


@router.get("/data/catalog")
async def get_dataset_catalog():
    """List reference condition monitoring benchmark datasets available for calibration."""
    catalog = []
    catalog.extend(_cwru.get_catalog())
    catalog.extend(_paderborn.get_catalog())
    catalog.extend(_belt_drive.get_catalog())
    catalog.extend(_nasa_ims.get_catalog())
    return catalog


@router.get("/data/nasa-ims/degradation")
async def get_nasa_ims_degradation():
    """Retrieve benchmark bearing run-to-failure degradation trajectory."""
    return _nasa_ims.get_degradation_trajectory()


@router.post("/twin/calibrate", response_model=CalibrationResponse)
async def calibrate_model_parameter(req: CalibrationRequest):
    """Calibrate physical parameters (friction factor or motor thermal resistance)

    against reference datasets using Scipy optimization.
    """
    if req.target_parameter == "friction_factor":
        # Calibrate against empirical operating points
        speeds = np.array([2.5, 2.8, 3.2, 3.5, 4.0])
        tphs = np.array([800.0, 1000.0, 1200.0, 1500.0, 1800.0])
        # Measured site power with small non-linear idler drag
        powers = np.array([210.0, 260.0, 320.0, 410.0, 505.0])
        cal_result = ModelCalibrator.calibrate_friction_factor(
            measured_speeds_m_s=speeds,
            measured_tph=tphs,
            measured_motor_power_kw=powers,
            initial_f=0.020,
        )
        return CalibrationResponse(
            parameter_name=cal_result.parameter_name,
            nominal_value=cal_result.nominal_value,
            calibrated_value=cal_result.calibrated_value,
            unit=cal_result.unit,
            rmse_before=cal_result.rmse_before,
            rmse_after=cal_result.rmse_after,
            improvement_pct=cal_result.improvement_pct,
        )
    elif req.target_parameter == "thermal_resistance":
        losses_w = np.array([12000.0, 18000.0, 24000.0, 30000.0, 36000.0])
        measured_temps_c = np.array([34.2, 35.3, 36.4, 37.5, 38.5])
        cal_result = ModelCalibrator.calibrate_thermal_resistance(
            measured_loss_power_w=losses_w,
            measured_temp_c=measured_temps_c,
            ambient_temp_c=32.0,
            initial_r_th=0.00018,
        )
        return CalibrationResponse(
            parameter_name=cal_result.parameter_name,
            nominal_value=cal_result.nominal_value,
            calibrated_value=cal_result.calibrated_value,
            unit=cal_result.unit,
            rmse_before=cal_result.rmse_before,
            rmse_after=cal_result.rmse_after,
            improvement_pct=cal_result.improvement_pct,
        )
    else:
        raise HTTPException(status_code=400, detail="Unknown target parameter")


@router.get("/twin/operating-profile")
async def get_operating_profile():
    profile = await twin_store.get_operating_profile()
    return {"operatingProfile": profile}


@router.post("/twin/operating-profile")
async def set_operating_profile(profile: str = Body(..., embed=True)):
    allowed = ["REAL_DATA_MODE", "CALIBRATED_SIMULATION_MODE", "DEMO_MODE"]
    if profile not in allowed:
        raise HTTPException(status_code=400, detail=f"Profile must be one of: {allowed}")
    await twin_store.set_operating_profile(profile)
    return {"status": "OK", "operatingProfile": profile}
