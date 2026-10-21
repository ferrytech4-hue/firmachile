import re

def clean_rut(rut: str) -> str:
    """Elimina puntos, guiones y espacios, dejando sólo dígitos y K."""
    if not rut:
        return ""
    return re.sub(r"[^0-9kK]", "", str(rut)).upper()

def calculate_dv(rut_body: str) -> str:
    """Calcula el dígito verificador para un cuerpo de RUT dado según Módulo 11."""
    clean_body = re.sub(r"[^0-9]", "", str(rut_body))
    if not clean_body:
        return ""

    s = 0
    multiplier = 2
    for char in reversed(clean_body):
        s += int(char) * multiplier
        multiplier = 2 if multiplier == 7 else multiplier + 1

    remainder = 11 - (s % 11)
    if remainder == 11:
        return "0"
    if remainder == 10:
        return "K"
    return str(remainder)

def validate_rut(full_rut: str) -> bool:
    """Verifica si un RUT chileno completo es matemáticamente válido."""
    if not full_rut or not isinstance(full_rut, str):
        return False

    cleaned = clean_rut(full_rut)
    if len(cleaned) < 8 or len(cleaned) > 9:
        return False

    body = cleaned[:-1]
    dv = cleaned[-1]

    if not body.isdigit():
        return False

    expected_dv = calculate_dv(body)
    return dv == expected_dv

def format_rut(rut: str) -> str:
    """Formatea un RUT a estándar chileno: 12.345.678-K."""
    cleaned = clean_rut(rut)
    if len(cleaned) < 2:
        return cleaned

    body = cleaned[:-1]
    dv = cleaned[-1]

    formatted_body = ""
    count = 0
    for char in reversed(body):
        formatted_body = char + formatted_body
        count += 1
        if count % 3 == 0 and len(formatted_body) < len(body) + (len(body) - 1) // 3:
            formatted_body = "." + formatted_body

    return f"{formatted_body}-{dv}"
