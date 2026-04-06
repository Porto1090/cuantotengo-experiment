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

def load_all_logs_flat(prefix="GPT_logs/", limit=None):
    """
    Trae todos los logs de Azure en una lista plana (sin agrupar).
    Trae absolutamente todo lo que esté en el JSON y genera links a imágenes.
    """
    logs_list = []
    count = 0

    # URL base de tu contenedor de imágenes
    BASE_IMAGE_URL = "https://cuantotengostorage.blob.core.windows.net/experiment/GPT_images/"

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

                # 1. Guardamos el nombre original del log
                log['_blob_name'] = blob.name 
                
                # 2. Generamos los links de las imágenes dinámicamente
                # Ejemplo blob.name: "GPT_logs/39_2026-03-21T11:35:53.json"
                # Extraemos solo "39_2026-03-21T11:35:53"
                base_filename = blob.name.replace(prefix, "").replace(".json", "")
                
                # 3. Creamos las nuevas propiedades en el JSON (que luego serán columnas en Excel)
                log['url_imagen_original'] = f"{BASE_IMAGE_URL}{base_filename}_original.jpg"
                log['url_imagen_boxes'] = f"{BASE_IMAGE_URL}{base_filename}_bounding_boxes.jpg"

                # Metemos el log entero a la lista
                logs_list.append(log)
            
                count += 1
            
            except Exception as e:
                print(f"⚠️ Error processing blob {blob.name}: {e}")
                continue
       
    except Exception as e:
        print(f"❌ Error listing blobs: {e}")
        return []

    return logs_list