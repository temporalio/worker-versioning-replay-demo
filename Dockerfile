FROM node:20 as build

WORKDIR /app

COPY package.json package-lock.json /app

RUN npm ci

COPY tsconfig.json /app/
COPY src /app/src

RUN npm run build

# Reinstall without dev dependencies now that the application is built
RUN npm ci --omit dev

FROM gcr.io/distroless/nodejs20-debian11

ARG BUILD_ID
ENV BUILD_ID=$BUILD_ID
ENV WORKFLOW_BUNDLE_PATH=/app/workflow-bundle.js

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/lib /app/lib
COPY --from=build $WORKFLOW_BUNDLE_PATH $WORKFLOW_BUNDLE_PATH

VOLUME /certs
CMD ["/app/lib/worker.js"]
