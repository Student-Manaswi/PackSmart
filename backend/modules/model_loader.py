import os
import re
import shutil
from pathlib import Path
from typing import Optional

import requests
from huggingface_hub import hf_hub_download

from config import MODEL_STORAGE_DIR, HUGGINGFACE_TOKEN

MODEL_STORAGE_DIR = Path(MODEL_STORAGE_DIR)
MODEL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def ensure_local_model_file(source: Optional[str], filename: str) -> Path:
    if not filename:
        raise ValueError("Model filename must be specified.")

    local_path = MODEL_STORAGE_DIR / filename
    local_path.parent.mkdir(parents=True, exist_ok=True)

    if local_path.exists():
        return local_path

    if not source:
        raise FileNotFoundError(
            f"Model file '{local_path}' was not found locally and no source is configured. "
            "Set DETECTION_MODEL_SOURCE or MATERIAL_MODEL_SOURCE in the environment."
        )

    if source.startswith("hf://") or "huggingface.co" in source:
        return download_huggingface_model(source, filename, local_path)

    if source.startswith("gdrive://") or "drive.google.com" in source or "docs.google.com" in source:
        return download_gdrive_model(source, local_path)

    return download_public_url(source, local_path)


def download_huggingface_model(source: str, filename: str, local_path: Path) -> Path:
    repo_id, hf_filename = parse_hf_source(source, filename)
    local_path.parent.mkdir(parents=True, exist_ok=True)

    cached_path = Path(
        hf_hub_download(
            repo_id=repo_id,
            filename=hf_filename,
            repo_type="model",
            token=HUGGINGFACE_TOKEN,
            cache_dir=str(MODEL_STORAGE_DIR),
        )
    )

    if cached_path != local_path:
        shutil.copyfile(cached_path, local_path)

    return local_path


def parse_hf_source(source: str, default_filename: str) -> tuple[str, str]:
    if source.startswith("hf://"):
        source = source[5:]

    if source.startswith("https://huggingface.co/"):
        source = source[len("https://huggingface.co/"):]

    source = source.strip("/")

    if "/resolve/" in source:
        repo_id, tail = source.split("/resolve/", 1)
        if "/" in tail:
            _, file_path = tail.split("/", 1)
            return repo_id, file_path
        return repo_id, default_filename

    if source.count("/") >= 2 and source.endswith(default_filename):
        parts = source.split("/")
        repo_id = "/".join(parts[:2])
        file_path = "/".join(parts[2:])
        return repo_id, file_path

    return source, default_filename


def download_gdrive_model(source: str, local_path: Path) -> Path:
    file_id = parse_gdrive_file_id(source)
    url = "https://docs.google.com/uc?export=download"

    session = requests.Session()
    response = session.get(url, params={"id": file_id}, stream=True)
    token = get_confirm_token(response)

    if token:
        response = session.get(url, params={"id": file_id, "confirm": token}, stream=True)

    save_response_content(response, local_path)
    return local_path


def parse_gdrive_file_id(source: str) -> str:
    if source.startswith("gdrive://"):
        return source[len("gdrive://") :]

    match = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", source)
    if match:
        return match.group(1)

    match = re.search(r"/d/([a-zA-Z0-9_-]+)", source)
    if match:
        return match.group(1)

    raise ValueError("Could not parse a Google Drive file ID from the provided source URL.")


def get_confirm_token(response: requests.Response) -> Optional[str]:
    for key, value in response.cookies.items():
        if key.startswith("download_warning"):
            return value

    match = re.search(r"confirm=([0-9A-Za-z_]+)", response.text)
    return match.group(1) if match else None


def download_public_url(source: str, local_path: Path) -> Path:
    response = requests.get(source, stream=True, timeout=120)
    response.raise_for_status()
    save_response_content(response, local_path)
    return local_path


def save_response_content(response: requests.Response, destination: Path) -> None:
    CHUNK_SIZE = 32768
    with open(destination, "wb") as file:
        for chunk in response.iter_content(CHUNK_SIZE):
            if chunk:
                file.write(chunk)
