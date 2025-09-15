from fastapi import FastAPI
from pydantic import BaseModel
import redis
import json
import hashlib
import sqlite3

app = FastAPI()
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# establish database connection
def get_db_connection():
    """
    The function `get_db_connection` establishes a connection to a SQLite database file named
    `db.sqlite3` and sets the row factory to `sqlite3.Row`.
    :return: A database connection object to the SQLite database 'db.sqlite3' with row factory set to
    sqlite3.Row is being returned.
    """
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    return conn

# set up database
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DROP TABLE IF EXISTS users')
    cursor.execute(""" 
CREATE TABLE IF NOT EXISTS users(
                   id int PRIMARY KEY,
                   name varchar(50),
                   age int
                   )
""")
    cursor.execute("INSERT INTO users (id, name, age) VALUES (1, 'vedant', 20)")
    cursor.execute("INSERT INTO users (id, name, age) VALUES (2, 'akash', 19)")
    cursor.execute("INSERT INTO users (id, name, age) VALUES (3, 'waibhav', 19)")

    conn.commit()
    conn.close()

init_db()

class UserQuery(BaseModel):
    user_id : int

def make_cache_key(user_id : int):
    """
    The function `make_cache_key` generates a SHA-256 hash key based on a user ID.
    
    :param user_id: The `user_id` parameter is an integer value representing the unique identifier of a
    user
    :type user_id: int
    :return: The function `make_cache_key` returns the SHA-256 hash digest of the string "user :
    {user_id}" where `{user_id}` is the integer value passed as the argument to the function.
    """
    raw = f'user : {user_id}'
    return hashlib.sha256(raw.encode()).hexdigest()

@app.post('/get_user')
def get_user(query : UserQuery):
    cache_key = make_cache_key(query.user_id)

    cache_data = redis_client.get(cache_key)

    if cache_data:
        print("serving data from Redis")
        return json.loads(cache_data)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (query.user_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return {'message' : 'user not found'}
    
    result = {'id' : row['id'], 'name' : row['name'], 'age' : row['age']}
    redis_client.setex(cache_key,3600,json.dumps(result))

    print('fetching data from DB and caching')
    return result

