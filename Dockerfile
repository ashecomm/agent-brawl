FROM node:18-alpine

WORKDIR /app

# Install frontend deps & build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
RUN cd frontend && npm run build

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY backend ./backend

# Expose port
EXPOSE 3001

# Start backend (serves frontend/dist)
WORKDIR /app/backend
CMD ["npm", "start"]
