"""后端响应文案目录：按请求语言渲染用户可见的错误信息。

目录只收录接口返回给前端的文案；日志、注释、落库枚举值不在其中。
``code`` 与响应结构保持稳定，语言只影响 ``message`` 和 ``details[].message``。
"""

from app.core.language import DEFAULT_LANGUAGE, get_current_language
from app.core.source_messages import DYNAMIC_PATTERNS, ROLE_NAMES, SOURCE_MESSAGES

MESSAGE_CATALOG: dict[str, dict[str, str]] = {
    "zh-CN": {
        # 通用状态
        "status.SUCCESS": "请求成功",
        "status.CREATED": "创建成功",
        "status.ACCEPTED": "请求已接受",
        "status.NO_CONTENT": "无返回内容",
        "status.BAD_REQUEST": "请求参数错误",
        "status.MISSING_CREDENTIALS": "缺少登录凭证",
        "status.INVALID_CREDENTIALS": "用户名或密码错误",
        "status.TOKEN_EXPIRED": "登录已失效",
        "status.UNAUTHORIZED": "未认证",
        "status.PERMISSION_DENIED": "无权限执行该操作",
        "status.NOT_FOUND": "资源不存在",
        "status.METHOD_NOT_ALLOWED": "请求方法不允许",
        "status.CONFLICT": "资源状态冲突",
        "status.VALIDATION_ERROR": "请求参数校验失败",
        "status.BUSINESS_ERROR": "业务规则不满足",
        "status.TOO_MANY_REQUESTS": "请求过于频繁",
        "status.SERVER_ERROR": "系统异常",
        "status.SERVICE_UNAVAILABLE": "服务暂不可用",
        "status.GATEWAY_TIMEOUT": "网关超时",
        # 异常类型默认文案
        "exception.InvalidCredentialsError": "用户名或密码错误",
        "exception.InvalidTokenError": "登录已失效",
        "exception.McpDisabledError": "MCP 服务未启用",
        "exception.OrganizationDepartmentNameTakenError": "部门名称已存在",
        "exception.OrganizationDepartmentNotFoundError": "部门不存在",
        "exception.OrganizationDepartmentInUseError": "部门下已有用户，不能删除",
        "exception.OrganizationDepartmentRequiredError": "用户必须关联部门",
        "exception.OrganizationUsernameTakenError": "用户名已存在",
        "exception.OrganizationSelfDeactivateError": "不能停用当前登录账号",
        "exception.OrganizationSelfDemoteError": "不能移除当前账号的管理权限",
        "exception.OrganizationRoleCodeTakenError": "角色编码已存在",
        "exception.OrganizationRoleNotFoundError": "角色不存在",
        "exception.OrganizationRoleInUseError": "角色下已有用户，不能删除",
        "exception.OrganizationPermissionDeniedError": "缺少组织管理权限",
        "exception.OrganizationUserNotFoundError": "用户不存在",
        "exception.SampleRecordAlreadyCreatedError": "该寄样申请已生成样品登记，不能重复生成",
        "exception.SampleStockError": "样品库存不足",
        "exception.DocumentNumberConflictError": "单号生成失败，请重试",
        # 模块实体名称
        "entity.finance.fee_payments": "合作方费用付款",
        "entity.finance.misc_fees": "杂费",
        "entity.finance.payments": "付款",
        "entity.finance.port_data": "口岸数据",
        "entity.finance.receipts": "收款",
        "entity.finance.reimbursements": "报销单",
        "entity.finance.settlements": "财务结算",
        "entity.finance.tax_refunds": "退税单据",
        "entity.followup": "跟单任务",
        "entity.masterdata.customers": "客户",
        "entity.masterdata.document_parties": "单证主体",
        "entity.masterdata.partners": "合作方",
        "entity.masterdata.products": "商品",
        "entity.masterdata.suppliers": "供应商",
        "entity.purchase.contracts": "采购合同",
        "entity.purchase.inquiries": "采购询价",
        "entity.purchase.invoice_notices": "采购开票通知",
        "entity.quality.inspections": "QC 任务",
        "entity.sales.contracts": "出口合同",
        "entity.sales.quotations": "出口报价",
        "entity.sales.shipments": "出运计划",
        "entity.sample.deliveries": "寄样单",
        "entity.sample.records": "样品登记",
        "entity.sample.requests": "寄样申请",
        "entity.system.company": "公司信息",
        "entity.system.auth": "组织管理",
        "entity.system.dashboard": "工作台任务",
        "entity.system.files": "文件",
        "entity.system.mcp_settings": "MCP 配置",
        "entity.system.printing": "打印单据",
        "entity.warehouse.inbound_orders": "入库单",
        "entity.warehouse.inbound_plans": "入库计划",
        "entity.warehouse.outbound_orders": "出库单",
        "entity.warehouse.outbound_plans": "出库计划",
        "entity.fallback": "业务资源",
        # 业务通知
        "notification.approval.title": "审批通知",
        "notification.approval.submitted": "{actor} 提交了{entity} {no}，请及时审批",
        "notification.approval.approved": "{actor} 已审批通过{entity} {no}",
        "notification.approval.rejected": "{actor} 驳回了{entity} {no}",
        "notification.approval.rejected_with_reason": "{actor} 驳回了{entity} {no}，原因：{reason}",
        "notification.approval.withdrawn": "{actor} 撤回了{entity} {no}，无需继续审批",
        # 定时提醒
        "notification.qc.title": "QC 查验提醒",
        "notification.qc.due_soon": (
            "QC 任务 {no} 将于 {due} 到期（还剩 {days} 天），请及时安排查验"
        ),
        "notification.qc.overdue": "QC 任务 {no} 已逾期 {days} 天（排期 {due}），请尽快处理",
        "notification.followup.title": "采购跟单提醒",
        "notification.followup.overdue": (
            "采购合同 {no} 的跟单节点「{node}」已逾期 {days} 天，请尽快更新进度"
        ),
        # 校验错误明细
        "validation.required": "为必填项",
        "validation.empty": "不能为空",
        "validation.min_length": "至少填写 {min} 个字符",
        "validation.max_length": "不能超过 {max} 个字符",
        "validation.greater_than": "必须大于 {value}",
        "validation.greater_than_equal": "不能小于 {value}",
        "validation.number": "请输入有效数字",
        "validation.date": "请输入有效日期",
        "validation.format": "格式不正确",
        # 通用错误兜底
        "error.business_data_invalid": "业务数据无效",
        "error.permission_denied": "缺少{entity}权限",
        "error.not_found": "{entity}不存在",
        "error.conflict": "{entity}状态冲突",
        "error.entity_invalid": "{entity}数据无效",
    },
    "en-US": {
        "status.SUCCESS": "Request succeeded",
        "status.CREATED": "Created successfully",
        "status.ACCEPTED": "Request accepted",
        "status.NO_CONTENT": "No content",
        "status.BAD_REQUEST": "Invalid request",
        "status.MISSING_CREDENTIALS": "Missing login credentials",
        "status.INVALID_CREDENTIALS": "Invalid username or password",
        "status.TOKEN_EXPIRED": "Session expired",
        "status.UNAUTHORIZED": "Unauthorized",
        "status.PERMISSION_DENIED": "You do not have permission to perform this action",
        "status.NOT_FOUND": "Resource not found",
        "status.METHOD_NOT_ALLOWED": "Method not allowed",
        "status.CONFLICT": "Resource state conflict",
        "status.VALIDATION_ERROR": "Request validation failed",
        "status.BUSINESS_ERROR": "Business rule not satisfied",
        "status.TOO_MANY_REQUESTS": "Too many requests",
        "status.SERVER_ERROR": "Internal server error",
        "status.SERVICE_UNAVAILABLE": "Service unavailable",
        "status.GATEWAY_TIMEOUT": "Gateway timeout",
        "exception.InvalidCredentialsError": "Invalid username or password",
        "exception.InvalidTokenError": "Session expired",
        "exception.McpDisabledError": "MCP service is disabled",
        "exception.OrganizationDepartmentNameTakenError": "Department name already exists",
        "exception.OrganizationDepartmentNotFoundError": "Department not found",
        "exception.OrganizationDepartmentInUseError": (
            "Department still has users and cannot be deleted"
        ),
        "exception.OrganizationDepartmentRequiredError": "User must belong to a department",
        "exception.OrganizationUsernameTakenError": "Username already exists",
        "exception.OrganizationSelfDeactivateError": "Cannot deactivate the current account",
        "exception.OrganizationSelfDemoteError": (
            "Cannot remove admin permission from the current account"
        ),
        "exception.OrganizationRoleCodeTakenError": "Role code already exists",
        "exception.OrganizationRoleNotFoundError": "Role not found",
        "exception.OrganizationRoleInUseError": "Role still has users and cannot be deleted",
        "exception.OrganizationPermissionDeniedError": (
            "Missing organization management permission"
        ),
        "exception.OrganizationUserNotFoundError": "User not found",
        "exception.SampleRecordAlreadyCreatedError": (
            "A sample record has already been created from this request"
        ),
        "exception.SampleStockError": "Insufficient sample stock",
        "exception.DocumentNumberConflictError": (
            "Failed to generate a unique document number, please retry"
        ),
        "entity.finance.fee_payments": "Partner fee payment",
        "entity.finance.misc_fees": "Miscellaneous fee",
        "entity.finance.payments": "Payment",
        "entity.finance.port_data": "Port data",
        "entity.finance.receipts": "Receipt",
        "entity.finance.reimbursements": "Reimbursement",
        "entity.finance.settlements": "Financial settlement",
        "entity.finance.tax_refunds": "Tax refund document",
        "entity.followup": "Follow-up task",
        "entity.masterdata.customers": "Customer",
        "entity.masterdata.document_parties": "Document party",
        "entity.masterdata.partners": "Partner",
        "entity.masterdata.products": "Product",
        "entity.masterdata.suppliers": "Supplier",
        "entity.purchase.contracts": "Purchase contract",
        "entity.purchase.inquiries": "Purchase inquiry",
        "entity.purchase.invoice_notices": "Purchase invoice notice",
        "entity.quality.inspections": "QC task",
        "entity.sales.contracts": "Export contract",
        "entity.sales.quotations": "Export quotation",
        "entity.sales.shipments": "Shipment plan",
        "entity.sample.deliveries": "Sample delivery",
        "entity.sample.records": "Sample record",
        "entity.sample.requests": "Sample request",
        "entity.system.company": "Company profile",
        "entity.system.auth": "Organization",
        "entity.system.dashboard": "Workbench task",
        "entity.system.files": "File",
        "entity.system.mcp_settings": "MCP settings",
        "entity.system.printing": "Printing document",
        "entity.warehouse.inbound_orders": "Inbound order",
        "entity.warehouse.inbound_plans": "Inbound plan",
        "entity.warehouse.outbound_orders": "Outbound order",
        "entity.warehouse.outbound_plans": "Outbound plan",
        "entity.fallback": "business resource",
        "notification.approval.title": "Approval notification",
        "notification.approval.submitted": "{actor} submitted {entity} {no} for your approval",
        "notification.approval.approved": "{actor} approved {entity} {no}",
        "notification.approval.rejected": "{actor} rejected {entity} {no}",
        "notification.approval.rejected_with_reason": "{actor} rejected {entity} {no}: {reason}",
        "notification.approval.withdrawn": (
            "{actor} withdrew {entity} {no}; no further approval is needed"
        ),
        "notification.qc.title": "QC inspection reminder",
        "notification.qc.due_soon": (
            "QC task {no} is due on {due} ({days} day(s) left); please arrange the inspection"
        ),
        "notification.qc.overdue": (
            "QC task {no} is {days} day(s) overdue (scheduled {due}); please handle it soon"
        ),
        "notification.followup.title": "Purchase follow-up reminder",
        "notification.followup.overdue": (
            "Follow-up node \"{node}\" of purchase contract {no} is {days} day(s) overdue; "
            "please update its progress"
        ),
        "validation.required": "is required",
        "validation.empty": "must not be empty",
        "validation.min_length": "must be at least {min} characters",
        "validation.max_length": "must be at most {max} characters",
        "validation.greater_than": "must be greater than {value}",
        "validation.greater_than_equal": "must be greater than or equal to {value}",
        "validation.number": "must be a valid number",
        "validation.date": "must be a valid date",
        "validation.format": "has an invalid format",
        "error.business_data_invalid": "Invalid business data",
        "error.permission_denied": "Missing permission for {entity}",
        "error.not_found": "{entity} not found",
        "error.conflict": "{entity} state conflict",
        "error.entity_invalid": "Invalid {entity} data",
    },
}


def translate(key: str, language: str | None = None, **params: object) -> str:
    """按语言取文案并填充参数；目标语言缺失时回落中文，再缺失时返回 key。"""
    resolved = language or get_current_language()
    template = MESSAGE_CATALOG.get(resolved, {}).get(key)
    if template is None:
        template = MESSAGE_CATALOG[DEFAULT_LANGUAGE].get(key, key)
    if not params:
        return template
    return template.format(**params)


def status_message_key(code: str) -> str:
    return f"status.{code}"


def localize_labels(labels: list[str], language: str | None = None) -> list[str]:
    """批量渲染导出/打印表头，保持顺序不变。"""
    resolved = language or get_current_language()
    return [localize_message(label, resolved) for label in labels]


def localize_message(text: str, language: str | None = None) -> str:
    """把业务域中文源文案渲染为目标语言；无译文时原样返回。"""
    resolved = language or get_current_language()
    if resolved == DEFAULT_LANGUAGE or resolved not in MESSAGE_CATALOG:
        return text
    stripped = text.strip()
    if not stripped:
        return text

    translated = SOURCE_MESSAGES.get(stripped)
    if translated is not None:
        return translated

    for pattern, template in DYNAMIC_PATTERNS:
        match = pattern.match(stripped)
        if match is None:
            continue
        params = match.groupdict()
        fields = params.get("fields")
        if fields is not None:
            params["fields"] = fields.replace("、", ", ")
        role = params.get("role")
        if role is not None:
            params["role"] = ROLE_NAMES.get(role, role)
        return template.format(**params)
    return text
