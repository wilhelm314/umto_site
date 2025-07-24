## Instalation

`git clone git@github.com:wilhelm314/llmwrap.git`

`cd llmwrap`

### install postgresql

`sudo apt install postgresql`

`sudo service postgresql start`

`cp ./localstack_db_0.1.6.sql /tmp/sql.sql && sudo -u postgres psql -v ON_ERROR_STOP=1 -a -f /tmp/sql.sql`

if something goes wrong you can run

`sudo pg_dropcluster --stop 14 main && pg_createcluster --start 14 main`

to wipe the current postgres setup.

### Install node

```
# Download and install fnm:
curl -o- https://fnm.vercel.app/install | bash

# Download and install Node.js:
fnm install 22

# Verify the Node.js version:
node -v # Should print "v22.14.0".

# Verify npm version:
npm -v # Should print "10.9.2".
```

#### install frontend

`cd frontend && npm install`

### Create backend venv
`curl -LsSf https://astral.sh/uv/install.sh | sh && cd ../backend && uv venv && uv sync && source .venv/bin/activate`

## Setup db env

`cd src`

### Create envfile

`python -m cli create_env`

### Create dummy admin user and organisation

`python -m cli create_organisation`

`python -m cli create_user --username Jonas --email foo@bar.dk --password 1234`

## Start up

To start frontend in devmode run

`llmwrap/frontend$ npm start dev`

To start backend run (make sure you've activated the venv)

`llmwrap/backend/src$ python -m main`

## Update frontendpoints

`npm run generate-client`
