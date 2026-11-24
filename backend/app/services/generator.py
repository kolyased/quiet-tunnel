from pydantic import ValidationError

from ..core.exceptions import InvalidProviderResponse, ProviderUnavailable, UnsupportedFormat
from ..providers.base import VPNProvider
from ..providers.models import ConnectionParameters, GenerationResponse, RegistrationRequest


async def generate_configuration(
    provider: VPNProvider | None,
    mode: str,
    request: RegistrationRequest,
) -> GenerationResponse:
    if provider is None:
        raise ProviderUnavailable("VPN generation is disabled.")

    availability = await provider.availability()
    if not availability.available:
        raise ProviderUnavailable(availability.reason or "Provider is unavailable.")
    if request.format not in availability.formats:
        raise UnsupportedFormat(f"Provider does not support {request.format}.")

    try:
        raw_parameters = await provider.register(request)
        parameters = ConnectionParameters.model_validate(raw_parameters)
    except ValidationError as exc:
        raise InvalidProviderResponse("Provider returned invalid connection parameters.") from exc
    except ProviderUnavailable:
        raise

    return GenerationResponse(
        mode=mode,
        provider=provider.name,
        format=request.format,
        parameters=parameters,
        notice=("Mock profile only. Reserved test addresses cannot establish a VPN." if mode == "mock" else None),
    )
