from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from fastapi.staticfiles import StaticFiles
import os
from app.config.settings import APP_NAME, API_V1_PREFIX, CORS_ORIGINS

from app.models.associations import user_roles, role_permissions

from app.models.auth.permissions import Permission
from app.models.auth.roles import Role
from app.models.auth.users import User
from app.models.organization.areas import Area


from app.api.v1 import api_router

app = FastAPI(
    title=APP_NAME,
    openapi_url=f"{API_V1_PREFIX}/openapi.json",
    docs_url=f"{API_V1_PREFIX}/docs",
    redoc_url=f"{API_V1_PREFIX}/redoc",
)

static_dir = Path("static")
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#API v1
app.include_router(api_router, prefix=API_V1_PREFIX)

@app.get("/")
def root():
    return {"message": "API funcionando. Accede a la documentación en " + API_V1_PREFIX + "/docs"}