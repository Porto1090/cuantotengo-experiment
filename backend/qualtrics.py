import os
import time
import io
import zipfile
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("QUALTRICS_API_KEY")
DATA_CENTER = os.getenv("QUALTRICS_DATA_CENTER")
SURVEY_ID = os.getenv("QUALTRICS_SURVEY_ID")

BASE_URL = f"https://{DATA_CENTER}.qualtrics.com/API/v3"

HEADERS = {
	"X-API-TOKEN": API_KEY,
	"Content-Type": "application/json"
}

# =========================
# STEP 1: START EXPORT
# =========================

def start_export():
	r = requests.post(
		f"{BASE_URL}/surveys/{SURVEY_ID}/export-responses",
		headers=HEADERS,
		json={"format": "csv", "useLabels": True}
	)
	r.raise_for_status()
	return r.json()["result"]["progressId"]

# =========================
# STEP 2: POLLING (SAFE)
# =========================

def wait_for_export(progress_id, timeout=60, interval=2):
	start_time = time.time()

	while True:
		if time.time() - start_time > timeout:
			raise TimeoutError("Qualtrics export timeout")

		r = requests.get(
			f"{BASE_URL}/surveys/{SURVEY_ID}/export-responses/{progress_id}",
			headers=HEADERS
		)
		r.raise_for_status()

		result = r.json()["result"]

		if result["status"] == "complete":
			return result["fileId"]

		time.sleep(interval)
  
# =========================
# STEP 3: DOWNLOAD + PARSE
# =========================

def download_csv(file_id):
	r = requests.get(
		f"{BASE_URL}/surveys/{SURVEY_ID}/export-responses/{file_id}/file",
		headers=HEADERS
	)
	r.raise_for_status()

	with zipfile.ZipFile(io.BytesIO(r.content)) as z:
		csv_files = [n for n in z.namelist() if n.endswith(".csv")]
		if not csv_files:
			raise RuntimeError("No CSV in export")

		with z.open(csv_files[0]) as f:
			return pd.read_csv(f)
 
# =========================
# STEP 4: CLEAN DATA
# =========================

def clean_dataframe(df):
  # Quitar las dos primeras filas (headers extra de Qualtrics)
  df = df.iloc[2:].reset_index(drop=True)

  columns_to_keep = [
    "StartDate", "EndDate", "Q1", "Q1_Tag", "Q1_Phase",
    "Q3_1_1", "Q3_2_1", "Q3_3_1", "Q3_4_1", "Q3_5_1", 
    "Q3_6_1", "Q3_7_1", "Q3_8_1", "Q3_9_1", "Q3_10_1", 
    "Q3_11_1", "Q3_12_1"
  ]
  # print("\n[DEBUG] Valores únicos encontrados en la columna 'Q1_Phase':")
  # print(df["Q1_Phase"].unique())
  # print(df["Q1_Phase"].value_counts(dropna=False))

  # Filtrar solo las columnas que existan en el DataFrame y estén en la lista
  df = df[[col for col in df.columns if col in columns_to_keep]]

  # Filtrar solo la fase "treatment"
  df = df[df["Q1_Tag"].str.strip().str.lower() == "treatment"]
  df = df[df["Q1_Phase"].str.strip().str.lower() == "phase ii"]
  

  # Parseo de fechas a la zona horaria de CDMX
  df["StartDate"] = pd.to_datetime(df["StartDate"], utc=True)\
    .dt.tz_convert("America/Mexico_City")\
    .dt.strftime("%Y-%m-%d %H:%M:%S")

  df["EndDate"] = pd.to_datetime(df["EndDate"], utc=True)\
    .dt.tz_convert("America/Mexico_City")\
    .dt.strftime("%Y-%m-%d %H:%M:%S")

  df = df.rename(columns={
    "Q1": "ID",
    "Q3_1_1": '7_up_original', 
    "Q3_2_1": 'boing_fresa', 
    "Q3_3_1": 'boing_guayaba', 
    "Q3_4_1": 'boing_mango', 
    "Q3_5_1": 'boing_manzana', 
    "Q3_6_1": 'jumex_durazno', 
    "Q3_7_1": 'jumex_mango', 
    "Q3_8_1": 'jumex_manzana', 
    "Q3_9_1": 'manzanita_sol_original', 
    "Q3_10_1": 'mirinda_original', 
    "Q3_11_1": 'pepsi_original', 
    "Q3_12_1": 'squirt_original'
  })

  df["ID"] = pd.to_numeric(df["ID"], errors="coerce")

  quantity_columns = [
    '7_up_original', 'boing_fresa', 'boing_guayaba', 'boing_mango', 
    'boing_manzana', 'jumex_durazno', 'jumex_mango', 'jumex_manzana', 
    'manzanita_sol_original', 'mirinda_original', 'pepsi_original', 'squirt_original'
  ]
  
  for col in quantity_columns:
    if col in df.columns: # Validación de seguridad por si alguna columna no vino en el CSV
      df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

  return df.reset_index(drop=True)
  

# =========================
# MAIN PIPELINE
# =========================

def fetch_survey_data():
  progress_id = start_export()
  file_id = wait_for_export(progress_id)
  df = download_csv(file_id)
  df = clean_dataframe(df)

  return df

def fetch_qualtrics_rows():
	df = fetch_survey_data()

	if "ID" not in df.columns:
		raise RuntimeError("Missing ID column")

	return df.to_dict(orient="records")