import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.twin.state_store import twin_store


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_data_provenance_endpoint(client):
    res = client.get("/api/data/provenance")
    assert res.status_code == 200
    data = res.json()
    assert "parameters" in data
    assert "conveyor_length_m" in data["parameters"]


def test_dataset_catalog_endpoint(client):
    res = client.get("/api/data/catalog")
    assert res.status_code == 200
    catalog = res.json()
    assert len(catalog) >= 4
    names = [c.get("datasetName") or c.get("dataset_name") for c in catalog]
    assert any("CWRU" in n for n in names)
    assert any("Paderborn" in n for n in names)


def test_nasa_ims_trajectory_endpoint(client):
    res = client.get("/api/data/nasa-ims/degradation")
    assert res.status_code == 200
    traj = res.json()
    assert len(traj) > 0
    assert "rms_g" in traj[0]


def test_calibration_endpoint(client):
    res = client.post("/api/twin/calibrate", json={"targetParameter": "friction_factor"})
    assert res.status_code == 200
    cal = res.json()
    assert cal["parameterName"] == "din22101_friction_factor_f"
    assert cal["calibratedValue"] > 0.0


def test_operating_profile_endpoint(client):
    res = client.get("/api/twin/operating-profile")
    assert res.status_code == 200
    assert "operatingProfile" in res.json()

    set_res = client.post("/api/twin/operating-profile", json={"profile": "CALIBRATED_SIMULATION_MODE"})
    assert set_res.status_code == 200
    assert set_res.json()["operatingProfile"] == "CALIBRATED_SIMULATION_MODE"
