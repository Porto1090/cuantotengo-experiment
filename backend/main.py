from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from aggregator import aggregate_experiment_data
from fastapi.responses import JSONResponse

app = FastAPI()

# Permitir llamadas desde React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello World"}

@app.get("/api/dashboard")
def get_survey_data():
  data = aggregate_experiment_data()
  safe_data = sanitize(data)
  return JSONResponse(content=safe_data)

import math

def sanitize(obj):
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize(i) for i in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return 0
    else:
        return obj
