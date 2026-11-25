# Saranath College website

Merged from the team's three sample sites into one production website.

* **Backend:** Python 3 + FastAPI, SQLAlchemy (SQLite by default, MySQL optional). Folder `backend/`.
* **Frontend:** React 19 + TypeScript + Tailwind CSS + Motion animations, built with Vite. Folder `frontend/`.
* **Admin panel:** at `/admin`. Everything on the public site is edited there.
* **Hosting:** cPanel "Setup Python App" (Passenger). See `DEPLOY-CPANEL.md`.

## What came from which sample

| Sample | What we kept |
|---|---|
| Single-page site (motto intro) | Motto letter-by-letter intro animation, navy and gold look, history timeline, principal's message, real hero photo and crest |
| Multi-page site | Academic pathways and A/L streams, clubs and societies, houses, gallery with filters, private feedback form, news and events content |
| React + Express site | Upcoming/past events with categories, house points managed by admins. Its admin login (one shared passcode, `saranath1882`, written in the code) was **not** reused: it was replaced with real accounts |

## Public pages

Home (intro animation, hero, legacy numbers, full history timeline, principal's message, academic pathways, live house standings, **Saranath TV** events screen, latest news, clubs, gallery, motto, feedback) · About · Academics · Student Life (clubs, societies, sports) · Houses & Sports Meet · News + story pages · Events + event pages · Gallery with lightbox · Contact & private feedback.

## Admin panel

Dashboard · Sports Meet Points (quick +1/+5/+10 buttons) · Houses · Events · School News · Academic Levels · A/L Streams · Clubs & Sports · History Timeline · Gallery · Comments & Feedback inbox · School Info (name, motto, contacts, home photos, numbers) · Principal's Message · Admin Users (super admin only) · Activity Log (super admin only) · My Account (password, two-step sign-in).

Roles: **Super admin** manages everything including users and the activity log. **Editor** manages content and reads feedback.

## Security

* Passwords hashed with **Argon2id**. Minimum 12 characters, letters + numbers, common passwords refused. New accounts must change their temporary password at first sign-in.
* **Two-step sign-in (TOTP)** with Google/Microsoft Authenticator, optional per account.
* **Brute-force protection:** an account locks for 15 minutes after 5 wrong passwords; a network is blocked after 20 failed attempts in 15 minutes. Unknown usernames get the same message and the same timing as wrong passwords.
* **Sessions:** random token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie, stored only as a SHA-256 hash in the database. Signs out after 30 minutes idle or 8 hours total. Changing a password signs out other devices.
* **CSRF:** every change needs a per-session token in a header.
* **Feedback is private:** there is no public way to read it. Name, email, phone, subject, message and admin notes are **encrypted at rest** (Fernet / AES). Honeypot field + 5 messages per hour per network.
* **Input validation:** every field has a type and maximum length; unknown fields are rejected. Image fields only accept files uploaded through the panel, so `javascript:` or outside links cannot be injected. React escapes all text, so script tags show as text.
* **Uploads:** opened with Pillow (non-images rejected), re-encoded to WebP, EXIF/GPS removed, random filenames, 6 MB limit, decompression-bomb guard.
* **Headers:** strict Content-Security-Policy (no inline scripts, no third-party scripts), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy. Admin and auth responses are `no-store` and `noindex`.
* **Host header allow-list**, API docs off in production, generic error messages, refuses to start in production without strong secrets.
* **Activity log** of sign-ins, failed attempts, lockouts and every change.
* Public visitors never download admin code (separate bundle loaded only at `/admin`).
* Automated tests: `backend/tests/test_security.py` (17 tests: login required, CSRF, lockout, XSS input, bad uploads, feedback privacy and encryption, roles, cookie flags).

## Content still to check (placeholders)

* Photos of classrooms, labs, sport and performances are stock images from a sample site. Replace them with real school photos in the admin panel. Only the main building photo and crest are real.
* House colours differ between the samples (Thisara red vs gold, Paravi gold vs red). The site uses red for Thisara and gold for Paravi; change in Admin > Houses if wrong.
* House points start at 0.
* The three upcoming events (Feb to Apr 2027) came from a sample and are examples.
* School email, office hours and principal's photo are empty or guessed.

## Local development

```bash
cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt pytest httpx uvicorn
python -m app.cli seed && python -m app.cli create-admin
uvicorn app.main:app --reload --port 8000
# second terminal
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Tests: `cd backend && python -m pytest tests`
