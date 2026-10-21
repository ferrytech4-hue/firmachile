import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FirmaDigital Chile API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos PostgreSQL
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "firmadigital_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Seguridad JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_jwt_key_firmadigital_chile_2026_x7842")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 horas

    # Almacenamiento S3 / MinIO
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "minioadmin")
    S3_BUCKET_DOCUMENTS: str = "firmadigital-documents-private"

    # Legislación y Firma
    TIMEZONE_CLT: str = "America/Santiago"
    LEGAL_NOTICE_LEY_19799: str = (
        "Documento suscrito mediante Firma Electrónica Simple conforme a la Ley N° 19.799 "
        "y doctrina uniforme de la Dirección del Trabajo de Chile."
    )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
