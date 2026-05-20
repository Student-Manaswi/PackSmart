import os
from pathlib import Path
from huggingface_hub import hf_hub_download


def ensure_hf_file(repo_id: str, filename: str) -> Path:
    """Download a single file from a Hugging Face repo and return local path.

    This uses the HF cache so repeated calls are cheap.
    """
    if not repo_id or not filename:
        raise ValueError("repo_id and filename must be set")
    try:
        path = hf_hub_download(repo_id=repo_id, filename=filename)
        return Path(path)
    except Exception:
        raise
