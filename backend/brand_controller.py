# =========================
# EVALUATION LOGIC
# =========================

def evaluate_brand(expected: int, qualtrics: int = 0, azure: int = 0) -> dict:
  if expected == qualtrics == azure:
    status = "success"
  elif expected == azure and qualtrics != azure:
    status = "user_failure"
  elif expected != azure:
    status = "algorithm_failure"
  else:
    status = "unknown"  # fallback (should not happen)

  return {
    "status": status,
    "success": status == "success",
    "userFailure": status == "user_failure",
    "algorithmFailure": status == "algorithm_failure"
  }

# =========================
# ROW BUILDER
# =========================

def build_brand_rows(expected, qualtrics_metrics, azure_metrics):
  rows = []
  totals = {
    "success": 0,
    "userFailure": 0,
    "algorithmFailure": 0
  }

  for brand, exp in expected.items():
    qual = qualtrics_metrics.get(brand, 0)
    az = azure_metrics.get(brand, 0)

    result = evaluate_brand(exp, qual, az)
    status = result["status"]

    if status == "success":
      totals["success"] += 1
    elif status == "user_failure":
      totals["userFailure"] += 1
    elif status == "algorithm_failure":
      totals["algorithmFailure"] += 1

    rows.append({
      "brand": brand,
      "expected": exp,
      "qualtrics": qual,
      "azure": az,
      "diff_qualtrics": qual - exp,
      "diff_azure": az - exp,
      **result
    })

  return rows, totals

# =========================
# SNAPSHOT BUILDER
# =========================

def build_session_snapshot(timestamp, expected, qualtrics_metrics, azure_metrics):
  rows, totals = build_brand_rows(
    expected,
    qualtrics_metrics,
    azure_metrics
  )
  
  total_brands = len(rows)
  total_failures = totals["userFailure"] + totals["algorithmFailure"]

  return {
    "timestamp": timestamp,
    "rows": rows,
    "totals": totals,
    "summary": {
      "total_brands": total_brands,
      "total_failures": total_failures,
      "success_rate": (totals["success"] / total_brands) if total_brands else 0
    },
    "status": "success" if total_failures == 0 else "error"
  }
