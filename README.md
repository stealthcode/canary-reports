# Canary Reporting #

## MongoDB Prerequisite ##
Download the latest version of [MongoDB](http://www.mongodb.org/downloads). The zip can be extracted to any directory of your choice. The following shell command will install a service named "MongoDB". You can also change the service user/password using mongod.exe flags. Note that you must first `cd` to the bin folder in the root of the extraction path.

`mongod.exe --dbpath <data_directory_path> --logpath <log_file_path> --install --serviceName "MongoDB"`

## Node.js Prerequisite ##
Install [Nodejs v0.8.x](http://nodejs.org/).

## Installation ##
1. Clone the git repository. 
2. From a command shell `cd <repository_directory>` and run `npm install`. This will download all nodejs libraries necessary to run the application. 
3. Launch node with the shell command `node canary`. You can configure the web reporting port with the `--port=<port_number>` command line flag.

Node can also be hosted from within an IIS7 environment. See the *Running* section below.

## Configuration ##
You may specify a configuration by writing a js module that exports a json object. Running this process with an environment variable named `CONFIG_KEY` will indicate at run time which config file name to use. For further reference, see the `config/local.js` file and it's usage in the `server.js`.

## Running ##
IIS7 is made possible by [iisnode](https://github.com/tjanczuk/iisnode/wiki/iisnode-releases). 

## Accessing Reports ##
Open a browser and go to the host where the nodejs server is running on the configured port (default 8081). 

## FAQ ##
1. **What ports do I need to open for this application?**
MongoDB listens for connetions from NodeJS on port 27017. By default, NodeJS will listen for HTTP requests on port 8081.
2. **How can I test the MongoDB connectivity?** Run `node canary`. The message `Connected to 'autotest' database` will be output to `STDOUT`.
3. **What kind of administrative access will a developer or IT administrator require?** Occasionally it may be necessary to access MongoDB data directly via shell. This can be done over the same port MongoDB is configured to listen for connections (default 27017). Also, it may sometimes be necessary to update the reporting to a tag or latest version hosted in github. 
