#!/bin/bash

# 🚀 Timelines MCP Servers - Automated Deployment Script
# This script helps deploy both basic and authenticated MCP servers to Cloudflare

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Installing..."
        npm install -g wrangler
    fi
    print_success "Wrangler CLI is available"
}

# Check if user is logged into Cloudflare
check_auth() {
    print_status "Checking Cloudflare authentication..."
    if ! npx wrangler whoami &> /dev/null; then
        print_warning "Not logged into Cloudflare. Starting login process..."
        npx wrangler login
    fi
    print_success "Cloudflare authentication confirmed"
}

# Deploy basic MCP server
deploy_basic() {
    print_status "Deploying Basic MCP Server..."
    
    if [ ! -d "timelines-mcp-basic" ]; then
        print_error "Basic MCP server directory not found!"
        exit 1
    fi
    
    cd timelines-mcp-basic
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for basic server..."
        npm install
    fi
    
    # Deploy
    print_status "Deploying to Cloudflare Workers..."
    npx wrangler deploy
    
    # Get the deployed URL
    BASIC_URL=$(npx wrangler list | grep "timelines-mcp-basic" | awk '{print $3}' || echo "")
    if [ -n "$BASIC_URL" ]; then
        print_success "Basic server deployed: $BASIC_URL"
        echo "$BASIC_URL" > ../basic-server-url.txt
    fi
    
    cd ..
}

# Deploy authenticated MCP server
deploy_auth() {
    print_status "Deploying Authenticated MCP Server..."
    
    if [ ! -d "timelines-mcp-auth" ]; then
        print_error "Authenticated MCP server directory not found!"
        exit 1
    fi
    
    cd timelines-mcp-auth
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for auth server..."
        npm install
    fi
    
    # Check if secrets are set
    print_status "Checking required secrets..."
    
    # Note: We can't easily check if secrets exist without trying to deploy
    # So we'll provide instructions instead
    print_warning "Please ensure these secrets are set in Cloudflare:"
    echo "  - GITHUB_CLIENT_ID (your GitHub OAuth app client ID)"
    echo "  - GITHUB_CLIENT_SECRET (your GitHub OAuth app client secret)"
    echo "  - JWT_SECRET (a secure random string, 32+ characters)"
    echo ""
    echo "Set them using:"
    echo "  npx wrangler secret put GITHUB_CLIENT_ID"
    echo "  npx wrangler secret put GITHUB_CLIENT_SECRET"
    echo "  npx wrangler secret put JWT_SECRET"
    echo ""
    
    read -p "Have you set all required secrets? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Please set the required secrets before continuing."
        exit 1
    fi
    
    # Deploy
    print_status "Deploying to Cloudflare Workers..."
    npx wrangler deploy
    
    # Get the deployed URL
    AUTH_URL=$(npx wrangler list | grep "timelines-mcp-auth" | awk '{print $3}' || echo "")
    if [ -n "$AUTH_URL" ]; then
        print_success "Auth server deployed: $AUTH_URL"
        echo "$AUTH_URL" > ../auth-server-url.txt
    fi
    
    cd ..
}

# Test deployed servers
test_servers() {
    print_status "Testing deployed servers..."
    
    # Test basic server
    if [ -f "basic-server-url.txt" ]; then
        BASIC_URL=$(cat basic-server-url.txt)
        print_status "Testing basic server: $BASIC_URL"
        
        if curl -s "$BASIC_URL/health" > /dev/null; then
            print_success "Basic server is responding"
        else
            print_error "Basic server is not responding"
        fi
    fi
    
    # Test auth server
    if [ -f "auth-server-url.txt" ]; then
        AUTH_URL=$(cat auth-server-url.txt)
        print_status "Testing auth server: $AUTH_URL"
        
        if curl -s "$AUTH_URL/health" > /dev/null; then
            print_success "Auth server is responding"
        else
            print_error "Auth server is not responding"
        fi
    fi
}

# Main deployment flow
main() {
    echo "🚀 Timelines MCP Servers - Deployment Script"
    echo "============================================="
    echo ""
    
    # Pre-flight checks
    check_wrangler
    check_auth
    
    echo ""
    echo "Choose deployment option:"
    echo "1) Deploy Basic MCP Server only"
    echo "2) Deploy Authenticated MCP Server only"
    echo "3) Deploy both servers"
    echo "4) Test existing deployments"
    echo ""
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_basic
            test_servers
            ;;
        2)
            deploy_auth
            test_servers
            ;;
        3)
            deploy_basic
            deploy_auth
            test_servers
            ;;
        4)
            test_servers
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    
    if [ -f "basic-server-url.txt" ]; then
        BASIC_URL=$(cat basic-server-url.txt)
        echo "📦 Basic MCP Server: $BASIC_URL"
        echo "   - Health check: $BASIC_URL/health"
        echo "   - SSE endpoint: $BASIC_URL/sse"
        echo "   - Tools: add, multiply, create_timeline, get_current_time"
    fi
    
    if [ -f "auth-server-url.txt" ]; then
        AUTH_URL=$(cat auth-server-url.txt)
        echo "🔐 Auth MCP Server: $AUTH_URL"
        echo "   - Health check: $AUTH_URL/health"
        echo "   - OAuth login: $AUTH_URL/authorize"
        echo "   - SSE endpoint: $AUTH_URL/sse"
        echo "   - Additional tools: get_user_info, create_project_timeline, analyze_timeline"
    fi
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Set up custom domain routing in Cloudflare (see SETUP_GUIDE.md)"
    echo "2. Test with MCP Inspector: npx @modelcontextprotocol/inspector@latest"
    echo "3. Configure Claude Desktop (see SETUP_GUIDE.md)"
    echo "4. For auth server: Complete GitHub OAuth setup"
    echo ""
    echo "📖 For detailed instructions, see SETUP_GUIDE.md"
}

# Run main function
main "$@"