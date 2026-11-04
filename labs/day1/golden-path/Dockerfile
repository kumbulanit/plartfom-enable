# The pipeline passes BASE_IMAGE so the build pulls through the lab's Harbor cache.
ARG BASE_IMAGE=python:3.12-slim
FROM ${BASE_IMAGE}

# The commit SHA the image was built from; reported by / and /metrics.
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION} \
    PORT=8081 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /srv
COPY app/ app/

# Run as an unprivileged user (the Deployment also sets runAsNonRoot).
USER 10001
EXPOSE 8081
ENTRYPOINT ["python", "-m", "app.main"]
