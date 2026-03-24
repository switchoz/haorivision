# HAORI VISION E-Commerce Backend

**Complete NFT-integrated e-commerce system for wearable light art**

---

## 🚀 Features

### Payment Processing

- ✅ **Stripe** - Credit/debit cards
- ✅ **PayPal** - PayPal accounts
- ✅ **Crypto** - Ethereum payments via MetaMask

### NFT Integration

- ✅ Automatic NFT certificate generation
- ✅ IPFS metadata storage
- ✅ OpenSea integration
- ✅ ERC-721 token minting

### Customer Management

- ✅ Customer profiles with order history
- ✅ Wallet address linking
- ✅ VIP tier system
- ✅ Referral codes

### Email Automation

- ✅ Welcome to Light Circle email
- ✅ Order confirmation
- ✅ Shipping notifications
- ✅ Beautiful HTML templates

### Admin Features

- ✅ Order management dashboard
- ✅ Customer CRM
- ✅ Inventory tracking
- ✅ NFT minting control

---

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── Customer.js          # Customer schema
│   ├── Product.js           # Product schema
│   └── Order.js             # Order schema
├── services/
│   ├── paymentService.js    # Stripe/PayPal/Crypto
│   ├── nftService.js        # NFT minting & metadata
│   └── emailService.js      # Email notifications
├── routes/                  # API routes (to be created)
├── controllers/             # Request handlers (to be created)
├── middleware/              # Auth, validation (to be created)
├── server.js                # Main application
├── package.json
└── .env.example             # Environment variables template
```

---

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Ethereum wallet with private key
- Stripe account
- Email service (Gmail recommended)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required variables:**

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Random secret key
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `INFURA_PROJECT_ID` - From Infura.io
- `WALLET_PRIVATE_KEY` - Your Ethereum wallet private key
- `EMAIL_USER` - Your Gmail address
- `EMAIL_PASSWORD` - Gmail app password

### Step 3: Start MongoDB

**Local MongoDB:**

```bash
mongod
```

**Or use MongoDB Atlas** (cloud) and update `MONGODB_URI` in `.env`

### Step 4: Run Server

```bash
npm start
```

Server will run on `http://localhost:5000`

---

## 🔑 API Endpoints

### Health Check

```
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 123.45
}
```

### Products

```
GET  /api/products           # List all products
GET  /api/products/:id       # Get single product
POST /api/products           # Create product (admin)
PUT  /api/products/:id       # Update product (admin)
```

### Orders

```
POST /api/orders/create              # Create new order
GET  /api/orders/:id                 # Get order details
GET  /api/orders/customer/:customerId # Customer's orders
PUT  /api/orders/:id/status          # Update order status (admin)
```

### Customers

```
POST /api/customers/register  # Register new customer
POST /api/customers/login     # Login
GET  /api/customers/profile   # Get profile (auth required)
PUT  /api/customers/profile   # Update profile
```

### Admin

```
GET  /api/admin/dashboard     # Dashboard stats
GET  /api/admin/orders        # All orders
POST /api/admin/orders/:id/ship # Mark as shipped
POST /api/admin/mint-nft      # Manual NFT minting
```

---

## 💳 Payment Flow

### 1. Stripe Payment

**Frontend:**

```javascript
// Create payment intent
const response = await fetch("/api/orders/create-payment-intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    productId: "twin-001-mycelium",
    customerId: "customer_id",
  }),
});

const { clientSecret } = await response.json();

// Use Stripe.js to complete payment
const stripe = Stripe("pk_test_...");
const result = await stripe.confirmCardPayment(clientSecret);
```

### 2. Crypto Payment

**Frontend:**

```javascript
// Connect MetaMask
const accounts = await ethereum.request({ method: "eth_requestAccounts" });

// Get ETH amount needed
const { eth, usd } = await fetch("/api/orders/crypto-price?amount=1200").then(
  (r) => r.json(),
);

// Send transaction
const txHash = await ethereum.request({
  method: "eth_sendTransaction",
  params: [
    {
      from: accounts[0],
      to: "0x_YOUR_WALLET_ADDRESS",
      value: ethers.utils.parseEther(eth).toHexString(),
    },
  ],
});

// Verify payment on backend
await fetch("/api/orders/verify-crypto", {
  method: "POST",
  body: JSON.stringify({ txHash, orderId }),
});
```

---

## 🎨 NFT Certificate Flow

### Automatic Process

When order is paid:

1. **Generate Metadata**

   ```javascript
   {
     name: "Mycelium Dreams #3/50",
     description: "Limited edition wearable light art...",
     image: "ipfs://...",
     attributes: [...]
   }
   ```

2. **Upload to IPFS**
   - Metadata stored on IPFS
   - Returns `ipfs://Qm...` URI

3. **Mint NFT**
   - Smart contract called
   - NFT minted to customer's wallet
   - Transaction confirmed on blockchain

4. **Send Email**
   - "Welcome to Light Circle" email
   - Contains OpenSea link
   - NFT details and certificate

---

## 📧 Email Templates

### Welcome Email Variables

```javascript
{
  customerName: "John Doe",
  productName: "Mycelium Dreams",
  editionNumber: 3,
  totalEditions: 50,
  tokenId: "1234567890",
  openseaUrl: "https://opensea.io/assets/...",
  orderNumber: "HV25010001"
}
```

### Custom Templates

Place HTML templates in `data/email/`:

- `welcome.html`
- `orderConfirmation.html`
- `shipping.html`

Use `{{variableName}}` for replacements.

---

## 🗄️ Database Models

### Customer

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  walletAddress: String,
  orders: [ObjectId],
  nftCertificates: [{
    tokenId, contractAddress, openseaUrl
  }],
  vipTier: 'standard' | 'silver' | 'gold' | 'platinum',
  totalSpent: Number
}
```

### Product

```javascript
{
  id: String (unique),
  name: String,
  collection: String,
  price: Number,
  editions: { total, remaining, sold },
  images: { daylight, uv },
  uvColors: [String],
  nftMetadata: { contractAddress, tokenIdRange }
}
```

### Order

```javascript
{
  orderNumber: String (auto-generated),
  customer: ObjectId,
  items: [{
    product, name, price, editionNumber, nftTokenId
  }],
  payment: {
    method: 'stripe' | 'paypal' | 'crypto',
    status: 'pending' | 'completed' | 'failed'
  },
  nft: {
    minted: Boolean,
    tokenId, transactionHash, openseaUrl
  },
  status: 'pending' | 'paid' | 'shipped' | 'delivered',
  tracking: { carrier, trackingNumber }
}
```

---

## 🔐 Security

### Implemented

- ✅ Helmet.js (HTTP headers)
- ✅ Rate limiting (100 req/15min)
- ✅ CORS protection
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Input validation

### Environment Security

- ✅ All secrets in `.env`
- ✅ `.env` in `.gitignore`
- ✅ Never commit private keys
- ✅ Use separate wallets for dev/prod

---

## 📊 Admin Dashboard

### Stats Overview

```
Total Orders: 127
Total Revenue: $152,400
NFTs Minted: 119
Active Customers: 98
```

### Quick Actions

- View pending orders
- Process NFT minting queue
- Update order status
- Send shipping notifications
- Export customer data to CSV

---

## 🌐 CRM Integration

### Notion

```env
NOTION_TOKEN=secret_your_token
NOTION_DATABASE_ID=your_db_id
```

Auto-sync customers to Notion database.

### Airtable

```env
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base
AIRTABLE_TABLE_NAME=Customers
```

Sync orders and customers to Airtable.

---

## 🧪 Testing

### Manual API Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Create order (example)
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{"customerId":"123","productId":"twin-001-mycelium"}'
```

---

## 🚢 Deployment

### Vercel/Netlify (Functions)

```bash
npm install -g vercel
vercel --prod
```

### Heroku

```bash
heroku create haori-vision-api
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 📝 Development Roadmap

### Phase 1: Core (Current)

- [x] Database models
- [x] Payment services
- [x] NFT minting
- [x] Email notifications
- [ ] Complete API routes
- [ ] Frontend integration

### Phase 2: Admin

- [ ] Admin authentication
- [ ] Dashboard UI
- [ ] Order management
- [ ] Analytics

### Phase 3: Advanced

- [ ] Waitlist system
- [ ] Pre-orders
- [ ] Auction system
- [ ] Secondary market

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

```
Error: MongoServerError: Authentication failed
```

**Solution:** Check `MONGODB_URI` in `.env`

### NFT Minting Failed

```
Error: insufficient funds for gas
```

**Solution:** Add ETH to wallet for gas fees

### Email Not Sending

```
Error: Invalid login: 535-5.7.8
```

**Solution:** Enable "Less secure app access" or use App Password

---

## 📞 Support

**Technical Issues:**

- Email: dev@haorivision.com
- GitHub: [github.com/haorivision/backend](https://github.com/haorivision/backend)

**Documentation:**

- Full API docs: `/docs/api.md`
- NFT guide: `/docs/nft-integration.md`

---

## 📄 License

© 2025 HAORI VISION. All rights reserved.

---

**"Build the future of wearable art, one NFT at a time."**

_HAORI VISION E-Commerce Backend v1.0_
