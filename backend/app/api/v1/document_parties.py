from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.masterdata.document_parties.providers import get_document_party_service
from app.modules.masterdata.document_parties.schemas import (
    DocumentPartyCreate,
    DocumentPartyListResponse,
    DocumentPartyResponse,
    DocumentPartyUpdate,
)
from app.modules.masterdata.document_parties.services import (
    DocumentPartyService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/document-parties", tags=["document-parties"])


@router.get("", response_model=ApiResponse[DocumentPartyListResponse])
async def list_document_parties(
    user: CurrentUserDep,
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
    party_type: Annotated[str | None, Query(max_length=40)] = None,
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[DocumentPartyListResponse]:
    parties = await service.list_parties(
        current_user=user,
        q=q,
        party_type=party_type,
        customer_id=customer_id,
    )
    return ApiResponse(data=parties)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[DocumentPartyResponse],
)
async def create_document_party(
    payload: DocumentPartyCreate,
    user: CurrentUserDep,
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    party = await service.create_party(current_user=user, payload=payload)
    return ApiResponse(data=party)


@router.get("/lookup", response_model=ApiResponse[DocumentPartyListResponse])
async def lookup_document_parties(
    user: CurrentUserDep,
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
    party_type: Annotated[str, Query(max_length=40)],
    customer_id: Annotated[str | None, Query(max_length=36)] = None,
) -> ApiResponse[DocumentPartyListResponse]:
    parties = await service.lookup_parties(
        current_user=user,
        party_type=party_type,
        customer_id=customer_id,
    )
    return ApiResponse(data=parties)


@router.get("/{party_id}", response_model=ApiResponse[DocumentPartyResponse])
async def get_document_party(
    party_id: str,
    user: CurrentUserDep,
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    party = await service.get_party(current_user=user, party_id=party_id)
    return ApiResponse(data=party)


@router.put("/{party_id}", response_model=ApiResponse[DocumentPartyResponse])
async def update_document_party(
    party_id: str,
    payload: DocumentPartyUpdate,
    user: CurrentUserDep,
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    party = await service.update_party(
        current_user=user,
        party_id=party_id,
        payload=payload,
    )
    return ApiResponse(data=party)


@router.delete("/{party_id}", response_model=ApiResponse[DocumentPartyResponse])
async def delete_document_party(
    party_id: str,
    user: CurrentUserDep,
    service: Annotated[DocumentPartyService, Depends(get_document_party_service)],
) -> ApiResponse[DocumentPartyResponse]:
    party = await service.deactivate_party(current_user=user, party_id=party_id)
    return ApiResponse(data=party)
