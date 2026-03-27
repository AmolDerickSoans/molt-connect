# Molt Connect Scalability Roadmap

## Current Architecture (MVP)

```
Agent A ←→ Single Relay (file-based) ←→ Agent B
```

**Limitations:**
- Single point of failure
- No redundancy
- File-based registry (not scalable)
- HTTP polling (not real-time)

---

## Phase 1: Production-Ready (1-2 days)

### Infrastructure
```
                    Cloudflare (DDoS protection)
                           │
                    Load Balancer
                           │
              ┌────────────┼────────────┐
              │            │            │
         Relay Pod    Relay Pod    Relay Pod
              │            │            │
              └────────────┼────────────┘
                           │
                    Redis Cluster
                    (registry + pub/sub)
```

### Components
- **Relay**: Deploy to Railway/Fly.io (auto-scaling)
- **Registry**: Redis (managed, 99.9% SLA)
- **Transport**: WebSocket for real-time delivery
- **Cost**: $20-50/month for 10k users

### Code Changes Needed
1. Replace file-based registry with Redis
2. Add WebSocket server to relay
3. Add connection pooling
4. Add health checks + auto-restart

---

## Phase 2: High Availability (1 week)

### Infrastructure
- Kubernetes cluster (3+ nodes)
- Redis Cluster (multi-AZ)
- Multi-region failover
- Monitoring (Prometheus + Grafana)

### Features
- Auto-scaling based on load
- Zero-downtime deployments
- Multi-region replication
- Message queue for reliability

**Cost**: $200-500/month for 100k users

---

## Phase 3: Global Scale (1 month)

### Infrastructure
- Multi-region Kubernetes
- CDN for static assets
- Edge workers for routing
- Dedicated message brokers

### Features
- Geographic load balancing
- Message persistence + replay
- Analytics dashboard
- Enterprise SSO

**Cost**: $1,000-5,000/month for 1M+ users

---

## Serverless Alternative (Cheapest)

### Cloudflare Workers + Durable Objects

```
Agent A → Cloudflare Edge → Durable Object → Agent B
```

**Advantages:**
- Auto-scales to infinity
- No server management
- Global edge network
- Built-in DDoS protection

**Cost:**
- Free tier: 100k requests/day
- Paid: $5/month + $0.50 per million requests

**Implementation:**
1. Port relay logic to Cloudflare Worker
2. Use Durable Objects for registry
3. Use WebSocket API for real-time

---

## Decision Matrix

| Scale | Solution | Time | Cost/month |
|-------|----------|------|------------|
| <10k users | Single VPS + Redis | 1 day | $20 |
| 10-100k users | K8s (3 nodes) | 1 week | $200 |
| 100k-1M users | K8s + Redis Cluster | 2 weeks | $500 |
| 1M+ users | Multi-region K8s | 1 month | $2k+ |
| Any scale | Cloudflare Workers | 2 days | $5-50 |

---

## Recommended Path

1. **Start**: Cloudflare Workers (cheapest, auto-scales)
2. **If needed**: Migrate to K8s when costs exceed $200/month

---

## Key Code Changes Required

### 1. Redis Registry (src/registry-redis.ts)
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function register(address: string, url: string, publicKey: string) {
  await redis.hset('molt:registry', address, JSON.stringify({ url, publicKey }));
}

async function resolve(address: string) {
  const data = await redis.hget('molt:registry', address);
  return data ? JSON.parse(data) : null;
}
```

### 2. WebSocket Support (src/relay-ws.ts)
```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  ws.on('message', (data) => {
    // Route message to target agent
    const { to, message } = JSON.parse(data);
    routeMessage(to, message);
  });
});
```

### 3. Horizontal Scaling
- Use Redis pub/sub for cross-relay messaging
- Use sticky sessions or connection routing

---

## Contact

When ready to scale, notify founder Amol:
- Current architecture file: `src/relay.ts`
- This roadmap: `SCALABILITY_ROADMAP.md`
- Estimated costs and decisions documented above
