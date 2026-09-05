FROM python:3.12-slim

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/')"

EXPOSE 5000

CMD ["python", "run.py"]