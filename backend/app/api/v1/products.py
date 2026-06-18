from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_bearer_token
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
    PermissionDeniedError,
    ProductAccessoryNotFoundError,
    ProductImportInvalidError,
    ProductNotFoundError,
    ProductService,
)
from app.modules.system.auth.providers import get_auth_service
from app.modules.system.auth.schemas import CurrentUserResponse
from app.modules.system.auth.services import AuthService, InvalidTokenError
from app.schemas.responses import ApiResponse

router = APIRouter(prefix="/masterdata/products", tags=["products"])


async def _current_user(token: str, auth_service: AuthService) -> CurrentUserResponse:
    try:
        return (await auth_service.get_current_user(token)).user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效") from None


def _raise_permission_denied() -> NoReturn:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="缺少商品资料权限")


@router.get("", response_model=ApiResponse[ProductListResponse])
async def list_products(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
    q: Annotated[str | None, Query(max_length=120)] = None,
) -> ApiResponse[ProductListResponse]:
    user = await _current_user(token, auth_service)
    try:
        products = await service.list_products(current_user=user, q=q)
        return ApiResponse(data=products)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[ProductResponse])
async def create_product(
    payload: ProductCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    user = await _current_user(token, auth_service)
    try:
        product = await service.create_product(current_user=user, payload=payload)
        return ApiResponse(data=product)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.get("/export", response_model=ApiResponse[ProductExportResponse])
async def export_products(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductExportResponse]:
    user = await _current_user(token, auth_service)
    try:
        export = await service.export_products(current_user=user)
        return ApiResponse(data=export)
    except PermissionDeniedError:
        _raise_permission_denied()


@router.post("/import", response_model=ApiResponse[ProductImportResponse])
async def import_products(
    payload: ProductImportRequest,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductImportResponse]:
    user = await _current_user(token, auth_service)
    try:
        result = await service.import_products(current_user=user, payload=payload)
        return ApiResponse(data=result)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductImportInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None


@router.get("/{product_id}", response_model=ApiResponse[ProductResponse])
async def get_product(
    product_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    user = await _current_user(token, auth_service)
    try:
        product = await service.get_product(current_user=user, product_id=product_id)
        return ApiResponse(data=product)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None


@router.get(
    "/{product_id}/customers",
    response_model=ApiResponse[ProductCustomerListResponse],
)
async def list_product_customers(
    product_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductCustomerListResponse]:
    user = await _current_user(token, auth_service)
    try:
        customers = await service.list_product_customers(
            current_user=user,
            product_id=product_id,
        )
        return ApiResponse(data=customers)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None


@router.get(
    "/{product_id}/transactions",
    response_model=ApiResponse[ProductTransactionListResponse],
)
async def list_product_transactions(
    product_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductTransactionListResponse]:
    user = await _current_user(token, auth_service)
    try:
        transactions = await service.list_transactions(
            current_user=user,
            product_id=product_id,
        )
        return ApiResponse(data=transactions)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None


@router.put("/{product_id}", response_model=ApiResponse[ProductResponse])
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    user = await _current_user(token, auth_service)
    try:
        product = await service.update_product(
            current_user=user,
            product_id=product_id,
            payload=payload,
        )
        return ApiResponse(data=product)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None


@router.delete("/{product_id}", response_model=ApiResponse[ProductResponse])
async def deactivate_product(
    product_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductResponse]:
    user = await _current_user(token, auth_service)
    try:
        product = await service.deactivate_product(current_user=user, product_id=product_id)
        return ApiResponse(data=product)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None


@router.post(
    "/{product_id}/accessories",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ProductAccessoryResponse],
)
async def add_accessory(
    product_id: str,
    payload: ProductAccessoryCreate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductAccessoryResponse]:
    user = await _current_user(token, auth_service)
    try:
        accessory = await service.add_accessory(
            current_user=user,
            product_id=product_id,
            payload=payload,
        )
        return ApiResponse(data=accessory)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None


@router.put(
    "/{product_id}/accessories/{accessory_id}",
    response_model=ApiResponse[ProductAccessoryResponse],
)
async def update_accessory(
    product_id: str,
    accessory_id: str,
    payload: ProductAccessoryUpdate,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductAccessoryResponse]:
    user = await _current_user(token, auth_service)
    try:
        accessory = await service.update_accessory(
            current_user=user,
            product_id=product_id,
            accessory_id=accessory_id,
            payload=payload,
        )
        return ApiResponse(data=accessory)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None
    except ProductAccessoryNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配件不存在") from None


@router.delete(
    "/{product_id}/accessories/{accessory_id}",
    response_model=ApiResponse[ProductAccessoryResponse],
)
async def delete_accessory(
    product_id: str,
    accessory_id: str,
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ApiResponse[ProductAccessoryResponse]:
    user = await _current_user(token, auth_service)
    try:
        accessory = await service.delete_accessory(
            current_user=user,
            product_id=product_id,
            accessory_id=accessory_id,
        )
        return ApiResponse(data=accessory)
    except PermissionDeniedError:
        _raise_permission_denied()
    except ProductNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在") from None
    except ProductAccessoryNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配件不存在") from None
