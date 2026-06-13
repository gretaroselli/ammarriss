// Global State Tracker Instances
let activeCategoryId = null;
let bootstrapEditModal = null;
let selectedImageFile = null;
let currentComboItems = []; // Tracking storage for mutable bundle rows

document.addEventListener("DOMContentLoaded", () => {
    // Initialize the Bootstrap Edit Modal cleanly on page boot
    const modalElement = document.getElementById('editItemModal');
    if (modalElement) {
        bootstrapEditModal = new bootstrap.Modal(modalElement);
    }

    // Attach form submit event listener directly
    const editForm = document.getElementById("edit-item-form");
    if (editForm) {
        editForm.addEventListener("submit", handleEditFormSubmit);
    }

    // Set up drag-and-drop utilities for the product image uploader zone
    setupDragAndDrop();
});

function setupDragAndDrop() {
    const dropZone = document.getElementById("image-drop-zone");
    const fileInput = document.getElementById("edit-item-image");
    const removeBtn = document.getElementById("remove-preview-btn");

    if (!dropZone || !fileInput) return;

    // Click zone triggers hidden input field click
    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));

    // Visual drag states styling triggers
    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add("border-warning", "bg-body-secondary");
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove("border-warning", "bg-body-secondary");
        }, false);
    });

    dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        handleFileSelect(dt.files[0]);
    });

    // Clear selected image file preview back to blank upload slate
    if (removeBtn) {
        removeBtn.addEventListener("click", () => {
            selectedImageFile = null;
            fileInput.value = "";
            document.getElementById("image-preview-container").classList.add("d-none");
            dropZone.classList.remove("d-none");
        });
    }
}

function handleFileSelect(file) {
    if (!file || !file.type.startsWith("image/")) return;

    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById("edit-image-preview").src = e.target.result;

        // Hide drop zone box, reveal preview wrapper image layout component
        document.getElementById("image-drop-zone").classList.add("d-none");
        document.getElementById("image-preview-container").classList.remove("d-none");
    };
    reader.readAsDataURL(file);
}

async function loadCategories() {
    try {
        const response = await fetch("http://127.0.0.1:8000/categories");
        const categories = await response.json();

        const container = document.getElementById("categories-container");
        container.innerHTML = "";

        if (categories.length === 0) {
            container.innerHTML = `<div class="list-group-item text-muted small py-3">No categories found.</div>`;
            return;
        }

        categories.forEach((category, index) => {
            if (activeCategoryId === null && index === 0) {
                activeCategoryId = category.category_id;
                document.getElementById("current-category-title").innerText = category.category_name;
                loadProductsByCategory(category.category_id);
            }

            const isActive = category.category_id === activeCategoryId;

            const itemHTML = `
                <div class="list-group-item d-flex justify-content-between align-items-center border-bottom px-3 py-2.5" 
                     style="${isActive ? 'background-color: #ff9800; color: white; font-weight: 600;' : 'background-color: white; color: #212529;'} cursor: pointer;"
                     onclick="selectCategory(${category.category_id}, '${category.category_name.replace(/'/g, "\\'")}')">
                    <span>${category.category_name}</span>
                    <span class="${isActive ? 'text-white-50' : 'text-muted'} small" onclick="event.stopPropagation(); deleteCategory(${category.category_id})">&times;</span>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", itemHTML);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

function selectCategory(id, name) {
    activeCategoryId = id;
    document.getElementById("current-category-title").innerText = name;

    loadCategories();
    loadProductsByCategory(id);
}
async function loadProductsByCategory(categoryId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/categories/${categoryId}/products`);
        const products = await response.json();

        const tableBody = document.getElementById("products-table-body");
        tableBody.innerHTML = "";

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-4">No items inside this category yet.</td>
                </tr>
            `;
            return;
        }

        products.forEach(product => {
            const rowHTML = `
                <tr>
                    <td class="fw-semibold text-dark py-3 ps-4">${product.product_name}</td>
                    <td class="text-dark py-3">₱${parseFloat(product.unit_price || product.price).toFixed(2)}</td>
                    <td class="py-3 pe-4 text-end">
                        <button class="btn btn-sm text-white px-3 me-1 rounded-3" style="background-color: #d19bed;" onclick="editProduct(${product.product_id})">Edit</button>
                        <button class="btn btn-sm btn-danger px-3 rounded-3" onclick="deleteProduct(${product.product_id})">Remove</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", rowHTML);
        });
    } catch (error) {
        console.error("Error loading products:", error);
        document.getElementById("products-table-body").innerHTML = `
            <tr><td colspan="3" class="text-center text-danger py-4">Failed to load product list.</td></tr>
        `;
    }
}

async function editProduct(productId) {
    try {
        if (document.activeElement) {
            document.activeElement.blur();
        }

        // Reset image previews and file states
        selectedImageFile = null;
        currentComboItems = [];

        const fileInput = document.getElementById("edit-item-image");
        if (fileInput) fileInput.value = "";

        document.getElementById("image-preview-container").classList.add("d-none");
        document.getElementById("image-drop-zone").classList.remove("d-none");

        const comboSection = document.getElementById("combo-items-section");
        const comboList = document.getElementById("combo-items-list");
        if (comboSection) comboSection.classList.add("d-none");
        if (comboList) comboList.innerHTML = "";

        // Fetch the entire inventory registry for combo assignment context
        const allProdsRes = await fetch(`http://127.0.0.1:8000/products`);
        let allProducts = [];

        if (allProdsRes.ok) {
            const data = await allProdsRes.json();

            if (Array.isArray(data)) {
                // Perfect, this is the flat list from your database query
                allProducts = data;
            } else if (data && typeof data === 'object') {
                // Fallback: If the server forces the categorized object, flatten it completely
                allProducts = [];
                Object.keys(data).forEach(categoryKey => {
                    const categoryItems = data[categoryKey];
                    if (Array.isArray(categoryItems)) {
                        allProducts.push(...categoryItems);
                    }
                });
            }
        }

        const selectDropdown = document.getElementById("combo-product-select");
        if (selectDropdown) {
            selectDropdown.innerHTML = '<option value="">Select an item...</option>';

            allProducts.forEach(p => {
                const currentLoopId = p.product_id ? p.product_id.toString() : "";
                const editingId = productId ? productId.toString() : "";

                // ✅ Exclude the parent item so a combo can't recursively contain itself
                if (currentLoopId !== editingId) {
                    // Adapt to both backend field name naming models seamlessly
                    let rawName = p.product_name || p.name || p.PRODUCT_NAME || "Unnamed Item";
                    let rawPrice = p.unit_price !== undefined ? p.unit_price : (p.price !== undefined ? p.price : 0);

                    const safeNameForAttribute = String(rawName).replace(/"/g, '&quot;');

                    selectDropdown.insertAdjacentHTML('beforeend', `
                        <option value="${p.product_id}" data-name="${safeNameForAttribute}" data-price="${rawPrice}">
                            ${rawName} (₱${parseFloat(rawPrice).toFixed(2)})
                        </option>
                    `);
                }
            });
        }

        const response = await fetch(`http://127.0.0.1:8000/products/${productId}`);
        if (!response.ok) throw new Error("Failed to pull product data");

        const product = await response.json();

        const idField = document.getElementById("edit-product-id");
        const nameField = document.getElementById("edit-item-name");
        const priceField = document.getElementById("edit-item-price");

        if (idField) idField.value = product.product_id || "";
        if (nameField) {
            nameField.value = product.product_name || product.name || product.PRODUCT_NAME || "";
        }
        if (priceField) {
            priceField.value = product.unit_price !== undefined ? product.unit_price : (product.price !== undefined ? product.price : 0);
        }

        if (product.image_url) {
            const previewImg = document.getElementById("edit-image-preview");
            if (previewImg) previewImg.src = `http://127.0.0.1:8000/static/uploads/${product.image_url}`;

            const dropZone = document.getElementById("image-drop-zone");
            const previewContainer = document.getElementById("image-preview-container");
            if (dropZone) dropZone.classList.add("d-none");
            if (previewContainer) previewContainer.classList.remove("d-none");
        }

        if (comboSection) comboSection.classList.remove("d-none");

        if (product.combo_items && product.combo_items.length > 0) {
            currentComboItems = product.combo_items;
            renderComboList();
        } else {
            if (comboList) {
                comboList.innerHTML = '<div class="text-muted text-center py-2" id="empty-combo-msg">No bundled items linked.</div>';
            }
        }

        const modalElement = document.getElementById('editItemModal');
        if (modalElement) {
            modalElement.removeAttribute('aria-hidden');
        }

        if (bootstrapEditModal) {
            bootstrapEditModal.show();
        }
    } catch (error) {
        console.error("Error opening edit modal:", error);
    }
}

async function handleEditFormSubmit(event) {
    event.preventDefault();

    const productId = document.getElementById("edit-product-id").value;
    const updatedName = document.getElementById("edit-item-name").value;
    const updatedPrice = document.getElementById("edit-item-price").value;

    const formData = new FormData();
    formData.append("product_name", updatedName);
    formData.append("price", updatedPrice);

    // Append layout mapping collection safely to target payload field keys
    formData.append("combo_items", JSON.stringify(currentComboItems));
    formData.append("admin_id", localStorage.getItem('admin_id'));

    if (selectedImageFile) {
        formData.append("image", selectedImageFile);
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/products/${productId}`, {
            method: "PUT",
            body: formData
        });

        if (!response.ok) throw new Error("Update transaction failed");

        if (bootstrapEditModal) {
            bootstrapEditModal.hide();
        }

        if (activeCategoryId) {
            loadProductsByCategory(activeCategoryId);
        }
    } catch (error) {
        console.error("Error saving updated attributes:", error);
        alert("Failed to save item updates.");
    }
}


function renderComboList() {
    const comboList = document.getElementById("combo-items-list");
    comboList.innerHTML = "";

    if (currentComboItems.length === 0) {
        comboList.innerHTML = '<div class="text-muted text-center py-2">No bundled items linked.</div>';
        return;
    }

    currentComboItems.forEach((item, index) => {
        const itemHTML = `
            <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center px-1 py-1.5 border-0">
                <span class="text-dark fw-medium">${item.product_name} <span class="text-muted small">x${item.quantity}</span></span>
                <div class="d-flex align-items-center gap-2">
                    <span class="text-muted">₱${(parseFloat(item.unit_price || item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                    <button type="button" class="btn btn-sm text-danger p-0 m-0 border-0 fs-5 lh-1" onclick="removeItemFromComboList(${index})">&times;</button>
                </div>
            </li>
        `;
        comboList.insertAdjacentHTML("beforeend", itemHTML);
    });
}

function addItemToComboList() {
    const select = document.getElementById("combo-product-select");
    const qtyInput = document.getElementById("combo-quantity-input");

    const productId = select.value;
    const quantity = parseInt(qtyInput.value);

    if (!productId || quantity < 1) return;

    const selectedOption = select.options[select.selectedIndex];
    const productName = selectedOption.getAttribute("data-name");
    const unitPrice = parseFloat(selectedOption.getAttribute("data-price"));

    const existingItem = currentComboItems.find(item => (item.item_id == productId || item.product_id == productId));
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        currentComboItems.push({
            item_id: parseInt(productId),
            product_id: parseInt(productId), // Safe bind for varying API schema targets
            product_name: productName,
            quantity: quantity,
            unit_price: unitPrice
        });
    }

    qtyInput.value = "1";
    select.value = "";
    renderComboList();
}

function removeItemFromComboList(index) {
    currentComboItems.splice(index, 1);
    renderComboList();
}

// Function for adding a Category
async function triggerAddCategory() {
    const inputField = document.getElementById("new-category-name");
    const categoryName = inputField.value.trim();

    if (!categoryName) {
        alert("Please enter a category name.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/categories/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category_name: categoryName, admin_id: localStorage.getItem('admin_id')})
        });

        if (!response.ok) throw new Error("Failed to create category");

        inputField.value = ""; // Clear the input
        loadCategories();      // Reload the sidebar list
    } catch (error) {
        console.error("Error:", error);
        alert("Error adding category.");
    }
}

// Function for adding a Product Placeholder
async function triggerAddProductPlaceholder() {
    if (typeof activeCategoryId === 'undefined' || !activeCategoryId) {
        alert("Please select a category first.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/products/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category_id: parseInt(activeCategoryId), admin_id: localStorage.getItem('admin_id')})
        });

        if (!response.ok) throw new Error("Failed to create product");

        // Reload the products table for the current category
        loadProductsByCategory(activeCategoryId);
    } catch (error) {
        console.error("Error:", error);
        alert("Error adding product.");
    }
}
// product deletion
async function deleteProduct(productId) {
    // 1. Confirm before deleting
    if (!confirm("Are you sure you want to remove this item from the menu?")) {
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/products/delete/${productId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to delete product");
        }


        if (typeof activeCategoryId !== 'undefined') {
            loadProductsByCategory(activeCategoryId);
        }

        alert("Product removed successfully.");
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Error: Could not delete product.");
    }
}
//category deletion
async function deleteCategory(categoryId) {
    if (!confirm("Are you sure? This will delete the category and all products inside it!")) {
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/categories/delete/${categoryId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Failed to delete category");

        if (activeCategoryId === categoryId) {
            activeCategoryId = null;
        }

        alert("Category deleted successfully.");
        loadCategories();
    } catch (error) {
        console.error("Error:", error);
        alert("Error: Could not delete category.");
    }
}