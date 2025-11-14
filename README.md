# AsaliTrace 🍯

<div align="center">

**A blockchain-based honey supply chain management system ensuring transparency, traceability, and security from hive to jar.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-orange.svg)](https://soliditylang.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Blockchain Integration](#blockchain-integration)
- [Authentication & Authorization](#authentication--authorization)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## 🎯 Overview

AsaliTrace is an innovative **three-tier blockchain-based supply chain management system** designed to ensure complete transparency, traceability, and security of honey production and distribution. By leveraging Ethereum smart contracts and decentralized ledger technology, AsaliTrace tracks honey from production to consumer, creating an immutable record of every step in the supply chain.

### Key Benefits

- **🔒 Immutability**: All batch records are stored on the blockchain, making them tamper-proof
- **📊 Transparency**: Complete visibility into the honey's journey from hive to jar
- **✅ Verification**: Blockchain verification ensures data integrity and authenticity
- **👥 Access Control**: Role-based permissions ensure only authorized users can manage batches
- **📝 Audit Trail**: Comprehensive logging of all actions for compliance and traceability

### Target Users

- **Beekeepers**: Record honey production batches
- **Processors**: Add lab tests and quality certifications
- **Distributors**: Track shipping and distribution
- **Consumers**: Verify honey authenticity and traceability
- **Administrators**: Full system access and audit capabilities

---

## Features

### Core Features

- ✅ **Batch Management**: Create, update, and track honey batches with unique identifiers
- ✅ **Lab Test Integration**: Record and verify laboratory test results on the blockchain
- ✅ **Certificate Management**: Issue and track quality certificates linked to batches
- ✅ **Blockchain Verification**: Verify batch data against on-chain records
- ✅ **Journey Tracking**: Visual timeline of batch journey from creation to distribution
- ✅ **Statistics Dashboard**: Real-time statistics calculated from database
- ✅ **Trust Score**: Calculate and display trust scores for batches

### Security & Access Control

- 🔐 **JWT Authentication**: Secure token-based authentication
- 👤 **Role-Based Access Control**: Different permissions for different user roles
- 🛡️ **Object-Level Permissions**: Users can only access batches they created or own
- 📋 **Audit Logging**: Complete audit trail of all actions with user, timestamp, and IP address
- 🔑 **Two-Factor Authentication (2FA)**: Optional TOTP-based 2FA for enhanced security

### Social Authentication

- 🔵 **Google OAuth**: Sign in with Google account
- 🐙 **GitHub OAuth**: Sign in with GitHub account
- 🍎 **Apple Sign In**: (Coming soon)

### Blockchain Features

- ⛓️ **Smart Contract Integration**: Ethereum smart contracts for immutable records
- 📝 **Transaction Recording**: Record batches, lab tests, and certificates on-chain
- ✅ **On-Chain Verification**: Verify data integrity against blockchain records
- 🔍 **Transaction Hash Tracking**: Track all blockchain transactions with hashes

### User Interface

- 🎨 **Modern React UI**: Built with React 19, TypeScript, and TailwindCSS
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🎯 **Interactive Journey Map**: Visual representation of batch journey
- 📊 **Real-Time Updates**: Dynamic data display from database and blockchain
- 🌙 **Theme Support**: Light/dark mode support (via next-themes)

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.14
- **UI Library**: Radix UI components
- **Styling**: TailwindCSS 3.4
- **State Management**: React Context API, TanStack Query
- **Routing**: React Router DOM 7.9.4
- **Blockchain**: Ethers.js 6.15.0
- **Forms**: React Hook Form 7.66.0
- **Validation**: Zod 4.1.12
- **HTTP Client**: Axios 1.13.2

### Backend

- **Framework**: Django 5.2.7
- **API**: Django REST Framework 3.14.0
- **Authentication**: djangorestframework-simplejwt 5.5.1
- **Blockchain**: Web3.py 7.13.0, eth-account 0.13.7
- **Database**: SQLite (development) / PostgreSQL (production)
- **CORS**: django-cors-headers 4.3.1
- **2FA**: django-two-factor-auth 1.18.1

### Blockchain

- **Language**: Solidity 0.8.19
- **Framework**: Hardhat
- **Network**: Ethereum (local Hardhat node for development)
- **Testing**: Hardhat test suite

### DevOps

- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (frontend), Gunicorn (backend)
- **Database**: PostgreSQL 15 (production)

---

## 🏗️ Architecture

AsaliTrace follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Tier                        │
│  React + TypeScript + Ethers.js + TailwindCSS           │
│  - User Interface                                       │
│  - Wallet Integration (MetaMask)                        │
│  - API Communication                                    │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST API
                   │ (JWT Authentication)
┌──────────────────▼──────────────────────────────────────┐
│                    Backend Tier                         │
│  Django REST Framework + Web3.py                        │
│  - Business Logic                                       │
│  - API Endpoints                                        │
│  - Database Management                                  │
│  - Blockchain Adapter                                   │
└──────────────────┬──────────────────────────────────────┘
                   │ Web3 RPC
                   │ (Ethereum JSON-RPC)
┌──────────────────▼──────────────────────────────────────┐
│                 Blockchain Tier                         │
│  Ethereum Smart Contracts (Hardhat)                     │
│  - Immutable Batch Records                              │
│  - Lab Test Records                                     │
│  - Certificate Records                                  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → Frontend captures user input
2. **API Request** → Frontend sends authenticated request to Django API
3. **Database Save** → Backend saves data to database first
4. **Blockchain Record** → Backend records data on blockchain (optional, on-demand)
5. **Verification** → Frontend/Backend can verify data against blockchain

---

## 📁 Project Structure

```
AsaliTrace/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components (Radix UI)
│   │   │   ├── HeroSection.tsx
│   │   │   ├── JourneyMap.tsx
│   │   │   ├── TrustScore.tsx
│   │   │   └── ...
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── Web3Context.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Index.tsx
│   │   │   ├── Auth.tsx
│   │   │   ├── Batches.jsx
│   │   │   ├── HoneyBatch.tsx
│   │   │   └── Account.tsx
│   │   ├── services/        # API and blockchain services
│   │   │   ├── api.ts
│   │   │   ├── contract.js
│   │   │   └── socialAuth.js
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useBlockchain.ts
│   │   └── App.tsx          # Main app component
│   ├── public/              # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── backend/                 # Django backend application
│   ├── asalitrace/          # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── blockchain/      # Blockchain adapter
│   │       └── eth_adapter.py
│   ├── batches/             # Batches app
│   │   ├── models.py        # Batch, LabTest, Certificate, AuditLog
│   │   ├── views.py         # API viewsets
│   │   ├── serializers.py   # DRF serializers
│   │   ├── urls.py
│   │   └── utils.py         # Utility functions
│   ├── accounts/            # Authentication app
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                 # Environment variables (not in git)
│   └── Dockerfile
│
├── contracts/               # Smart contracts
│   ├── contracts/
│   │   └── AsaliTrace.sol   # Main smart contract
│   ├── scripts/
│   │   └── deploy.js        # Deployment script
│   ├── test/
│   │   └── AsaliTrace.js    # Contract tests
│   ├── hardhat.config.js
│   └── package.json
│
├── docker-compose.yml       # Docker orchestration
├── deploy.sh               # Deployment script
├── README.md               # This file
└── .env.example            # Example environment variables
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **PostgreSQL** 15+ (for production)
- **Docker** and Docker Compose (optional, for containerized deployment)
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/<username>/AsaliTrace.git
cd AsaliTrace
```

### Step 2: Backend Setup

#### Option A: Local Development

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example if available)
# See Configuration section for required variables

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

#### Option B: Docker

```bash
# From project root
docker-compose up -d db
docker-compose up backend
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
# See Configuration section for required variables

# Run development server
npm run dev
```

### Step 4: Blockchain Setup

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Start Hardhat local node (in a separate terminal)
npx hardhat node

# Deploy contracts (in another terminal)
npx hardhat run scripts/deploy.js --network localhost

# Copy the deployed contract address to backend/.env and frontend/.env
```

### Step 5: Verify Installation

1. **Backend**: Visit `http://localhost:8000/api/` - should show API root
2. **Frontend**: Visit `http://localhost:5173` - should show homepage
3. **Blockchain**: Check Hardhat node is running and contracts are deployed

---

## ⚙️ Configuration

### Backend Environment Variables (`backend/.env`)

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
# For PostgreSQL:
# DB_NAME=asalitrace_db
# DB_USER=asalitrace_user
# DB_PASSWORD=your-password
# DB_HOST=localhost
# DB_PORT=5432

# Blockchain Configuration
PRIVATE_KEY=your-ethereum-private-key
PUBLIC_ADDRESS=your-ethereum-public-address
CONTRACT_ADDRESS=deployed-contract-address
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Frontend Environment Variables (`frontend/.env`)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Blockchain Configuration
VITE_CONTRACT_ADDRESS=deployed-contract-address
VITE_CHAIN_ID=31337

# OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

### Getting OAuth Client IDs

//

---

## 📖 Usage Guide

### For Beekeepers

1. **Sign Up/Login**: Create an account or login at `/auth`
2. **Create Batch**: Navigate to `/batches` and create a new honey batch
3. **Record on Blockchain**: Click "Record on Blockchain" to create immutable record
4. **View Journey**: Click on a batch to see its complete journey timeline

### For Processors

1. **Add Lab Test**: On a batch detail page, add laboratory test results
2. **Record Test on Blockchain**: Record test results on blockchain for verification
3. **Issue Certificate**: Issue quality certificates for tested batches

### For Consumers

1. **Browse Batches**: View all batches (if you have access)
2. **Verify Authenticity**: Click "Verify on Blockchain" to verify batch data
3. **View Journey**: See complete journey from hive to jar

### For Administrators

1. **Full Access**: Access all batches regardless of ownership
2. **Audit Logs**: View complete audit trail in Django admin
3. **User Management**: Manage users and permissions

---

## 📡 API Documentation

### Base URL

```
http://localhost:8000/api/
```

### Authentication

All protected endpoints require JWT authentication:

```http
Authorization: Bearer <access_token>
```

### Batch Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/batches/` | GET | List all batches (filtered by user) | Yes |
| `/api/batches/` | POST | Create a new batch | Yes |
| `/api/batches/{id}/` | GET | Retrieve batch details | Yes |
| `/api/batches/{id}/` | PUT/PATCH | Update batch | Yes |
| `/api/batches/{id}/` | DELETE | Delete batch | Yes |
| `/api/batches/{id}/record-on-chain/` | POST | Record batch on blockchain | Yes |
| `/api/batches/verify-batch/{batch_id}/` | GET | Verify batch from blockchain | Yes |
| `/api/batches/journey/{batch_id}/` | GET | Get batch journey timeline | Yes |
| `/api/batches/statistics/` | GET | Get batch statistics | No |

### Lab Test Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/labtests/` | GET | List all lab tests | Yes |
| `/api/labtests/` | POST | Create a new lab test | Yes |
| `/api/labtests/{id}/record-on-chain/` | POST | Record lab test on blockchain | Yes |
| `/api/labtests/verify-test/{test_id}/` | GET | Verify lab test from blockchain | Yes |

### Certificate Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/certificates/` | GET | List all certificates | Yes |
| `/api/certificates/` | POST | Create a new certificate | Yes |
| `/api/certificates/{id}/record-on-chain/` | POST | Record certificate on blockchain | Yes |
| `/api/certificates/verify-certificate/{cert_id}/` | GET | Verify certificate from blockchain | Yes |

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register/` | POST | Register new user | No |
| `/api/auth/login/` | POST | Login and get JWT tokens | No |
| `/api/auth/refresh/` | POST | Refresh access token | No |
| `/api/auth/logout/` | POST | Logout | Yes |

### Example Request

```bash
# Create a batch
curl -X POST http://localhost:8000/api/batches/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "B001",
    "producer_name": "Honey Farm",
    "production_date": "2024-01-15",
    "honey_type": "Wildflower",
    "quantity": "100.00",
    "status": "created"
  }'
```

---

## ⛓️ Blockchain Integration

### Smart Contract

The `AsaliTrace.sol` contract provides:

- **Batch Management**: Create and retrieve batches
- **Lab Test Management**: Add and retrieve lab tests
- **Certificate Management**: Issue and retrieve certificates

### Recording on Blockchain

1. **Backend Process**:
   - User clicks "Record on Blockchain"
   - Backend creates transaction using Web3.py
   - Transaction is signed with private key
   - Transaction is sent to Hardhat node
   - Transaction hash is stored in database

2. **Verification**:
   - User clicks "Verify on Blockchain"
   - Backend queries smart contract
   - Compares on-chain data with database
   - Returns verification result

### Transaction Hash

Every blockchain transaction receives a unique hash (e.g., `0x29a28fa8264af4c40ecd1339f832f6bc9224d0060967429eb42514ed2c84047f`). This hash:
- Proves the transaction was recorded
- Can be used to verify transaction on blockchain explorers
- Links database records to blockchain records

### Local Development

For local development, use Hardhat node:

```bash
# Start Hardhat node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Production Deployment

For production, deploy to a testnet (e.g., Sepolia) or mainnet:

```bash
# Update hardhat.config.production.js with network settings
npx hardhat run scripts/deploy.js --network sepolia
```

---

## 🔐 Authentication & Authorization

### Authentication Methods

1. **JWT Token Authentication** (Primary)
   - Register/Login via `/api/auth/`
   - Receive access and refresh tokens
   - Include access token in `Authorization` header

2. **Social Authentication** (Optional)
   - Google OAuth
   - GitHub OAuth
   - Apple Sign In (coming soon)

3. **Two-Factor Authentication** (Optional)
   - TOTP-based 2FA
   - QR code setup
   - Backup codes

### Authorization

#### Role-Based Access Control

- **Regular Users**: Can only access batches they created or own
- **Administrators**: Full access to all batches

#### Permission Checks

- `IsAuthenticated`: User must be logged in
- `AllowAny`: Public access (e.g., statistics endpoint)
- Custom permissions: Object-level permissions via `can_user_access_batch()`

### Access Control Flow

1. User makes API request with JWT token
2. Backend validates token
3. Backend checks user permissions
4. If user is admin → allow access
5. If user is regular → check if user created/owns the batch
6. Return 403 Forbidden if access denied

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

//

### Environment-Specific Settings

- **Development**: Use SQLite, Hardhat local node
- **Production**: Use PostgreSQL, deploy to testnet/mainnet, enable HTTPS

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

### Integration Tests

```bash
# Test blockchain integration
cd backend
python scripts/test_blockchain_integration.py
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Blockchain connection failed"

**Solution**:
- Ensure Hardhat node is running: `npx hardhat node`
- Check `BLOCKCHAIN_RPC_URL` in `backend/.env`
- Verify contract is deployed

#### 2. "401 Unauthorized"

**Solution**:
- Check JWT token is included in request headers
- Verify token hasn't expired
- Ensure user is logged in

#### 3. "Batch not found on blockchain"

**Solution**:
- Ensure batch was recorded on blockchain first
- Check transaction hash in database
- Verify transaction was successful on blockchain

#### 4. "Contract address not configured"

**Solution**:
- Set `VITE_CONTRACT_ADDRESS` in `frontend/.env`
- Set `CONTRACT_ADDRESS` in `backend/.env`
- Redeploy contracts if needed

### Debugging

- **Backend Logs**: Check Django console output
- **Frontend Logs**: Check browser console
- **Blockchain Logs**: Check Hardhat node output
- **Network Requests**: Use browser DevTools Network tab

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 for Python code
- Follow ESLint rules for JavaScript/TypeScript
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

### Getting Help

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Email**: Contact the project maintainers

### Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

---

## 👥 Contributors

- **Margaret Wambui Mwaura** – 149264

---

## 🗺️ Roadmap

### Planned Features

- [ ] IPFS integration for document storage
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] QR code scanning for batch verification
- [ ] Email notifications
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] GraphQL API option

---

<div align="center">

**Built with ❤️ for transparent honey supply chains**

[⭐ Star us on GitHub](https://github.com/mwauramargaret/AsaliTrace) | [📖 Documentation](./docs) | [🐛 Report Bug](https://github.com/mwauramargaret/AsaliTrace/issues)

</div>
