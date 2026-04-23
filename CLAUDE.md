# Propulsion — PWA Communautaire

## Stack
- React 18 + Vite 8 + TailwindCSS v3
- Supabase (Auth OTP, PostgreSQL, Storage, RLS)
- React Query v5 + Zustand v5
- React Router v6
- Vite PWA Plugin + Workbox
- TipTap (éditeur rich text admin)
- SheetJS / xlsx (import Excel)

## Commandes
```bash
npm run dev      # Développement local
npm run build    # Build production
npm run preview  # Prévisualiser le build
```

## Variables d'environnement
Copier `.env.example` en `.env` et remplir :
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Structure
```
src/
  components/
    ui/          # Avatar, MemberCard, Modal, LoadingSpinner, InstallBanner
    layout/      # BottomNav, TopBar, Layout
    admin/       # AdminLayout, RichTextEditor
  pages/
    auth/        # LoginPage (OTP email)
    home/        # HomePage
    explorer/    # ExplorerPage (search + filtres)
    announcements/ # liste + détail
    profile/     # MemberProfilePage, MyProfilePage
    profile/onboarding/ # OnboardingPage (niveau 1 & 2)
    admin/       # Dashboard, Members, Announcements, MemberOfDay
  hooks/         # useMembers, useAnnouncements, useAuth
  lib/           # supabase.js, utils.js, constants.js
  stores/        # authStore (Zustand)
supabase/
  schema.sql     # Tables, RLS, triggers, storage buckets
scripts/
  import-excel.js # Import batch Excel/CSV
```

## Setup Supabase
1. Créer un projet sur supabase.com
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL
3. Activer "Email OTP" dans Authentication > Providers
4. Renseigner les variables d'environnement

## Import Excel (2000+ membres)
```bash
SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=yyy \
  node scripts/import-excel.js membres.xlsx --dry-run
# Retirer --dry-run pour l'import réel
```

## Rôles
- `member` : accès à tout l'annuaire, son profil
- `admin` : en plus, gestion membres, annonces, membre du jour

## Couleurs (identité Propulsion)
- Violet (primaire) : `#6B3FA0`
- Orange/Or : `#F5A623`
- Rouge : `#D0021B`
- Bleu : `#1A6BB5`
