# Putting the site live on cPanel

You need: a cPanel hosting plan that shows **"Setup Python App"** (Python 3.9 or newer), the domain pointed at it, and about 30 minutes.

## 1. Turn on HTTPS
cPanel > **SSL/TLS Status** > run AutoSSL for the domain. Then cPanel > **Domains** > switch on **Force HTTPS Redirect**.

## 2. Upload the files
1. cPanel > **File Manager** > your home folder (not `public_html`). Create a folder named `saranath_app`.
2. Upload `saranath_app.zip` from this package into it and **Extract**. You should see `app/`, `media/`, `frontend_dist/`, `passenger_wsgi.py`, `requirements.txt`, `.env.example`.

## 3. Create the Python app
cPanel > **Setup Python App** > **Create Application**
* Python version: the newest offered (3.11+ ideal)
* Application root: `saranath_app`
* Application URL: your domain (leave the path empty)
* Application startup file: `passenger_wsgi.py`
* Application entry point: `application`

Click **Create**. At the top of the page cPanel shows a command starting with `source /home/.../virtualenv/...`. Copy it.

## 4. Install and configure (cPanel > Terminal)
```bash
# paste the "source ..." command you copied, then:
cd ~/saranath_app
pip install -r requirements.txt

cp .env.example .env
python -m app.cli gen-secret      # copy the output into SECRET_KEY in .env
python -m app.cli gen-fernet      # copy the output into DATA_ENCRYPTION_KEY in .env
nano .env                          # also set ALLOWED_HOSTS to your domain, save with Ctrl+O, Enter, Ctrl+X
chmod 600 .env

python -m app.cli seed            # loads the starter content
python -m app.cli create-admin    # your super admin account (choose a strong password)
```
**Back up the `DATA_ENCRYPTION_KEY`** somewhere safe and private (for example a password manager). If it is lost, saved feedback messages cannot be read.

## 5. Start it
Setup Python App > your app > **Restart**. Open `https://your-domain/` and `https://your-domain/admin`.

Then in the admin panel: My Account > **Set up two-step sign-in**, and Admin Users > create a separate account for each teacher who edits the site.

## Updating later
Upload the new files over the old ones (never overwrite `.env` or the `data/` folder), run `pip install -r requirements.txt`, then **Restart**.

## Backups
The `data/` folder holds the database (`saranath.db`) and uploaded photos. Include `saranath_app/data` and `.env` in cPanel > **Backup**, or download them monthly.

## If something goes wrong
* **"Unsafe production configuration"** in the log: SECRET_KEY or DATA_ENCRYPTION_KEY is missing from `.env`.
* **"Invalid host header"**: add the exact domain (with and without `www.`) to ALLOWED_HOSTS.
* Error details: `~/saranath_app/stderr.log` or Setup Python App > log.
