#!/usr/bin/env bash
# Police SafeGuard - Vercel & GitHub Deployment Helper
# ----------------------------------------------------

set -e

echo "=========================================="
echo " Police SafeGuard - Production Deployment "
echo " Domain: https://www.policesafeguard.com  "
echo "=========================================="

if [ -n "$VERCEL_TOKEN" ]; then
  echo "🚀 Deploying directly to Vercel Production..."
  npx vercel deploy --prod --token "$VERCEL_TOKEN" --yes
  echo "✅ Live deployment completed!"
  exit 0
fi

if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPO" ]; then
  echo "🚀 Pushing changes to GitHub ($GITHUB_REPO)..."
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
  git push -u origin main --force
  echo "✅ Successfully synced to GitHub! Vercel auto-deploy has been triggered."
  exit 0
fi

echo "To deploy directly:"
echo "1) Run with VERCEL_TOKEN=<your_token> ./deploy-to-vercel.sh"
echo "   OR"
echo "2) Run with GITHUB_TOKEN=<pat> GITHUB_REPO=<user/repo> ./deploy-to-vercel.sh"
