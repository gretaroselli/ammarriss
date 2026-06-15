from datetime import datetime, timedelta
import os
import json
import shutil
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Form, UploadFile, File, status
from mysql.connector.connection import MySQLConnection
from ..database import get_db
import bcrypt
import secrets


router = APIRouter()

tokens = []

#handle login uses bcrypt for hashing
@router.post("/login")
def login(username: str = Body(...), password: str = Body(...), db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    query = 'select password, admin_id from admin where admin_name = %s'
    cursor.execute(query, (username,))
    identifiedAdmin = cursor.fetchone()

    if identifiedAdmin:
        hashed_password_from_db = identifiedAdmin['password']
        passwordBytes = password.encode('utf-8')
        hashBytes = hashed_password_from_db.encode('utf-8')

        currentUserToken = "100"
        tokens.append({"token": currentUserToken})

        
        if not bcrypt.checkpw(passwordBytes, hashBytes):
            raise HTTPException(status_code=401)

    else:
        raise HTTPException(status_code=401)

    cursor.close()
    return {"message": "Login successful",
            "admin_id": identifiedAdmin['admin_id'],
            "token":currentUserToken}

#check token authenticity
@router.post("/authenticate-user")
def check_token(clientToken: str = Body(...), db: MySQLConnection = Depends(get_db)):

    for token in tokens:
        if token["token"] == clientToken:
            return {"message": "Token is valid"}

    raise HTTPException(status_code=401, detail="Invalid token")

#signout user, removes token
@router.post("/signout")
def check_token(clientToken: str = Body(...), db: MySQLConnection = Depends(get_db)):

    for token in tokens:
        if token["token"] == clientToken:
            tokens.remove(token)

    return {"message": "Token is removed"}


#handle account creation
@router.post("/register")
def create_account(username: str = Body(...), password: str = Body(...), email: str = Body(...), db: MySQLConnection = Depends(get_db)):
    try:
        cursor = db.cursor(dictionary=True)
        query = 'INSERT INTO admin (admin_name, role, email, password) VALUES (%s, %s, %s, %s)'
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute(query, (username,"Admin", email, hashed_password))
        db.commit()
        return {"message": "Account created successfully"}
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()






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

    cursor.close()
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
            if payment and status != "Cancelled":
                query = "UPDATE payment SET trn = %s, amount_paid = %s WHERE order_id = %s"
                cursor.execute(query, (trn, order['price'], order_id))
            elif not payment and status != "Cancelled":
                query = "INSERT INTO payment (order_id, payment_method, trn, amount_paid, discount, vat) VALUES (%s, %s, %s, %s, %s, %s)"
                cursor.execute(query, (order_id,"Cash", trn, order['price'], 0, 0))

            query = "UPDATE `order` SET status = %s WHERE order_id = %s"
            cursor.execute(query, (status, order_id))
        



        db.commit()
        return {"message": "order updated"}
    
    except:
        db.rollback()
    finally:
        cursor.close()

#get payments
@router.get("/payments")
def get_payments(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM payment")
    payments = cursor.fetchall()
    return payments

#get the most sold items
@router.get("/top-items")
def get_top_items(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    
    try:
        query = """
            SELECT 
                p.product_name, 
                SUM(oi.quantity) AS total_qty_sold
            FROM `order_item` oi
            JOIN `order` o ON oi.order_id = o.order_id
            JOIN `product` p ON oi.product_id = p.product_id
            WHERE o.status IN ('Completed', 'Paid')
            GROUP BY p.product_id, p.product_name
            HAVING total_qty_sold > 0
            ORDER BY total_qty_sold DESC;
        """
        cursor.execute(query)
        top_items = cursor.fetchall()
        
        for item in top_items:
            item['total_qty_sold'] = int(item['total_qty_sold'])
            
        return top_items

    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()

@router.get("/categories")
def get_categories(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT category_id, category_name FROM category ORDER BY category_name ASC"
        cursor.execute(query)
        categories = cursor.fetchall()
        return categories
    except Exception as e:
        return {"error": str(e)}, 500

    finally:
        cursor.close()

@router.get("/categories/{category_id}/products")
def get_products_by_category(category_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    try:
        # First, quickly check if the requested category even exists
        cursor.execute("SELECT category_id FROM category WHERE category_id = %s", (category_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        # Fetch all products mapped explicitly to this category id
        query = """
            SELECT product_id, product_name, unit_price, category_id 
            FROM product 
            WHERE category_id = %s 
            ORDER BY product_name ASC
        """
        cursor.execute(query, (category_id,))
        products = cursor.fetchall()
        
        # Convert Decimals/Floats cleanly for standard JSON serialization
        for product in products:
            product['unit_price'] = float(product['unit_price'])
            
        return products
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching products: {str(e)}"
        )
    finally:
        cursor.close()

# get all products
@router.get("/products")
def get_all_products(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT product_id, product_name, unit_price FROM product ORDER BY product_name ASC"
        cursor.execute(query)
        products = cursor.fetchall()
        
        for product in products:
            product['unit_price'] = float(product['unit_price']) if product['unit_price'] is not None else 0.0
            
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

# get products
@router.get("/products/{product_id}")
def get_single_product(product_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT product_id, product_name, unit_price, image_url FROM product WHERE product_id = %s"
        cursor.execute(query, (product_id,))
        product = cursor.fetchone()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        product['unit_price'] = float(product['unit_price']) if product['unit_price'] is not None else 0.0
        
        combo_query = """
            SELECT 
                ci.product_id AS item_id, 
                child.product_name, 
                ci.quantity, 
                child.unit_price AS unit_price
            FROM combo_item ci
            JOIN product child ON ci.product_id = child.product_id
            WHERE ci.combo_id = %s
        """
        cursor.execute(combo_query, (product_id,))
        product['combo_items'] = cursor.fetchall()
        
        # Dynamically set the flag if the bridge table has rows for this item
        product['is_combo'] = len(product['combo_items']) > 0
        
        # Clean decimal types for child products
        for item in product['combo_items']:
            item['unit_price'] = float(item['unit_price']) if item['unit_price'] is not None else 0.0

        return product
    except Exception as e:
        print(f"Error fetching product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

# update product and combo items
@router.put("/products/{product_id}")
def update_product_and_combo_items(
    product_id: int,
    product_name: str = Form(...),
    price: float = Form(...),
    combo_items: str = Form(None),
    image: UploadFile = File(None),
    db: MySQLConnection = Depends(get_db)
):
    cursor = db.cursor()
    try:
        cursor.execute("SELECT image_url FROM product WHERE product_id = %s", (product_id,))
        current_product = cursor.fetchone()
        if not current_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        filename = current_product[0]

        if image and image.filename:
            filename = f"prod_{product_id}_{image.filename}"
            upload_dir = "uploads"
            os.makedirs(upload_dir, exist_ok=True)
            
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

        update_product_query = """
            UPDATE product 
            SET product_name = %s, unit_price = %s, image_url = %s 
            WHERE product_id = %s
        """
        cursor.execute(update_product_query, (product_name, price, filename, product_id))

        if combo_items is not None:
            parsed_items = json.loads(combo_items)
            
            delete_old_query = "DELETE FROM combo_item WHERE combo_id = %s"
            cursor.execute(delete_old_query, (product_id,))
            
            if len(parsed_items) > 0:
                insert_item_query = """
                    INSERT INTO combo_item (combo_id, product_id, quantity)
                    VALUES (%s, %s, %s)
                """
                for item in parsed_items:
                    target_child_id = item.get('item_id') or item.get('product_id')
                    if target_child_id is not None:
                        cursor.execute(insert_item_query, (product_id, int(target_child_id), int(item['quantity'])))

        db.commit()
        return {"status": "Success", "message": "Product records and combo links synchronized."}

    except Exception as e:
        db.rollback()
        print(f"Transaction aborted. Database rolled back. Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

#create categories
@router.post("/categories/create", status_code=status.HTTP_201_CREATED)
def create_category(category_name: str = Body(...), admin_id: int = Body(...), db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor()
    try:
        # Check if the category already exists to avoid duplicates
        cursor.execute("SELECT category_id FROM category WHERE category_name = %s", (category_name.strip(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Category already exists")

        query = "INSERT INTO category (category_name, admin_id) VALUES (%s, %s)"
        cursor.execute(query, (category_name.strip(), admin_id))
        db.commit()
        return {"status": "Success", "message": "Category created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

# Create products
@router.post("/products/create", status_code=status.HTTP_201_CREATED)
def create_product(category_id: int = Body(...), admin_id: int = Body(...),db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor()
    try:
        # Default baseline structural values for a brand new item
        default_name = "New Item (Click Edit)"
        default_price = 0.00
        default_image = "default.jpg"

        query = """
            INSERT INTO product (product_name, unit_price, image_url, category_id, admin_id)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (default_name, default_price, default_image, category_id, admin_id))
        db.commit()
        return {"status": "Success", "message": "Placeholder product initialized successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

#product deletion
@router.delete("/products/delete/{product_id}")
def delete_product(product_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor()
    try:
        query = "DELETE FROM product WHERE product_id = %s"
        cursor.execute(query, (product_id,))
        db.commit()
        return {"status": "Success", "message": "Product deleted successfully"}
    except:
        pass
    finally:
        cursor.close()

#category deletion
@router.delete("/categories/delete/{category_id}")
def delete_category(category_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor()
    try:
        query = "DELETE FROM category WHERE category_id = %s"
        cursor.execute(query, (category_id,))  
        db.commit()
        return {"status": "Success", "message": "Category deleted successfully"}
    except:
        pass
    finally:
        cursor.close()

#get transactions
@router.get("/transactions")
def get_transactions(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    query = "SELECT o.order_id, o.updated_at, o.order_mode, p.payment_method, p.amount_paid FROM `order` o JOIN payment p ON o.order_id = p.order_id WHERE o.status = 'Completed'"
    cursor.execute(query)
    transactions = cursor.fetchall()
    return transactions