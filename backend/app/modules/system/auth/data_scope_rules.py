# 纯规则模块：无内部依赖，供 repository 与 resolver 共用，避免循环导入。

# 数据范围由宽到窄的优先级，多角色取最宽松值。
DATA_SCOPE_RANK: dict[str, int] = {
    "all": 3,
    "department_tree": 2,
    "department": 1,
    "self": 0,
}

DEFAULT_DATA_SCOPE = "self"

DATA_SCOPE_VALUES = ("self", "department", "department_tree", "all")


def widest_data_scope(scopes: list[str]) -> str:
    """从多个角色的数据范围中取最宽松的一个。"""
    widest = DEFAULT_DATA_SCOPE
    for scope in scopes:
        if DATA_SCOPE_RANK.get(scope, -1) > DATA_SCOPE_RANK.get(widest, -1):
            widest = scope
    return widest
