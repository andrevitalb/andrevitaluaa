let products = [];
let productCounter = 0;
let cart = [];
let itemCounter = 0;
let orderTotal = 0;

function validateProductData(){
    if($('#addName').val().trim() === '' || $('#addDescription').val().trim() === '' || $('#addPrice').val().trim() === '') return false;
    return true;
}

function removeArticle(id){
    let prodId = id;

    let index = -1;
    cart.forEach(item => {
        if(item.id === prodId) index = cart.indexOf(item);
    });

    localStorage.removeItem('item' + index);
    for(let i = index; i < itemCounter - 1; i++) {
        localStorage.setItem(('item' + i), localStorage.getItem('item' + (i + 1)));
    }
    if(index !== itemCounter - 1) localStorage.removeItem('item' + (itemCounter - 1));

    itemCounter--;
    localStorage.setItem('cartCounter', itemCounter);
    cart.splice(index, 1);
    $('#shoppingTable tbody tr#' + prodId).remove();

    calculateTotal();
}

function setExistingProducts(){
    let productCheck = localStorage.getItem('existingCounter');
    if(productCheck === null) localStorage.setItem('existingCounter', productCounter);
    else productCounter = parseInt(productCheck);

    if(productCounter > 0){
        for(let i = 0; i < productCounter; i++){
            let prodEnt = 'product' + i;
            products.push(JSON.parse(localStorage.getItem(prodEnt)));
        }

        $('#productTable tbody').html('');

        products.forEach(prod => {
            $('#productTable tbody').append(`
                <tr id="${prod.id}">
                    <td>${prod.nombre}</td>
                    <td>${prod.descripcion}</td>
                    <td>$${prod.precio}.00</td>
                    <td><input type="number" value="0" class="form-control" min="0"/></td>
                    <td>
                        <button type="button" class="shoppingCartAdd btn btn-primary" value="${prod.id}" data-toggle="tooltip" data-placement="top" title="Agregar al carrito"><i class="fal fa-shopping-cart"></i></button>
                        <button type="button" class="productDelete btn btn-danger" value="${prod.id}" data-toggle="tooltip" data-placement="top" title="Eliminar producto"><i class="fal fa-trash-alt"></i></button>
                    </td>
                </tr>
            `);

            $('#productSelect').append(`
                <option value="${prod.id}">${prod.nombre}</option>
            `);
        });
    } else {
        $('#productTable tbody').html('<td class="text-center" colspan="5">No hay productos existentes</td>');
    }
}

function setCurrentCart(){
    let itemCheck = localStorage.getItem('cartCounter');
    if(itemCheck === null) localStorage.setItem('cartCounter', itemCounter);
    else itemCounter = parseInt(itemCheck);

    if(itemCounter > 0){
        for(let i = 0; i < itemCounter; i++){
            let cartEntry = 'item' + i;
            cart.push(JSON.parse(localStorage.getItem(cartEntry)));
        }
        
        orderTotal = 0;

        $('#shoppingTable tbody').html('');

        let index;
        

        cart.forEach(item => {
            index = -1;
            products.forEach(prod => {
                if(String(item.id) == String(prod.id)) index = products.indexOf(prod);
            });

            $('#shoppingTable tbody').append(`
                <tr id="${item.id}">
                    <td>${products[index].nombre}</td>
                    <td>${products[index].descripcion}</td>
                    <td>$${products[index].precio}.00</td>
                    <td><input type="text" value="${item.qty}" class="form-control" min="0" disabled/></td>
                    <td><button type="button" class="shoppingCartRemove btn btn-danger" value="${item.id}" data-toggle="tooltip" data-placement="top" title="Eliminar del carrito"><i class="fal fa-trash-alt"></i></button></td>
                </tr>
            `);
            orderTotal += (item.qty * parseInt(products[index].precio));
        });
        
        $('#shoppingTable tfoot').html(`
            <tr id="orderTotal">
                <td colspan="2"><strong>Total</strong></td>
                <td><strong>$${orderTotal}.00</strong></td>
                <td colspan="2"></td>
            </tr>
        `);
    } else {
        $('#shoppingTable tbody').html('<td class="text-center" colspan="5">No tienes productos en tu carrito</td>');
    }
}

$(document).ready(function(){
    setExistingProducts();
    setCurrentCart();

    $('[data-toggle="tooltip"]').tooltip();
});

// Products CRUD
$('#productModal').on('show.bs.modal', function (event) {
    let button = $(event.relatedTarget);
    let option = button.data('option');
    
    let modal = $(this);

    switch(option){
        case 'addProduct':
            modal.find('.modal-title').text('Crear producto');
            modal.find('.modal-body').removeClass('edit');
            modal.find('#addProduct').addClass('active');
            modal.find('#editProduct').removeClass('active');
        break;
        case 'editProduct':
            modal.find('.modal-title').text('Editar producto');
            modal.find('.modal-body').addClass('edit');
            modal.find('.modal-body #productSelect').addClass('active');
            modal.find('#editProduct').addClass('active');
            modal.find('#addProduct').removeClass('active');
        break;
    }
});

$('#productSelect').change(function (){
    $('#productDetailsFields').addClass('active');
    $('#productSelect').removeClass('active');

    let prodId = parseInt($(this).val());

    $('#addName').val(products[prodId].nombre);
    $('#addDescription').val(products[prodId].descripcion);
    $('#addPrice').val(products[prodId].precio);
});

$('#addProduct').click(function(){
    if(validateProductData()) {
        let newProduct = {
            id: productCounter,
            nombre: $('#addName').val().trim(),
            descripcion: $('#addDescription').val().trim(),
            precio: $('#addPrice').val().trim()
        };

        products.push(newProduct);

        let productReg = 'product' + productCounter;
        localStorage.setItem(productReg, JSON.stringify(newProduct));
        
        if(productCounter++ == 0) $('#productTable tbody').html('');
        localStorage.setItem('existingCounter', productCounter);

        $('#productTable tbody').append(`
            <tr id="${newProduct.id}">
                <td>${newProduct.nombre}</td>
                <td>${newProduct.descripcion}</td>
                <td>$${newProduct.precio}.00</td>
                <td><input type="number" value="0" class="form-control" min="0"/></td>
                <td>
                    <button type="button" class="shoppingCartAdd btn btn-primary" value="${newProduct.id}" data-toggle="tooltip" data-placement="top" title="Agregar al carrito"><i class="fal fa-shopping-cart"></i></button>
                    <button type="button" class="productDelete btn btn-danger" value="${newProduct.id}" data-toggle="tooltip" data-placement="top" title="Eliminar producto"><i class="fal fa-trash-alt"></i></button>
                </td>
            </tr>
        `);

        $('#productSelect').append(`
            <option value="${newProduct.id}">${newProduct.nombre}</option>
        `);

        $('#productModal').modal('toggle');

        $('[data-toggle="tooltip"]').tooltip();
    } else alert('Por favor, llena todos los campos');
});

$('#editProduct').click(function(){
    if(validateProductData()) {
        let updatedProduct = {
            id: $('#productSelect option:selected').val(),
            nombre: $('#addName').val().trim(),
            descripcion: $('#addDescription').val().trim(),
            precio: $('#addPrice').val().trim()
        };

        products[updatedProduct.id] = updatedProduct;

        let productReg = 'product' + updatedProduct.id;
        localStorage.setItem(productReg, JSON.stringify(updatedProduct));

        $('#productTable tbody #' + updatedProduct.id).html(`
            <td>${updatedProduct.nombre}</td>
            <td>${updatedProduct.descripcion}</td>
            <td>$${updatedProduct.precio}.00</td>
            <td><input type="number" value="0" class="form-control" min="0"/></td>
            <td>
                <button type="button" class="shoppingCartAdd btn btn-primary" value="${updatedProduct.id}" data-toggle="tooltip" data-placement="top" title="Agregar al carrito"><i class="fal fa-shopping-cart"></i></button>
                <button type="button" class="productDelete btn btn-danger" value="${updatedProduct.id}" data-toggle="tooltip" data-placement="top" title="Eliminar producto"><i class="fal fa-trash-alt"></i></button>
            </td>
        `);

        $('#productSelect option[value="' + updatedProduct.id + '"]').html(updatedProduct.nombre);
        $('#productModal').modal('toggle');
    } else alert('Por favor, llena todos los campos');
});

$('#productTable').on('click', '.productDelete', function(){
    let deleteCheck = confirm('¿Estás seguro que deseas eliminar este producto?');

    if(deleteCheck){
        let prodId = $(this).val();
        removeArticle(prodId);

        localStorage.removeItem('product' + prodId);
        for(let i = prodId; i < productCounter - 1; i++) {
            localStorage.setItem(('product' + i), localStorage.getItem('product' + (parseInt(i) + 1)));
        }
        if(prodId !== productCounter - 1) localStorage.removeItem('product' + (productCounter - 1));

        
        productCounter--;
        localStorage.setItem('existingCounter', productCounter);
        products.splice(prodId, 1);
        $('#productTable tbody tr#' + prodId).remove();
    }
});

$('#addProduct, #editProduct, .close-modal').click(function() {
    $('#addName, #addDescription, #addPrice').val('');
    $('#productDetailsFields').removeClass('active');
    $('#productSelect option[value="disabled"]').prop('selected', true);
});

// Shopping cart CRUD
function calculateTotal(){
    orderTotal = 0;
    cart.forEach(item => {
        index = -1;
        products.forEach(prod => {
            if(String(item.id) == String(prod.id)) index = products.indexOf(prod);
        });

        orderTotal += (item.qty * parseInt(products[index].precio));
    });

    $('#shoppingTable tfoot').html(`
        <tr id="orderTotal">
            <td colspan="2"><strong>Total</strong></td>
            <td><strong>$${orderTotal}.00</strong></td>
            <td colspan="2"></td>
        </tr>
    `);
}

function addShoppingItem(id, cartDetails, itemInfo, update = false){
    localStorage.setItem(('item' + id), JSON.stringify(cartDetails));
    alert('Producto agregado al carrito con éxito.');

    if(!update){
        if(itemCounter++ == 0) $('#shoppingTable tbody').html('');
        localStorage.setItem('cartCounter', itemCounter);

        cart.push(cartDetails);
        
        $('#shoppingTable tbody').append(`
            <tr id="${cartDetails.id}">
                <td>${itemInfo.nombre}</td>
                <td>${itemInfo.descripcion}</td>
                <td>$${itemInfo.precio}.00</td>
                <td><input type="text" value="${cartDetails.qty}" class="form-control" min="0" disabled/></td>
                <td><button type="button" class="shoppingCartRemove btn btn-danger" value="${cartDetails.id}" data-toggle="tooltip" data-placement="top" title="Eliminar del carrito"><i class="fal fa-trash-alt"></i></button></td>
            </tr>
        `);
    } else {
        cart[id] = cartDetails;
        let field = '#shoppingTable tbody #' + cartDetails.id + ' input';
        $(field).val(cartDetails.qty);
    }

    calculateTotal();
    
    $('#shoppingCart').modal('toggle');
    $('#productTable input').val('0');
}

$('#productTable').on('click', '.shoppingCartAdd', function(){
    let prodId = $(this).val();
    let quantity = parseInt($('#productTable tbody tr#' + prodId + ' input').val());
    if(quantity === 0) quantity = 1;

    let itemInfo = JSON.parse(localStorage.getItem('product' + prodId));

    let newItem = {
        id: prodId,
        qty: quantity
    };

    let index = -1;
    cart.forEach(item => {
        if(item.id === newItem.id) index = cart.indexOf(item);
    });
    
    let itemCheck = JSON.parse(localStorage.getItem('item' + index));
    if(itemCheck === null) addShoppingItem(itemCounter, newItem, itemInfo);
    else {
        let inc = confirm('Este producto ya está en tu carrito, ¿deseas incrementar la cantidad actual que tienes?');
        newItem.qty += itemCheck.qty;
        if(inc) addShoppingItem(index, newItem, itemInfo, true);
    }
});

$('#shoppingTable').on('click', '.shoppingCartRemove', function(){
    let deleteCheck = confirm('¿Estás seguro que deseas eliminar este artículo de tu carrito?');

    if(deleteCheck) removeArticle($(this).val());
});