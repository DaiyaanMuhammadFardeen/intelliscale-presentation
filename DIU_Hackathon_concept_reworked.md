# HPA++: AI-Powered Predictive Auto-Scaling & GPU Scheduling for Kubernetes Clusters

**Forecast-Driven, Confidence-Aware Resource Optimization for Cluster Intelligence**

---

| Field | Detail |
|-------|--------|
| Team Name | Team Falah |
| Institution | Daffodil International University (DIU) |
| Track | AI for Cluster Intelligence |
| Phase | Phase-1 Online Preliminary |

---

## 1. Problem Statement

Modern Kubernetes clusters host a diverse mix of workloads—from stateless web services to **GPU‑intensive AI/ML training and inference**. While standard autoscalers handle CPU and memory reactively, **GPU resources present additional challenges**:

- **Scarcity and cost** – GPUs are expensive and often limited in number.
- **Contention** – multiple AI workloads compete for the same GPUs, causing queue delays and underutilization.
- **Reactive allocation** – Kubernetes default scheduler places GPU pods based on immediate availability, ignoring **predictable future demand** (e.g., scheduled training jobs, inference spikes).
- **Reactive pod scaling** – HPA only reacts after GPU usage spikes, leading to queued inference requests or OOM errors.

Organisations face the same reliability–cost trade‑off, now amplified by GPU costs. Over‑provisioning GPUs is prohibitively expensive; under‑provisioning stalls AI pipelines. The result: **idle GPU cycles** during quiet periods and **performance degradation** during surges—both unacceptable for production AI services.

---

## 2. Proposed Solution: HPA++

**HPA++** now forecasts **CPU, memory, and GPU utilisation** simultaneously, using these predictions for two intelligent actions:

1. **Proactive pod scaling** – adjust replica counts for both CPU‑based and GPU‑based deployments *before* demand arrives.
2. **Predictive GPU scheduling** – anticipate future GPU requirements and pre‑schedule workloads on suitable nodes, minimising queue times and maximising utilisation.

### 2.1 Core Components (updated)

| Component | Description |
|-----------|-------------|
| **Multi‑Metric Forecasting Engine** | Prophet models for **requests/sec, CPU%, memory%, and GPU utilisation% / memory%** – each with confidence intervals. |
| **Predictive Controller** | Python service that converts each forecast into target pod counts (for CPU/GPU pods) and issues scaling commands. Also triggers **scheduling hints** for GPU workloads. |
| **Predictive Scheduler** | An optional module that uses GPU forecasts to influence scheduling decisions—e.g., pre‑binding GPU pods to nodes that will have free capacity when the pod starts. |
| **Live Monitoring Dashboard** | Streamlit + Plotly UI displaying all predicted metrics, actual vs. predicted, scaling actions, and scheduler decisions. |
| **Reactive Safety Net** | HPA and default scheduler remain as fallbacks—catching unforeseen spikes and placement failures. |

### 2.2 What Makes HPA++ Different (updated)

| Feature | Traditional HPA + Default Scheduler | HPA++ |
|---------|--------------------------------------|--------------|
| **Scaling Timing** | Reactive (after spike) | **Proactive (before spike)** |
| **GPU‑Aware Scaling** | ✗ (only CPU/memory) | **✓** |
| **Confidence‑Aware Decisions** | ✗ | **✓** |
| **Predictive Scheduling** | ✗ (only immediate fit) | **✓** (future‑aware placement) |
| **Cluster‑Wide Resource Optimisation** | ✗ | **✓** (planned) |
| **Cost‑Aware (both directions)** | Limited | **✓** (scale‑up & scale‑down driven by forecasts) |
| **Transparent Audit Trail** | Limited | **✓** full forecast logs |

---

## 3. Why Prophet? (unchanged, but now justifies multi‑metric forecasting)

We evaluated LSTM, XGBoost, ARIMA, and Prophet. Prophet was selected because:

- Handles multiple seasonal patterns (daily, weekly) – essential for both web traffic and AI job schedules.
- Provides **native confidence intervals** – critical for risk‑aware scaling and scheduling.
- Fast enough to retrain per metric on a rolling window – no bottleneck even with multiple models.
- Interpretable – decisions can be traced back to predicted values and intervals.

For GPU metrics, we also considered **NVIDIA DCGM** as the data source, and Prophet handles the time‑series equally well.

---

## 4. System Architecture (updated with GPU flow)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HPA++ SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────────────┐ │
│  │  Kubernetes     │    │  Metrics Sources   │    │  Forecasting Engine     │ │
│  │  Cluster        │    │                    │    │  (Prophet)              │ │
│  │                 │    │  • Prometheus      │    │                         │ │
│  │  ┌───────────┐  │    │    (CPU, mem)     │───►│  • Multi‑model per      │ │
│  │  │ CPU Pods  │  │    │  • NVIDIA DCGM    │    │    metric               │ │
│  │  └───────────┘  │    │    (GPU util,     │    │  • 5‑min forecast       │ │
│  │  ┌───────────┐  │    │     memory)       │    │  • Confidence intervals │ │
│  │  │ GPU Pods  │  │    └────────────────────┘    └────────────┬────────────┘ │
│  │  └───────────┘  │                                           │              │
│  │  ┌───────────┐  │               ┌───────────────────────────┘              │
│  │  │ Scheduler │  │               ▼                                          │
│  │  └─────┬─────┘  │    ┌─────────────────────────────────────┐              │
│  │        │        │    │  Predictive Controller              │              │
│  └────────┼────────┘    │  (Python + k8s-client)             │              │
│           │             │                                     │              │
│           │             │  1. Get forecasts for CPU & GPU     │              │
│           │             │  2. Check confidence per metric    │              │
│           │             │  3. Compute target replicas        │              │
│           │             │  4. Patch deployments              │              │
│           │             │  5. Optionally write scheduling    │              │
│           │             │     hints (via annotations)        │              │
│           │             │  6. Log decisions                  │              │
│           │             └──────────────────┬──────────────────┘              │
│           │                                │                                 │
│           │                                ▼                                 │
│           │             ┌─────────────────────────────────────┐              │
│           └────────────►│  Predictive Scheduler (optional)   │              │
│                         │  • Uses GPU forecast to pre‑bind   │              │
│                         │    pods to nodes with predicted    │              │
│                         │    free capacity                   │              │
│                         │  • Falls back to default if no     │              │
│                         │    hint available                  │              │
│                         └─────────────────────────────────────┘              │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  Monitoring Dashboard (Streamlit + Plotly)                               │  │
│  │  • Live forecasts for CPU, memory, GPU                                  │  │
│  │  • Actual vs. predicted plots                                           │  │
│  │  • Current vs. target replicas (CPU & GPU pods)                        │  │
│  │  • Scheduling decisions & node utilisation forecasts                   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow Pipeline (updated)

| Stage | Component | Description |
|-------|-----------|-------------|
| **Collect** | Prometheus + DCGM exporter | requests/sec, CPU%, memory%, GPU utilisation%, GPU memory% sampled periodically |
| **Forecast** | Prophet (per metric) | Each metric predicted 5 min ahead with confidence bounds; rolling window update |
| **Decide** | Controller Logic | For each deployment type (CPU or GPU), convert predicted metric(s) to target replicas; adjust for confidence |
| **Schedule** | Predictive Scheduler (optional) | For GPU pods, use GPU forecast to pre‑filter nodes and set preferred node affinities |
| **Act** | Kubernetes API | Controller patches deployments; scheduler updates pod spec hints; all actions logged |
| **Observe** | Dashboard | All predictions, decisions, and actions shown live |

---

## 6. Core Scaling & Scheduling Logic (updated)

**Scaling decision** (per deployment):

```
needed_replicas = clamp(
    ceil( max(predicted_rps/requests_per_pod,
              predicted_gpu_util / gpu_per_pod),
          min_replicas, max_replicas )
)
```

**Confidence‑aware adjustment** (for each forecasted metric):

```
if any(confidence_interval_width > threshold):
    ## Scale conservatively – add only up to a safety margin
    target_replicas = min(target_replicas, current_replicas + safety_step)
else:
    target_replicas = needed_replicas
```

**Scheduling hint** (for GPU workloads):

```
## For each pending GPU pod, predict which node will have available GPU memory in 5 min
for node in nodes:
    predicted_gpu_mem_free = node.gpu_mem_total - forecasted_gpu_mem_used(node)
    if predicted_gpu_mem_free >= pod.gpu_mem_request:
        annotate pod with node affinity to that node
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `gpu_per_pod` | GPU units (e.g., 0.5 GPU) per pod | Configurable |
| `confidence_threshold` | Width threshold for conservative decisions | Configurable |
| `safety_step` | Max extra replicas when uncertain | 1–2 pods |
| `forecast_horizon` | Time ahead for predictions | 5 minutes |

---

## 7. Expected Performance Improvements (updated)

| Metric | Target Improvement |
|--------|-------------------|
| **Scaling Response Time** | 30‑50% faster – pods ready before CPU/GPU spike |
| **Request Latency During Spikes** | 20‑30% lower (for CPU workloads) |
| **GPU Pod Queue Time** | **40‑60% reduction** – proactive scheduling reduces waiting |
| **GPU Utilisation** | Increase by **15‑25%** – better fit between supply and demand |
| **Resource Waste (CPU/GPU)** | 15‑25% reduction – faster scale‑down and avoided over‑provisioning |

---

## 8. Comparison with Traditional HPA + Default Scheduler

| Feature | Traditional HPA + Default Scheduler | HPA++ |
|---------|--------------------------------------|--------------|
| **Reactive Scaling** | ✓ | ✓ (as safety net) |
| **Predictive Scaling** | ✗ | ✓ |
| **GPU‑Aware Scaling** | ✗ (HPA only CPU/mem) | ✓ |
| **Confidence‑Aware Decisions** | ✗ | ✓ |
| **Predictive Scheduling** | ✗ (only immediate fit) | ✓ |
| **Cost Optimisation (Scale‑Up/Down)** | Limited | ✓ |
| **Cluster‑Wide Resource View** | ✗ | ✓ (planned) |
| **Decision Audit Trail** | Limited | ✓ |

---

## 9. Real-World Impact & Use Cases (updated)

| Use Case | Challenge | HPA++ Solution |
|----------|-----------|----------------------|
| **AI Model Training (Scheduled)** | Many teams submit training jobs at specific times; GPU contention causes long queues | Predicts future GPU demand; pre‑schedules jobs to nodes that will have free capacity |
| **Real‑Time Inference Services** | Inference traffic spikes (e.g., during product launches) | Predicts GPU usage and scales inference pods proactively |
| **E‑Commerce with AI Recommendations** | Spike in recommendation requests during flash sales | Scales both CPU and GPU resources before the spike |
| **University AI Research Clusters** | Idle GPUs overnight, over‑subscribed during day | Forecast‑driven scheduling reduces idle time and improves researcher productivity |
| **FinTech Fraud Detection** | Sudden transaction volume increases require more inference capacity | Predictive scaling ensures low latency for fraud checks |

---

## 10. Extending to Cluster Intelligence (updated)

HPA++ already demonstrates **cluster‑level intelligence** by:

- Forecasting **multiple resource types** across the cluster.
- Making **scheduling decisions** that consider future load.
- Providing a **holistic view** of predicted vs. actual usage.

Future extensions align directly with the hackathon theme:

| Extension | Description |
|-----------|-------------|
| **Multi‑Deployment Coordination** | Scale all deployments together based on global cluster forecasts. |
| **Node‑Level Forecasting** | Predict per‑node resource availability to refine scheduling even further. |
| **Cost‑Aware Placement** | Consider spot vs. on‑demand pricing when forecasting and scheduling. |
| **Anomaly Detection** | Flag sudden changes in GPU utilisation patterns and adjust forecasts dynamically. |

---

## 11. Technical Implementation (updated)

### 11.1 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Orchestration** | Kubernetes (Minikube with GPU‑enabled nodes for demo) | Standard; local dev with GPU simulation possible |
| **Metrics Collection** | Prometheus + Node Exporter + NVIDIA DCGM Exporter | Industry standard for GPU metrics |
| **Forecasting** | Facebook Prophet (per metric) | Multi‑seasonality, confidence intervals, fast retraining |
| **Controller** | Python + kubernetes-client | Official client; safe API interactions |
| **Scheduling Hints** | Pod annotations / node affinity | Native Kubernetes primitives |
| **Load Testing** | Locust + custom GPU‑simulating workloads | Reproducible mixed workloads |
| **Dashboard** | Streamlit + Plotly | Live multi‑metric visualisations |
| **Monitoring (ext.)** | Prometheus + Grafana | Production polish |

### 11.2 Evaluation Methodology

We run identical workloads (CPU + GPU) against two configurations:

| Configuration | Description |
|---------------|-------------|
| **Baseline** | Standard HPA (CPU/mem) + default scheduler (no predictive) |
| **HPA++** | Predictive scaling for CPU/mem/GPU + predictive scheduler for GPU |

Same Locust load profile; results compared on:

- Pod readiness lead time
- Request latency / error rate
- GPU queue waiting time
- Total pod‑minutes and GPU‑minutes consumed
- Forecast accuracy (MAE per metric)

---

## 12. Known Limitations & Mitigations (updated)

| Limitation | Mitigation Strategy |
|------------|---------------------|
| **GPU forecasts may not capture sudden job bursts** | Retain default scheduler; reactive scaling still works |
| **Training Prophet per metric adds overhead** | Optimise rolling window length and retraining frequency |
| **Heterogeneous GPU types** | Treated as configurable; can model per‑type capacity |
| **Scheduling hints may become stale** | Hints are re‑evaluated at each cycle; fallback to default if outdated |

---

## 13. Future Work Beyond Hackathon Scope

- **Fine‑grained GPU sharing** – predict per‑process GPU memory for better packing.
- **Reinforcement learning** for optimal scaling and scheduling policies.
- **Integration with Cluster Autoscaler** to add/remove GPU nodes proactively.
- **Multi‑cluster forecasting** for federated clusters.

---

## 14. Summary

HPA++ transforms Kubernetes from a reactive platform into a **proactive, intelligence‑driven cluster manager** that understands both CPU and GPU workloads. By combining **multi‑metric forecasting, confidence‑aware decisions, and predictive scheduling**, we deliver:

- **Reduced latency and error rates** for all workloads.
- **Higher GPU utilisation** and **shorter job queues**.
- **Lower infrastructure costs** through proactive scale‑down.
- **A clear audit trail** for every decision, building trust.

This makes HPA++ a compelling entry for the **AI for Cluster Intelligence** track—demonstrating practical AI applied to real‑world infrastructure challenges.

---

### Appendix: Tools at a Glance (updated)

| Category | Tools |
|----------|-------|
| Orchestration | Kubernetes, Minikube, kubectl |
| Programming | Python 3.x |
| Forecasting | Facebook Prophet, pandas, NumPy |
| Metrics | Prometheus, Node Exporter, NVIDIA DCGM Exporter |
| Cluster Control | kubernetes-client (Python) |
| Scheduling | Pod annotations, node affinity |
| Load Testing | Locust + custom GPU workloads |
| Dashboard | Streamlit, Plotly |
| Monitoring (ext.) | Prometheus, Grafana |
| Version Control | Git, GitHub |

---

*This updated proposal incorporates GPU prediction and scheduling, aligning with the hackathon theme and addressing the mentor’s feedback on innovation, architecture, and cluster‑level intelligence.*
