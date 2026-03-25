#!/bin/bash

# NETO - Build Verification Script
# Verifica que el proyecto compilará correctamente en Railway

set -e

echo "🔍 NETO - Build Verification Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Check Node version
echo "📋 Verificando prerequisitos..."
NODE_VERSION=$(node --version)
echo "Node version: $NODE_VERSION"

# Navigate to backend
cd backend

# Check package.json
echo ""
echo "📦 Verificando package.json..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json no encontrado${NC}"
    exit 1
fi
print_status "package.json encontrado"

# Install dependencies
echo ""
echo "📥 Instalando dependencias..."
npm install
print_status "Dependencias instaladas"

# Run linter
echo ""
echo "🔬 Ejecutando linter..."
npm run lint || echo -e "${YELLOW}⚠️  Algunos errores de linting (no crítico)${NC}"

# Build project
echo ""
echo "🏗️  Compilando proyecto..."
npm run build
print_status "Proyecto compilado"

# Check build output
echo ""
echo "📂 Verificando archivos compilados..."
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Carpeta dist no creada${NC}"
    exit 1
fi
print_status "Carpeta dist creada"

# Check main entry point
if [ ! -f "dist/main.js" ]; then
    echo -e "${RED}❌ main.js no encontrado en dist/${NC}"
    exit 1
fi
print_status "main.js encontrado"

# Verify static frontend files
echo ""
echo "🎨 Verificando archivos frontend..."
cd ..
if [ ! -d "frontend/src/pages" ]; then
    echo -e "${RED}❌ Carpeta frontend/src/pages no encontrada${NC}"
    exit 1
fi
print_status "Carpeta frontend encontrada"

# Count frontend files
FRONTEND_FILES=$(find frontend/src/pages -type f | wc -l)
echo "Archivos frontend encontrados: $FRONTEND_FILES"

# Back to root
echo ""
echo "📋 Compilación verificada exitosamente"
echo ""
echo -e "${GREEN}✅ Tu proyecto está listo para desplegar en Railway${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Configura tus variables de entorno en Railway"
echo "2. Conecta tu repositorio GitHub"
echo "3. El despliegue se iniciará automáticamente"
echo ""
echo "Para desplegar, ejecuta:"
echo "  ./deploy-railway.sh"
