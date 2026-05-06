# ========== BUILDER STAGE ==========
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Accept build arguments
ARG VITE_REACT_APP_API_URL
ARG VITE_REACT_APP_WEBSOCKET_URL
ARG VITE_GOOGLE_CLIENT_ID

# Set them as environment variables for the build
ENV VITE_REACT_APP_API_URL=${VITE_REACT_APP_API_URL}
ENV VITE_REACT_APP_WEBSOCKET_URL=${VITE_REACT_APP_WEBSOCKET_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Build the application
RUN npm run build


# ========== RUNTIME STAGE ==========
FROM nginx:alpine AS runtime

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
