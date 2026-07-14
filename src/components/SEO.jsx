import { Helmet } from 'react-helmet-async'

/**
 * SEO Component - Dynamic head management for each scene
 * Updates title, meta description, and OpenGraph tags per scene
 */
export default function SEO({ scene = 'default' }) {
  // Scene-specific SEO configuration
  const seoConfig = {
    default: {
      title: 'HPA++ — AI-Powered Predictive Auto-Scaling & GPU Scheduling for Kubernetes',
      description: 'HPA++ transforms Kubernetes from reactive to proactive with AI-driven predictive auto-scaling and GPU scheduling. Forecast CPU, memory, and GPU utilization before spikes occur.',
      keywords: 'Kubernetes, auto-scaling, GPU scheduling, AI, machine learning, predictive scaling, HPA, container orchestration',
    },
    IGNITION: {
      title: 'HPA++ Introduction — AI Cluster Intelligence | Team Falah',
      description: 'Introducing HPA++: AI-Powered Predictive Auto-Scaling & GPU Scheduling for Kubernetes. Built by Team Falah for DIU Hackathon.',
      keywords: 'HPA++, Kubernetes, AI, introduction, Team Falah, DIU Hackathon',
    },
    TSUNAMI: {
      title: 'The Scaling Tsunami — Why Kubernetes Needs AI | HPA++',
      description: 'The exponential growth of cloud workloads creates a scaling tsunami. Traditional reactive autoscalers cannot keep up with modern demand patterns.',
      keywords: 'Kubernetes scaling, cloud workloads, autoscaling challenges, reactive scaling',
    },
    'GOLD RUSH': {
      title: 'GPU Gold Rush — Resource Scarcity in AI Workloads | HPA++',
      description: 'GPU resources are scarce and expensive. Multiple AI workloads compete for the same GPUs, causing queue delays and underutilization.',
      keywords: 'GPU scheduling, AI workloads, resource contention, GPU scarcity, Kubernetes GPU',
    },
    ORACLE: {
      title: 'Predictive Oracle — Prophet-Based Forecasting Engine | HPA++',
      description: 'HPA++ uses Facebook Prophet for multi-metric forecasting with confidence intervals. Predict CPU, memory, and GPU utilization before spikes.',
      keywords: 'Prophet forecasting, time series prediction, CPU forecasting, GPU prediction, confidence intervals',
    },
    FORMULA: {
      title: 'The HPA++ Formula — Confidence-Aware Scaling Logic | HPA++',
      description: 'The mathematical formula behind HPA++ predictive scaling. Confidence-aware decisions that balance performance and cost optimization.',
      keywords: 'scaling formula, confidence-aware, predictive algorithm, resource optimization',
    },
    BATTLE: {
      title: 'HPA++ vs Traditional HPA — Performance Comparison | HPA++',
      description: 'See how HPA++ outperforms traditional HPA with 30-50% faster scaling, 40-60% GPU queue reduction, and 15-25% better utilization.',
      keywords: 'HPA comparison, performance benchmarks, scaling speed, GPU utilization',
    },
    'GHOST SCHEDULER': {
      title: 'Ghost Scheduler — Predictive GPU Node Placement | HPA++',
      description: 'The Ghost Scheduler pre-binds GPU pods to nodes with predicted free capacity, reducing queue times by 40-60%.',
      keywords: 'GPU scheduling, node placement, predictive scheduling, Kubernetes scheduler',
    },
    'NERVOUS SYSTEM': {
      title: 'Cluster Nervous System — Multi-Metric Architecture | HPA++',
      description: 'HPA++ orchestrates CPU, memory, and GPU forecasts through a nervous system architecture for cluster-wide intelligence.',
      keywords: 'cluster architecture, multi-metric, Prometheus, NVIDIA DCGM, monitoring',
    },
    COCKPIT: {
      title: 'Operations Cockpit — Live Monitoring Dashboard | HPA++',
      description: 'Real-time monitoring dashboard showing live forecasts, actual vs predicted metrics, and scaling decisions across your cluster.',
      keywords: 'monitoring dashboard, real-time metrics, live forecasting, Streamlit, Plotly',
    },
    GALAXY: {
      title: 'Cluster Galaxy — Real-World Use Cases | HPA++',
      description: 'From AI model training to e-commerce flash sales. See how HPA++ solves real-world scaling challenges across industries.',
      keywords: 'use cases, AI training, e-commerce, FinTech, research clusters',
    },
    IMPACT: {
      title: 'Impact & Results — Measurable Business Outcomes | HPA++',
      description: '30-50% faster scaling, 20-30% lower latency, 40-60% GPU queue reduction, 15-25% cost savings. Measurable impact on your infrastructure.',
      keywords: 'business impact, ROI, performance metrics, cost savings, infrastructure optimization',
    },
  }

  const config = seoConfig[scene] || seoConfig.default
  const siteUrl = 'https://intelliscale.dev'

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{config.title}</title>
      <meta name="title" content={config.title} />
      <meta name="description" content={config.description} />
      <meta name="keywords" content={config.keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={config.title} />
      <meta property="og:description" content={config.description} />
      <meta property="og:image" content={`${siteUrl}/og-image.png`} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={siteUrl} />
      <meta property="twitter:title" content={config.title} />
      <meta property="twitter:description" content={config.description} />
      <meta property="twitter:image" content={`${siteUrl}/og-image.png`} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={siteUrl} />
    </Helmet>
  )
}
