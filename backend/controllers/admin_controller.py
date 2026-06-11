from fastapi import APIRouter, Body, Depends, HTTPException
from mysql.connector.connection import MySQLConnection
from ..database import get_db
import bcrypt


router = APIRouter()


#handle login uses bcrypt for hashing
@router.post("/login")
def login(username: str = Body(...), password: str = Body(...), db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    query = 'select password from admin where admin_name = %s'
    cursor.execute(query, (username,))
    identifiedAdmin = cursor.fetchone()



    if identifiedAdmin:
        hashed_password_from_db = identifiedAdmin['password']
        passwordBytes = password.encode('utf-8')
        hashBytes = hashed_password_from_db.encode('utf-8')
        
        if not bcrypt.checkpw(passwordBytes, hashBytes):
            raise HTTPException(status_code=401, detail="Incorrect password")

    else:
        raise HTTPException(status_code=404, detail="Admin not found")

    return {"message": "Login successful"}

#gets orders for the admin
@router.get("/orders")
def get_orders(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM `order`")
    orders = cursor.fetchall()

    print(orders)
    return orders
