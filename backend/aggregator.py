from brand_controller import build_session_snapshot
from azure_data import load_all_logs_grouped
from qualtrics import fetch_qualtrics_rows

# Ground truth FIXED for this experiment
EXPECTED_TOTALS = {
  "Dos Equis Lager": 10,
  "Manzanita Sol Original": 8,
  "Modelo Especial": 12,
}

BRAND_NAME_MAP = {
  "can_seltzer lime": "Dos Equis Lager",
  "can_canada dry ginger ale": "Manzanita Sol Original",
  "can_diet coke original": "Modelo Especial",
}

def build_snapshot(timestamp, detected, expected):
  rows = []
  failures = 0

  for brand, exp in expected.items():
    obs = detected.get(brand, 0)
    diff = obs - exp
    status = "success" if diff == 0 else "failure"

    if status == "failure":
      failures += 1

    rows.append({
      "brand": brand,
      "expected": exp,
      "observed": obs,
      "diff": diff,
      "status": status
    })

  return {
    "timestamp": timestamp,
    "rows": rows,
    "summary": {
      "total": len(rows),
      "failures": failures,
      "successes": len(rows) - failures,
      "status": "success" if failures == 0 else "failure"
    }
  }

def aggregate_experiment_data():
  qualtrics_rows = fetch_qualtrics_rows()
  sessions = []
  
  summary = {
    "total_records": 0,
    "session_successes": 0,
    "user_failures": 0,
    "algorithm_failures": 0
  }

  all_logs = load_all_logs_grouped()
  for row in qualtrics_rows:
    session_id = row.get("ID")
    if not session_id:
      continue

    summary["total_records"] += 1
    azure_logs = all_logs.get(session_id, [])

    # QUALTRICS PROCESSED
    qualtrics = {
      "meta": {
        #"session_id": session_id,
        "start_date": row["StartDate"],
        "end_date": row["EndDate"],
        #"duration_s": row["Duration (s)"],
      },
      "metrics": {
        k: v for k, v in row.items()
        if k not in ["StartDate", "EndDate", "Duration (s)", "ID"]
      }
    }

    # AZURE SNAPSHOTS
    snapshots = []
    for log in sorted(azure_logs, key=lambda x: x["timestamp"], reverse=True):
      raw_metrics = log.get("brand_totals", {})
      azure_metrics = {
        BRAND_NAME_MAP[k]: v
        for k, v in raw_metrics.items()
        if k in BRAND_NAME_MAP
      }
      snapshot = build_session_snapshot(
        timestamp=log["timestamp"].replace("T", " ").split("+")[0],
        expected=EXPECTED_TOTALS,
        qualtrics_metrics=qualtrics["metrics"],
        azure_metrics=azure_metrics
      )
      snapshots.append(snapshot)
      
    # IF NOT AZURE DATA, CREATE A SINGLE SNAPSHOT BASED ON QUALTRICS ALONE
    if not snapshots:
      snapshot = build_session_snapshot(
        timestamp=qualtrics["meta"]["start_date"].replace("T", " ").split("+")[0],
        expected=EXPECTED_TOTALS,
        qualtrics_metrics=qualtrics["metrics"],
        azure_metrics={}
      )
      snapshots.append(snapshot)
      
    # SESSION SUMMARY (based on latest snapshot)
    if snapshots:
      latest = snapshots[0]

      if latest["status"] == "success":
        summary["session_successes"] += 1

      summary["user_failures"] += latest["totals"]["userFailure"]
      summary["algorithm_failures"] += latest["totals"]["algorithmFailure"]

    sessions.append({
      "session_id": session_id,
      "metadata": qualtrics["meta"],
      "snapshots": snapshots,
    })
    
  #(sessions[0], summary)
  return {"sessions": sessions, "summary": summary}
