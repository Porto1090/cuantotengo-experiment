from brand_controller import build_session_snapshot
from azure_data import load_all_logs_grouped
from qualtrics import fetch_qualtrics_rows
from datetime import datetime

# =========================
# CONSTANTS
# =========================

GROUND_TRUTHS = [
  {
    "mirinda_original": 3,
    "jumex_mango": 4,
    "jumex_durazno": 2,
    "manzanita_sol_original": 5,
    "pepsi_original": 6,
    "7_up_original": 4
  },
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


def get_session_phase(row) -> int:
  phase = row.get("Q1_Phase", "").strip()
  return 1 if phase == "Phase II" else 0

# =========================
# MAIN FUNCTION
# =========================

def aggregate_experiment_data():
  qualtrics_rows = fetch_qualtrics_rows()
  all_logs = load_all_logs_grouped()
  
  sessions = []  
  summary = {
    "total_records": 0,
    "session_successes": 0,
    "user_failures": 0,
    "algorithm_failures": 0
  }

  for row in qualtrics_rows:
    session_id = str(row.get("ID", "")).strip()
    if not session_id:
      continue

    summary["total_records"] += 1
    session_phase = get_session_phase(row)
    expected = GROUND_TRUTHS[session_phase]
    
    azure_logs = all_logs.get(session_id, [])

    # QUALTRICS DATA
    qualtrics_metrics = {
      k: v for k, v in row.items()
      if k not in ["StartDate", "EndDate", "Duration (s)", "ID"]
    }
    metadata = {
      "start_date": row.get("StartDate"),
      "end_date": row.get("EndDate"),
    }
    
    # =========================
    # SNAPSHOTS
    # =========================
  
    snapshots = []
    
    for log in sorted(azure_logs, key=lambda x: x["timestamp"], reverse=True):
      raw_metrics = log.get("brand_totals", {})
      
      snapshot = build_session_snapshot(
        timestamp=parse_timestamp(log.get("timestamp", "")),
        expected=expected,
        qualtrics_metrics=qualtrics_metrics,
        azure_metrics=normalize_metrics(raw_metrics)
      )
      snapshots.append(snapshot)
      
    # IF NOT AZURE DATA, CREATE A FALLABACK SNAPSHOT BASED ON QUALTRICS ALONE
    if not snapshots:
      snapshots.append(
        build_session_snapshot(
          timestamp="0000-00-00 00:00:00",
          expected=expected,
          qualtrics_metrics=qualtrics_metrics,
          azure_metrics={}
        )
      )
      
    # =========================
    # SUMMARY
    # =========================
    
    if snapshots:
      latest = snapshots[0]

      if latest["status"] == "success":
        summary["session_successes"] += 1

      totals = latest.get("totals", {})
      summary["user_failures"] += latest["totals"]["userFailure"]
      summary["algorithm_failures"] += latest["totals"]["algorithmFailure"]

    sessions.append({
      "session_id": session_id,
      "metadata": metadata,
      "snapshots": snapshots,
    })
    
  return {"sessions": sessions, "summary": summary}
