from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
from app.modules.masterdata.document_parties.providers import get_document_party_service
from app.modules.masterdata.document_parties.schemas import (
    DocumentPartyCreate,
    DocumentPartyListResponse,
    DocumentPartyResponse,
    DocumentPartyUpdate,
)
from app.modules.masterdata.document_parties.services import (
    DocumentPartyNotFoundError,
    DocumentPartyService,
    PermissionDeniedError,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/document-parties", tags=["document-parties"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少单证资料权限")


def _raise_invalid_party_type() -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="单证资料类型无效",
    )


@router.get("", response_model=ApiResponse[DocumentPartyListResponse])
async def list_document_parties(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    party_type: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[DocumentPartyListResponse]:
    user = await _current_user(token, auth_service)
    try:
        parties = await service.list_parties(
            current_user=user,
            q=q,
            party_type=party_type,
            customer_id=customer_id,
        )
        return ApiResponse(data=parties)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_party_type()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[DocumentPartyResponse],
)
async def create_document_party(
    payload: DocumentPartyCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    user = await _current_user(token, auth_service)
    try:
        party = await service.create_party(current_user=user, payload=payload)
        return ApiResponse(data=party)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_party_type()


@router.get("/lookup", response_model=ApiResponse[DocumentPartyListResponse])
async def lookup_document_parties(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
    party_type: Annotated[str, Query(max_length=40)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[DocumentPartyListResponse]:
    user = await _current_user(token, auth_service)
    try:
        parties = await service.lookup_parties(
            current_user=user,
            party_type=party_type,
            customer_id=customer_id,
        )
        return ApiResponse(data=parties)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ValueError:
        _raise_invalid_party_type()


@router.get("/{party_id}", response_model=ApiResponse[DocumentPartyResponse])
async def get_document_party(
    party_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    user = await _current_user(token, auth_service)
    try:
        party = await service.get_party(current_user=user, party_id=party_id)
        return ApiResponse(data=party)
    except PermissionDeniedError:
        _raise_permission_denied()
    except DocumentPartyNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="单证资料不存在",
        ) from None


@router.put("/{party_id}", response_model=ApiResponse[DocumentPartyResponse])
async def update_document_party(
    party_id: str,
    payload: DocumentPartyUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    user = await _current_user(token, auth_service)
    try:
        party = await service.update_party(
            current_user=user,
            party_id=party_id,
            payload=payload,
        )
        return ApiResponse(data=party)
    except PermissionDeniedError:
        _raise_permission_denied()
    except DocumentPartyNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="单证资料不存在",
        ) from None
    except ValueError:
        _raise_invalid_party_type()


@router.delete("/{party_id}", response_model=ApiResponse[DocumentPartyResponse])
async def delete_document_party(
    party_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    user = await _current_user(token, auth_service)
    try:
        party = await service.deactivate_party(current_user=user, party_id=party_id)
        return ApiResponse(data=party)
    except PermissionDeniedError:
        _raise_permission_denied()
    except DocumentPartyNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="单证资料不存在",
        ) from None
