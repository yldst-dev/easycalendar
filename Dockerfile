FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_DEFAULT_AI_PROVIDER=auto
ARG NEXT_PUBLIC_PRIVACY_POLICY_URL=
ENV NODE_ENV=production
ENV NEXT_PUBLIC_DEFAULT_AI_PROVIDER=${NEXT_PUBLIC_DEFAULT_AI_PROVIDER}
ENV NEXT_PUBLIC_PRIVACY_POLICY_URL=${NEXT_PUBLIC_PRIVACY_POLICY_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ARG NEXT_PUBLIC_DEFAULT_AI_PROVIDER=auto
ARG NEXT_PUBLIC_PRIVACY_POLICY_URL=
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_PUBLIC_DEFAULT_AI_PROVIDER=${NEXT_PUBLIC_DEFAULT_AI_PROVIDER}
ENV NEXT_PUBLIC_PRIVACY_POLICY_URL=${NEXT_PUBLIC_PRIVACY_POLICY_URL}
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "const http=require('node:http');const req=http.get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},(res)=>process.exit(res.statusCode>=500?1:0));req.on('error',()=>process.exit(1));"
CMD ["node", "server.js"]
