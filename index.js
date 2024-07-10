const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Order = require("./models/order.js")
const bodyParser = require('body-parser');
require('dotenv').config();
const dburl = process.env.dburl


const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

async function connectToMongo(dburl) {
    const retryAttempts = 3; 
    const connectTimeoutMS = 20000; 
  
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await mongoose.connect(dburl, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          connectTimeoutMS
        });
        console.log('Connected to Database');
        return; 
      } catch (error) {
        console.error(`Connection attempt ${attempt} failed:`, error.message);
  
        await new Promise(resolve => setTimeout(resolve, Math.min(attempt * 2000, 10000))); 
      }
    }
  
    throw new Error('Failed to connect to MongoDB Atlas after retries');
  }
  
  connectToMongo(dburl)
    .then(() => {
      console.log("connection succesful")
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
    });
  




// New endpoint to get order by tracking number
app.get('/track/:trackingNumber', async (req, res) => {
    const { trackingNumber } = req.params;
    console.log(req.params);
    try {
      const order = await Order.findOne({ trackingNumber: trackingNumber });
      if (order) {
        res.json({ order: order });
        console.log(order);
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    } catch (error) {
      console.error('Error fetching order:', error.message);
      res.status(500).json({ error: 'Server error' });
    }
  });
  



app.post('/generate', async (req, res) => {
    try {
      const trackingNumber = Math.floor(Math.random() * 1000000000).toString(); // Example: Generate a random 9-digit number
      const newOrder = new Order({
        name: "",
        orderId: `Order_${Date.now()}`,
        trackingNumber: trackingNumber,
        amount: 0,
        address: "",
        status: 'Pending',
        history: [{ date: new Date(), status: 'Pending' }],
        trackingHistory: [{ date: new Date(), status: 'Tracking number generated' }]
      });
  

      await newOrder.save();

      res.json({ trackingNumber: trackingNumber });
      console.log(newOrder)
    } catch (error) {
      console.error('Error generating tracking number:', error.message);
      res.status(500).json({ error: 'Failed to generate tracking number' });
    }
  });

  app.put('/admin/update-status/:trackingNumber', async (req, res) => {
    const { trackingNumber } = req.params;
    const { status,amount,address,name} = req.body;
    console.log(name)

    if (!['Pending','Picked Up','In Transit', 'Delivered'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const order = await Order.findOne({ trackingNumber: trackingNumber });
        if (order) {
            order.status = status;
            order.amount = amount;
            order.address = address;
            order.name = name;
            order.history.push({ date: new Date(), status: status, amount: amount, address: address, name: name});
            await order.save();
            res.json({ message: 'Order status updated successfully', order: order });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        console.error('Error updating order status:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to delete an order by tracking number
app.delete('/admin/delete-order/:trackingNumber', async (req, res) => {
    const { trackingNumber } = req.params;

    try {
        const deletedOrder = await Order.findOneAndDelete({ trackingNumber: trackingNumber });
        if (deletedOrder) {
            res.json({ message: 'Order deleted successfully', order: deletedOrder });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        console.error('Error deleting order:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});



// New endpoint to list all tracking numbers with statuses
app.get('/admin/list-orders', async (req, res) => {
    try {
        const orders = await Order.find({}, 'trackingNumber status amount address name');
        res.json({ orders: orders });
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
