# Architecture and Deployment Solutions – Pros & Cons Comparison

This project evolved through several deployment and routing solutions. This section compares those solutions in terms of **meaningful differences**, focusing on:

- Initialization effort
- Costs
- Maintenance
- Backup strategies and ease of recovery

The comparison is written to justify the final choices made in this repository.

---

## 1. Ingress vs Gateway API

### Ingress

**Pros**
- Simple and widely known
- Large ecosystem and documentation
- Lower conceptual overhead for small projects
- Quick to get started

**Cons**
- Relies heavily on annotations (controller-specific)
- Less portable between environments
- Limited extensibility
- Path handling often leaks cluster routing details into applications
- Becoming legacy as Gateway API matures

**Initialization & Cost**
- Minimal setup
- Usually included by default in clusters
- No additional cost beyond load balancer

**Maintenance**
- Annotation drift can become hard to manage
- Harder to reason about complex routing rules

**Backups**
- YAML-based, easy to store in Git
- No built-in separation of concerns

---

### Gateway API (Chosen Solution)

**Pros**
- Clear separation of concerns (Gateway vs Routes)
- Portable and standardized
- First-class support for advanced routing (rewrites, filters)
- Enables clean applications (apps serve `/`, infra handles paths)
- Future-proof Kubernetes networking model

**Cons**
- Slightly higher learning curve
- Requires CRD installation
- Not all features supported by all providers yet

**Initialization & Cost**
- One-time CRD installation
- Same load balancer cost as Ingress
- No additional runtime cost

**Maintenance**
- Easier long-term maintenance due to explicit resources
- Cleaner YAML, less controller-specific logic

**Backups**
- CRDs are declarative and Git-friendly
- Easy to restore full routing by reapplying manifests

---

## 2. Manual Deployment vs Automatic (CI/CD)

### Manual Deployment

**Pros**
- Simple to understand
- No CI/CD tooling required
- Useful for learning and debugging

**Cons**
- Error-prone
- Not scalable
- No guaranteed consistency
- Slow feedback loop

**Initialization & Cost**
- No setup cost
- No external services required

**Maintenance**
- High operational overhead
- Requires human intervention for every change

**Backups**
- Depends entirely on Git discipline
- No guarantee the cluster matches the repo state

---

### Automatic Deployment with GitHub Actions (Chosen Solution)

**Pros**
- Fully automated
- Reproducible and consistent
- Fast feedback
- Industry-standard practice
- Enables preview environments

**Cons**
- Initial setup effort
- Requires secret management

**Initialization & Cost**
- Moderate one-time setup
- GitHub Actions is free for small workloads
- No additional infrastructure cost

**Maintenance**
- Low ongoing maintenance
- Changes are versioned and auditable

**Backups**
- Git is the source of truth
- Cluster can be fully recreated from repository

---

## 3. Single Environment vs Branch-Based Environments

### Single Environment

**Pros**
- Simple
- Minimal resource usage

**Cons**
- No isolation
- Risky testing
- Hard to experiment

**Maintenance**
- High risk of breaking production

**Backups**
- One environment to recover
- Mistakes affect everything

---

### Branch-Based Environments (Chosen Solution)

**Pros**
- Full isolation per branch
- Safe experimentation
- Easy parallel development
- Matches modern DevOps practices

**Cons**
- More Kubernetes resources
- Requires automation

**Initialization & Cost**
- Automatic namespace creation
- Slightly higher cluster resource usage

**Maintenance**
- Very low (automated lifecycle)
- Environments cleaned up automatically

**Backups**
- Namespace = environment
- Easy to recreate by redeploying branch
- Clean deletion prevents stale state

---

## 4. Persistent Volumes & Deployment Strategy

### RollingUpdate with ReadWriteOnce PVC

**Pros**
- Default Kubernetes behavior

**Cons**
- Can fail due to volume lock
- Unreliable for stateful workloads

---

### Recreate Strategy (Chosen Solution)

**Pros**
- Safe with ReadWriteOnce volumes
- Predictable behavior

**Cons**
- Short downtime during redeploy

**Maintenance & Backups**
- Simple mental model
- Volumes can be backed up at storage level
- Easy restore by recreating pod

---

## 5. Overall Conclusion

The final architecture (Gateway API + Kustomize + CI/CD + branch-based namespaces) was chosen because:

- It minimizes long-term maintenance
- It keeps applications clean and portable
- It enables safe experimentation
- It is fully declarative and Git-backed
- It reflects modern Kubernetes best practices

While the initial setup effort is higher, the **operational cost over time is significantly lower**, and recovery/backup is straightforward because **Git is the source of truth**.

