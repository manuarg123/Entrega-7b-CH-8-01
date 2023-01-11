//Inicializo express
const express = require('express');
const app = express();

//Llamo a la clase contenedor que tiene las funcionalidades
const Contenedor = require('./contenedor');
//inicializa un contenedor para manejar productos y un carrito para cargar los seleccionados
const contenedor = new Contenedor("products.json", ["timestamp", "tittle", "price", "description", "code", "image", "stock"]);
const carrito = new Contenedor("cart.json", ["timestamp", "products"]);

//inicializo dotenv
const dotenv = require('dotenv');
dotenv.config();
console.log(`Port... ${process.env.TOKEN}`);

//Habilito el uso de response json 
app.use(express.json());
//Habilito el uso en el navegador del html
app.use(express.urlencoded({ extended: true }))

const authMiddleware = app.use((req, res, next) => {
    req.header('authorization') == process.env.TOKEN 
        ? next()
        : res.status(401).json({"error": "unauthorized"})
})

//Defino rutas para los productos y el carrito
const routerProducts = express.Router();
const routerCart = express.Router();

app.use('/api/productos', routerProducts);
app.use('/api/carrito', routerCart);

/**
 * Manejo de Productos
 */

// GET api/productos.. Para obtener todos los productos que hay
routerProducts.get('/', async (req, res) => {
    const products = await contenedor.getAll();
    res.status(200).json(products);
})

// GET api/productos/:id Busca un producto por id
routerProducts.get('/:id', async (req, res) => {
    const { id } = req.params;
    const product = await contenedor.getById(id);
    
    product
        ? res.status(200).json(product)
        : res.status(400).json({"error": "producto no encontrado"})
})

// POST api/productos Agrega un producto
routerProducts.post('/',authMiddleware, async (req,res, next) => {
    const {body} = req;
    
    body.timestamp = Date.now();
    
    const newProductId = await contenedor.save(body);
    
    newProductId
        ? res.status(200).json({"success" : "Se agrego el producto con el siguiente  ID: "+newProductId})
        : res.status(400).json({"error": "Clave invalida. Verifique el contenido del body"})
})

// PUT api/productos/:id HAcer un update del producto
routerProducts.put('/:id', authMiddleware ,async (req, res, next) => {
    const {id} = req.params;
    const {body} = req;
    const wasUpdated = await contenedor.updateById(id,body);
    
    wasUpdated
        ? res.status(200).json({"success" : "producto actualizado"})
        : res.status(404).json({"error": "producto no encontrado"})
})


// DELETE /api/productos/:id Eliminar un producto
routerProducts.delete('/:id', authMiddleware, async (req, res, next) => {
    const {id} = req.params;
    const wasDeleted = await contenedor.deleteById(id);
    
    wasDeleted 
        ? res.status(200).json({"success": "Producto removido exitosamente"})
        : res.status(404).json({"error": "Producto no encontrado"})
})

/**
 * Manejo del carrito
 */

// POST /api/carrito
routerCart.post('/', async(req, res) => {
    const {body} = req;
    
    body.timestamp = Date.now();
    body.products = [];
    const newCartId = await carrito.save(body);
    
    newCartId
        ? res.status(200).json({"success" : "Producto agregado con ID: "+newCartId})
        : res.status(400).json({"error": "Clave inválida, verifique el contenido del body"})
    
})

// DELETE /api/carrito/id Eliminar  carrito
routerCart.delete('/:id', async (req, res) => {
    const {id} = req.params;
    const wasDeleted = await carrito.deleteById(id);
    
    wasDeleted 
        ? res.status(200).json({"success": "carrito eliminado exitosamente"})
        : res.status(404).json({"error": "carrito no encontrado"})
})

// POST /api/carrito/:id/productos Agregar productos
routerCart.post('/:id/productos', async(req,res) => {
    const {id} = req.params;
    const { body } = req;
    
    const product = await contenedor.getById(body['id']);
    
    if (product) {
        const cartExist = await carrito.addToArrayById(id, {"products": product});
        cartExist
            ? res.status(200).json({"success" : "producto agregado"})
            : res.status(404).json({"error": "no encontrado"})
    } else {
        res.status(404).json({"error": "Producto no encontrado, verifique que el id ingresado es correcto"})
    }
})

// GET /api/carrito/:id/productos Buscar carrito
routerCart.get('/:id/productos', async(req, res) => {
    const { id } = req.params;
    const cart = await carrito.getById(id)
    
    cart
        ? res.status(200).json(cart.products)
        : res.status(404).json({"error": "carrito no encontrado"})
})

// DELETE /api/carrito/:id/productos/:id_prod Eliminar producto del carrito
routerCart.delete('/:id/productos/:id_prod', async(req, res) => {
    const {id, id_prod } = req.params;
    const productExists = await contenedor.getById(id_prod);
    if (productExists) {
        const cartExists = await carrito.removeFromArrayById(id, id_prod, 'products')
        cartExists
            ? res.status(200).json({"success" : "producto eliminado"})
            : res.status(404).json({"error": "carrito no encontrado"})
    } else {
        res.status(404).json({"error": "producto no encontrado"})
    }
})

const PORT = 8080;
const server = app.listen(PORT, () => {
console.log(` >>>>> 🚀 Server started at http://localhost:${PORT}`)
})

server.on('error', (err) => console.log(err));