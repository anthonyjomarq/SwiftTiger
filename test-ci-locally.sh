#!/bin/bash

set -e

echo "Testing CI/CD Pipeline Locally..."
echo "=================================="

echo ""
echo "Testing Backend..."
echo "--------------------"

cd backend

echo "Installing backend dependencies..."
npm ci

echo "Running backend linting..."
npm run lint

echo "Running backend type checking..."
npm run type-check

echo "Building backend..."
npm run build

echo "Running backend security audit..."
npm audit --omit=dev

echo "Backend tests completed successfully!"

echo ""
echo "Testing Frontend..."
echo "---------------------"

cd ../frontend

echo "Installing frontend dependencies..."
npm ci

echo "Running frontend linting..."
npm run lint

echo "Building frontend..."
npm run build

echo "Running frontend security audit..."
npm audit --omit=dev

echo "Frontend tests completed successfully!"

cd ..

echo ""
echo "ALL CI/CD TESTS PASSED!"
echo "========================="
echo ""
echo "Backend: Linting, Type-checking, Build, Security Audit"
echo "Frontend: Linting, Build, Security Audit" 
echo ""
echo "Ready to push to GitHub"