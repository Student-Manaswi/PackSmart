import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "a_fallback_secret_key_for_dev")
APP_ENV = os.environ.get("APP_ENV", "development")
API_HOST = os.environ.get("API_HOST", "0.0.0.0")
API_PORT = int(os.environ.get("API_PORT", "8000"))

UPLOAD_FOLDER = Path(os.environ.get("UPLOAD_FOLDER", str(BASE_DIR / "uploaded_images")))
OUTPUT_FOLDER = Path(os.environ.get("OUTPUT_FOLDER", str(BASE_DIR / "outputs")))
MODEL_STORAGE_DIR = Path(os.environ.get("MODEL_STORAGE_DIR", str(BASE_DIR / "models")))
OBJECT_CATEGORY_PATH = os.environ.get(
    "OBJECT_CATEGORY_PATH",
    str(BASE_DIR / "data" / "object_categories.json"),
)

ALLOWED_EXTENSIONS = set(
    os.environ.get("ALLOWED_EXTENSIONS", "png,jpg,jpeg,gif").split(",")
)
MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))

CORS_ALLOW_ORIGINS = [origin.strip() for origin in os.environ.get("CORS_ALLOW_ORIGINS", "*").split(",")]
CORS_ALLOW_METHODS = [method.strip() for method in os.environ.get("CORS_ALLOW_METHODS", "*").split(",")]
CORS_ALLOW_HEADERS = [header.strip() for header in os.environ.get("CORS_ALLOW_HEADERS", "*").split(",")]

DETECTION_MODEL_SOURCE = os.environ.get("DETECTION_MODEL_SOURCE")
DETECTION_MODEL_FILENAME = os.environ.get("DETECTION_MODEL_FILENAME", "best.pt")
MATERIAL_MODEL_SOURCE = os.environ.get("MATERIAL_MODEL_SOURCE")
MATERIAL_MODEL_FILENAME = os.environ.get("MATERIAL_MODEL_FILENAME", "efficientnetb4_best_model.pth")
HUGGINGFACE_TOKEN = os.environ.get("HUGGINGFACE_TOKEN")
