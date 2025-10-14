#!/bin/bash
# Quick script to check what's in the PostgreSQL database

echo "=== Checking PostgreSQL Database (fitness_tracker) ==="
echo ""

echo "📊 Exercise Types:"
psql postgres://postgres:postgres@localhost:5432/fitness_tracker -c "SELECT * FROM exercise_types;" 2>&1
echo ""

echo "🏋️ Workouts:"
psql postgres://postgres:postgres@localhost:5432/fitness_tracker -c "SELECT * FROM workouts;" 2>&1
echo ""

echo "💪 Exercises:"
psql postgres://postgres:postgres@localhost:5432/fitness_tracker -c "SELECT * FROM exercises;" 2>&1
echo ""

echo "🎯 Goals:"
psql postgres://postgres:postgres@localhost:5432/fitness_tracker -c "SELECT * FROM goals;" 2>&1
