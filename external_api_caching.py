from fastapi import FastAPI
from pydantic import BaseModel
import json
import hashlib
import httpx
import redis

app = FastAPI()
redis_client = redis.Redis(host='localhost', port=6379, db=0)

class PostRequest(BaseModel):
    post_id : int

def make_cache_key(post_id : int):
    raw = f'external_api:post_{post_id}'
    return hashlib.sha256(raw.encode()).hexdigest()

@app.post('/get_post')
async def get_post(data : PostRequest):
    cache_key = make_cache_key(data.post_id)

    result = redis_client.get(cache_key)
    if result:
        print('serving form redis')
        return json.loads(result)
    
    print('calling external api')
    async with httpx.AsyncClient() as Client:
        response = await Client.get(f'https://jsonplaceholder.typicode.com/posts/{data.post_id}')
        if response.status_code != 200 :
            return {'error' : 'post not found'}
        
    post_data = response.json()
    redis_client.setex(cache_key, 600, json.dumps(post_data))
    print('fetched and storing data in redis')
    return post_data