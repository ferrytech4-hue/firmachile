# Especificación de Integración de Firma Electrónica Avanzada (FEA)

## 1. Alcance y Marco Regulatorio
En Chile, la **Firma Electrónica Avanzada (FEA)** se encuentra regulada por el Artículo 2° letra f) de la Ley N° 19.799 y requiere que el certificado sea emitido por un prestador acreditado ante la Subsecretaría de Economía y Empresas de Menor Tamaño (ej: Acepta, E-Sign, Certinet, Tok清, IDOK).

> **Aviso de Integridad (Directiva de Diseño)**:
> El sistema no simula firmas avanzadas falsas ni expone la opción como operativa hasta que la entidad acreditada complete la conexión criptográfica real. En la Fase 1 opera la Firma Simple (FES) y se provee la interfaz desacoplada para la conexión FEA.

## 2. Interfaz Desacoplada de Proveedor (`FEAProviderInterface`)

```python
from abc import ABC, abstractmethod
from typing import Dict, Any

class FEAProviderInterface(ABC):
    @abstractmethod
    def initiate_signing_session(self, document_hash: str, signer_rut: str, callback_url: str) -> Dict[str, Any]:
        """Inicia sesión con el prestador acreditado en Chile."""
        pass

    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature_header: str) -> bool:
        """Verifica la firma criptográfica del webhook enviado por el prestador."""
        pass

    @abstractmethod
    def retrieve_signed_certificate_package(self, transaction_id: str) -> Dict[str, Any]:
        """Obtiene el paquete PKCS#7 / PAdES y el certificado X.509 de la firma."""
        pass
```

## 3. Seguridad de Claves Criptográficas
* **Principio de Clave Cero en Base de Datos**: Nunca se almacenan claves privadas ni credenciales de segundo factor (OTP/ClaveÚnica) del firmante en la base de datos de FirmaDigital Chile.
* La autenticación biométrica o cédula electrónica es realizada directamente en la pasarela segura del prestador acreditado.
* Solo se conserva la referencia de transacción, el certificado público de la cadena de confianza y el sello PAdES en el PDF resultante.
