from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.modules.sample.requests.repositories import SampleRequestRepository, SampleRequestRow


async def test_sample_request_repository_filters_by_customer_status_q_and_owner(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        repository = SampleRequestRepository(session)
        sample_request = await repository.create_request(
            code="SR-REPO-001",
            request_date=date(2026, 6, 20),
            customer_id="customer-a",
            customer_name="客户 A",
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            supplier_id="supplier-a",
            supplier_name="供应商 A",
            sales_user_id="u-001",
            sales_user_name="业务主管",
            destination="factory",
            requirements="环保材质确认样",
            due_date=date(2026, 6, 28),
            status="draft",
            owner_user_id="u-001",
        )
        await repository.add_line(
            sample_request_id=sample_request.id,
            product_id="product-a",
            product_code="BAG-40",
            product_name="Eco Bag",
            specification="40x35cm",
            quantity="3",
            unit="pcs",
            requirement="绿色样",
        )
        await repository.create_request(
            code="SR-REPO-002",
            request_date=date(2026, 6, 22),
            customer_id="customer-b",
            customer_name="客户 B",
            product_id="product-b",
            product_code="CUP-01",
            product_name="Cup",
            supplier_id=None,
            supplier_name=None,
            sales_user_id="u-other",
            sales_user_name="其他业务",
            destination="in_house",
            requirements="内部打样",
            due_date=None,
            status="completed",
            owner_user_id="u-other",
        )
        await session.commit()

        rows, total = await repository.list_requests(
            q="Eco",
            status="draft",
            customer_id="customer-a",
            owner_user_id="u-001",
        )

    assert total == 1
    assert isinstance(rows[0], SampleRequestRow)
    assert rows[0].id == sample_request.id
    assert rows[0].code == "SR-REPO-001"
