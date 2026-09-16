from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    cookie_secure: bool = True
    aws_region: str = "eu-west-1"
    s3_bucket: str = ""


settings = Settings()
