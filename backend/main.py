import json
import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from aggregator import aggregate_experiment_data
from sanitizer import sanitize

CACHE_FILE = "dashboard_cache.json"
UPDATE_INTERVAL_SECONDS = 300

async def update_data_task():
    while True:
        try:
            print("""---------------\nIniciando extracción de datos de Qualtrics y Azure...\n---------------""")
            data = await asyncio.to_thread(aggregate_experiment_data)
            safe_data = sanitize(data)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(safe_data, f)
            print("""---------------\nDatos procesados y guardados en caché estático.\n---------------""")
        except Exception as e: 
            print(f"Error actualizando los datos en segundo plano: {e}")
            
        await asyncio.sleep(UPDATE_INTERVAL_SECONDS)
        
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(update_data_task())
    yield
    task.cancel()
    
app = FastAPI(lifespan=lifespan)

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
    if os.path.exists(CACHE_FILE):
        return FileResponse(CACHE_FILE, media_type="application/json")
    else:
        return JSONResponse(
            status_code=503, 
            content={"message": "Sincronizando datos por primera vez. Intenta en un par de minutos."}
        )
        
@app.post("/api/dashboard/refresh")
async def force_refresh():
    try:
        print("Forzando actualización manual desde el Dashboard...")
        data = await asyncio.to_thread(aggregate_experiment_data)
        safe_data = sanitize(data)
        
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(safe_data, f)
            
        return {"status": "success", "message": "Datos actualizados correctamente"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
