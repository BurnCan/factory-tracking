from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routers import containers, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Factory Tracking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(containers.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Factory Tracking API running"}
