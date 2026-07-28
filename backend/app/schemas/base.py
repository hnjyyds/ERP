"""Pydantic schema base with a stable OpenAPI description contract.

Business schemas may still provide a more specific ``Field(description=...)``.
When they do not, this base derives a concise Chinese description from the field
name so generated OpenAPI and MCP metadata never expose undocumented fields.
"""

import re

from pydantic import BaseModel as PydanticBaseModel

_EXACT_DESCRIPTIONS = {
    "id": "唯一标识",
    "code": "业务编码",
    "name": "名称",
    "type": "类型",
    "status": "状态",
    "remark": "备注",
    "message": "提示消息",
    "success": "请求是否成功",
    "data": "响应数据",
    "error": "错误详情",
    "items": "数据项列表",
    "total": "数据总数",
    "currency": "币种",
    "unit": "计量单位",
    "quantity": "数量",
    "amount": "金额",
    "description": "说明",
    "created_at": "创建时间",
    "updated_at": "更新时间",
    "created_by": "创建人",
    "updated_by": "更新人",
}

_TOKEN_LABELS = {
    "access": "访问",
    "active": "启用",
    "actual": "实际",
    "address": "地址",
    "allocation": "分摊",
    "applicant": "申请人",
    "approval": "审批",
    "approved": "已审批",
    "assignee": "负责人",
    "attachment": "附件",
    "avatar": "头像",
    "bank": "银行",
    "batch": "批次",
    "category": "分类",
    "company": "公司",
    "contact": "联系人",
    "contract": "合同",
    "created": "创建",
    "customer": "客户",
    "customs": "海关",
    "date": "日期",
    "department": "部门",
    "detail": "明细",
    "display": "显示",
    "document": "单据",
    "due": "到期",
    "email": "邮箱",
    "enabled": "是否启用",
    "end": "结束",
    "english": "英文",
    "export": "出口",
    "fee": "费用",
    "file": "文件",
    "followup": "跟单",
    "goods": "货物",
    "import": "导入",
    "inbound": "入库",
    "inspection": "查验",
    "invoice": "发票",
    "issue": "异常问题",
    "language": "语言",
    "line": "明细行",
    "location": "库位",
    "login": "登录",
    "menu": "菜单",
    "mobile": "手机号",
    "node": "节点",
    "order": "订单",
    "organization": "组织",
    "outbound": "出库",
    "owner": "负责人",
    "partner": "合作方",
    "password": "密码",
    "payment": "付款",
    "permission": "权限",
    "phone": "电话",
    "plan": "计划",
    "product": "商品",
    "purchase": "采购",
    "quality": "质量",
    "quotation": "报价",
    "receipt": "收款",
    "refund": "退款",
    "request": "申请",
    "result": "结果",
    "role": "角色",
    "sales": "销售",
    "scheduled": "排期",
    "shipment": "出运",
    "source": "来源",
    "start": "开始",
    "supplier": "供应商",
    "tax": "退税",
    "template": "模板",
    "token": "令牌",
    "updated": "更新",
    "upload": "上传",
    "user": "用户",
    "username": "用户名",
    "verification": "核销",
    "warehouse": "仓库",
}

_SUFFIX_LABELS = {
    "id": "唯一标识",
    "ids": "唯一标识列表",
    "no": "编号",
    "name": "名称",
    "code": "编码",
    "status": "状态",
    "type": "类型",
    "date": "日期",
    "at": "时间",
    "amount": "金额",
    "rate": "比率",
    "count": "数量",
    "total": "合计",
    "url": "链接",
    "path": "路径",
}


def _field_description(field_name: str) -> str:
    exact = _EXACT_DESCRIPTIONS.get(field_name)
    if exact is not None:
        return exact

    parts = [part for part in re.split(r"_+", field_name) if part]
    prefix_parts = parts
    suffix = ""
    if parts and parts[-1] in _SUFFIX_LABELS:
        prefix_parts = parts[:-1]
        suffix = _SUFFIX_LABELS[parts[-1]]

    prefix = "".join(_TOKEN_LABELS.get(part, part) for part in prefix_parts)
    if prefix or suffix:
        return f"{prefix}{suffix}"
    return f"{field_name} 字段"


class BaseModel(PydanticBaseModel):
    """Project schema base that guarantees OpenAPI field descriptions."""

    @classmethod
    def __pydantic_init_subclass__(cls, **kwargs: object) -> None:
        super().__pydantic_init_subclass__(**kwargs)
        changed = False
        for field_name, field in cls.model_fields.items():
            if field.description is None or not field.description.strip():
                field.description = _field_description(field_name)
                changed = True
        if changed:
            # Pydantic builds the core schema before this hook. Rebuild once so
            # the derived descriptions are also present in generated OpenAPI.
            cls.model_rebuild(force=True)
