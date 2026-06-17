from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .controllers import admin_controller
from .controllers import kiosk_controller

app = FastAPI()


app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/admin")
async def get_admin():
    return FileResponse("static/admin/index.html")

@app.get("/kiosk")
async def get_kiosk():
    return FileResponse("static/kiosk/html/index.html")

@app.get("/")
async def get_admin():
    return FileResponse("static/admin/index.html")



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


