# FlowCatalyst - Enterprise Workflow Automation Platform

FlowCatalyst is a high-performance, scalable SaaS platform designed for seamless workflow automation. Much like Zapier, FlowCatalyst empowers users to connect disparate applications and automate repetitive tasks through "Zaps"—powerful, multi-step workflows triggered by real-time events.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Kafka](https://img.shields.io/badge/Kafka-Distributed-orange?style=flat-square&logo=apache-kafka)](https://kafka.apache.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)

## 🚀 Key Features

- **Visual Workflow Builder**: Intuitive drag-and-drop interface powered by React Flow for designing complex automations.
- **Multi-Step Zaps**: Support for workflows with multiple sequential actions and conditional logic.
- **Robust Integrations**:
  - **GitHub**: Trigger workflows based on PRs, issues, and commits.
  - **Google Sheets**: Automate data entry and spreadsheet management.
  - **Email (Gmail/Nodemailer)**: Automated notifications and communication.
  - **Web3 (Solana)**: Execute on-chain transfers and blockchain interactions.
  - **Job Scrapers**: Built-in Python scrapers for LinkedIn and Indeed.
- **Enterprise-Grade Security**: OAuth2 integration (Google/GitHub) and JWT-based authentication.
- **Integrated Payments**: Global payment support via DodoPayments and Cashfree.
- **Scalable Execution**: Event-driven architecture using Kafka for high-throughput processing.

## 🏗️ System Architecture

FlowCatalyst is built as a modern monorepo using **Turborepo**, ensuring consistency and high performance across all services.

### Applications (`apps/`)

- **Frontend**: A sleek Next.js dashboard for building and managing Zaps.
- **Primary Backend**: The core Express.js API handling authentication, CRUD, and business logic.
- **Hooks Service**: Dedicated ingestion engine for webhooks and background tasks.
- **Processor**: Implements the Transactional Outbox pattern to ensure reliable event delivery to Kafka.
- **Worker**: The distributed execution engine that consumes Kafka events and runs workflow actions.

### Shared Packages (`packages/`)

- **Database**: Centralized Prisma schema and client for PostgreSQL.
- **UI**: A shared React component library built with Tailwind CSS and Radix UI.
- **Configuration**: Shared ESLint and TypeScript configurations.

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion, Zustand, React Flow.
- **Backend**: Node.js, Express.js, Passport.js.
- **Database**: PostgreSQL with Prisma ORM.
- **Messaging**: Apache Kafka (via KafkaJS).
- **Blockchain**: Solana Web3.js.
- **DevOps**: Docker, Turborepo.

## 🏁 Getting Started

### Prerequisites

- Node.js (>= 18)
- Docker (for Kafka and PostgreSQL)
- Python (for job scraping capabilities)

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` in the root and respective app directories.

3. Initialize the database:
   ```bash
   npm run db:update
   ```

4. Start the development environment:
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
