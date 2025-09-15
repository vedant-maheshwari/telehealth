import redis

r = redis.Redis(host='localhost', port=6379, db=0)

try :
    if r.ping():
        print('Connected to Redis')

except redis.ConnectionError:
    print('Redis Connection Failed')


r.set('FastAPI','Hello')
value = r.get('FastAPI')
print(f'Value retrived {value.decode()}')