# full stack twitter data archiving tool

## Description:
 A dockerized full-stack twitter data archiving tool written in React and Flask, use twitter APIv2 and MongoDB as database. 
 
 Store and manage twitter data and media locally.
 
<img src="https://github.com/lusixing/full-stack-twitter-data-archiving-tool/blob/main/asset/img1.jpg" width=60% height=60%>

## How to use:
#### Install:
1. put yor bearer token in ./backend/backend_config.yaml
2. run: 
```
docker-compose -f stack.yml build
```

#### start the tool:
1.run:
```
docker-compose -f stack.yml up
```
2.visit:
```
localhost:3000
```
in your browser.
