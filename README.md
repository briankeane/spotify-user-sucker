# pl-example-service

### Adding a microservice to Playola:
* Clone this repo
* Replace the git remote with your new git remote
* Modify:
	* 	package.json:
		*	Name and Author
	*	.env files:
		* create a .env file
		* update .env-example with your changes
	*  docker-compose file:
		* 

### Connecting to playola's rabbitmq stream:

The example service connects to the stream by default.  If your service does not want to use it:

* Comment out the appropriate line in .env files
* Comment out `connectToServices()` line in `index.js`
* Comment out the appropriate section in `docker-compose.yaml`
* Remove submodule pl-event-stream-node

### If using a redis cache:
* Uncomment the appropriate line in .env files
* Uncomment the appropriate section in `docker-compose.yaml`

### If using postgres:
* Uncomment the appropriate line in .env files
* Uncomment the appropriate section in `docker-compose.yaml`

### If using mongoose:
* Uncomment the appropriate line in .env files
* Uncomment the appropriate section in `docker-compose.yaml`
* Uncomment `connectToMongo()` in `index.js`

### Running the app in dev mode:

`docker-compose up --build` spin up the docker containers and start the app.  It will automatically restart when files are changed.

### Running tests
ssh into the running docker container with

`docker exec -it pl_example_service bash`

Tests can then be run with 

`npm test` 

or, if you need a different .env config, 

`env-cmd .env-test npm test`




