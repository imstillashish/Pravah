from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vendor_quote import VendorQuote
from app.schemas import VendorQuoteResponse

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("", response_model=List[VendorQuoteResponse])
@router.get("/", response_model=List[VendorQuoteResponse])
def get_vendor_quotes(db: Session = Depends(get_db)):
    """
    Returns all vendor quotes.
    Always flags is_sample_data=True and includes sample_data_notice.
    (Tasks 353 & 354)
    """
    quotes = db.query(VendorQuote).all()
    return [q.to_dict() for q in quotes]
