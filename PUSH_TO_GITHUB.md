# Push this app to GitHub

Your project is already a git repo with one commit. To put it on GitHub:

## 1. Create a new repository on GitHub

1. Go to [github.com/new](https://github.com/new).
2. Choose a **Repository name** (e.g. `event-ordering-system`).
3. Leave it **empty** (no README, .gitignore, or license).
4. Click **Create repository**.

## 2. Add the remote and push

In your project folder, run (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

```bash
cd "/Users/jenner.coker/Downloads/event-ordering-system 2"

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. (Optional) Set your git identity

To use your name and email in future commits:

```bash
git config user.name "Your Name"
git config user.email "your@email.com"
```

Done. After this, you can connect the repo to Render or Railway as in **DEPLOYMENT.md**.
