import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional

from config import (
    ALLOWED_EXTENSIONS,
    CORS_ALLOW_HEADERS,
    CORS_ALLOW_METHODS,
    CORS_ALLOW_ORIGINS,
    OUTPUT_FOLDER,
    UPLOAD_FOLDER,
)

# Import your pipeline
from pipeline import run_detection_pipeline, run_packaging_pipeline

# ---------------- GLOBAL FASTAPI APP ----------------
app = FastAPI(title="SmartPack AI Backend")

# ---------------- ENABLE CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
)

os.makedirs(str(OUTPUT_FOLDER), exist_ok=True)
os.makedirs(str(UPLOAD_FOLDER), exist_ok=True)

app.mount("/outputs", StaticFiles(directory=str(OUTPUT_FOLDER)), name="outputs")

# ---------------- HELPER FUNCTION ----------------
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------- ROOT ENDPOINT ----------------
@app.get("/")
def root_status():
    return {
        "status": "running",
        "message": "SmartPack AI Backend is online!"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Backend health check passed.",
    }


# ---------------- STAGE 1: DETECTION ENDPOINT ----------------
@app.post("/api/analyze")
async def analyze_package(
    request: Request,
    front_image: UploadFile = File(...),
    top_image: UploadFile = File(...),
    real_width_cm: float = Form(...)
):
    # 1️⃣ Validate file types
    if not allowed_file(front_image.filename):
        raise HTTPException(status_code=400, detail="Front image file type not allowed.")

    if not allowed_file(top_image.filename):
        raise HTTPException(status_code=400, detail="Top image file type not allowed.")

    # 2️⃣ Validate real width
    if real_width_cm <= 0:
        raise HTTPException(status_code=400, detail="Real width must be greater than zero.")

    # 3️⃣ Save uploaded files temporarily
    upload_folder = UPLOAD_FOLDER
    os.makedirs(str(upload_folder), exist_ok=True)

    front_path = os.path.join(upload_folder, front_image.filename)
    top_path = os.path.join(upload_folder, top_image.filename)

    with open(front_path, "wb") as buffer:
        buffer.write(await front_image.read())

    with open(top_path, "wb") as buffer:
        buffer.write(await top_image.read())

    try:
        # 4️⃣ Run detection pipeline (Stage 1 only)
        result = run_detection_pipeline(front_path, top_path, real_width_cm)

        # 5️⃣ Build public URL for the saved annotated image (if present)
        if result.get("bbox_image_path"):
            image_name = os.path.basename(result["bbox_image_path"])
            try:
                result["bbox_image_url"] = request.url_for("outputs", path=image_name)
            except Exception:
                result["bbox_image_url"] = str(request.base_url).rstrip("/") + f"/outputs/{image_name}"

        # 6️⃣ Clean up temp uploaded files
        if os.path.exists(front_path):
            os.remove(front_path)
        if os.path.exists(top_path):
            os.remove(top_path)

        return {"status": "success", "data": result}

    except Exception as e:
        if os.path.exists(front_path):
            os.remove(front_path)
        if os.path.exists(top_path):
            os.remove(top_path)

        raise HTTPException(status_code=500, detail=f"Internal server error in Stage 1: {str(e)}")


# ---------------- STAGE 2: PACKAGING ENDPOINT ----------------
@app.post("/api/packaging")
async def generate_packaging(payload: dict):
    try:
        # Fixed Key names to match exactly what run_detection_pipeline returns
        # Checks both "material" and "material_data" fallback just in case
        material_data    = payload.get("material") or payload.get("material_data")
        real_dimensions  = payload.get("real_dimensions")
        estimated_weight = payload.get("estimated_weight", 0)
        real_weight      = payload.get("real_weight")

        if not material_data or not real_dimensions:
            raise HTTPException(
                status_code=400, 
                detail="Missing structural components: 'material' or 'real_dimensions' missing from payload data."
            )

        # Use real weight if provided and valid, otherwise fall back to estimated
        final_weight = real_weight if real_weight and real_weight > 0 else estimated_weight

        # Run Stage 2 Packaging recommendations & Bill of Materials
        result = run_packaging_pipeline(material_data, real_dimensions, final_weight)

        return {"status": "success", "data": result}

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required payload fields: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error in Stage 2: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
