#!/bin/bash
set -e

echo "[Firewall] Initializing network security rules..."

if ! command -v iptables &> /dev/null; then
    echo "[Firewall] ERROR: iptables not found. Firewall setup skipped."
    exit 0
fi

iptables -F OUTPUT 2>/dev/null || true
iptables -F INPUT 2>/dev/null || true

iptables -P INPUT ACCEPT
iptables -P OUTPUT ACCEPT
iptables -P FORWARD ACCEPT

iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

echo "[Firewall] Firewall initialized (OPEN mode - all traffic allowed)"
