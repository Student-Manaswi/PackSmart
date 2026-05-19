import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import DevelopmentConfig
from typing import Optional

# Import your pipeline
from pipeline import run_detection_pipeline, run_packaging_pipeline

# Import model loading functions
from modules.detection import load_model
from modules.material import load_material_model

# ---------------- GLOBAL FASTAPI APP ----------------
app = FastAPI(title="SmartPack AI Backend")

# ---------------- ENABLE CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("outputs", exist_ok=True)
os.makedirs("uploaded_images", exist_ok=True)

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# ---------------- HELPER FUNCTION ----------------
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in DevelopmentConfig.ALLOWED_EXTENSIONS


# ---------------- STARTUP EVENT (LOAD MODELS ONCE) ----------------
@app.on_event("startup")
def load_models():
    print("Loading Detection Model...")
    try:
        load_model()
    except Exception as e:
        print(f"[WARNING] Could not load detection weights: {e}")

    print("Loading Material Model...")
    try:
        load_material_model()
    except Exception as e:
        print(f"[WARNING] Could not load material weights: {e}")

    print("All models loaded successfully!")


# ---------------- ROOT ENDPOINT ----------------
@app.get("/")
def health_check():
    return {
        "status": "running",
        "message": "SmartPack AI Backend is online!"
    }


# ---------------- STAGE 1: DETECTION ENDPOINT ----------------
@app.post("/api/analyze")
async def analyze_package(
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
    upload_folder = DevelopmentConfig.UPLOAD_FOLDER
    os.makedirs(upload_folder, exist_ok=True)

    front_path = os.path.join(upload_folder, front_image.filename)
    top_path = os.path.join(upload_folder, top_image.filename)

    with open(front_path, "wb") as buffer:
        buffer.write(await front_image.read())

    with open(top_path, "wb") as buffer:
        buffer.write(await top_image.read())

    try:
        # 4️⃣ Run detection pipeline (Stage 1 only)
        result = run_detection_pipeline(front_path, top_path, real_width_cm)

        # 5️⃣ Clean up temp uploaded files
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