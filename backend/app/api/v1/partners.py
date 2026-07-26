from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.api.http_exceptions import raise_permission_denied, raise_unprocessable
from app.modules.masterdata.partners.providers import get_partner_service
from app.modules.masterdata.partners.schemas import (
    PartnerContactCreate,
    PartnerContactResponse,
    PartnerContactUpdate,
    PartnerCreate,
    PartnerFeeRecordListResponse,
    PartnerListResponse,
    PartnerResponse,
    PartnerUpdate,
)
from app.modules.masterdata.partners.services import (
    PartnerContactNotFoundError,
    PartnerNotFoundError,
    PartnerService,
    PermissionDeniedError,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/partners", tags=["partners"])


@router.get("", response_model=ApiResponse[PartnerListResponse])
async def list_partners(
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    partner_type: Annotated[str | None, Query(max_length=40)] = None,
) -> ApiResponse[PartnerListResponse]:
    try:
        partners = await service.list_partners(
            current_user=user,
            q=q,
            partner_type=partner_type,
        )
        return ApiResponse(data=partners)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except ValueError:
        raise_unprocessable("合作伙伴类型无效")


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[PartnerResponse])
async def create_partner(
    payload: PartnerCreate,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerResponse]:
    try:
        partner = await service.create_partner(current_user=user, payload=payload)
        return ApiResponse(data=partner)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except ValueError:
        raise_unprocessable("合作伙伴类型无效")


@router.get("/{partner_id}", response_model=ApiResponse[PartnerResponse])
async def get_partner(
    partner_id: str,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerResponse]:
    try:
        partner = await service.get_partner(current_user=user, partner_id=partner_id)
        return ApiResponse(data=partner)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except PartnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴不存在",
        ) from None


@router.put("/{partner_id}", response_model=ApiResponse[PartnerResponse])
async def update_partner(
    partner_id: str,
    payload: PartnerUpdate,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerResponse]:
    try:
        partner = await service.update_partner(
            current_user=user,
            partner_id=partner_id,
            payload=payload,
        )
        return ApiResponse(data=partner)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except PartnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴不存在",
        ) from None
    except ValueError:
        raise_unprocessable("合作伙伴类型无效")


@router.post(
    "/{partner_id}/contacts",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[PartnerContactResponse],
)
async def add_partner_contact(
    partner_id: str,
    payload: PartnerContactCreate,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerContactResponse]:
    try:
        contact = await service.add_contact(
            current_user=user,
            partner_id=partner_id,
            payload=payload,
        )
        return ApiResponse(data=contact)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except PartnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴不存在",
        ) from None


@router.put(
    "/{partner_id}/contacts/{contact_id}",
    response_model=ApiResponse[PartnerContactResponse],
)
async def update_partner_contact(
    partner_id: str,
    contact_id: str,
    payload: PartnerContactUpdate,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerContactResponse]:
    try:
        contact = await service.update_contact(
            current_user=user,
            partner_id=partner_id,
            contact_id=contact_id,
            payload=payload,
        )
        return ApiResponse(data=contact)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except PartnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴不存在",
        ) from None
    except PartnerContactNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="联系人不存在",
        ) from None


@router.delete(
    "/{partner_id}/contacts/{contact_id}",
    response_model=ApiResponse[PartnerContactResponse],
)
async def delete_partner_contact(
    partner_id: str,
    contact_id: str,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerContactResponse]:
    try:
        contact = await service.delete_contact(
            current_user=user,
            partner_id=partner_id,
            contact_id=contact_id,
        )
        return ApiResponse(data=contact)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except PartnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴不存在",
        ) from None
    except PartnerContactNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="联系人不存在",
        ) from None


@router.delete("/{partner_id}", response_model=ApiResponse[PartnerResponse])
async def deactivate_partner(
    partner_id: str,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerResponse]:
    try:
        partner = await service.deactivate_partner(current_user=user, partner_id=partner_id)
        return ApiResponse(data=partner)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except PartnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴不存在",
        ) from None


@router.get(
    "/{partner_id}/fee-records",
    response_model=ApiResponse[PartnerFeeRecordListResponse],
)
async def list_partner_fee_records(
    partner_id: str,
    user: CurrentUserDep,
    service: Annotated[PartnerService, Depends(get_partner_service)],
) -> ApiResponse[PartnerFeeRecordListResponse]:
    try:
        fee_records = await service.list_fee_records(
            current_user=user,
            partner_id=partner_id,
        )
        return ApiResponse(data=fee_records)
    except PermissionDeniedError:
        raise_permission_denied("缺少合作伙伴权限")
    except PartnerNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="合作伙伴不存在",
        ) from None
