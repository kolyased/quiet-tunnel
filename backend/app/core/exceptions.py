class ProviderError(Exception):
    """Base for sanitized provider failures."""


class ProviderUnavailable(ProviderError):
    pass


class ProviderTimeout(ProviderError):
    pass


class InvalidProviderResponse(ProviderError):
    pass


class UnsupportedFormat(ProviderError):
    pass
