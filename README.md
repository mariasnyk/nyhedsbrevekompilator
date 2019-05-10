=======
Redaktionelle nyhedsbreve
======

This is the application for editorial newsletters with an API and a web interface to admin the newsletters, preview the content, initiate the send out. The application will be built in Node.js and the web framework Hapijs. The application will be run through a Docker container.

## Run from Docker

*This sections describes the details for deploying the app (HCL).*

Running this app inside a Docker container is very easy.
You need to have a Ubuntu/Linux computer with Docker installed.

Docker will automatically download the image and run the app from just one (but very long) command:

```
sudo docker run \
--env=RDS_HOSTNAME=xxx \
--env=RDS_PORT=xxx \
    [...]
--dns=xx.xx.xx.xxx \
--publish=xxx:8000 \
-d bmdako/nyhedsbrevekompilator
```

All the `--env` parameters are the environent variables to allow the app to connect to dependent services eg. SendGrid. These will be supplied separately.

Note: See internal document for details on the environment variables.

The `--dns` parameter specifies what DNS-server should be used. (Necessary for reaching BOND.)

The `--publish` parameter determines what port the container will bind the app to.

Visit `http://<server>:<port>` to make sure the app is running. The *port* is either 8000 or the one you have defined using the `--publish` parameter above.

## Build the Docker image

*This sections describes the details for creating a new release (DevOp / Release Manager).*

First, check out the lastest source code from the GitHub repo or download the ZIP archive.

Next, make sure the application dependencies are installed by running:

```
npm install --production
```

Next, to create a build run (The source code and the Node modules will be copied onto the Docker image.):

```
sudo docker build -t bmdako/nyhedsbrevekompilator .
```


Lastly, to upload the newly built version of the image to Docker Hub, run (You must have been granted permissions.):

```
sudo docker push bmdako/nyhedsbrevekompilator
```

Now the images is ready to deployed. See section *Run from Docker*.


## Run from source

*This sections describes the details for developing new feature and bug fixing. (Developer).*

If you like to run the app directly from source, you can either clone this repo or download the latest ZIP. It's possible to install and run the app from a directory - no systemwide installation or dependencies desides Python (for PostgreSQL client). Python is already installed on a Mac.

First, you need Node (incl. NPM). Download Node (The zipped Binaries - not the installer!) from [http://nodejs.org/download/](http://nodejs.org/download/). I'm currently running v0.10.29 but v0.10.32 should also work fine.

Unpack the ZIP into a directory.

Download the source from git (either using git or zip from [https://github.com/BerlingskeMedia/nyhedsbrevekompilator/archive/master.zip](https://github.com/BerlingskeMedia/nyhedsbrevekompilator/archive/master.zip)). Place the source in a folder next to node. Open a terminal and change directory to it.

First, install the application dependencies by running:

```
npm install
```

*Important*: Before you can start the app, the following environment variables need to be set.
See internal document for details on the environment variables.

You can set these by using a Bash-script eg.:

```
#!/bin/bash

export RDS_HOSTMAME=xxx
export RDS_PORT=xxx
and so on and so on and so on
```

Make the config script executable with `chmod +x config.sh` and set the environment variables by running `. ./config.sh`. (Yes, the extra dot and space in the beginning is necessary.)


Start the app with the following command:

```
npm start
```

Or, to have the app reload on changes, use `npm run dev`.

Now visit [http://localhost:8000/](http://localhost:8000/) if you get no error after startup to see the app.

# Templating

The templates are written in Swig. See the documentation on [http://paularmstrong.github.io/swig/docs/](http://paularmstrong.github.io/swig/docs/).
Also, SendGrid Email Tags are placeholders that will be used when sending the email. See [https://sendgrid.com/docs/Marketing_Emails/tags.html](https://sendgrid.com/docs/Marketing_Emails/tags.html)

The templates are located in `templates` and can be previewed by following URL: `http://<server>/templates/<template_filename>`.

The data to be injected into the template is defined by

E.g.:

```
http://localhost:8000/templates/berlingske_middag.html?f=berlingske_middag.json
http://localhost:8000/templates/berlingske_middag.html?u=http%3A%2F%2Fedit.berlingskemedia.net.white.bond.u.net%2Fbondapi%2Fnodequeue%2F5842.ave-json%3Fimage_preset%3D620x355-c
```

To generate the JSON file in the testdata-folder, user the gulptask **gulp testdata**.

Note: Changes to the templates does not require the application to be restarted since the templates are not cached nor compiled.

# API


## Template collection [GET /templates]
Get all templates.

Use query param **filter** to narrow the result.
E.g.: `template?filter=bt_` or `template?filter=html`

Returns an array:

```
[
"berlingske_middag.html",
"bt_eftermiddag.html",
"bt_mode.html",
"bt_morgen.html",
"bt_nyhedsquiz.html",
"bt_plus.html",
"bt_sport.html",
"simple_overview.plain"
]
```

## Render template [GET /templates/{template}]
Get rendered HTML of a template.

Use query params **u** (BOND API URL) and **f** (JSON file in the testdata-folder) to inject data.

## Render template [POST /templates/{template}]
Get rendered HTML of a template.

Use POST body payload with JSON to inject data.

## Save template file [PUT /templates/{template}]
Saves the HTML body payload as a template file.
Beware: files will be overwritten.

## Delete template file [DELETE /templates/{template}]
Deletes the template file.

## XXX [GET /templates/controlroom]
Returns the corresponding BOND controlroom URL based on a BOND API URL.

Use query params **u** (BOND API URL) as input.

E.g.:

```
GET http://localhost:8000/templates/controlroom?u=http%3A%2F%2Fedit.berlingskemedia.net.white.bond.u.net%2Fbondapi%2Fnodequeue%2F5842.ave-json%3Fimage_preset%3D620x355-c
```

returns:

```
{
"url": "http://edit.berlingskemedia.net.white.bond.u.net/admin/content/nodequeue/5842/view"
}
```

## XXX [GET /bonddata]
Returns JSON BONDAPI data from a URL

## Newsletter collection [GET /newsletters]

## XXX [POST /newsletters]

## XXX [GET /newsletters/{newsletter}]

## XXX [PUT,POST /newsletters/{newsletter}]

## XXX [DELETE /newsletters/{newsletter}]

## XXX [POST /newsletters/draft]

## XXX [POST /newsletters/send]

## XXX [POST /newsletters/{newsletter}/send]

## XXX [GET /newsletters/admin]

## XXX [GET /newsletters/identities]

## XXX [GET /newsletters/identities/{identity}]

## XXX [GET /newsletters/lists]

## XXX [GET /newsletters/lists/{list}]

## XXX [GET /newsletters/categories]

## XXX [GET /newsletters/categories/stats]

## XXX [GET /newsletters/emails]

## XXX [GET /newsletters/emails/{email}]

## XXX [GET /newsletters/emails/schedule/{name}]

## XXX [DELETE /newsletters/emails/schedule/{name}]
