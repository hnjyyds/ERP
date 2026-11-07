class DocumentNumberConflictError(Exception):
    """随机单号在重试上限内仍与既有单号冲突。"""
