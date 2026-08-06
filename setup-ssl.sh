#!/bin/bash

# SSL Setup Script for Catalog Application
# This script sets up Let's Encrypt SSL certificates for custom domains

set -e

DOMAINS=("catalog.adihuman.com" "api.adihuman.com")
EMAIL="pradipta@uuoinnovation.com"

echo "Setting up SSL certificates for: ${DOMAINS[@]}"

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo yum install -y certbot || sudo apt-get install -y certbot
fi

# Stop the frontend container temporarily to free up port 80
echo "Stopping frontend container..."
sudo docker stop frontend || true

# Obtain SSL certificates
for domain in "${DOMAINS[@]}"; do
    echo "Obtaining SSL certificate for $domain..."
    
    # Use standalone mode since we're not running a web server on port 80
    sudo certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$domain" \
        --non-interactive || echo "Failed to obtain certificate for $domain"
done

# Start the frontend container again
echo "Starting frontend container..."
sudo docker start frontend || true

# Set up automatic certificate renewal
echo "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 0 * * 0 certbot renew --quiet && docker restart frontend") | crontab -

echo "SSL setup completed!"
echo "Certificates are located in /etc/letsencrypt/live/"
echo "Automatic renewal is configured via cron."