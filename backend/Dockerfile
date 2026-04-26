FROM python:3.11-slim

WORKDIR /app

# system deps (some libs may be required by sentence-transformers/torch)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# create storage dir inside container
RUN mkdir -p /app/storage /app/storage/docs /app/storage/chroma

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]