# Exercise 1.1: Log Output

**How to run:**

    kubectl apply -f persistent-volume.yaml
    kubectl apply -f persistent-volume-claim.yaml
    kubectl apply -f manifests/log-output-deployment.yaml
    kubectl apply -f manifests/log-output-service.yaml
    kubectl apply -f manifests/pingpong-deployment.yaml
    kubectl apply -f manifests/pingpong-service.yaml
    kubectl apply -f manifests/ingress.yaml 
    

**How to clean:**

    kubectl delete -f persistent-volume.yaml
    kubectl delete -f persistent-volume-claim.yaml
    kubectl delete -f manifests/log-output-deployment.yaml
    kubectl delete -f manifests/log-output-service.yaml
    kubectl delete -f manifests/pingpong-deployment.yaml
    kubectl delete -f manifests/pingpong-service.yaml
    kubectl delete -f manifests/ingress.yaml

