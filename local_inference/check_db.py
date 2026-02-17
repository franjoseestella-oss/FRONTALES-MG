import pyodbc

def test_connection():
    print("--- Database Connection Test ---")
    
    # Check Drivers
    drivers = pyodbc.drivers()
    print(f"Available ODBC Drivers: {drivers}")
    
    # SQL Server Drivers often used:
    # 'ODBC Driver 17 for SQL Server'
    # 'SQL Server'
    # 'SQL Server Native Client 11.0'
    
    conn_str = (
        r'DRIVER={ODBC Driver 17 for SQL Server};'
        r'SERVER=DESKTOP-PMRMSPT\SQLEXPRESS;'
        r'DATABASE=DAFEED;'
        r'Trusted_Connection=yes;'
    )
    
    print(f"\nAttempting connection with string:\n{conn_str}\n")
    
    try:
        conn = pyodbc.connect(conn_str, timeout=5)
        print("SUCCESS: Connection established!")
        
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        row = cursor.fetchone()
        print(f"Server Version: {row[0]}")
        
        conn.close()
    except Exception as e:
        print("FAILURE: Could not connect.")
        print(f"Error details: {e}")
        
        # Suggest alternative if driver missing
        if 'ODBC Driver 17 for SQL Server' not in drivers:
            print("\nSUGGESTION: 'ODBC Driver 17 for SQL Server' is missing.")
            print("Try changing the driver in server.py to 'SQL Server' if available.")

if __name__ == "__main__":
    test_connection()
