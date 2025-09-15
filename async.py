import time
import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI()

# -------------------------------
# Blocking endpoint (bad example)
# -------------------------------
@app.get("/weather-blocking")
def weather_blocking():
    print("START blocking request")
    response = httpx.get("https://jsonplaceholder.typicode.com/posts/1")  # blocking
    print("END blocking request")
    return response.json()

# -------------------------------
# Async endpoint (good example)
# -------------------------------
@app.get("/weather-async")
async def weather_async():
    print("START async request")
    async with httpx.AsyncClient() as client:
        response = await client.get("https://jsonplaceholder.typicode.com/posts/1")
    print("END async request")
    return response.json()

# -------------------------------
# Fake "slow" endpoints for testing
# -------------------------------
@app.get("/slow-blocking")
def slow_blocking():
    print("START blocking sleep")
    time.sleep(3)  # blocks everything
    print("END blocking sleep")
    return {"msg": "done blocking"}

@app.get("/slow-async")
async def slow_async():
    print("START async sleep")
    await asyncio.sleep(3)  # non-blocking sleep
    print("END async sleep")
    return {"msg": "done async"}
