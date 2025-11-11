#!/bin/bash

# Supabase Setup Script
# This script helps you set up your Supabase database with migrations

set -e  # Exit on error

echo "🚀 Supabase Setup Script"
echo "========================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📦 Install it with: brew install supabase/tap/supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if migrations exist
if [ ! -d "supabase/migrations" ] || [ -z "$(ls -A supabase/migrations)" ]; then
    echo "❌ No migrations found in supabase/migrations/"
    exit 1
fi

echo "📁 Found migrations:"
ls -1 supabase/migrations/
echo ""

# Ask user which method they want to use
echo "Choose setup method:"
echo "1) Link to existing Supabase project and push migrations"
echo "2) Start local Supabase for testing"
echo "3) Exit"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📡 Linking to existing Supabase project..."
        echo ""
        read -p "Enter your Supabase project reference ID: " project_ref

        if [ -z "$project_ref" ]; then
            echo "❌ Project reference ID is required"
            exit 1
        fi

        echo ""
        echo "🔗 Linking to project: $project_ref"
        supabase link --project-ref "$project_ref"

        echo ""
        read -p "Push migrations to remote database? (y/n): " push_confirm

        if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
            echo ""
            echo "⬆️  Pushing migrations..."
            supabase db push

            echo ""
            echo "✅ Migrations pushed successfully!"
            echo ""
            echo "📋 Check migration status with: supabase migration list"
        fi

        echo ""
        read -p "Do you want to seed the database with sample data? (y/n): " seed_confirm

        if [ "$seed_confirm" = "y" ] || [ "$seed_confirm" = "Y" ]; then
            echo ""
            echo "🌱 To seed your remote database, run:"
            echo "psql 'postgresql://postgres:[YOUR-PASSWORD]@db.$project_ref.supabase.co:5432/postgres' -f supabase/seed/seed.sql"
        fi
        ;;

    2)
        echo ""
        echo "🐳 Starting local Supabase..."
        echo "This will start Docker containers for:"
        echo "  - PostgreSQL database"
        echo "  - Supabase Studio (http://localhost:54323)"
        echo "  - Auth server"
        echo "  - Storage server"
        echo "  - Realtime server"
        echo ""

        supabase start

        echo ""
        echo "✅ Local Supabase is running!"
        echo ""
        echo "📊 Access Supabase Studio: http://localhost:54323"
        echo "🔑 Get connection info: supabase status"
        echo ""
        echo "Next steps:"
        echo "  - Visit http://localhost:54323 to view your database"
        echo "  - Run 'supabase db reset' to apply migrations + seeds"
        echo "  - Run 'supabase stop' when done"
        echo ""
        ;;

    3)
        echo "👋 Exiting..."
        exit 0
        ;;

    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Useful commands:"
echo "  supabase status          - View connection info"
echo "  supabase migration list  - Check migration status"
echo "  supabase db reset        - Reset local database"
echo "  supabase db push         - Push migrations to remote"
echo "  supabase db pull         - Pull schema from remote"
echo "  supabase stop            - Stop local Supabase"
echo ""
echo "📖 For more info, see: SUPABASE_CLI_SETUP.md"
