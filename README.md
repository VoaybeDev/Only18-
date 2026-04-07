# Only18+

Prototype React 18 + Vite + TypeScript pour une application de contenu payant avec :

- rôles `modele`, `chateur`, `subscriber`
- chateur invisible côté fan
- contenu PPV avec blur + déblocage instantané
- splash screen, onboarding, auth, catalogue, viewer, chat, profil, dashboard
- Zustand + localStorage pour la persistance
- Tailwind CSS + composants inspirés shadcn/ui
- Lucide React + Framer Motion

## Comptes de démonstration

- Modèle : `modele_test` / `123456`
- Chateur : `chateur_test` / `123456`
- Subscriber : `fan_test` / `123456`

## Lancer le projet

```bash
npm install
npm run dev
```

## Pages

- `/onboarding`
- `/login`
- `/register`
- `/home`
- `/content/:contentId`
- `/chat`
- `/profile`
- `/dashboard`

## Notes fonctionnelles

- Le subscriber ne voit jamais le rôle `chateur`.
- Tous les messages du modèle **et** du chateur apparaissent comme envoyés par `modele_test` côté subscriber.
- Le bouton **Simuler paiement** crée une transaction locale et révèle immédiatement le média.
- Le dashboard chateur calcule une commission fixe de 10%.
- Le dashboard modèle affiche ventes, revenus, commission et catalogue payant.

## Réinitialiser la démo

Depuis la page Profil, bouton **Réinitialiser la démo**.
