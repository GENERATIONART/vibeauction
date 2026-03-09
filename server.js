import express from 'express';
import { supabase, createAuction, placeBid, getActiveAuctions, getUserAuctions } from './supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Auction Routes
app.post('/auctions', async (req, res) => {
  try {
    const auctionData = req.body;
    const newAuction = await createAuction(auctionData);
    res.status(201).json(newAuction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/bids', async (req, res) => {
  try {
    const bidData = req.body;
    const newBid = await placeBid(bidData);
    res.status(201).json(newBid);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/auctions', async (req, res) => {
  try {
    const auctions = await getActiveAuctions();
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user/:userId/auctions', async (req, res) => {
  try {
    const { userId } = req.params;
    const userAuctions = await getUserAuctions(userId);
    res.json(userAuctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});