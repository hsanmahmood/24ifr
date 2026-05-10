FROM python:3.9-slim

ENV PYTHONPATH=/app

WORKDIR /app/backend

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["python", "-m", "waitress", "--port=5000", "app.app:app"]