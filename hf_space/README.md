PackSmart - HF Space microservice

This folder contains a minimal FastAPI app that exposes `/api/analyze`.

Setup:

- Set the following environment variables in your Space:
  - `YOLO_HF_REPO` - e.g. "username/yolo-repo"
  - `YOLO_HF_FILENAME` - weight filename (default: "best.pt")
  - `EFF_HF_REPO` - e.g. "username/efficientnet-repo"
  - `EFF_HF_FILENAME` - checkpoint filename (default: "efficientnet_b4.pth")
  - `CLASSES_HF_REPO` - optional repo for `classes.txt`
  - `CLASSES_HF_FILENAME` - filename for classes (default: "classes.txt")

Build & run locally (example):

```bash
docker build -t packsmart-hfspace .
docker run -p 7860:7860 -e YOLO_HF_REPO=owner/repo -e EFF_HF_REPO=owner/repo packsmart-hfspace
```
