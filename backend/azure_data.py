import os
import json
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv

load_dotenv()

AZURE_CONN_STR = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER = os.getenv("AZURE_CONTAINER")

blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
container_client = blob_service.get_container_client(AZURE_CONTAINER)

def load_all_logs_grouped():
    logs_by_session = {}

    blobs = container_client.list_blobs(name_starts_with="GPT_logs/")

    for blob in blobs:
        blob_client = container_client.get_blob_client(blob.name)
        raw = blob_client.download_blob().readall()
        log = json.loads(raw)

        session_id = log.get("session_id")
        if not session_id:
            continue

        logs_by_session.setdefault(session_id, []).append(log)

    return logs_by_session
