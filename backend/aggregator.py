from brand_controller import build_session_snapshot
from azure_data import load_all_logs_grouped
from qualtrics import fetch_qualtrics_rows
from datetime import datetime
import math

# =========================
# CONSTANTS
# =========================

GROUND_TRUTHS = [
  # CONTROL PHASE (I)
  {
    "pepsi_original": 5,
    "boing_manzana": 4,
    "boing_mango": 3,
    "squirt_original": 5,
    "jumex_manzana": 3,
    "jumex_durazno": 4
  },
  # CONTROL PHASE (II)
  {
    "manzanita_sol_original": 3,
    "mirinda_original": 4,
    "jumex_manzana": 3,
    "pepsi_original": 11,
    "boing_fresa": 3
  },
  # TREATMENT PHASE (I)
  {
    "boing_mango": 3,
    "boing_guayaba": 6,
    "boing_fresa": 3,
    "pepsi_original": 5,
    "squirt_original": 4,
    "7_up_original": 3,
  },
  # TREATMENT PHASE (II)
  {
    "mirinda_original": 3,
    "jumex_mango": 4,
    "jumex_durazno": 2,
    "manzanita_sol_original": 5,
    "pepsi_original": 6,
    "7_up_original": 4
  }
]

ALL_BRANDS = [
  '7_up_original', 
  'boing_fresa', 
  'boing_guayaba', 
  'boing_mango', 
  'boing_manzana', 
  'jumex_durazno', 
  'jumex_mango', 
  'jumex_manzana', 
  'manzanita_sol_original', 
  'mirinda_original', 
  'pepsi_original', 
  'squirt_original'
]  

# =========================
# PRECOMPUTED DATA
# =========================

NORMALIZED_GROUND_TRUTHS = [
  {brand: gt.get(brand, 0) for brand in ALL_BRANDS}
  for gt in GROUND_TRUTHS
]

# =========================
# HELPERS
# =========================

def normalize_metrics(metrics: dict) -> dict:
  """Ensure all brands exist in metrics"""
  return {brand: metrics.get(brand, 0) for brand in ALL_BRANDS}


def parse_timestamp(ts: str) -> str:
  try:
    return datetime.fromisoformat(ts).strftime("%Y-%m-%d %H:%M:%S")
  except Exception:
    return "0000-00-00 00:00:00"


def get_session_ground_truth(row) -> dict:
  tag = str(row.get("Q1_Tag", "")).strip()
  phase = str(row.get("Q1_Phase", "")).strip()
  if tag == "Treatment":
    if phase == "Phase II":
      return NORMALIZED_GROUND_TRUTHS[3]  # TREATMENT PHASE (II)
    else:
      return NORMALIZED_GROUND_TRUTHS[2]  # TREATMENT PHASE (I)
  elif tag == "Control":
    if phase == "Phase II":
      return NORMALIZED_GROUND_TRUTHS[1]  # CONTROL PHASE (II)
    else:
      return NORMALIZED_GROUND_TRUTHS[0]  # CONTROL PHASE (I)
  else: 
    return {brand: 0 for brand in ALL_BRANDS}  # DEFAULT TO ZERO IF NO TAG/PASE MATCH
  
  
def get_empty_group():
  """Helper para inicializar la estructura de cada grupo"""
  return {
    "sessions": [],
    "summary": {
      "total_records": 0,
      "session_successes": 0,
      "user_failures": 0,
      "algorithm_failures": 0,
      "total_time_to_submit": 0.0,
      "valid_time_records": 0,
      "average_time_to_submit": 0.0
    }
  }
  

# =========================
# MAIN FUNCTION
# =========================

def aggregate_experiment_data():
  qualtrics_rows = fetch_qualtrics_rows()
  all_logs = load_all_logs_grouped()
  
  # 1. Inicializamos los 5 grupos
  grouped_data = {
    "all": get_empty_group(),
    "control_phase_1": get_empty_group(),
    "control_phase_2": get_empty_group(),
    "treatment_phase_1": get_empty_group(),
    "treatment_phase_2": get_empty_group()
  }
  
  # 2. Helper interno para guardar en el grupo correspondiente
  def update_group_data(group_key, session_data, is_success, user_fails, algo_fails, time_val):
    if group_key not in grouped_data: return
    
    # Agregar sesión
    grouped_data[group_key]["sessions"].append(session_data)
    
    # Actualizar summary de ese grupo
    summary = grouped_data[group_key]["summary"]
    summary["total_records"] += 1
    if is_success:
      summary["session_successes"] += 1
    summary["user_failures"] += user_fails
    summary["algorithm_failures"] += algo_fails
    
    if time_val is not None:
      summary["total_time_to_submit"] += time_val
      summary["valid_time_records"] += 1

  # 3. Iteramos las filas
  for row in qualtrics_rows:
    session_id = str(row.get("ID", "")).strip()
    if not session_id: continue

    expected = get_session_ground_truth(row)
    azure_logs = all_logs.get(session_id, [])
    
    raw_time = row.get("time_to_submit")
    time_to_submit = None
    try:
        if raw_time is not None:
            f_time = float(raw_time)
            if not math.isnan(f_time):
                time_to_submit = round(f_time, 2)
    except (ValueError, TypeError):
        pass

    # QUALTRICS DATA
    qualtrics_metrics = {
      k: v for k, v in row.items()
      if k not in ["StartDate", "EndDate", "Duration (s)", "ID"]
    }
    metadata = {
      "start_date": row.get("StartDate"),
      "end_date": row.get("EndDate"),
      "tag": row.get("Q1_Tag"),
      "phase": row.get("Q1_Phase"),
      "time_to_submit": time_to_submit
    }
    
    # =========================
    # IDENTIFICAR EL GRUPO PRIMERO
    # =========================
    tag = str(metadata.get("tag", "")).strip()
    phase = str(metadata.get("phase", "")).strip()
    group_key = None
    
    if tag == "Control":
      group_key = "control_phase_2" if phase == "Phase II" else "control_phase_1"
    elif tag == "Treatment":
      group_key = "treatment_phase_2" if phase == "Phase II" else "treatment_phase_1"

    # =========================
    # SNAPSHOTS
    # =========================
    snapshots = []
    
    for log in sorted(azure_logs, key=lambda x: x["timestamp"], reverse=True):
      raw_metrics = log.get("brand_totals", {})
      raw_ts = log.get("timestamp", "")
      
      snapshot = build_session_snapshot(
        timestamp=parse_timestamp(raw_ts),
        raw_timestamp=raw_ts,
        expected=expected,
        qualtrics_metrics=qualtrics_metrics,
        azure_metrics=normalize_metrics(raw_metrics)
      )
      snapshots.append(snapshot)
      
    # IF NOT AZURE DATA, CREATE A FALLBACK SNAPSHOT BASED ON QUALTRICS ALONE
    if not snapshots:
      snapshots.append(
        build_session_snapshot(
          timestamp="0000-00-00 00:00:00",
          raw_timestamp="",
          expected=expected,
          qualtrics_metrics=qualtrics_metrics,
          azure_metrics={}
        )
      )
      
    # =========================
    # EXTRAER KPI PARA EL SUMMARY
    # =========================
    is_success = False
    user_fails = 0
    algo_fails = 0
    
    if snapshots:
      latest = snapshots[0]
      is_success = latest.get("status") == "success" or latest.get("user_status") == "success"
      
      totals = latest.get("totals", {})
      user_fails = totals.get("userFailure", 0)
      
      # REGLA DE NEGOCIO: Solo contamos fallas de algoritmo si es Treatment Phase II
      if group_key == "treatment_phase_2":
          algo_fails = totals.get("algorithmFailure", 0)
      else:
          algo_fails = 0

    # Preparamos el objeto final de la sesión
    session_data = {
      "session_id": session_id,
      "metadata": metadata,
      "snapshots": snapshots,
    }

    # =========================
    # CLASIFICACIÓN Y GUARDADO
    # =========================
    # Siempre lo agregamos al contenedor principal "all"
    update_group_data("all", session_data, is_success, user_fails, algo_fails, time_to_submit)
    
    # Si pertenece a un grupo, lo agregamos también a su respectiva llave
    if group_key:
      update_group_data(group_key, session_data, is_success, user_fails, algo_fails, time_to_submit)
      
  # =========================
  # [NUEVO] CALCULAR PROMEDIOS FINALES
  # =========================
  for group_key, group in grouped_data.items():
    summary = group["summary"]
    valid_records = summary.get("valid_time_records", 0)
    total_time = summary.get("total_time_to_submit", 0.0)
    
    if valid_records > 0:
        summary["average_time_to_submit"] = round(total_time / valid_records, 2)
    else:
        summary["average_time_to_submit"] = 0.0
        
    # Limpiamos las llaves temporales para que el JSON del frontend quede limpio
    summary.pop("total_time_to_submit", None)
    summary.pop("valid_time_records", None)
    
    # [NUEVO] Si es el grupo "all", eliminamos la llave de promedio
    if group_key == "all":
        summary.pop("average_time_to_submit", None)
    
  # Retornamos todo el objeto agrupado directamente
  return grouped_data