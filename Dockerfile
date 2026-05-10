# Use a tiny Nginx image to serve the app
FROM nginx:stable-alpine

# Copy the pre-built dist folder from your local machine to the container
COPY dist /usr/share/nginx/html

# Copy your custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
