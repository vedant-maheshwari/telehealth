# Use official Python base image
FROM python:3.11.6

# Set working directory inside container
WORKDIR /app

# Copy and install dependencies (better cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source code including frontend static files
COPY . .

# Expose only one port (FastAPI server port)
EXPOSE 8000

# Run FastAPI via Uvicorn on port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
