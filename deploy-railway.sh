#!/bin/bash

# NETO - Railway Deployment Script
# Este script automatiza el despliegue en Railway

set -e

echo "🚀 NETO - Railway Deployment Script"
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "📦 Installing Railway CLI..."
    npm i -g @railway/cli
fi

echo ""
echo "✅ Railway CLI found"

# Check if git is clean
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Hay cambios no committeados"
    echo "Por favor, haz commit de tus cambios primero:"
    echo "  git add ."
    echo "  git commit -m 'Your message'"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Branch actual: $CURRENT_BRANCH"

# Prompt for deployment confirmation
echo ""
echo "⚠️  Se desplegará en Railway desde: $CURRENT_BRANCH"
read -p "¿Deseas continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Despliegue cancelado"
    exit 1
fi

# Push to GitHub
echo ""
echo "📤 Código push a GitHub..."
git push origin $CURRENT_BRANCH

echo ""
echo "⏳ Esperando a que Railway detecte los cambios..."
sleep 5

# Open Railway dashboard
echo ""
echo "🌐 Abriendo Railway dashboard..."
railway open

echo ""
echo "✅ ¡Despliegue iniciado!"
echo ""
echo "Próximos pasos:"
echo "1. Verifica el progreso en Railway dashboard"
echo "2. Espera a que se complete el build y deploy"
echo "3. Prueba tu aplicación en la URL pública"
echo ""
echo "Para ver los logs en tiempo real:"
echo "  railway logs"
echo ""
echo "Para más información:"
echo "  Ver RAILWAY_DEPLOYMENT.md"
