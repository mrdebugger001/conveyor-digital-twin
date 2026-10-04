from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.twin.state_store import twin_store
from app.schemas.twin import TensionProfileResponse, JointSpatialMarker

router = APIRouter(prefix="/api/conveyor", tags=["conveyor"])


@router.get("/tension-profile", response_model=TensionProfileResponse)
async def get_tension_profile():
    """Retrieve 1D distributed belt tension profile T(s) along the 720m loop

    including live locations and stresses of all 24 splices.
    """
    profile = await twin_store.get_tension_profile()
    if not profile:
        raise HTTPException(status_code=503, detail="Tension profile engine initializing")
    return profile


@router.get("/joints")
async def list_joints():
    """Retrieve kinematic position, zone classification, and stress breakdown for all 24 belt joints."""
    profile = await twin_store.get_tension_profile()
    if not profile:
        raise HTTPException(status_code=503, detail="Joint kinematics engine initializing")
    return profile.get("joints", [])


@router.get("/joints/{joint_id}")
async def get_joint_detail(joint_id: str):
    """Retrieve detailed stress, fatigue damage, and health analytics for a specific joint."""
    clean_id = joint_id.replace("joint-", "")
    profile = await twin_store.get_tension_profile()
    if not profile:
        raise HTTPException(status_code=503, detail="Joint kinematics engine initializing")

    for j in profile.get("joints", []):
        if j["id"] == clean_id or j["id"] == joint_id:
            return j

    raise HTTPException(status_code=404, detail=f"Joint {joint_id} not found")
