FROM python:3.10-slim
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app
EXPOSE 7860

ENV PORT=7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
