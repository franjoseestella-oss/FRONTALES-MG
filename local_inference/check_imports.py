
try:
    import flask
    print(f"Flask: {flask.__version__}")
except ImportError:
    print("Flask: MISSING")

try:
    import flask_cors
    print(f"Flask-CORS: {flask_cors.__version__}")
except ImportError:
    print("Flask-CORS: MISSING")

try:
    import requests
    print(f"Requests: {requests.__version__}")
except ImportError:
    print("Requests: MISSING")

try:
    import pyodbc
    print(f"PyODBC: {pyodbc.version}")
except ImportError:
    print("PyODBC: MISSING")
