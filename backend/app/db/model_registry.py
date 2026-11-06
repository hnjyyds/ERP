"""模型注册表：集中导入所有 ORM 模型，供建表、迁移与元数据比对使用。

Alembic 的 `target_metadata` 依赖模型模块被导入后才能反射出完整表结构，
应用启动与迁移脚本都必须从这里获取同一份模型集合，避免两边漂移。
"""

from app.modules.finance.fee_payments import models as finance_fee_payment_models  # noqa: F401
from app.modules.finance.misc_fees import models as finance_misc_fee_models  # noqa: F401
from app.modules.finance.payments import models as finance_payment_models  # noqa: F401
from app.modules.finance.port_data import models as finance_port_data_models  # noqa: F401
from app.modules.finance.receipts import models as finance_receipt_models  # noqa: F401
from app.modules.finance.reimbursements import models as finance_reimbursement_models  # noqa: F401
from app.modules.finance.settlements import models as finance_settlement_models  # noqa: F401
from app.modules.finance.tax_refunds import models as finance_tax_refund_models  # noqa: F401
from app.modules.followup import models as followup_models  # noqa: F401
from app.modules.masterdata.customers import models as customer_models  # noqa: F401
from app.modules.masterdata.document_parties import models as document_party_models  # noqa: F401
from app.modules.masterdata.partners import models as partner_models  # noqa: F401
from app.modules.masterdata.products import models as product_models  # noqa: F401
from app.modules.masterdata.suppliers import models as supplier_models  # noqa: F401
from app.modules.purchase.contracts import models as purchase_contract_models  # noqa: F401
from app.modules.purchase.inquiries import models as purchase_inquiry_models  # noqa: F401
from app.modules.purchase.invoice_notices import (
    models as purchase_invoice_notice_models,  # noqa: F401
)
from app.modules.quality.inspections import models as quality_inspection_models  # noqa: F401
from app.modules.sales.contracts import models as contract_models  # noqa: F401
from app.modules.sales.quotations import models as quotation_models  # noqa: F401
from app.modules.sales.shipments import models as shipment_models  # noqa: F401
from app.modules.sample.deliveries import models as sample_delivery_models  # noqa: F401
from app.modules.sample.records import models as sample_record_models  # noqa: F401
from app.modules.sample.requests import models as sample_request_models  # noqa: F401
from app.modules.system.auth import models as auth_models  # noqa: F401
from app.modules.system.company import models as company_models  # noqa: F401
from app.modules.system.dashboard import models as dashboard_models  # noqa: F401
from app.modules.system.mcp_settings import models as mcp_settings_models  # noqa: F401
from app.modules.warehouse.inbound_orders import models as inbound_order_models  # noqa: F401
from app.modules.warehouse.inbound_plans import models as inbound_plan_models  # noqa: F401
from app.modules.warehouse.inventory import models as inventory_models  # noqa: F401
from app.modules.warehouse.outbound_orders import models as outbound_order_models  # noqa: F401
from app.modules.warehouse.outbound_plans import models as outbound_plan_models  # noqa: F401
