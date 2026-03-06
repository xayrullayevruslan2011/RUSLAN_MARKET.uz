import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(process.cwd(), "data.json");

// Initial data structure
const getInitialData = () => ({
  products: [
    {
      id: "p1",
      name: "AirPods Pro Gen 2 (Premium)",
      pinduoduoPrice: 320000,
      oldPrice: 450000,
      description: "Eng so'nggi rusumdagi AirPods Pro. Shovqinni kamaytirish (ANC) va yuqori sifatli ovoz. Xitoyning eng yaxshi fabrikasidan keltiriladi.",
      category: "Elektronika",
      images: [
        "https://images.unsplash.com/photo-1588423770186-80f3ef9adad0?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600294037681-c80b4cbfa11c?q=80&w=1000&auto=format&fit=crop"
      ],
      videos: [
        "https://assets.mixkit.co/videos/preview/mixkit-girl-putting-on-white-wireless-headphones-to-listen-to-music-34533-large.mp4"
      ],
      sizes: ["Oq", "Qora"],
      rating: 4.9,
      salesCount: 1240,
      seller: {
        name: "Ruslan Electronics",
        avatar: "",
        rating: 5,
        description: "Ishonchli yetkazib beruvchi"
      },
      isOriginal: true,
      isCheapPrice: true,
      isFlashSale: true,
      flashSaleEnd: Date.now() + 86400000,
      reviews: []
    },
    {
      id: "p2",
      name: "Nike Air Jordan 1 Low",
      pinduoduoPrice: 450000,
      oldPrice: 600000,
      description: "Sifatli krossovkalar. Kundalik kiyish uchun juda qulay va zamonaviy dizayn. Ranglari tanlovda mavjud.",
      category: "Oyoq kiyim",
      images: [
        "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop"
      ],
      videos: [
        "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-shoes-walking-on-pavement-4361-large.mp4"
      ],
      sizes: ["39", "40", "41", "42", "43", "44"],
      rating: 4.8,
      salesCount: 850,
      seller: {
        name: "Sneaker Shop Uz",
        avatar: "",
        rating: 4.9,
        description: "Brend oyoq kiyimlar mutaxassisi"
      },
      isOriginal: true
    }
  ],
  users: [],
  orders: [],
  banners: [
    {
      id: "b1",
      title: "Xuddi Malikadek",
      subtitle: "Smartfon va boshqa texnikalar hamyonbop narxlarda",
      image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80"
    }
  ],
  promoCodes: [],
  partnerships: [],
  wishlists: {},
  supportMessages: []
});

// Load data from file
const loadData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(getInitialData()));
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    // Ensure new fields exist
    if (!data.promoCodes) data.promoCodes = [];
    if (!data.partnerships) data.partnerships = [];
    if (!data.wishlists) data.wishlists = {};
    if (!data.supportMessages) data.supportMessages = [];
    return data;
  } catch (e) {
    return getInitialData();
  }
};

// Save data to file
const saveData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API: Get all data
  app.get("/api/data", (req, res) => {
    res.json(loadData());
  });

  // API: Partnership request
  app.post("/api/partnerships", (req, res) => {
    const data = loadData();
    const newRequest = { ...req.body, id: `PART-${Date.now()}`, status: 'pending', date: new Date().toISOString() };
    data.partnerships.push(newRequest);
    saveData(data);
    res.json({ success: true, request: newRequest });
  });

  // API: Update partnership (Admin only)
  app.post("/api/partnerships/update", (req, res) => {
    const data = loadData();
    const { id, status } = req.body;
    const index = data.partnerships.findIndex((p: any) => p.id === id);
    if (index > -1) {
      data.partnerships[index].status = status;
      
      // If approved, generate 50 promo codes
      if (status === 'approved') {
        const userId = data.partnerships[index].userId;
        const type = data.partnerships[index].type; // '40' or '55'
        const discount = type === '40' ? 0.4 : 0.55;
        
        for (let i = 0; i < 50; i++) {
          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          data.promoCodes.push({
            id: `PROMO-${Date.now()}-${i}`,
            code,
            discount,
            ownerId: userId,
            isUsed: false,
            usedBy: null
          });
        }
      }
      
      saveData(data);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  });

  // API: Wishlist toggle
  app.post("/api/wishlist/toggle", (req, res) => {
    const data = loadData();
    const { userId, productId } = req.body;
    if (!data.wishlists[userId]) data.wishlists[userId] = [];
    
    const index = data.wishlists[userId].indexOf(productId);
    if (index > -1) {
      data.wishlists[userId].splice(index, 1);
    } else {
      data.wishlists[userId].push(productId);
    }
    
    saveData(data);
    res.json({ success: true, wishlist: data.wishlists[userId] });
  });

  // API: Support messages
  app.post("/api/support", (req, res) => {
    const data = loadData();
    const newMessage = { ...req.body, id: `MSG-${Date.now()}`, date: new Date().toISOString() };
    data.supportMessages.push(newMessage);
    saveData(data);
    res.json({ success: true });
  });

  // API: Update products (Admin only)
  app.post("/api/products", (req, res) => {
    const data = loadData();
    const newProduct = req.body;
    const existingIndex = data.products.findIndex((p: any) => p.id === newProduct.id);
    if (existingIndex > -1) {
      data.products[existingIndex] = newProduct;
    } else {
      data.products.push(newProduct);
    }
    saveData(data);
    res.json({ success: true });
  });

  // API: Delete product (Admin only)
  app.delete("/api/products/:id", (req, res) => {
    const data = loadData();
    const { id } = req.params;
    data.products = data.products.filter((p: any) => p.id !== id);
    saveData(data);
    res.json({ success: true });
  });

  // API: Update banners (Admin only)
  app.post("/api/banners", (req, res) => {
    const data = loadData();
    data.banners = req.body;
    saveData(data);
    res.json({ success: true });
  });

  // API: Register/Update user
  app.post("/api/users", (req, res) => {
    const data = loadData();
    const newUser = req.body;
    const existingIndex = data.users.findIndex((u: any) => u.phoneNumber === newUser.phoneNumber);
    if (existingIndex > -1) {
      data.users[existingIndex] = { ...data.users[existingIndex], ...newUser };
    } else {
      data.users.push(newUser);
    }
    saveData(data);
    res.json({ success: true, user: newUser });
  });

  // API: Use promo code
  app.post("/api/promo/use", (req, res) => {
    const data = loadData();
    const { code } = req.body;
    const promoIndex = data.promoCodes.findIndex((p: any) => p.code.toUpperCase() === code.toUpperCase());
    if (promoIndex > -1) {
      const promo = data.promoCodes[promoIndex];
      data.promoCodes[promoIndex].isUsed = true;
      
      // Reward the owner
      const ownerIndex = data.users.findIndex((u: any) => u.telegramId === promo.ownerId);
      if (ownerIndex > -1) {
        // Reward owner with 20,000 UZS per use
        data.users[ownerIndex].referralBalance = (data.users[ownerIndex].referralBalance || 0) + 20000;
      }
      
      saveData(data);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Promo code not found" });
    }
  });

  // API: Create order
  app.post("/api/orders", (req, res) => {
    const data = loadData();
    const newOrder = { ...req.body, id: `ORD-${Date.now()}` };
    data.orders.push(newOrder);
    saveData(data);
    res.json({ success: true, order: newOrder });
  });

  // API: Update order (Status and Track Number)
  app.post("/api/orders/update", (req, res) => {
    const data = loadData();
    const { id, status, trackNumber } = req.body;
    const orderIndex = data.orders.findIndex((o: any) => o.id === id);
    if (orderIndex > -1) {
      data.orders[orderIndex] = { ...data.orders[orderIndex], status, trackNumber };
      saveData(data);
      res.json({ success: true, order: data.orders[orderIndex] });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // API: Delete order
  app.delete("/api/orders/:id", (req, res) => {
    const data = loadData();
    const { id } = req.params;
    data.orders = data.orders.filter((o: any) => o.id !== id);
    saveData(data);
    res.json({ success: true });
  });

  // API: Notify Admin via Telegram
  app.post("/api/notify", async (req, res) => {
    const { message, chatId } = req.body;
    const token = process.env.TELEGRAM_TOKEN || '8543158894:AAHkaN83tLCgNrJ-Omutn744aTui784GScc';
    const targetChatId = chatId || '8215056224';
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetChatId, text: message, parse_mode: 'Markdown' })
      });
      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // API: Add referral bonus
  app.post("/api/referral/add", (req, res) => {
    const data = loadData();
    const { referrerId, amount } = req.body;
    const userIndex = data.users.findIndex((u: any) => u.telegramId === referrerId || u.phoneNumber === referrerId);
    if (userIndex > -1) {
      data.users[userIndex].referralBalance = (data.users[userIndex].referralBalance || 0) + amount;
      data.users[userIndex].invitedCount = (data.users[userIndex].invitedCount || 0) + 1;
      saveData(data);
      res.json({ success: true, user: data.users[userIndex] });
    } else {
      res.status(404).json({ error: "Referrer not found" });
    }
  });

  // API: Add review to product
  app.post("/api/products/:id/reviews", (req, res) => {
    const data = loadData();
    const { id } = req.params;
    const review = { ...req.body, id: `REV-${Date.now()}`, date: new Date().toISOString().split('T')[0] };
    
    const productIndex = data.products.findIndex((p: any) => p.id === id);
    if (productIndex > -1) {
      if (!data.products[productIndex].reviews) {
        data.products[productIndex].reviews = [];
      }
      data.products[productIndex].reviews.unshift(review);
      
      // Update product rating
      const reviews = data.products[productIndex].reviews;
      const avgRating = reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length;
      data.products[productIndex].rating = Number(avgRating.toFixed(1));
      
      saveData(data);
      res.json({ success: true, review });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
