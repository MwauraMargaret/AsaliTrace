[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/F63P1L7A)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20100718&assignment_repo_type=AssignmentRepo)

# AsaliTrace-GRP-A

A **blockchain-based supply chain management system** designed to ensure transparency, traceability, and security of honey production and distribution. This project leverages smart contracts and decentralized ledger technology to track honey from farm to consumer.

---

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Setup and Installation](#setup-and-installation)  
- [Project Structure](#project-structure)  
- [Models & Relationships](#models--relationships)  
- [Smart Contracts](#smart-contracts)  
- [Serializers & Views](#serializers--views)  
- [API Endpoints](#api-endpoints)  
- [Authentication & Permissions](#authentication--permissions)  
- [Testing](#testing)  
- [Future Work](#future-work)  
- [Contributors](#contributors)  

---

## Overview

AsaliTrace-GRP-A is an innovative solution for the honey supply chain. By using blockchain, we ensure:

- **Traceability**: Track honey from production to sale.  
- **Transparency**: Every transaction is recorded on the blockchain and immutable.  
- **Security**: Only authorized participants can add or modify data.  

The system is designed for beekeepers, distributors, and consumers.

---

## Features

- Track honey batches through the supply chain  
- Record production, storage, and distribution events  
- Smart contract-based verification  
- User authentication and role-based permissions  
- Data integrity via blockchain ledger  

---

## Tech Stack

- **Blockchain**: Ethereum (via Hardhat & Ethers.js)  
- **Backend**: Django REST Framework  
- **Frontend**: React.js (planned for full UI integration)  
- **Database**: PostgreSQL / SQLite  
- **Testing**: PyTest, Chai & Mocha (for smart contracts)  
- **Version Control**: Git & GitHub  

---

## Setup and Installation

1. **Clone the repository**

```bash
git clone https://github.com/<username>/AsaliTrace-GRP-A.git
cd AsaliTrace-GRP-A
```

2. **Set up a virtual environment**

```bash
python -m venv venv
```
---

## Project Structure ##

```
AsaliTrace-GRP-A/
├── contracts/       # Smart contracts
├── scripts/         # Deployment scripts
├── tests/           # Smart contract tests
├── backend/         # Django backend
│   ├── asali_app/   # Django app
│   ├── manage.py
│   └── requirements.txt
├── frontend/        # React frontend (planned)
├── README.md
├── package.json
└── hardhat.config.js

```
## Models & Relationships

- **User**: Stores user information and roles. Roles include:
  - Beekeeper
  - Distributor
  - Consumer
- **HoneyBatch**: Represents a batch of honey with attributes:
  - Batch ID
  - Origin
  - Quantity
  - Production Date
  - Owner (User)
- **Transaction**: Logs events in the supply chain:
  - Linked to a HoneyBatch
  - Event type (Production, Transfer, Sale)
  - Timestamp
  - Actor (User)
- **Blockchain Ledger**: Records immutable transactions of batches on the blockchain.

Relationships:

- `User` can own multiple `HoneyBatch` entries.  
- `HoneyBatch` can have multiple `Transaction` records.  
- All `Transaction` events are mirrored on the blockchain ledger.

---

## Serializers & Views

**Serializers**: Convert Django models to JSON for API responses:

- `UserSerializer`
- `HoneyBatchSerializer`
- `TransactionSerializer`

**Views**: API endpoints using Django REST Framework:

- `UserViewSet` – CRUD operations for users  
- `HoneyBatchViewSet` – Create, read, update, delete honey batches  
- `TransactionViewSet` – Record and view supply chain events  

---

## Smart Contracts

- **HoneyBatchContract.sol**:  
  - Create and manage honey batches  
  - Track ownership and transfers between participants  

- **SupplyChain.sol**:  
  - Record supply chain events (production, transfer, sale)  
  - Ensure immutability and traceability on the blockchain  

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/` | GET / POST | List users / Create a new user |
| `/api/users/<id>/` | GET / PUT / DELETE | Retrieve, update, or delete a user |
| `/api/batches/` | GET / POST | List honey batches / Create a new batch |
| `/api/batches/<id>/` | GET / PUT / DELETE | Retrieve, update, or delete a batch |
| `/api/transactions/` | GET / POST | List transactions / Create a new transaction |
| `/api/transactions/<id>/` | GET / PUT / DELETE | Retrieve, update, or delete a transaction |

---

## Authentication & Permissions

- **Role-based access control**:
  - Beekeeper: Add batches, update production events  
  - Distributor: Record distribution events  
  - Consumer: View batch provenance  
- **Authentication**:
  - JWT-based authentication for secure API access  
- **Permissions**:
  - Only authorized users can perform certain actions  
  - Secure endpoints to prevent unauthorized modifications  

---

## Testing

- **Unit tests**: Test Django models, serializers, and views  
- **Integration tests**: Ensure backend interacts correctly with smart contracts  
- **Smart contract tests**: Use Hardhat, Chai, and Mocha to validate contract logic  

---

## Future Work

- Build a **React.js frontend** with interactive supply chain visualization  
- Integrate **IPFS** for decentralized storage of batch documents  
- Advanced analytics dashboard for supply chain insights  
- Mobile application for end-consumer tracking and verification  

---

## Contributors

- **Margaret Wambui Mwaura** – 149264
