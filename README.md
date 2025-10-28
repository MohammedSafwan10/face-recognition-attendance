# 🎓 Face Recognition Attendance System

A complete cloud-based attendance management system using face recognition, GPS verification, and QR code scanning for colleges and educational institutions.

## ✨ Features

### 👨‍💼 Admin Portal
- Manage courses, semesters, subjects, and classes
- Register students and teachers with face data
- View comprehensive attendance reports
- Export data to CSV

### 👨‍🏫 Teacher Portal
- Create attendance sessions with QR codes
- Enable GPS verification for classroom location
- View session history and statistics
- Real-time attendance tracking

### 👨‍🎓 Student Portal
- Mark attendance using face recognition
- QR code scanning
- GPS location verification
- View weekly class schedules
- Track personal attendance reports

## 🚀 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Face Recognition:** face-api.js (TensorFlow.js)
- **Authentication:** Email OTP (Resend API)
- **Deployment:** Vercel

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd face_recognition

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

## ⚙️ Configuration

Create a `.env` file with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=your_secure_password
```

**Note:** Never commit `.env` file to Git. It's already in `.gitignore`.

## 🏃‍♂️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

### Supabase Setup
1. Create a Supabase project
2. Run migrations from `migrations/` folder
3. Deploy Edge Functions from `supabase/functions/`
4. Configure Resend API key in Supabase Vault

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add environment variables in Vercel Dashboard.

## 📱 Default Login Credentials

**Admin:**
- Username: `admin`
- Password: `admin123` (change in production)

**Teachers/Students:**
- Use email-based OTP login

## 🔒 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ No API keys in source code
- ✅ Secrets stored in Supabase Vault
- ✅ `.env` files in `.gitignore`
- ✅ Face data encrypted in database

## 📄 License

MIT License - feel free to use for your college project

## 🤝 Contributing

This is a college project. Feel free to fork and modify for your needs.

## ⚠️ Important Notes

- Change default admin credentials before production deployment
- Download face-api.js models to `public/models/` folder
- Configure email service (Resend) for OTP functionality
- Test face recognition in good lighting conditions

## 🆘 Support

For setup help, check the `.env.example` file for required configuration.

---

Built with ❤️ for educational purposes
