from fastapi import APIRouter, Depends
from ..database import get_db
from mysql.connector.connection import MySQLConnection



router = APIRouter()



@router.get("/products")
def get_products(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT p.product_id, p.product_name as name, p.unit_price as price, p.image_url, c.category_name, p.admin_id FROM product p JOIN category c On p.category_id = c.category_id")
    products = cursor.fetchall()
    
    payload = {}
    for product in products:
        if product['category_name'] in payload:
            payload[product['category_name']].append(product)
        else:
            payload[product['category_name']] = []
    


    return payload

