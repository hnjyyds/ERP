from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.auth_dependencies import CurrentUserDep
from app.modules.masterdata.products.providers import get_product_service
from app.modules.masterdata.products.schemas import (
    ProductAccessoryCreate,
    ProductAccessoryResponse,
    ProductAccessoryUpdate,
    ProductCreate,
    ProductCustomerListResponse,
    ProductExportResponse,
    ProductImportRequest,
    ProductImportResponse,
    ProductListResponse,
    ProductResponse,
    ProductTransactionListResponse,
    ProductUpdate,
)
from app.modules.masterdata.products.services import (
    ProductService,
)
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/products", tags=["products"])


@router.get("", response_model=ApiResponse[ProductListResponse])
async def list_products(
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[ProductListResponse]:
    products = await service.list_products(current_user=user, q=q)
    return ApiResponse(data=products)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[ProductResponse])
async def create_product(
    payload: ProductCreate,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    product = await service.create_product(current_user=user, payload=payload)
    return ApiResponse(data=product)


@router.get("/export", response_model=ApiResponse[ProductExportResponse])
async def export_products(
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductExportResponse]:
    export = await service.export_products(current_user=user)
    return ApiResponse(data=export)


@router.post("/import", response_model=ApiResponse[ProductImportResponse])
async def import_products(
    payload: ProductImportRequest,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductImportResponse]:
    result = await service.import_products(current_user=user, payload=payload)
    return ApiResponse(data=result)


@router.get("/{product_id}", response_model=ApiResponse[ProductResponse])
async def get_product(
    product_id: str,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    product = await service.get_product(current_user=user, product_id=product_id)
    return ApiResponse(data=product)


@router.get(
    "/{product_id}/customers",
    response_model=ApiResponse[ProductCustomerListResponse],
)
async def list_product_customers(
    product_id: str,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductCustomerListResponse]:
    customers = await service.list_product_customers(
        current_user=user,
        product_id=product_id,
    )
    return ApiResponse(data=customers)


@router.get(
    "/{product_id}/transactions",
    response_model=ApiResponse[ProductTransactionListResponse],
)
async def list_product_transactions(
    product_id: str,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductTransactionListResponse]:
    transactions = await service.list_transactions(
        current_user=user,
        product_id=product_id,
    )
    return ApiResponse(data=transactions)


@router.put("/{product_id}", response_model=ApiResponse[ProductResponse])
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    product = await service.update_product(
        current_user=user,
        product_id=product_id,
        payload=payload,
    )
    return ApiResponse(data=product)


@router.delete("/{product_id}", response_model=ApiResponse[ProductResponse])
async def deactivate_product(
    product_id: str,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    product = await service.deactivate_product(current_user=user, product_id=product_id)
    return ApiResponse(data=product)


@router.post(
    "/{product_id}/accessories",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ProductAccessoryResponse],
)
async def add_accessory(
    product_id: str,
    payload: ProductAccessoryCreate,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductAccessoryResponse]:
    accessory = await service.add_accessory(
        current_user=user,
        product_id=product_id,
        payload=payload,
    )
    return ApiResponse(data=accessory)


@router.put(
    "/{product_id}/accessories/{accessory_id}",
    response_model=ApiResponse[ProductAccessoryResponse],
)
async def update_accessory(
    product_id: str,
    accessory_id: str,
    payload: ProductAccessoryUpdate,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductAccessoryResponse]:
    accessory = await service.update_accessory(
        current_user=user,
        product_id=product_id,
        accessory_id=accessory_id,
        payload=payload,
    )
    return ApiResponse(data=accessory)


@router.delete(
    "/{product_id}/accessories/{accessory_id}",
    response_model=ApiResponse[ProductAccessoryResponse],
)
async def delete_accessory(
    product_id: str,
    accessory_id: str,
    user: CurrentUserDep,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductAccessoryResponse]:
    accessory = await service.delete_accessory(
        current_user=user,
        product_id=product_id,
        accessory_id=accessory_id,
    )
    return ApiResponse(data=accessory)
