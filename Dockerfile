# Tomes Club : meme image que celle generee par Mini Railway (Next.js, Node 22 alpine, npm),
# avec LibreOffice en plus pour transformer PowerPoint / Word / Excel en PDF
# (l hote les montre page par page pendant l appel video).

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm ci
ENV NODE_ENV=production
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine
# LibreOffice + polices (Liberation = memes tailles que Arial / Times New Roman).
# su-exec : demarrer en tant que "node" apres avoir donne le volume a "node".
RUN apk add --no-cache libreoffice-impress libreoffice-writer libreoffice-calc \
    font-liberation font-dejavu font-noto su-exec
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app ./
# Sans volume : les fichiers vont dans /app/uploads (a "node" aussi).
RUN mkdir -p /app/uploads && chown node:node /app /app/uploads
EXPOSE 3000
# Le volume (fichiers des activites) appartient a root au depart : on le donne a "node",
# puis l application tourne en tant que "node" (pas en root).
CMD ["/bin/sh", "-c", "if [ -n \"$TWINS_VOLUME_MOUNT_PATH\" ]; then mkdir -p \"$TWINS_VOLUME_MOUNT_PATH/activity-files/pdf\" && chown node:node \"$TWINS_VOLUME_MOUNT_PATH\" \"$TWINS_VOLUME_MOUNT_PATH/activity-files\" \"$TWINS_VOLUME_MOUNT_PATH/activity-files/pdf\"; fi; exec su-exec node npm run start"]
