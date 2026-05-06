# Teaching Management Platform

A comprehensive **open-source teaching management platform** that empowers educators to manage their classes, students, and teaching workflows effectively. The platform includes advanced features such as scheduling, student grouping, homework management, and AI-powered class report generation.

---

## 🌟 Features

- **Class Scheduling**: Easily schedule and manage class timings.
- **Student Management**: Organize students into classes and groups with intuitive tools.
- **Homework Assignments**: Assign homework, track progress, and provide meaningful feedback.
- **Generative AI Reports**: Automatically generate detailed class reports after each session using cutting-edge AI technology.

---

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- PostgreSQL 16+ (via Docker)
- Redis (via Docker)
- API keys for AI tools (OpenAI)
  > **Note**: The platform does not include API keys. Users must provide their own.

### Installation

1. **Clone the Repository**:

   ```bash
   git clone git@github.com:Kenzen92/lessonbase.git
   cd lessonbase
   ```

2. **Configure Environment**:

   ```bash
   # Copy backend environment template
   cp deploy/env/.env.backend.example backend/.env

   # Edit backend/.env with your database settings and API keys
   ```

3. **Start Development Environment**:

   ```bash
   # Navigate to docker compose directory
   cd deploy/docker

   # Start all services (PostgreSQL, Redis, Django backend)
   docker-compose up

   # Or run in detached mode
   docker-compose up -d
   ```

4. **Set Up the Frontend** (in separate terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the Application**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Django Admin: `http://localhost:8000/admin`

---

## 📜 Usage

1. **Schedule Classes**: Log in as a teacher and create class schedules.
2. **Manage Students**: Group students into classes and monitor their progress.
3. **Assign Homework**: Assign tasks, check submissions, and provide feedback.
4. **Generate Reports**: Leverage AI to generate session summaries and insights.

---

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request on github

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute the code as you wish.  
**Note**: API keys for third-party services are not included and must be configured by the user.

---

## 📫 Contact

For questions or feedback, reach out to us at:  
[jamespeterkenny@gmail.com](mailto:jamespeterkenny@gmail.com)
