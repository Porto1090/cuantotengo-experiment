import asyncio
import io
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from aggregator import aggregate_experiment_data
from qualtrics import fetch_survey_data, fetch_qualtrics_rows
from azure_data import load_all_logs_grouped, load_all_logs_flat
from sanitizer import sanitize

app = FastAPI()

# Permitir llamadas desde el frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API is running."}

# ==========================================
# 1. ENDPOINT: TRAER TODO QUALTRICS
# ==========================================
@app.get("/api/qualtrics")
async def get_qualtrics_data():
    try:
        # fetch_qualtrics_rows ya retorna una lista de diccionarios
        data = await asyncio.to_thread(fetch_qualtrics_rows)
        return JSONResponse(content=sanitize(data))
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# ==========================================
# 2. ENDPOINT: TRAER TODO AZURE
# ==========================================
@app.get("/api/azure")
async def get_azure_data():
    try:
        data = await asyncio.to_thread(load_all_logs_grouped)
        return JSONResponse(content=sanitize(data))
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# ==========================================
# 3. ENDPOINT: TRATAMIENTO (JSON FRONTEND)
# ==========================================
@app.get("/api/dashboard")
async def get_dashboard_data():
    try:
        # Esta función internamente llama a Qualtrics y Azure y hace la lógica
        data = await asyncio.to_thread(aggregate_experiment_data)
        return JSONResponse(content=sanitize(data))
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


# ==========================================
# EXTRA: DESCARGAS PARA EXCEL (CSV)
# ==========================================

@app.get("/api/export/qualtrics")
async def export_qualtrics_excel():
    """Descarga los datos limpios de Qualtrics en formato CSV"""
    try:
        # fetch_survey_data retorna un DataFrame de pandas
        df = await asyncio.to_thread(fetch_survey_data)
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=qualtrics_data.csv"
        return response
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/api/export/azure")
async def export_azure_excel():
    """Trae TODOS los logs de Azure y los descarga en formato CSV con todas las columnas posibles limpias"""
    try:
        # 1. Traemos la lista plana de logs
        logs_list = await asyncio.to_thread(load_all_logs_flat)
        
        if not logs_list:
            return JSONResponse(status_code=404, content={"status": "error", "message": "No hay logs disponibles."})
        
        # 2. Convertimos a DataFrame aplanando los JSONs
        df = pd.json_normalize(logs_list)
        
        # 3. REGLA 1: Poner un 0 en todas las celdas vacías (NaN)
        df = df.fillna(0)
        
        # 4. REGLA 2: Convertir a Entero (int) las columnas de conteo de refrescos.
        # Buscamos dinámicamente cualquier columna que empiece con "brand_totals."
        brand_cols = [col for col in df.columns if col.startswith('brand_totals.')]
        
        for col in brand_cols:
            df[col] = df[col].astype(int)
            
        # * Opcional: Si quisieras forzar ABSOLUTAMENTE TODOS los números (incluyendo tiempos) a entero, 
        # podrías borrar las 4 líneas de arriba y usar esta única línea en su lugar:
        # df = df.apply(lambda x: x.astype(int) if x.dtype == 'float64' else x)

        # 5. Lo convertimos a CSV
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=azure_all_logs_full.csv"
        return response
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})