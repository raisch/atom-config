# Ambi Network Security Plan

## TL;DR

Our network firewall rules will be changed to limit direct access to
- all of our remote service instances to `ssh` only and
- to our cloud service instances (running `redis`, `mongodb`, `elasticsearch`)
   to our application only.

All other access will be denied.

### Background

We have six service instances in east-1 which currently allow access to the
following ports from ANYWHERE on the global Internet:

    22 ssh
    80 http
    443 https
    3000 appserver
    6379 redis
    9200 elasticsearch
    27017 mongodb

where the appserver port (3000) is where we run our webserver/backend that our
load-balancers reverse-proxy as `public:80,443 -> private:3000`.

### Goal

To secure our backend network services from unauthorized use.

### Plan

We will change these rules as follows:

- application service instances (production and sandbox)
  - ssh: __ANYWHERE__
  - http, https, appserver: load-balancers only
  - all others: __DENIED__


- database service instances (production and sandbox)
  - ssh: __ANYWHERE__
  - mongodb: only from app.prod and app.sand
  - all others: __DENIED__


- text indexing service instances ((production and sandbox))
  - ssh: __ANYWHERE__
  - elasticsearch: only from app.prod and app.sand
  - all others: __DENIED__

### Expected impact

1. The only means to reach our application will be through the load-balancers.

2. All service instances will be generally accessible using ssh.

3. It will no longer be possible to access mongodb, elasticsearch, redis, etc.
directly.

If you still require direct access to our cloud services, see
[Direct Access To Cloud Services](https://github.com/Ambiwork/KnowledgeBase/blob/master/Direct-access-to-cloud-services.md).
