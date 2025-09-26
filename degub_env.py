# Create a file called debug_env.py
import os
from dotenv import load_dotenv

load_dotenv()

print("DATABASE_URL:", os.getenv("DATABASE_URL"))
print("Current working directory:", os.getcwd())
print("Files in current directory:", os.listdir("."))

# Check if .env file exists
if os.path.exists(".env"):
    print("\n.env file contents:")
    with open(".env", "r") as f:
        print(f.read())
else:
    print("\n.env file not found!")
