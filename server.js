const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const Product = require('./Product');
const Order = require('./Order');
require('dotenv').config();

// Establish associations
Product.hasMany(Order, { foreignKey: 'product_id', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Seed function
async function seedDatabase() {
  const count = await Product.count();
  if (count === 0) {
    console.log('Seeding initial products into database...');
    const dummyProducts = [
      {
        name: 'Nike Air Jordan 1 Retro High',
        price: 2499000,
        image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=600',
        description: 'Sneaker legendaris dengan desain ikonik dan kenyamanan optimal sepanjang hari. Cocok untuk koleksi maupun pemakaian kasual sehari-hari.',
        stock: 15
      },
      {
        name: 'Keychron K2 Mechanical Keyboard',
        price: 1350000,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600',
        description: 'Keyboard mekanis nirkabel berukuran 75% dengan layout tactile Gateron switches. Kompatibel penuh dengan Mac, Windows, iOS, dan Android.',
        stock: 8
      },
      {
        name: 'Sony WH-1000XM4 Wireless Headphones',
        price: 3899000,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
        description: 'Headphone premium dengan teknologi Active Noise Cancelling (ANC) terbaik di kelasnya. Baterai tahan hingga 30 jam dengan audio resolusi tinggi.',
        stock: 12
      },
      {
        name: 'Fjallraven Kanken Classic Backpack',
        price: 1199000,
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
        description: 'Tas ransel klasik asal Swedia yang tahan air, ringan, dan awet. Sangat pas untuk sekolah, bekerja, hingga perjalanan luar ruangan.',
        stock: 20
      },
      {
        name: 'Stainless Steel Minimalist Coffee Tumbler',
        price: 350000,
        image_url: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=600',
        description: 'Tumbler kopi tahan panas dan dingin hingga 12 jam dengan desain minimalis elegan dan bahan ramah lingkungan BPA-free.',
        stock: 25
      }
    ];

    await Product.bulkCreate(dummyProducts);
    console.log('Seeding completed successfully!');
  } else {
    console.log('Database already has product data. Skipping seed.');
  }

  const orderCount = await Order.count();
  if (orderCount === 0) {
    console.log('Seeding initial orders into database...');
    const products = await Product.findAll();
    if (products.length >= 3) {
      const dummyOrders = [
        {
          product_id: products[0].id,
          buyer_name: 'Budi Santoso',
          quantity: 1,
          total_price: products[0].price,
          status: 'Completed'
        },
        {
          product_id: products[1].id,
          buyer_name: 'Siti Rahmawati',
          quantity: 1,
          total_price: products[1].price,
          status: 'Pending'
        },
        {
          product_id: products[2].id,
          buyer_name: 'Andi Wijaya',
          quantity: 2,
          total_price: products[2].price * 2,
          status: 'Cancelled'
        }
      ];
      await Order.bulkCreate(dummyOrders);
      console.log('Order seeding completed successfully!');
    }
  } else {
    console.log('Database already has order data. Skipping order seed.');
  }
}

// Routes
// 1. Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['id', 'DESC']]
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// 2. Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// 3. Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, image_url, description, stock } = req.body;

    if (!name || !price || !image_url) {
      return res.status(400).json({ error: 'Missing required fields: name, price, or image_url' });
    }

    const newProduct = await Product.create({
      name,
      price: parseInt(price, 10),
      image_url,
      description,
      stock: parseInt(stock, 10) || 0
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// 4. Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, image_url, description, stock } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update({
      name: name || product.name,
      price: price !== undefined ? parseInt(price, 10) : product.price,
      image_url: image_url || product.image_url,
      description: description !== undefined ? description : product.description,
      stock: stock !== undefined ? parseInt(stock, 10) : product.stock
    });

    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// 5. Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    res.status(200).json({ message: `Product with ID ${req.params.id} has been deleted` });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// ==========================================
// ORDER API ENDPOINTS
// ==========================================

// 1. Get all orders (sorted by newest, with nested product information)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image_url']
      }]
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// 2. Create a new order (validates product & stock, calculates total price, decrements stock)
app.post('/api/orders', async (req, res) => {
  try {
    const { product_id, buyer_name, quantity } = req.body;

    if (!product_id || !buyer_name) {
      return res.status(400).json({ error: 'Missing required fields: product_id or buyer_name' });
    }

    const qty = parseInt(quantity, 10) || 1;
    if (qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer greater than 0' });
    }

    // Find the product to verify stock and price
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check stock availability
    if (product.stock < qty) {
      return res.status(400).json({ error: `Stok tidak mencukupi. Stok tersisa: ${product.stock} pcs.` });
    }

    // Calculate total price
    const total_price = product.price * qty;

    // Create order
    const newOrder = await Order.create({
      product_id,
      buyer_name,
      quantity: qty,
      total_price,
      status: 'Pending'
    });

    // Deduct stock from the product
    await product.update({
      stock: product.stock - qty
    });

    // Return the created order with nested product details
    const orderWithProduct = await Order.findByPk(newOrder.id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image_url']
      }]
    });

    res.status(201).json(orderWithProduct);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// 3. Update order status (For completing/cancelling orders in the Admin Dashboard)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({ status });

    // Fetch updated order with nested product info
    const updatedOrder = await Order.findByPk(order.id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image_url']
      }]
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Database Sync and Server Startup
async function startServer() {
  try {
    console.log('Connecting to the PostgreSQL database...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync models
    console.log('Syncing database models...');
    await sequelize.sync(); // Auto-create tables if they don't exist
    console.log('Database models synced successfully.');

    // Seed database if empty
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 Backend server is running on: http://localhost:${PORT}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();
