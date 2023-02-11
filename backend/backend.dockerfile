# syntax=docker/dockerfile:1

FROM python:3.10.4

WORKDIR /flask-app1

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

ENV FLASK_APP=backend_v1.py

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]