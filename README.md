# SyntaxSage

A full-stack web application built for students, beginner developers, and engineers to paste or upload source code, generate structured AI explanations tailored to **Beginner**, **Developer**, or **Manager** levels, save explanations to projects, and ask follow-up questions in a persistent chat workspace.

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express, Multer (file uploads), JWT (`jsonwebtoken`), `bcryptjs`
- **Database:** PostgreSQL (`pg`) with automatic schema creation & local file-store fallback when `DATABASE_URL` is unset
- **AI:** Google Gemini (`@google/genai` SDK)

---

## Folder Structure

```text
├── database/
│   └── schema.sql            # PostgreSQL table creation script
├── server/
│   ├── ai.ts                 # Gemini AI structured explanation & chat service
│   ├── auth.ts               # JWT signing/verification & bcrypt hashing helpers
│   └── db.ts                 # Parameterized PostgreSQL queries & fallback store
├── src/
│   ├── assets/images/        # Generated visual assets
│   ├── components/
│   │   ├── CodeEditorArea.tsx
│   │   ├── ExplanationView.tsx
│   │   └── Navbar.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── pages/
│   │   ├── AuthPages.tsx     # Sign up & Login pages
│   │   ├── ChatPage.tsx      # Follow-up AI Q&A page
│   │   ├── DashboardPage.tsx # Projects & file upload dashboard
│   │   ├── ExplainerPage.tsx # Code editor + structured AI explainer
│   │   ├── HistoryPage.tsx   # Saved explanations library
│   │   ├── HomePage.tsx      # Hero, CTA, supported languages
│   │   └── ProfilePage.tsx   # Account preferences & theme switch
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── server.ts                 # Express + Vite server entry point
└── tsconfig.json
```

---

## Setup & Run Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `GEMINI_API_KEY`: Your Gemini API key (server-side only).
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgres://user:password@host:5432/dbname?sslmode=require`).
- `PORT`: Defaults to `3000`.

### 3. Initialize PostgreSQL Database

Run the SQL schema script against your PostgreSQL database (the server also verifies tables automatically on first query when `DATABASE_URL` is provided):

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

### 4. Run in Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### 5. Build & Run in Production

```bash
npm run build
npm start
```

---

## Sample API Requests for Testing

### 1. Sign Up (`POST /api/auth/signup`)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "password": "password123"
  }'
```

### 2. Login (`POST /api/auth/login`)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com",
    "password": "password123"
  }'
```

### 3. Create Project (`POST /api/projects`)

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectName": "Algorithms Lab",
    "description": "Week 3 Python exercises"
  }'
```

### 4. List Projects (`GET /api/projects`)

```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Upload Code File (`POST /api/files/upload`)

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "projectId=1" \
  -F "programmingLanguage=Python" \
  -F "file=@./sample.py"
```

### 6. Explain Code (`POST /api/explain`)

```bash
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "programmingLanguage": "Python",
    "explanationLevel": "beginner",
    "code": "def add(a, b):\n    return a + b"
  }'
```

### 7. Save & Fetch Explanations (`POST /api/explanations`, `GET /api/explanations`)

```bash
curl http://localhost:3000/api/explanations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Ask Follow-Up Question (`POST /api/chat`) & Get History (`GET /api/chat/:fileId`)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fileId": 1,
    "message": "What happens if I pass a string instead of a number?"
  }'

curl http://localhost:3000/api/chat/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
