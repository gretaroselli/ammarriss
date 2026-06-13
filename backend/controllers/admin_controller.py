from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
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
def get_orders(include_items: bool = Query(False),status: str = Query(None),db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)


    if include_items:
        if status:
            query = """
            SELECT 
                o.order_id, o.price, o.status, o.created_at,
                oi.quantity,
                p.product_name
            FROM `order` o
            LEFT JOIN order_item oi ON o.order_id = oi.order_id
            LEFT JOIN product p ON oi.product_id = p.product_id WHERE o.status = %s
            ORDER BY o.order_id DESC
            """
            cursor.execute(query, (status,))
        else:
            query = """
            SELECT 
                o.order_id, o.price, o.status, o.created_at,
                oi.quantity,
                p.product_name
            FROM `order` o
            LEFT JOIN order_item oi ON o.order_id = oi.order_id
            LEFT JOIN product p ON oi.product_id = p.product_id
            ORDER BY o.order_id DESC
            """
            cursor.execute(query)

        rawOrders = cursor.fetchall()
        orders = {}
        for row in rawOrders:
            order_id = row['order_id']

            if order_id not in orders:
                orders[order_id] = {
                    "order_id": order_id,
                    "price": row["price"],
                    "status": row["status"],
                    "created_at": row["created_at"],
                    "items": []
                }
            
            if row["product_name"]:
                orders[order_id]["items"].append({
                    "product_name": row["product_name"],
                    "quantity": row["quantity"]
                })

        return list(orders.values())

    else:
        cursor.execute("SELECT * FROM `order`")
        orders = cursor.fetchall()

    print(orders)
    return orders

# update orders and payments
@router.put("/orders/{order_id}/status")
def updateOrder(order_id:int, status:str, db:MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True, buffered=True)


    try:
        db.start_transaction()
        # get order
        query = "SELECT * FROM `order` WHERE order_id = %s"
        cursor.execute(query, (order_id,))
        order = cursor.fetchone()

        # get payment
        if order:
            query = "SELECT payment_id,amount_paid FROM payment JOIN `order` ON payment.order_id = `order`.order_id WHERE `order`.order_id = %s"
            cursor.execute(query, (order_id,))
            payment = cursor.fetchone()

            trn = f"ORD-{order['order_id']}-{order['order_date']}"

        # update order and payment
            if payment:
                query = "UPDATE payment SET trn = %s, amount_paid = %s WHERE order_id = %s"
                cursor.execute(query, (trn,payment['amount_paid'], order_id))
            elif not payment:
                query = "INSERT INTO payment (order_id, payment_method, trn, discount, vat, amount_paid) VALUES (%s, %s, %s, %s, %s, %s)"
                cursor.execute(query, (order_id,"Cash", trn, 0, 0, order['price']))

            query = "UPDATE `order` SET status = %s WHERE order_id = %s"
            cursor.execute(query, (status, order_id))
        



        db.commit()
        return {"message": "order updated"}
    
    except:
        db.rollback()
    finally:
        cursor.close()

        