# Systems

A small app for scheduling how long you'll spend on a task, backed by a real
Postgres database so it syncs across every device automatically.

## Deploying (step-by-step)

See the walkthrough in chat, or follow along here:

1. **Install prerequisites** — Node.js (https://nodejs.org) and Git
   (https://git-scm.com), if you don't already have them.
2. **Push this folder to GitHub** — create a new repo at github.com/new,
   then from inside this folder run:
   ```
   git init
   git add .
   git commit -m "Systems app"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. **Import into Vercel** — go to vercel.com, sign in, click "Add New Project",
   and select this repo.
4. **Add a Postgres database** — in your new Vercel project, open the
   "Storage" tab, click "Create Database", choose Postgres, and connect it
   to this project. Vercel fills in the required environment variables for
   you automatically.
5. **Deploy** — trigger a deploy (or redeploy if it already ran before the
   database was connected). The build step creates the database table for
   you the first time it runs.
6. **Open it anywhere** — visit the URL Vercel gives you on your phone,
   laptop, whatever. Same data, everywhere, live from the database.

## Local development

```
npm install
vercel env pull .env.local   # after connecting the database on Vercel
npm run dev
```
