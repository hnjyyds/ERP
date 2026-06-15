from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.api.v1.finance.common import current_user, raise_permission_denied, raise_unprocessable
from app.modules.finance.tax_refunds.providers import get_tax_refund_service
from app.modules.finance.tax_refunds.schemas import (
    CustomsReceiptRegister,
    TaxRefundRegister,
    VerificationDocumentCreate,
    VerificationDocumentListResponse,
    VerificationDocumentResponse,
    VerificationRegister,
    VerificationUsageListResponse,
)
from app.modules.finance.tax_refunds.services import (
    PermissionDeniedError as TaxRefundPermissionDeniedError,
)
from app.modules.finance.tax_refunds.services import TaxRefundNotFoundError, TaxRefundService
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.services import AuthService
from app.schemas.responses import ApiResponse

router = APIRouter()

@router.post(
    "/verification-documents",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def create_verification_document(
    payload: VerificationDocumentCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await current_user(token, auth_service)
    try:
        document = await service.create_document(current_user=user, payload=payload)
        return ApiResponse(data=document)
    except TaxRefundPermissionDeniedError:
        raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get(
    "/verification-documents",
    response_model=ApiResponse[VerificationDocumentListResponse],
)
async def list_verification_documents(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    owner_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    reminder_status: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[VerificationDocumentListResponse]:
    user = await current_user(token, auth_service)
    try:
        documents = await service.list_documents(
            current_user=user,
            q=q,
            status=status_filter,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
        )
        return ApiResponse(data=documents)
    except TaxRefundPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/verification-documents/{verification_document_id}/customs-receipt",
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def register_verification_customs_receipt(
    verification_document_id: str,
    payload: CustomsReceiptRegister,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await current_user(token, auth_service)
    try:
        document = await service.register_customs_receipt(
            current_user=user,
            document_id=verification_document_id,
            payload=payload,
        )
        return ApiResponse(data=document)
    except TaxRefundPermissionDeniedError:
        raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/verification-documents/{verification_document_id}/verify",
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def register_verification(
    verification_document_id: str,
    payload: VerificationRegister,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await current_user(token, auth_service)
    try:
        document = await service.register_verification(
            current_user=user,
            document_id=verification_document_id,
            payload=payload,
        )
        return ApiResponse(data=document)
    except TaxRefundPermissionDeniedError:
        raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.post(
    "/verification-documents/{verification_document_id}/tax-refunds",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[VerificationDocumentResponse],
)
async def register_tax_refund(
    verification_document_id: str,
    payload: TaxRefundRegister,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
) -> ApiResponse[VerificationDocumentResponse]:
    user = await current_user(token, auth_service)
    try:
        document = await service.register_tax_refund(
            current_user=user,
            document_id=verification_document_id,
            payload=payload,
        )
        return ApiResponse(data=document)
    except TaxRefundPermissionDeniedError:
        raise_permission_denied()
    except TaxRefundNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="核销单不存在") from exc
    except ValueError as exc:
        raise_unprocessable(str(exc))


@router.get("/verification-usage", response_model=ApiResponse[VerificationUsageListResponse])
async def list_verification_usage(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[TaxRefundService, Depends(get_tax_refund_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[str | None, Query(alias="status", max_length=40)] = None,
    owner_user_id: Annotated[str | None, Query(max_length=64)] = None,
    shipment_no: Annotated[str | None, Query(max_length=80)] = None,
    reminder_status: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[VerificationUsageListResponse]:
    user = await current_user(token, auth_service)
    try:
        usage = await service.list_usage(
            current_user=user,
            q=q,
            status=status_filter,
            owner_user_id=owner_user_id,
            shipment_no=shipment_no,
            reminder_status=reminder_status,
        )
        return ApiResponse(data=usage)
    except TaxRefundPermissionDeniedError:
        raise_permission_denied()
    except ValueError as exc:
        raise_unprocessable(str(exc))
