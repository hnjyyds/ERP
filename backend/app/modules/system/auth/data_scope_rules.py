# 纯规则模块：无内部依赖，是 data_scope 类型、默认值与优先级的唯一事实源。
from typing import Literal

DataScope = Literal["self", "department", "department_tree", "all"]

DEFAULT_DATA_SCOPE: DataScope = "self"

# 数据范围由宽到窄的优先级，多角色取最宽松值。
DATA_SCOPE_RANK: dict[str, int] = {
    "all": 3,
    "department_tree": 2,
    "department": 1,
    "self": 0,
}


def widest_data_scope(scopes: list[str]) -> str:
    """从多个角色的数据范围中取最宽松的一个。"""
    widest: str = DEFAULT_DATA_SCOPE
    for scope in scopes:
        if DATA_SCOPE_RANK.get(scope, -1) > DATA_SCOPE_RANK[widest]:
            widest = scope
    return widest
