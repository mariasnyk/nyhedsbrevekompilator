=======
userdb
======

# Run from Docker

Running this app inside a Docker container is very easy.
You need to have a Ubuntu/Linux computer with Docker installed.

Docker will automatically download the image and run the app from just one (but very long) command:

```
sudo docker run \
-e RDS_HOSTNAME=xxx \
-e RDS_PORT=xxx \
-e RDS_DATABASE=xxx \
-e RDS_USERNAME=xxx \
-e RDS_PASSWORD=xxx \
-e MDB_ADDRESS=xxx \
-e MDB_PORT=xxx \
-e MDB_DATABASE=xxx \
-e MDB_USERNAME=xxx \
-e MDB_PASSWORD=nqO94hfrhC \
-e AWS_ACCESS_KEY_ID=xxx \
-e AWS_SECRET_ACCESS_KEY=xxx \
-e AWS_REGION=xxx \
-e BOND_API=xxx \
-e SENDGRID_API_USER=xxx \
-e SENDGRID_API_KEY=xxx \
-p xxxx:8000 \
-d bmdako/userdb
```

All the `-e` parameters are the environent variables to allow the app to connect to dependent services eg. SendGrid. These will be supplied seperatly
The `-p` parameter determines what port the container will bind the app to.


# Build the Docker image

Check out the lastest source code from the GitHub repo.

Run `sudo docker build -t bmdako/userdb` to create a build locally.
The Docker image will contain the source code and the Node modules.

Run `sudo docker push bmdako/userdb` to upload the last version of the image to Docker Hub. You need to have the right credentials on the Docker Hub to do this.


# Run from source

If you like to run the app directly from source, you can either clone this repo or download the latest ZIP.

You need Node (incl. NPM) and Python (for PostgreSQL client) installed.

Run `npm install` to install the dependencies.

You need to set the following environment variables:

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
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- BOND_API
- SENDGRID_API_USER
- SENDGRID_API_KEY

Start the app with `node src/app.js` or, if you have installed *gulp* (using `npm install -g gulp`), just with the command `gulp`.

Visit [http://localhost:8000/](http://localhost:8000/) if you get no error.

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

