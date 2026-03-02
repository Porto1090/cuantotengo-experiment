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


def fetch_survey_data():
    # 1. Start export
    r = requests.post(
        f"{BASE_URL}/surveys/{SURVEY_ID}/export-responses",
        headers=HEADERS,
        json={"format": "csv", "useLabels": True}
    )
    r.raise_for_status()
    progress_id = r.json()["result"]["progressId"]

    # 2. Wait
    while True:
        r = requests.get(
            f"{BASE_URL}/surveys/{SURVEY_ID}/export-responses/{progress_id}",
            headers=HEADERS
        )
        r.raise_for_status()
        result = r.json()["result"]

        if result["status"] == "complete":
            file_id = result["fileId"]
            break

        time.sleep(1)

    # 3. Download ZIP
    r = requests.get(
        f"{BASE_URL}/surveys/{SURVEY_ID}/export-responses/{file_id}/file",
        headers=HEADERS
    )
    r.raise_for_status()

    # 4. Extract CSV to pandas
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        csv_files = [n for n in z.namelist() if n.endswith(".csv")]
        if not csv_files:
            raise RuntimeError("No CSV file found in the export")
        csv_name = csv_files[0]
        with z.open(csv_name) as f:
            df = pd.read_csv(f)

    # 5. Modify DATA before returning
    df = df.iloc[2:].reset_index(drop=True)
    print("Original columns:", df.columns.tolist())
    print("Sample data:\n", df.head())
    columns_to_keep = [col for col in df.columns if col in ["StartDate", "EndDate", "Q1", "Duration (in seconds)", "Q3_1_1", "Q3_2_1", "Q3_3_1"]]
    df = df[columns_to_keep]
    
    # change column names
    df = df.rename(columns={
        "Q1": "ID", 
        "Duration (in seconds)": "Duration (s)",
        "Q3_1_1": "can_coca cola",
        "Q3_2_1": "can_pepsi original", 
        "Q3_3_1": "can_seltzer lime",
    })
    
    #change ID and Quantity columns to numeric
    df["ID"] = pd.to_numeric(df["ID"], errors='coerce')
    quantity_columns = ["Q3_1_1", "Q3_2_1", "Q3_3_1"]
    for col in quantity_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int) 

    return df

def fetch_qualtrics_rows():
    df = fetch_survey_data()

    # Asegurar que ID exista
    if "ID" not in df.columns:
        raise RuntimeError("La columna ID no existe en Qualtrics")
    
    return df.to_dict(orient="records")
  
def fetch_fake_qualtrics_rows():
  return [
    {'StartDate': '2025-12-01 19:17:02', 'EndDate': '2025-12-01 19:18:59', 'Duration (s)': 116, 'ID': 2, 'Dos Equis Lager': 10, 'Manzanita Sol Original': 8, 'Modelo Especial': 12, 'Negra Modelo': 0, 'New Mix Jimador Paloma Lata': 0, 'Pepsi Black': 0, 'Pepsi Light': 0, 'Pepsi Regular': 0},
    {'StartDate': '2026-02-10 19:17:02', 'EndDate': '2026-02-10 19:25:02', 'Duration (s)': 116, 'ID': 5, 'Dos Equis Lager': 10, 'Manzanita Sol Original': 8, 'Modelo Especial': 11, 'Negra Modelo': 0, 'New Mix Jimador Paloma Lata': 0, 'Pepsi Black': 0, 'Pepsi Light': 0, 'Pepsi Regular': 0},
    {'StartDate': '2025-12-01 19:19:02', 'EndDate': '2025-12-01 19:12:59', 'Duration (s)': 116, 'ID': 4, 'Dos Equis Lager': 9, 'Manzanita Sol Original': 8, 'Modelo Especial': 12, 'Negra Modelo': 0, 'New Mix Jimador Paloma Lata': 0, 'Pepsi Black': 0, 'Pepsi Light': 0, 'Pepsi Regular': 0},
  ]