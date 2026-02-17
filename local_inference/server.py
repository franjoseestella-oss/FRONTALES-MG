from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import requests
import pyodbc

app = Flask(__name__)
# Allow CORS from the app
CORS(app)

@app.route('/roboflow-proxy', methods=['POST'])
def roboflow_proxy():
    try:
        data = request.json
        api_key = data.get("api_key")
        workspace = data.get("workspace")
        workflow_id = data.get("workflow_id")
        image_data = data.get("image") 
        
        if not all([api_key, workspace, workflow_id, image_data]):
             return jsonify({"error": "Missing required fields"}), 400

        # Implement HTTP Proxy matching User's Curl
        url = f"https://serverless.roboflow.com/{workspace}/workflows/{workflow_id}"
        
        payload = {
            "api_key": api_key,
            "inputs": {
                "image": {
                    "type": "base64",
                    "value": image_data
                }
            }
        }
        
        print(f"Proxying via HTTP to: {url}")
        resp = requests.post(url, json=payload)
        
        if resp.status_code == 200:
            json_response = resp.json()
            print(f"Roboflow Response Body: {json_response}")
            return jsonify(json_response), 200
        
        print(f"Workflow HTTP Error: {resp.status_code} - {resp.text}")
        return jsonify(resp.json()), resp.status_code
        
    except Exception as e:
        print(f"Proxy Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/production-plan', methods=['GET'])
def get_production_plan():
    print(f"[{request.method}] /production-plan endpoint hit")
    try:
        # Connection String based on User Screenshot
        conn_str = (
            r'DRIVER={ODBC Driver 17 for SQL Server};'
            r'SERVER=DESKTOP-PMRMSPT\SQLEXPRESS;'
            r'DATABASE=DAFEED;'
            r'Trusted_Connection=yes;'
        )
        
        print(f"Connecting to DB with string: {conn_str}")
        # Add timeout to prevent hanging
        conn = pyodbc.connect(conn_str, timeout=5)
        print("DB Connection Established")
        
        cursor = conn.cursor()
        
        query = "SELECT TOP 100 REFERENCIA, SECUENCIA, DESCRIPCION FROM dbo.SECUENCIAS_FRONTALES_MG ORDER BY SECUENCIA DESC"
        print(f"Executing query: {query}")
        cursor.execute(query)
        
        columns = [column[0] for column in cursor.description]
        results = []
        
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
            
        conn.close()
        print(f"Fetched {len(results)} rows. Closing Connection.")
        return jsonify({"success": True, "data": results}), 200
        
    except Exception as e:
        print(f"CRITICAL ERROR in /production-plan: {e}")
        # Fallback to verify if driver is issue
        error_info = {
            "success": False, 
            "error": str(e), 
            "drivers": pyodbc.drivers()
        }
        return jsonify(error_info), 500

@app.route('/')
def home():
    return "Roboflow Proxy Server Running. (Cloud Only)"

if __name__ == '__main__':
    print("Starting Roboflow Proxy Server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
