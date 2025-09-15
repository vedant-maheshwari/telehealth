# Base image
FROM python:3.11.6

# Set working directory
WORKDIR /app

# Copy requirements first (better for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose FastAPI port
EXPOSE 8000 3000

# Run the app
CMD ["python", "run.py"]
