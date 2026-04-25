import os, uuid, shutil

BASE_DIR = "./storage/docs"

def save_pdf(user_id: int, file) -> str:
    os.makedirs(f"{BASE_DIR}/{user_id}", exist_ok=True)
    ext = os.path.splitext(file.filename)[1].lower()
    name = f"{uuid.uuid4().hex}{ext}"
    path = f"{BASE_DIR}/{user_id}/{name}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return path

def delete_file(path: str):
    try:
        os.remove(path)
    except FileNotFoundError:
        pass