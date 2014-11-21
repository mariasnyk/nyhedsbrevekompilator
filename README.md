=======
Email Marketing and UserDB platform
======

This is the application for Email Marketing with an API and a web interface to admin the newsletters, preview the content, initiate the send out. The application will be built in Node.js and the web framework Hapijs. The application will be run through a Docker container.

## Run from Docker

*This sections describes the details for deploying the app (HCL).*

Running this app inside a Docker container is very easy.
You need to have a Ubuntu/Linux computer with Docker installed.

Docker will automatically download the image and run the app from just one (but very long) command:

```
sudo docker run \
--env=RDS_HOSTNAME=xxx \
--env=RDS_PORT=xxx \
--env=RDS_DATABASE=xxx \
--env=RDS_USERNAME=xxx \
--env=RDS_PASSWORD=xxx \
--env=MDB_ADDRESS=xxx \
--env=MDB_PORT=xxx \
--env=MDB_DATABASE=xxx \
--env=MDB_USERNAME=xxx \
--env=MDB_PASSWORD=xxx \
--env=BOND_HOSTNAME=xxx \
--env=SENDGRID_API_USER=xxx \
--env=SENDGRID_API_KEY=xxx \
--env=PAYWALL_TOKEN_SALT=xxx \
--dns=80.80.12.242 \
--publish=xxx:8000 \
-d bmdako/userdb
```

All the `--env` parameters are the environent variables to allow the app to connect to dependent services eg. SendGrid. These will be supplied separately.

The `--dns` parameter specifies what DNS-server should be used. (Necessary for reaching BOND.)

The `--publish` parameter determines what port the container will bind the app to.

Visit **http://\<Server DNS/IP\>:\<Port\>** to make sure the app is running. The *Port* is the one you have defined above.

## Build the Docker image

*This sections describes the details for creating a new release (DevOp / Release Manager).*

First, check out the lastest source code from the GitHub repo or download the ZIP archive.

Next, make sure the application dependencies are installed by running:

```
npm install --production
```

Next, to create a build run (The source code and the Node modules will be copied onto the Docker image.):

```
sudo docker build -t bmdako/userdb .
``` 


Lastly, to upload the newly built version of the image to Docker Hub, run (You must have been granted permissions.): 

```
sudo docker push bmdako/userdb
```


## Run from source

*This sections describes the details for developing new feature and bug fixing. (Developer).*

If you like to run the app directly from source, you can either clone this repo or download the latest ZIP. It's possible to install and run the app from a directory - no systemwide installation or dependencies desides Python (for PostgreSQL client). Python is already installed on a Mac.

First, you need Node (incl. NPM). Download Node (The zipped Binaries - not the installer!) from [http://nodejs.org/download/](http://nodejs.org/download/). I'm currently running v0.10.29 but v0.10.32 should also work fine.

Unpack the ZIP into a directory.

Download userdb source from git (either using git or zip from [https://github.com/bmdako/userdb/archive/master.zip](https://github.com/bmdako/userdb/archive/master.zip)). Place the userdb source in a folder next to node. Open a terminal and change directory to it.

First, install the application dependencies by running: 

```
npm install
```

Before you can start the app, the following environment variables need to be set:

- RDS_HOSTNAME
- RDS_PORT
- RDS_DATABASE
- RDS_USERNAME
- RDS_PASSWORD
- MDB_ADDRESS
- MDB_PORT
- MDB_DATABASE
- MDB_USERNAME
- MDB_PASSWORD
- BOND_HOSTNAME
- SENDGRID_API_USER
- SENDGRID_API_KEY
- PAYWALL_TOKEN_SALT

You can set these by using a Bash-script eg.:

```
#!/bin/bash

export RDS_HOSTMAME=xxx
export RDS_PORT=xxx
and so on and so on and so on
```

Make the script executable by ```chmod +x config.sh``` and set the environment variables by running ```. ./config.sh```. (Yes, the extra dot and space in the beginning is necessary.)


Start the app with the following command:

```
../node/bin/node src/app.js
```

'Or, if you have installed *gulp* (using `npm install -g gulp`), just with the command `gulp`.

Now visit [http://localhost:8000/](http://localhost:8000/) if you get no error after startup to see the app.

# Templating

The templates are located in **src/templates** and can be previewed by following URL: **http://\<server\>/templates/\<template_filename\>**.

The data to be injected into the template is defined by query params ***node*** and **nodequeue**

E.g.:

```
http://localhost:8000/templates/breaking.html?node=29660614
http://localhost:8000/templates/overview.html?nodequeue=31 
```

Note: Changes to the templates does not require the application to be restarted since the templates are not cached nor compiled.

The templates are written in Swig. See the documentation on [http://paularmstrong.github.io/swig/docs/](http://paularmstrong.github.io/swig/docs/).

Also, SendGrid Email Tags are placeholders that will be used when sending the email. See [https://sendgrid.com/docs/Marketing_Emails/tags.html](https://sendgrid.com/docs/Marketing_Emails/tags.html) 


# API

From [http://docs.userdb.apiary.io/](http://docs.userdb.apiary.io/)

FORMAT: 1A
HOST: http://localhost:8000/v0

This documents the API for *User DB*, a service for handling the subscription in marketing automation.


# Group Members
These methods are related to the **Member** resources.

## Members Collection [/members]
Optional querystring parameter "show":

- _default_ (not set) - showing only active members
- _all_ - show both active and inactive members
- _inactive_ - show only inactive members

### List all members [GET]

+ Response 200 (application/json)

        [{
        "id": "1", "firstname": "Lars", "lastname": "Jensen", "birth_year": "1977", "birth_date": "03-11-1977", "gender": "", "company": "", "company_cvr": "" 
        }, {
        "id": "2", "firstname": "Lone", "lastname": "Hansen", "birth_year": "1963", "birth_date": "", "gender": "f", "company": "", "company_cvr": ""
        }]

### Create a Member [POST]
Fields:

- `firstname` (text 255 characters)
- `lastname` (text 255 characters)
- `birth_year` (number 4 digits), optional
- `birth_date` (date ISO 8601 in UTC)
- `gender` (`m`, `f`)
- `company` (text 255 characters), optional
- `company_cvr` (text 255 characters), optional
- `is_internal` (`0` default, `1`), optional
- `robinson_flag` (`0` default, `1`), optional

+ Request (application/json)

            { "firstname": "Lars", "lastname": "Jensen", "birth_year": "1977", "birth_date": "03-11-1977", "gender": "", "company": "", "company_cvr": "" }

+ Response 201
    
            { "message": "OK", "id": "123" }


## Member [/members/{id}]

Retrieve the specific member with all related data.

+ Parameters
    + id (required, number, `1`) ... The `id` of the member to be retrived.

### Retrieve a Member [GET]

+ Response 200 (application/json)

        {
        "id": "2", "firstname": "Lone", "lastname": "Hansen", "birth_year": "1963", "birth_date": "", "gender": "f", "company": "", "company_cvr": "", 
        "addresses": 
        [
        {"id": "14", "type": "home", "system_id": "3", "coname": "", "road_name": "Pilestræde", "house_number": "34", "house_letter": "", "floor": "", "side_door": "", "place_name": "", "city": "København K", "postcode": "1147", "country_code": "DK"}
        ], 
        "emails": 
        [
        {"id": "33", "type": "work", "email": "lone@work.com"},
        {"id": "56", "type": "personal", "email": "123@hotmail.com"}
        ],
        "phones": 
        [
        {"id": "62", "type": "home", "phone_number": "33112244"}
        ],
        "subscriptions":
        [
        {"id": "76", "newsletter_id": "565", "newsletter_href": "http://api.udb.berlingskemedia.net/v0/newsletters/565/", "subscription_date": "12-07-2009", "location_id": "112", "email_id": "56"},
        {"id": "77", "newsletter_id": "878", "newsletter_href": "http://api.udb.berlingskemedia.net/v0/newsletters/868/", "subscription_date": "12-07-2009", "location_id": "112", "email_id": "33"},
        ],
        "permissions":
        [
        ],
        "interests":
        [
        {"id": "978", "interest_id": "14", "interest_href": "http://api.udb.berlingskemedia.net/v0/interests/14/", "subscription_date": "12-07-2009", "location_id": "112"}
        ]
        }
        
### Delete a Member [DELETE]
This is a soft delete. Eg. member `status` and subscriptions will be to *inactive*. This means that the member will not be return from any API subscription requests.
But the member data will not be deleted from the database before an admin job deletes it.
        
+ Response 204



## Member email [/members/{id}/email]

### Add a new email to the member [POST]
The request must contain the email adresse and type to be added.
Fields:

- `email_address` (text 255 characters)
- `type` (text 50 characters)


+ Request (application/json)

        { "type": "work", "email_address": "test@test.nl" }

+ Response 201

## Delete member email [/members/{id}/email/{emailid}]

+ Parameters
    + emailid (required, number, `33`) ... The `id` from resource *member.email*.
    
### Remove an existing email from the member [DELETE]

+ Response 204


## Member phone [/members/{id}/phone]

### Add a new phone number to the member [POST]
The request must contain the phone number to be added.
Fields:

- `phone_number` (text 50 characters)
- `type` (text 50 characters)

+ Request (application/json)

        { "type": "work", "phone_number": "+4583736415" }

+ Response 201

## Delete member phone [/members/{id}/phone/{phoneid}]

+ Parameters
    + phoneid (required, number, `62`) ... The `id` from resource *member.phone*.
    
### Remove an existing phone number from the member [DELETE]

+ Response 204




## Member address [/members/{id}/address]

### Add a new address to the member [POST]
The request must contain the address to be added.
Fields:

- `type` (`billing` default, `shipping`)
- `road_name` (text 255 characters)
- `house_number` (text 10 characters)
- `house_letter` (text 10 characters), optional
- `floor` (text 10 characters), optional
- `side_door` (text 10 characters), optional
- `place_name` (text 40 characters), optional
- `coname` (text 255 characters), optional
- `city` (text 70 characters)
- `postal_number` (text 32 characters)
- `country_code` (text 2 characters)

+ Request (application/json)

+ Response 201


## Delete member address [/members/{id}/address/{addressid}]

+ Parameters
    + addressid (required, number, `14`) ... The `id` from resource *member.addresses*.
    
### Remove an existing address from the member [DELETE]

+ Response 204



## Member subscriptions [/members/{id}/subscription]

### Add a new subscription to the member [POST]
Fields:

- `newsletter_id`
- `email` (text 255 characters)
- `location_id`

+ Request (application/json)

+ Response 201

## Delete member subscriptions [/members/{id}/subscription/{subscriptionid}]
The subscription will be marked as inactive. Maybe we will delete it after 30 days.

+ Parameters
    + subscriptionid (required, number, `76`) ... The `id` from resource *member.subscriptions*.

### Remove an existing subscription from the member [DELETE]

+ Response 204



## Member permissions [/members/{id}/permission]

### Add a new permission to the member [POST]

+ Request (application/json)

+ Response 201

## Member permissions [/members/{id}/permission/{permissionid}]

+ Parameters
    + permissionid (required, number, `76`) ... The `id` from resource *member.permissions*.
    
### Remove an existing permission from the member [DELETE]

+ Response 204



## Member interests [/members/{id}/interest]

### Add a new interest to the member [POST]

+ Request (application/json)

+ Response 201

## Member interests [/members/{id}/interest/{interestid}]

+ Parameters
    + interestid (required, number, `978`) ... The `id` from resource *member.interests*.

### Remove an existing interest from the member [DELETE]

+ Response 204



# Group Publishers
These methods are related to the **Publishers** resources.

## Publisher Collection [/publishers]

### List all Publishers [GET]

+ Response 200 (application/json)

        [{
          "id": 1, "name": "AOK"
        }, {
          "id": 2, "name": "Berlingske"
        }]

### Create a Publisher [POST]
Fields:

- `name` (text 255 characters)
- `display_text` (text 255 characters)
- `from_email` (text 255 characters)
- `from_name` (text 255 characters)
- `url_picture_top` (text 255 characters)
- `url` (text 255 characters)

+ Request (application/json)

        [{
        "name": "AOK",
        "display_text": "Alt om København", 
        "from_email": "nothing@aok.dk", 
        "from_name": "AOK.dk", 
        "url_picture_top": "http://aok.dk/gfx/top.png", 
        "url": "http://aok.dk/"
        }]
+ Response 201

## Publisher [/publisher/{id}]

### Retrieve a Publisher [GET]

+ Response 200

### Delete a Publisher [DELETE]

+ Response 204    




# Group Newsletters
These methods are related to the **Newsletter** resources.

## Newsletters Collection [/newsletters]

### List all Newsletters [GET]
+ Response 200 (application/json)

        [{
          "id": 1, "title": "Jogging in park"
        }, {
          "id": 2, "title": "Pick-up posters from post-office"
        }]

### Create a Newsletter [POST]
Fields:

- TODO

+ Request (application/json)

+ Response 201


## Newsletters [/newsletters/{id}]
    
### Retrieve a Newsletter [GET]

+ Response 200 (application/json)

### Delete a Newsletter [DELETE]

+ Response 204


## Newsletters subscriptions [/newsletters/{id}/subscriptions]

### Retrieve subscriptions for this Newsletter [GET]

+ Response 200 (application/json)

    
        [{"email": "test@test.nl", "member":"123"},{"email": "john@doe.nl", "member":"987"}]




# Group Permissions
These methods are related to the **Permission** resources.

## Permissions Collection [/permissions]

### List all Permissions [GET]

+ Response 200 (application/json)

        [{
          "id": 1, "title": "Jogging in park"
        }, {
          "id": 2, "title": "Pick-up posters from post-office"
        }]

### Create a Permission [POST]
Fields:

- TODO

+ Request (application/json)

+ Response 201

## Permission [/permissions/{id}]

### Retrieve a Permission [GET]

+ Response 200

### Delete a Permission [DELETE]

+ Response 204



# Group Interests
These methods are related to the **Interests** resources.

## Interests Collection [/interests]

### List all Interests [GET]

+ Response 200 (application/json)

        [{
          "id": 1, "title": "Jogging in park"
        }, {
          "id": 2, "title": "Pick-up posters from post-office"
        }]

### Create a Interest [POST]
Fields:

- TODO

+ Request (application/json)

+ Response 201

## Interest [/interests/{id}]

### Retrieve an Interest [GET]

+ Response 200

### Delete an Interest [DELETE]

+ Response 204    

