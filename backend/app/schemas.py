from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "logistics_planner"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RoleSwitchRequest(BaseModel):
    target_role: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class MetricsSeries(BaseModel):
    bdi: list[float]
    freight: list[float]
    bunker: list[float]

class GlobalMetricsResponse(BaseModel):
    bdi_index: int
    bdi_change_pct: float
    current_avg_freight_pmt: float
    freight_change_pct: float
    bunker_vlsfo_pmt: float
    capesize_daily_usd: int
    panamax_daily_usd: int
    series: MetricsSeries

class AnalysisCreate(BaseModel):
    title: Optional[str] = None
    origin_country: str
    origin_port: str
    destination_port: str
    commodity: str
    parcel_tonnage: float
    benchmark_spot_pmt: Optional[float] = None
    predicted_rate_pmt: Optional[float] = None
    status: Optional[str] = "draft"

class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    origin_country: str
    origin_port: str
    destination_port: str
    commodity: str
    parcel_tonnage: float
    recommended_vessel: str
    predicted_rate_pmt: float
    benchmark_spot_pmt: float
    estimated_savings_usd: float
    status: str
    created_at: datetime

class UserRegister(BaseModel):
    full_name: str
    email: str # accepts email or employee id
    password: str
    confirm_password: Optional[str] = None
    role: Optional[str] = "logistics_planner"
