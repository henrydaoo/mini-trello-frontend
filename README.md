# Mini Trello — Task & Project Management System

> A Kanban-style collaboration platform built around nested relational data, board-scoped authorization, and stateless JWT authentication.

## Overview

Mini Trello covers the design, implementation, and operation of a multi-user task management system. The central challenge is modeling hierarchical data (Board → List → Task → Comment) across several users while keeping access control consistent at every level of the hierarchy.

The platform focuses on:

- Relational domain modeling with JPA/Hibernate, including a many-to-many board membership model.
- Stateless authentication and role-based authorization with Spring Security and JWT.
- Board-scoped access control for owners and members.
- Kanban workflows: ordered lists, ordered tasks, assignment, and moving tasks between lists.
- Notifications delivered through each user's preferred channel.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [For Users](#for-users)
  - [For Board Owners](#for-board-owners)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Technology Stack](#technology-stack)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Clone the Repositories](#clone-the-repositories)
  - [Start PostgreSQL](#start-postgresql)
  - [Run the Backend](#run-the-backend)
  - [Run the Frontend](#run-the-frontend)
  - [Configuration](#configuration)

## Key Features

### For Users

- Account registration and login with JWT authentication.
- Create and manage boards.
- Organize work into lists (for example *To Do*, *In Progress*, *Done*).
- Create tasks with title, description, priority (`LOW`, `MEDIUM`, `HIGH`), and due date.
- Reorder lists and move tasks between lists.
- Assign tasks to board members.
- Comment on tasks and delete your own comments.
- Receive a notification when a task is assigned to you, through your preferred channel (`EMAIL` or `IN_APP`).
- In-app notification feed with read/unread state.

### For Board Owners

- Update or delete boards.
- Invite members by email and remove members.
- Delete lists.
- Full visibility into every list, task, and comment on the board.

## System Architecture

The backend owns all business rules and persistence; the frontend only calls its REST API.

```mermaid
flowchart TB
    Browser[User Browser]
    Frontend[Next.js Frontend]
    Filter[JWT Authentication Filter]
    Controller[Controllers]
    Service[Services]
    Repository[Spring Data JPA Repositories]
    DB[(PostgreSQL)]

    Browser --> Frontend
    Frontend -->|REST + Bearer JWT| Filter
    Filter --> Controller
    Controller --> Service
    Service --> Repository
    Repository --> DB
```

## Database Design

```mermaid
erDiagram
    USER ||--o{ BOARD : owns
    USER ||--o{ BOARD_MEMBER : joins
    BOARD ||--o{ BOARD_MEMBER : has
    BOARD ||--o{ TASK_LIST : contains
    TASK_LIST ||--o{ TASK : contains
    USER ||--o{ TASK : "assigned to"
    TASK ||--o{ COMMENT : has
    USER ||--o{ COMMENT : writes
    USER ||--o{ NOTIFICATION : receives
    TASK ||--o{ NOTIFICATION : triggers

    USER {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar role "USER, ADMIN"
        varchar notification_preference "EMAIL, IN_APP"
        timestamp created_at
        timestamp updated_at
    }
    BOARD {
        bigint id PK
        varchar name
        text description
        bigint owner_id FK
        timestamp created_at
        timestamp updated_at
    }
    BOARD_MEMBER {
        bigint id PK
        bigint board_id FK
        bigint user_id FK
        timestamp joined_at
    }
    TASK_LIST {
        bigint id PK
        bigint board_id FK
        varchar name
        int position
        timestamp created_at
    }
    TASK {
        bigint id PK
        bigint list_id FK
        varchar title
        text description
        bigint assignee_id FK "nullable"
        varchar priority "LOW, MEDIUM, HIGH"
        date due_date
        int position
        timestamp created_at
        timestamp updated_at
    }
    COMMENT {
        bigint id PK
        bigint task_id FK
        bigint user_id FK
        text content
        timestamp created_at
    }
    NOTIFICATION {
        bigint id PK
        bigint user_id FK
        bigint task_id FK
        varchar type "EMAIL, IN_APP"
        text message
        boolean is_read
        timestamp created_at
    }
```

## Technology Stack

### Backend

- Java 17
- Spring Boot 3 (Spring Web)
- Spring Security with JWT
- Spring Data JPA / Hibernate
- PostgreSQL
- Bean Validation
- springdoc-openapi (Swagger UI)
- JUnit 5 and Mockito

### Frontend

- Next.js 14 (App Router) with TypeScript
- Tailwind CSS
- shadcn-style components on Radix UI primitives
- react-hook-form with Zod
- axios (JWT interceptor)
- sonner (toasts)

## Project Structure

The project is split into two repositories:

- [`mini-trello-backend`](https://github.com/henrydaoo/mini-trello-backend) — REST API
- [`mini-trello-frontend`](https://github.com/henrydaoo/mini-trello-frontend) — web client

```text
mini-trello-backend/
├── src/
│   ├── main/
│   │   ├── java/.../
│   │   │   ├── controller/      REST controllers
│   │   │   ├── service/         Business rules and transactions
│   │   │   ├── repository/      Spring Data JPA repositories
│   │   │   ├── entity/          JPA entities
│   │   │   ├── dto/             Request and response models
│   │   │   ├── exception/       Custom exceptions and global handler
│   │   │   └── security/        JWT filter and security configuration
│   │   └── resources/           Application configuration
│   └── test/                    Tests
└── pom.xml

mini-trello-frontend/
├── src/
│   ├── app/                     Next.js App Router pages and layouts
│   ├── components/              UI components (components/ui: Radix-based primitives)
│   ├── hooks/                   Custom React hooks
│   └── lib/                     API client, validation schemas, utilities
├── tailwind.config.ts
└── package.json
```

## Quick Start

### Prerequisites

- Java 17+
- Maven
- Node.js 18+
- PostgreSQL 14+ (local install or Docker)
- Git

### Clone the Repositories

```bash
git clone https://github.com/henrydaoo/mini-trello-backend.git
git clone https://github.com/henrydaoo/mini-trello-frontend.git
```

### Start PostgreSQL

```bash
docker run --name mini-trello-db \
  -e POSTGRES_DB=mini_trello \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:16
```

### Run the Backend

```bash
cd mini-trello-backend
# configure the datasource and JWT settings (see Configuration)
./mvnw spring-boot:run
```

### Run the Frontend

```bash
cd mini-trello-frontend
cp .env.example .env.local
# set the backend URL (see Configuration)
npm install
npm run dev
```

Services will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

### Configuration

**Backend** (`application.properties` or environment variables)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mini_trello
spring.datasource.username=postgres
spring.datasource.password=postgres

app.jwt.secret=your_jwt_secret
app.jwt.expiration-ms=86400000
```

**Frontend** (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```
