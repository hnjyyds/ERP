class DocumentStatusConflictError(Exception):
    """单据在并发操作下状态已变化，调用方应刷新后重试。"""

    def __init__(self) -> None:
        super().__init__("单据状态已变化，请刷新后重试")
