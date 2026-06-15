from fastapi import APIRouter

from app.api.v1.finance.fee_payments import router as fee_payments_router
from app.api.v1.finance.misc_fees import router as misc_fees_router
from app.api.v1.finance.overview import router as overview_router
from app.api.v1.finance.payments import router as payments_router
from app.api.v1.finance.receipts import router as receipts_router
from app.api.v1.finance.settlements import router as settlements_router
from app.api.v1.finance.tax_refunds import router as tax_refunds_router

router = APIRouter(prefix="/finance", tags=["finance"])
router.include_router(overview_router)
router.include_router(receipts_router)
router.include_router(payments_router)
router.include_router(fee_payments_router)
router.include_router(misc_fees_router)
router.include_router(settlements_router)
router.include_router(tax_refunds_router)
