#!/bin/bash

# Supabase Helper Scripts
# Quick commands for common Supabase operations

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check Supabase CLI installation
if ! command_exists supabase; then
    print_error "Supabase CLI not found"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Show menu
show_menu() {
    echo ""
    echo "🛠️  Supabase Helper Commands"
    echo "=============================="
    echo "1)  Start local Supabase"
    echo "2)  Stop local Supabase"
    echo "3)  Reset local database (apply migrations + seeds)"
    echo "4)  Check migration status"
    echo "5)  Push migrations to remote"
    echo "6)  Pull schema from remote"
    echo "7)  Create new migration"
    echo "8)  Generate TypeScript types"
    echo "9)  View local connection info"
    echo "10) Open Supabase Studio"
    echo "11) View logs"
    echo "12) Link to remote project"
    echo "13) Seed remote database"
    echo "0)  Exit"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter choice (0-13): " choice

    case $choice in
        1)
            print_info "Starting local Supabase..."
            supabase start
            print_success "Local Supabase started!"
            echo "Studio: http://localhost:54323"
            ;;

        2)
            print_info "Stopping local Supabase..."
            supabase stop
            print_success "Local Supabase stopped!"
            ;;

        3)
            print_info "Resetting local database..."
            supabase db reset
            print_success "Database reset complete!"
            ;;

        4)
            print_info "Checking migration status..."
            supabase migration list
            ;;

        5)
            print_info "Pushing migrations to remote..."
            supabase db push
            print_success "Migrations pushed!"
            ;;

        6)
            print_info "Pulling schema from remote..."
            supabase db pull
            print_success "Schema pulled!"
            ;;

        7)
            read -p "Enter migration name: " migration_name
            if [ -n "$migration_name" ]; then
                supabase migration new "$migration_name"
                print_success "Migration created!"
            else
                print_error "Migration name required"
            fi
            ;;

        8)
            echo "Generate types from:"
            echo "1) Local database"
            echo "2) Remote database"
            read -p "Choice (1-2): " type_choice

            case $type_choice in
                1)
                    print_info "Generating types from local database..."
                    supabase gen types typescript --local > types/database.types.ts
                    print_success "Types generated in types/database.types.ts"
                    ;;
                2)
                    print_info "Generating types from remote database..."
                    supabase gen types typescript --linked > types/database.types.ts
                    print_success "Types generated in types/database.types.ts"
                    ;;
                *)
                    print_error "Invalid choice"
                    ;;
            esac
            ;;

        9)
            print_info "Local connection info:"
            supabase status
            ;;

        10)
            print_info "Opening Supabase Studio..."
            open http://localhost:54323
            ;;

        11)
            print_info "Viewing logs (Ctrl+C to exit)..."
            supabase logs --follow
            ;;

        12)
            read -p "Enter project reference ID: " project_ref
            if [ -n "$project_ref" ]; then
                print_info "Linking to project: $project_ref"
                supabase link --project-ref "$project_ref"
                print_success "Project linked!"
            else
                print_error "Project reference ID required"
            fi
            ;;

        13)
            read -p "Enter project reference ID: " project_ref
            if [ -n "$project_ref" ]; then
                print_info "Seed your remote database with:"
                echo ""
                echo "psql 'postgresql://postgres:[YOUR-PASSWORD]@db.$project_ref.supabase.co:5432/postgres' -f supabase/seed/seed.sql"
                echo ""
                print_info "Replace [YOUR-PASSWORD] with your database password"
            else
                print_error "Project reference ID required"
            fi
            ;;

        0)
            print_info "Goodbye!"
            exit 0
            ;;

        *)
            print_error "Invalid choice"
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
done
