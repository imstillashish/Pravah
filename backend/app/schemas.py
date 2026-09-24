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


class PortResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    port_name: str
    locode: Optional[str] = None
    max_loa_m: float
    max_beam_m: float
    max_draft_m: float
    max_dwt_mt: int
    has_lightering: bool = False
    lightering_note: Optional[str] = None
    port_type: Optional[str] = "DESTINATION"
    country: Optional[str] = "India"
    loading_rate_tpd: Optional[float] = 25000.0
    typical_waiting_days: Optional[float] = 2.0
    current_vessels_in_queue: Optional[int] = 5
    source: Optional[str] = None
    is_active: bool = True


class MetricItem(BaseModel):
    current: float
    change_pct: float
    unit: Optional[str] = None


class BalticIndices(BaseModel):
    bdi: MetricItem
    bci: MetricItem
    bpi: MetricItem
    bsi: MetricItem


class CommodityPrices(BaseModel):
    coking_coal_fob_usd: MetricItem
    iron_ore_cfr_usd: MetricItem
    domestic_coal_parity_inr: MetricItem
    hrc_steel_usd: MetricItem


class MacroIndicators(BaseModel):
    global_manufacturing_pmi: float
    china_blast_furnace_utilization_pct: float
    fleet_orderbook_pct: float
    bunker_vlsfo_usd: float
    usd_inr_rate: float


class MarketIndicatorsResponse(BaseModel):
    recorded_at: str
    baltic_indices: BalticIndices
    commodity_prices: CommodityPrices
    macro_indicators: MacroIndicators


class IdleEmploymentRequest(BaseModel):
    origin_port: str = "Hay Point (DBCT)"
    destination_port: str = "Paradip"
    vessel_class: Optional[str] = "Capesize"
    quantity_mt: Optional[float] = 150000.0
    laycan_month: Optional[int] = 7


class TurnaroundMetrics(BaseModel):
    origin_waiting_days: float
    destination_waiting_days: float
    laytime_allowed_days: float
    demurrage_exposure_usd: float
    ballast_deadhead_days: float


class AlternativeEmploymentOption(BaseModel):
    id: str
    title: str
    route_type: str
    net_benefit_usd: float
    absorbed_idle_days: float
    description: str


class IdleEmploymentResponse(BaseModel):
    turnaround: TurnaroundMetrics
    alternative_employments: list[AlternativeEmploymentOption]

