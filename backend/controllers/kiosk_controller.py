from fastapi import APIRouter, Body, Depends, HTTPException
from ..database import get_db
from mysql.connector.connection import MySQLConnection



router = APIRouter()


#get products
@router.get("/kiosk/products")
def get_products(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT p.product_id, p.product_name as name, p.unit_price as price, p.image_url, c.category_name, p.admin_id FROM product p JOIN category c On p.category_id = c.category_id WHERE c.category_name != 'Hidden'")
    products = cursor.fetchall()
    
    payload = {}
    for product in products:
        if product['image_url']:
            product['image_url'] = f"/uploads/{product['image_url']}"
        else:
            product['image_url'] = None # Safe fallback if no image exists

        # 2. Safely group items into their category arrays
        category = product['category_name']
        if category not in payload:
            payload[category] = []
            
        payload[category].append(product)

    return payload

#create order
@router.post("/kiosk/place-order")
def create_orders(payload: dict = Body(...), db: MySQLConnection = Depends(get_db)):

    itemList = payload.get("items", [])
    if not itemList:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    price_cursor = db.cursor(dictionary=True, buffered=True)
    total_price = 0.0

    try:
        for item in itemList:
            p_id = int(item.get('product_id'))
            qty = int(item.get('quantity', 0))
            
            price_cursor.execute("SELECT unit_price FROM product WHERE product_id = %s", (p_id,))
            product = price_cursor.fetchone()
            
            if product:
                total_price += float(product['unit_price']) * qty
            else:
                raise HTTPException(status_code=400, detail=f"Product ID {p_id} does not exist.")
    finally:
        price_cursor.close()


    cursor = db.cursor(dictionary=True, buffered=True)

    try:
        insertQuery = "INSERT INTO `order` (order_mode, order_date, order_time, price, status) VALUES (%s, CURRENT_DATE, CURRENT_TIME, %s, %s)"
        cursor.execute(insertQuery, (payload.get("order_mode", "dine-in"), total_price, "Pending"))

        currentOrderId = cursor.lastrowid

        item_query = "INSERT INTO order_item (order_id, product_id, quantity) VALUES (%s, %s, %s)"
        batch_records = []
            
        for item in itemList:
            p_id = item.get('product_id')
            qty = item.get('quantity')
            
            if p_id is not None and qty is not None:
                batch_records.append((currentOrderId, int(p_id), int(qty)))
                
        if batch_records:
            cursor.executemany(item_query, batch_records)

        db.commit()
        
        return {"message": "Order created successfully", "order_id": currentOrderId, "total": total_price}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Rejected: {str(e)}")
    finally:
        cursor.close()

@router.post("/kiosk/create-payment")
def createPayment(currentOrderId:int = Body(...), db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    query = "INSERT INTO payment (order_id, payment_method, trn, amount_paid, discount, vat) VALUES (%s, %s, %s, %s, %s, %s)"
    cursor.execute(query, (currentOrderId, "Online", "", 0, 0, 0))
    db.commit()
    return {"message": "Payment created successfully"}


