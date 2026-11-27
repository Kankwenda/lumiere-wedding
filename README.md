# LUMIÈRE WEDDING

Invitations de mariage numériques : lien et QR code personnels par invité, RSVP, choix de
boissons, livre d'or, check-in par scan de QR code, notifications Telegram.

Stack : TanStack Start, React 19, Tailwind 4, Supabase (auth, base, stockage).

## Démarrage

```sh
bun install        # ou npm install
bun run dev
```

## Configuration

Variables d'environnement (serveur) :

| Variable | Rôle |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Accès Supabase (voir `src/integrations/supabase`) |
| `TELEGRAM_BOT_TOKEN` | Token du bot (@BotFather). **Sans lui, aucune notification n'est envoyée** — la page Paramètres l'indique clairement. |
| `TELEGRAM_CHAT_ID` | (facultatif) discussion de repli si un couple n'a pas renseigné la sienne |
| `APP_TIMEZONE` | (facultatif) fuseau des dates dans les messages, `Africa/Lubumbashi` par défaut |

## Base de données

Appliquez toutes les migrations de `supabase/migrations/`. La dernière
(`20261127090000_donnees_reelles.sql`) supprime les anciennes données de démonstration, crée le
bucket privé `couple-photos`, remplace les valeurs par défaut factices et ajoute les champs
`share_message` et `default_country_code`.

## Fonctionnalités

- **Mon invitation / Design** : aperçu en direct avec vos vraies données ; 4 modèles, 3 couleurs,
  5 polices, forme des boutons, contraste automatique.
- **Invités** : import/export CSV, liens uniques, partage WhatsApp (numéro direct) et email avec
  message personnalisable (Paramètres).
- **Invitation invité** : programme avec itinéraire Google Maps, ajout à l'agenda (Google / .ics),
  RSVP, boissons, livre d'or, QR code.
- **Check-in** : scan du QR code par la caméra ou recherche par nom ; alerte si déjà enregistré,
  inconnu ou indisponible.
- **Notifications Telegram** : RSVP, boissons, livre d'or, avec test réel.

La page `/invitations/preview` est un exemple local : aucune donnée n'est lue ni écrite.
