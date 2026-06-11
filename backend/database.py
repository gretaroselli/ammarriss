import mysql.connector
from fastapi import HTTPException

db_config ={
    "host": "localhost",
    "user": "root",
    "password": "alano321",
    "database": "amarris_kitchen",
    "port": 3306
}

def get_db():
    try:
        db = mysql.connector.connect(**db_config)
        yield db
    except mysql.connector.Error as err:
        print(f"Error cant connect to the database: {err}")
        raise HTTPException(status_code=500, detail="Error connecting to the database")
    finally:
        if 'db' in locals() and db.is_connected():
            db.close()

