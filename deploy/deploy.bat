set DOCKER_HOST=tcp://192.168.1.226:2375
cd ..
# git reset --hard origin/dev && git pull
yarn install && yarn build

cd deploy

docker-compose up -d --build



