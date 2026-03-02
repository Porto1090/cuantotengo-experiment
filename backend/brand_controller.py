def evaluate_brand(expected, qualtrics=0, azure=0):
  success = expected == qualtrics and qualtrics == azure
  user_failure = expected == azure and qualtrics != azure
  algorithm_failure = expected != azure

  return {
    "success": success,
    "userFailure": user_failure,
    "algorithmFailure": algorithm_failure
  }

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

    for key in totals:
      if result[key]:
        totals[key] += 1

    rows.append({
      "brand": brand,
      "expected": exp,
      "qualtrics": qual,
      "azure": az,
      **result
    })

  return rows, totals

def build_session_snapshot(timestamp, expected, qualtrics_metrics, azure_metrics):
  rows, totals = build_brand_rows(
    expected,
    qualtrics_metrics,
    azure_metrics
  )

  return {
    "timestamp": timestamp,
    "rows": rows,
    "totals": totals,
    "status": "success" if totals["algorithmFailure"] == 0 and totals["userFailure"] == 0 else "error"
  }
