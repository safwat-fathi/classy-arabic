class ToolUnavailableError(Exception):
    """Raised by a tool handler whose backing service does not exist yet."""


class ActionArgumentError(Exception):
    """Raised by a handler when an argument fails a check the validator
    can't express generically."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(", ".join(errors))
