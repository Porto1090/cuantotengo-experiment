import os
import json
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv

load_dotenv()

AZURE_CONN_STR = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER = os.getenv("AZURE_CONTAINER")

blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
container_client = blob_service.get_container_client(AZURE_CONTAINER)

# =========================
# AZURE RETRIEVERIEVAL
# =========================

def safe_parse_json(raw_bytes):
	try:
		return json.loads(raw_bytes)
	except Exception:
		return None

def load_all_logs_grouped(prefix="GPT_logs/", limit=None):
	logs_by_session = {}
	count = 0

	try:
		blobs = container_client.list_blobs(name_starts_with=prefix)

		for blob in blobs:
			if limit and count >= limit:
				break
  
			try:      
				blob_client = container_client.get_blob_client(blob.name)
		
				stream = blob_client.download_blob()
				raw = stream.readall()
		
				log = safe_parse_json(raw)
				if not log: 
					continue

				session_id = log.get("session_id")
				if not session_id:
					continue

				logs_by_session.setdefault(session_id, []).append(log)
		
				count += 1
		
			except Exception as e:
				print(f"⚠️ Error processing blob {blob.name}: {e}")
				continue
   
	except Exception as e:
		print(f"❌ Error listing blobs: {e}")
		return {}

	return logs_by_session