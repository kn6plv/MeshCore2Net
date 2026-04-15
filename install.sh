#! /bin/sh
cp bridge.service /etc/systemd/system/bridge.service
systemctl daemon-reload
systemctl enable bridge
systemctl start bridge
