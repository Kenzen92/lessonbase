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

- Docker
- Node.js (for frontend development)
- MongoDB
- API keys for the AI tools (OpenAI)
  > **Note**: The platform does not include API keys. Users must provide their own.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone git@github.com:Kenzen92/lessonbase.git
   cd lessonbase

   ```
2. **Set Up the Backend**:

   - Navigate to the `backend` directory:
     ```bash
     cd backend
     ```
   - Configure your `.env` file with your database settings and API keys.
   - Create the docker image:
     ```bash
     docker compose build
     ```
   - Run the container in the background:
     ```bash
     docker compose up -d
     ```

3. **Set Up the Frontend**:

   - Navigate to the `frontend` directory:
     ```bash
     cd ../frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```

4. **Run the Application**:

   - Start the frontend development server:
     ```bash
     npm run dev
     ```

5. Access the platform in your browser at `http://localhost:3000`.

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

## ❤️ Acknowledgments

- Thanks to the open-source community for their support.
- Special mention to [OpenAI](https://openai.com/) and other AI tools used in this project.

---

## 📫 Contact

For questions or feedback, reach out to us at:  
[jamespeterkenny@gmail.com](mailto:jamespeterkenny@gmail.com.com)
