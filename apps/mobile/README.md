# Learnova Mobile (Flutter)

The student companion app for Learnova. Talks to the same `/api/v1` backend as
the web app.

## Features

- Email/password login & registration (JWT + refresh-token rotation)
- Browse & search courses
- Course details with curriculum
- Enroll (free) / purchase (paid) courses
- Continue learning with progress tracking
- Mark lessons complete
- AI Tutor (context-aware, per lesson)
- Certificates
- Profile

## Architecture

```
lib/
├── core/         # config, theme, Dio API client (auth + token refresh)
├── models/       # JSON-mapped data models
├── services/     # CourseService, LearningService, AiService, CertificateService
├── state/        # AuthState (ChangeNotifier + Provider)
├── widgets/      # reusable widgets (CourseCard)
└── screens/      # auth gate, login, home shell + tabs, detail, learn, tutor
```

## Running

```bash
flutter pub get

# Android emulator points to host via 10.0.2.2 by default.
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
```

> The bundled `logo*.png` assets live in the repo `dummy/` folder and can be
> wired into `pubspec.yaml` assets and used as the launcher icon.
