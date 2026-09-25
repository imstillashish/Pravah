from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator
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

    @model_validator(mode="after")
    def validate_ports(self):
        if self.origin_port and self.destination_port:
            if self.origin_port.strip().lower() == self.destination_port.strip().lower():
                raise ValueError(
                    f"Origin port '{self.origin_port}' and destination terminal '{self.destination_port}' cannot be the same. A valid charter voyage requires distinct loading and discharge locations."
                )
        return self

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


class VendorQuoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quote_request_label: Optional[str] = None
    broker_name: str
    vessel_type: str
    quoted_rate_usd_per_mt: float
    delivery_days: int
    valid_until: str
    is_sample_data: bool = True
    sample_data_notice: str = "These quotes are sample data. Real broker integration is not connected."


class CargoRequestCreate(BaseModel):
    plant_id: Optional[int] = None
    cargo_type_id: Optional[int] = None
    quantity_mt: float
    destination_port_id: Optional[int] = None


class CargoRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plant_id: Optional[int] = None
    plant_name: Optional[str] = None
    cargo_type_id: Optional[int] = None
    quantity_mt: float
    destination_port_id: Optional[int] = None
    port_name: Optional[str] = None
    status: str = "OPEN"
    merged_into_id: Optional[int] = None
    created_at: Optional[str] = None

