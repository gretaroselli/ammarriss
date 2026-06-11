from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .controllers import admin_controller
from .controllers import kiosk_controller

app = FastAPI()



# Cors
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(kiosk_controller.router)
app.include_router(admin_controller.router)


