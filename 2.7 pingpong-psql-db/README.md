# Ping-Pong Project with Postgres

## Overview
Ping-pong Node.js app with counter persisted in Postgres.
Includes Kubernetes manifests for Postgres StatefulSet and Ping-pong Deployment.

## Prerequisites
- Docker
- Kubernetes cluster (k3d, Minikube, etc.)
- kubectl

## Steps

### 1. Build Docker image
cd ping-pong
docker build -t ping-pong:latest .

### 2. Apply Kubernetes manifests
kubectl create namespace exercises
kubectl apply -f k8s/postgres-config.yaml
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/pingpong-deployment.yaml
kubectl apply -f k8s/pingpong-service.yaml

### 3. Verify
kubectl get pods -n exercises
kubectl logs -n exercises <pingpong-pod>
kubectl exec -n exercises -it <pingpong-pod> -- curl http://localhost:3000/pingpong

### 4. Cleanup
kubectl delete namespace exercises
docker rmi ping-pong:latest