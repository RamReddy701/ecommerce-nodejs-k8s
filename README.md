Cloud-Native E-Commerce Microservices

A production-grade microservices deployment demonstrating distributed systems design, backend API development, and Kubernetes best practices.

This project simulates an e-commerce backend with Order and Payment services, built with Node.js/Express, backed by PostgreSQL, and orchestrated via Kubernetes.

🚀 Architecture & Tech Stack
Backend: Node.js (v20), Express.js

Database: PostgreSQL (deployed as a StatefulSet)

Containerization: Docker (Multi-stage, minimal Alpine images)

Orchestration: Kubernetes (Deployments, Services, ConfigMaps, Secrets, HPA)

Gateway/Routing: NGINX Ingress Controller

High-Level Request Flow
Client sends a request to create an order via the NGINX Ingress.

The Ingress routes traffic to the Order Service.

The Order Service makes an internal synchronous HTTP call to the Payment Service using Kubernetes internal DNS.

The Payment Service processes the transaction, interacts with PostgreSQL via connection pooling, and returns a success response.

The Order Service finalizes the order and returns the payload to the client.

🛠️ Production-Ready Engineering Practices Highlighted
I built this project to showcase real-world operational and security standards, not just basic business logic:

Least-Privilege Security: Docker containers run as the unprivileged node user rather than root.

Zero-Downtime Deployments: Configured Liveness (/livez) and Readiness (/readyz) probes so Kubernetes only routes traffic to healthy, fully initialized pods.

Graceful Shutdowns: Node.js applications intercept SIGTERM signals from Kubernetes to finish in-flight HTTP requests and cleanly drain database connection pools before exiting.

Configuration Management: Environment variables and sensitive data are completely decoupled from the codebase using Kubernetes ConfigMaps and Secrets.

Stateful Database: PostgreSQL is deployed as a StatefulSet with headless services, demonstrating knowledge of stateful vs. stateless application management.


💻 Local Setup & Deployment Instructions
Prerequisites
Docker installed.

A local Kubernetes cluster running (e.g., Minikube or Docker Desktop with K8s enabled).

kubectl installed.

NGINX Ingress Controller enabled on your cluster (minikube addons enable ingress).

1. Build the Docker Images
If using Minikube, point your terminal to Minikube's Docker daemon first:


Bash
eval $(minikube docker-env)
Build the images locally:


Bash
docker build -t yourusername/order-service:latest ./services/order-service
docker build -t yourusername/payment-service:latest ./services/payment-service
2. Deploy to Kubernetes
Apply the configuration files in order:


Bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmaps.yaml
kubectl apply -f k8s/02-secrets.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-order-service.yaml
kubectl apply -f k8s/05-payment-service.yaml
kubectl apply -f k8s/06-ingress.yaml
(Note: The 02-secrets.yaml file contains dummy credentials specifically so reviewers can test this repository out-of-the-box. In a real environment, secrets would be injected via HashiCorp Vault or AWS Secrets Manager).



3. Verify Deployment
Wait a few moments for the database to initialize and pods to pass readiness checks:


Bash
kubectl get pods,svc,ingress -n ecommerce
4. Test the API
Map the ingress hostname to your localhost in your /etc/hosts file:
127.0.0.1 api.ecommerce.local


Submit a test order:

Bash
curl -X POST http://api.ecommerce.local/orders/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"item":"Mechanical Keyboard","amount":120.00}'


Expected JSON Response:

{
  "order_id": "ord_1710000000000",
  "item": "Mechanical Keyboard",
  "amount": 120,
  "status": "CONFIRMED",
  "payment_info": {
    "payment_id": "pay_1710000000050",
    "order_id": "ord_1710000000000",
    "status": "SUCCESS",
    "processed_at": "2024-03-09T12:00:00.000Z"
  },
  "created_at": "2024-03-09T12:00:00.050Z"
}
