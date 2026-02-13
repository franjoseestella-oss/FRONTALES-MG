from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import requests

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

@app.route('/')
def home():
    return "Roboflow Proxy Server Running. (Cloud Only)"

if __name__ == '__main__':
    print("Starting Roboflow Proxy Server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
