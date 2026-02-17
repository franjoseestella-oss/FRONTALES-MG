
import pyodbc

def check_table():
    conn_str = (
        r'DRIVER={ODBC Driver 17 for SQL Server};'
        r'SERVER=DESKTOP-PMRMSPT\SQLEXPRESS;'
        r'DATABASE=DAFEED;'
        r'Trusted_Connection=yes;'
    )
    
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'SECUENCIAS_FRONTALES_MG'")
        if cursor.fetchone()[0] == 0:
            print("ERROR: Table 'SECUENCIAS_FRONTALES_MG' does not exist!")
            return

        # Check data
        query = "SELECT TOP 5 REFERENCIA, SECUENCIA, DESCRIPCION FROM dbo.SECUENCIAS_FRONTALES_MG ORDER BY SECUENCIA DESC"
        print(f"Executing: {query}")
        cursor.execute(query)
        
        rows = cursor.fetchall()
        print(f"Found {len(rows)} rows.")
        for row in rows:
            print(f"Row: {row}")
            for item in row:
                print(f"Type of {item}: {type(item)}")
            break
            
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_table()
