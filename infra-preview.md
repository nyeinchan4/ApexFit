# ApexFit — Infrastructure Design (Current State)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                          DEVELOPER WORKSTATION                                   ║
║                                                                                  ║
║   ┌─────────────────┐   git push    ┌──────────────────────────────────────┐    ║
║   │  Source Code    │ ─────────────►│           GitHub Repository          │    ║
║   │  (ApexFit repo) │               │   branches: main / dev / feature/*   │    ║
║   └─────────────────┘               └──────────────────────────────────────┘    ║
║                                                                                  ║
║   kubectl port-forward ◄──────────────────────────────────────────┐             ║
║   ┌────────────────────────┐    ┌──────────────────────────────┐   │             ║
║   │  ArgoCD UI             │    │  Grafana Dashboard           │   │             ║
║   │  localhost:8080        │    │  localhost:3001              │   │             ║
║   └────────────────────────┘    └──────────────────────────────┘   │             ║
║                                                                     │             ║
╚═════════════════════════════════════════════════════════════════════╪═════════════╝
                                                                      │
                        port-forward tunnels                          │
                        (argocd-server svc)                           │
                        (grafana svc)                                 │
                                                                      │
╔═════════════════════════════════════════════════════════════════════╪═════════════╗
║                        K3s CLUSTER (local / single-node)            │             ║
║                                                                     │             ║
║  ┌──────────────────────────────────────────────────────────────────▼──────────┐ ║
║  │                    NAMESPACE: argocd                                         │ ║
║  │                                                                              │ ║
║  │   ┌─────────────────────────────────────────────┐                           │ ║
║  │   │              ArgoCD                          │                           │ ║
║  │   │  Watches Git repo ──► reconciles Helm chart  │                           │ ║
║  │   │                                              │                           │ ║
║  │   │  Applications:                               │                           │ ║
║  │   │   • app-database  → helm/apexfit-database    │                           │ ║
║  │   │   • app-backend   → helm/apexfit-backend     │                           │ ║
║  │   │   • app-frontend  → helm/apexfit-frontend    │                           │ ║
║  │   └─────────────────────────────────────────────┘                           │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘ ║
║                          │              │              │                           ║
║              deploys     │              │              │    deploys                ║
║              ┌───────────┘              │              └────────────┐             ║
║              ▼                         ▼                            ▼             ║
║  ┌───────────────────────┐ ┌──────────────────────────┐ ┌───────────────────────┐ ║
║  │  NAMESPACE: apexfit   │ │   NAMESPACE: apexfit     │ │  NAMESPACE: apexfit   │ ║
║  │                       │ │                          │ │                       │ ║
║  │  Helm: apexfit-db     │ │  Helm: apexfit-backend   │ │  Helm: apexfit-fe     │ ║
║  │  ─────────────────    │ │  ──────────────────────  │ │  ─────────────────    │ ║
║  │                       │ │                          │ │                       │ ║
║  │  ┌─────────────────┐  │ │  ┌────────────────────┐  │ │  ┌─────────────────┐  │ ║
║  │  │  PostgreSQL      │  │ │  │   api-gateway       │  │ │  │  admin-portal   │  │ ║
║  │  │  (Bitnami chart) │  │ │  │   :3000            │  │ │  │  (React/Nginx)  │  │ ║
║  │  │  StatefulSet     │  │ │  └──────────┬─────────┘  │ │  │  :80           │  │ ║
║  │  │  PVC: 1Gi (dev)  │  │ │             │            │ │  └─────────────────┘  │ ║
║  │  └─────────────────┘  │ │        routes to          │ │                       │ ║
║  │                       │ │  ┌─────────┬──────────┐   │ │  ┌─────────────────┐  │ ║
║  │  ┌─────────────────┐  │ │  │         │          │   │ │  │  member-app     │  │ ║
║  │  │  Secret          │  │ │  ▼         ▼          ▼   │ │  │  (React/Nginx)  │  │ ║
║  │  │  (JWT + DB creds)│  │ │ ┌────┐ ┌──────┐ ┌─────┐  │ │  │  :80           │  │ ║
║  │  │  ← shared with   │  │ │ │user│ │memb. │ │admin│  │ │  └─────────────────┘  │ ║
║  │  │    backend pods  │  │ │ │svc │ │svc   │ │svc  │  │ │                       │ ║
║  │  └─────────────────┘  │ │ │3001│ │:3002 │ │3003 │  │ └───────────────────────┘ ║
║  │                       │ │ └──┬─┘ └──┬───┘ └──┬──┘  │                           ║
║  └───────────────────────┘ │    │      │        │     │                           ║
║                             │    └──────┴────────┘     │                           ║
║                             │         DB calls          │                           ║
║                             │    (via shared Secret)    │                           ║
║                             └──────────────────────────┘                           ║
║                                                                                    ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐ ║
║  │                    NAMESPACE: monitoring                                      │ ║
║  │                                                                              │ ║
║  │   ┌─────────────────────────┐    ┌───────────────────────────────────────┐   │ ║
║  │   │  Prometheus             │    │  Grafana                               │   │ ║
║  │   │  (scrapes k3s metrics,  │───►│  Dashboards: cluster / pod / service  │   │ ║
║  │   │   pod metrics)          │    │  (port-forward: localhost:3001)        │   │ ║
║  │   └─────────────────────────┘    └───────────────────────────────────────┘   │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Component Summary

| Layer | Tool / Chart | Namespace | Access |
|---|---|---|---|
| GitOps Controller | ArgoCD | `argocd` | `kubectl port-forward` → localhost:8080 |
| Database | apexfit-database (Bitnami PostgreSQL) | `apexfit` | ClusterIP only |
| Shared Secret | K8s Secret (JWT + DB creds) | `apexfit` | Mounted into backend pods |
| API Gateway | apexfit-backend / api-gateway | `apexfit` | ClusterIP (port-forward: 3000) |
| User Service | apexfit-backend / user-service | `apexfit` | ClusterIP :3001 |
| Membership Service | apexfit-backend / membership-service | `apexfit` | ClusterIP :3002 |
| Admin Service | apexfit-backend / admin-service | `apexfit` | ClusterIP :3003 |
| Admin Portal | apexfit-frontend / admin-portal | `apexfit` | ClusterIP (port-forward: 8899) |
| Member App | apexfit-frontend / member-app | `apexfit` | ClusterIP (port-forward: 8900) |
| Monitoring | Prometheus + Grafana | `monitoring` | Grafana: `kubectl port-forward` → localhost:3001 |

---

## ArgoCD Application Structure (planned)

```
ArgoCD
 ├── app-database   →  helm/apexfit-database   (syncs PostgreSQL + Secret)
 ├── app-backend    →  helm/apexfit-backend    (syncs 4 backend services)
 └── app-frontend   →  helm/apexfit-frontend   (syncs 2 React SPAs)
```

> All three ArgoCD Applications watch the **same Git repo**,
> each pointing at a different Helm chart path and `values-dev.yaml`.

---

## Port-Forward Reference (dev)

```bash
# ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Grafana
kubectl port-forward svc/grafana -n monitoring 3001:80

# API Gateway (backend entry point)
kubectl port-forward svc/apexfit-backend-api-gateway -n apexfit 3000:3000

# Admin Portal
kubectl port-forward svc/apexfit-frontend-admin-portal -n apexfit 8899:80

# Member App
kubectl port-forward svc/apexfit-frontend-member-app -n apexfit 8900:80
```

---

## Traffic Flow (dev — no Ingress)

```
Browser
  │
  ├─── localhost:8899  ──►  admin-portal pod (Nginx)
  │                              │ API calls
  │                              └──► localhost:3000 ──► api-gateway pod
  │                                                           │
  ├─── localhost:8900  ──►  member-app pod (Nginx)           ├──► user-service :3001
  │                              │ API calls                  ├──► membership-service :3002
  │                              └──► localhost:3000          └──► admin-service :3003
  │                                                                     │
  └─── localhost:8080  ──►  ArgoCD UI                         PostgreSQL StatefulSet
  └─── localhost:3001  ──►  Grafana UI
```

---

*Last updated: 2026-06-25*
