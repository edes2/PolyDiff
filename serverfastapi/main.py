import argparse
import os

import uvicorn
from config.deployment import DEV, ENV, PROD
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.route import router
from sockets import sio_app

app = FastAPI()
app.add_middleware(CORSMiddleware,
                   allow_origins=['*'],
                   allow_credentials=True,
                   allow_methods=['*'],
                   allow_headers=['*']
                   )

app.mount("/ws", sio_app)

app.include_router(router)


@app.get('/')
async def home():
    return {'message': 'Welcome!'}

if __name__ == '__main__':
    os.environ[ENV] = os.environ.get(ENV, DEV)

    print(f"Running in {os.environ[ENV]} mode")

    uvicorn.run('main:app', reload=True)
