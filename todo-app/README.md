# Exercise 1.2 --- todo

## How to run

``` bash
kubectl apply -f manifests/persistent-volume.yaml
kubectl apply -f manifests/persistent-volume-claim.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
```

## How to clean

``` bash
kubectl delete -f manifests/persistent-volume.yaml
kubectl delete -f manifests/persistent-volume-claim.yaml
kubectl delete -f manifests/deployment.yaml
kubectl delete -f manifests/service.yaml
```
