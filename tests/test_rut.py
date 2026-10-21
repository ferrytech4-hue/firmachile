import pytest
from backend.app.rut_validator import validate_rut, format_rut, clean_rut, calculate_dv

def test_rut_modulo_11_calculation():
    # Casos reales de prueba chilenos
    assert calculate_dv("16482903") == "7"
    assert calculate_dv("17391042") == "4"
    assert calculate_dv("18910223") == "K"
    assert calculate_dv("15719820") == "2"
    assert calculate_dv("76842190") == "K"

def test_validate_rut_valid_cases():
    assert validate_rut("16.482.903-7") is True
    assert validate_rut("16482903-7") is True
    assert validate_rut("164829037") is True
    assert validate_rut("18.910.223-K") is True
    assert validate_rut("18910223-k") is True
    assert validate_rut("76.842.190-K") is True  # RUT Empresa

def test_validate_rut_invalid_cases():
    assert validate_rut("16.482.903-9") is False # DV erróneo
    assert validate_rut("18.910.223-4") is False
    assert validate_rut("12345") is False        # Demasiado corto
    assert validate_rut("") is False
    assert validate_rut("abc-x") is False

def test_format_rut():
    assert format_rut("164829037") == "16.482.903-7"
    assert format_rut("18910223k") == "18.910.223-K"
    assert format_rut("76842190K") == "76.842.190-K"
