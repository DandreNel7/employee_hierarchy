"""Photo storage in S3."""

import uuid

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.config import settings

ALLOWED_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_UPLOAD_BYTES = 2 * 1024 * 1024
UPLOAD_EXPIRY_SECONDS = 300
VIEW_EXPIRY_SECONDS = 3600

_client = None


def is_enabled() -> bool:
    return bool(settings.s3_bucket)


def client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            endpoint_url=settings.s3_endpoint_url or None,
            aws_access_key_id=settings.s3_access_key or None,
            aws_secret_access_key=settings.s3_secret_key or None,
            config=Config(signature_version="s3v4"),
        )
    return _client


def build_key(employee_id: int, content_type: str) -> str:
    extension = ALLOWED_TYPES[content_type]
    return f"avatars/{employee_id}/{uuid.uuid4().hex}.{extension}"


def upload_form(key: str, content_type: str) -> dict:
    """A one-off form the browser posts the file to, limited by type and size."""
    return client().generate_presigned_post(
        Bucket=settings.s3_bucket,
        Key=key,
        Fields={"Content-Type": content_type},
        Conditions=[
            {"Content-Type": content_type},
            ["content-length-range", 1, MAX_UPLOAD_BYTES],
        ],
        ExpiresIn=UPLOAD_EXPIRY_SECONDS,
    )


def view_url(key: str) -> str | None:
    if not is_enabled():
        return None
    try:
        return client().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket, "Key": key},
            ExpiresIn=VIEW_EXPIRY_SECONDS,
        )
    except (BotoCoreError, ClientError):
        return None


def delete(key: str) -> None:
    try:
        client().delete_object(Bucket=settings.s3_bucket, Key=key)
    except (BotoCoreError, ClientError):
        pass
