FORMAT: 1A
HOST: http://localhost:8000/v0

# User DB
This documents the API for *User DB*, a service for handling the subscription in marketing automation.


# Group Members
These methods are related to the **Member** resources.

## Members Collection [/members]

### List all members [GET]
+ Response 200 (application/json)

        [{
          "id": 1, "title": "Jogging in park"
        }, {
          "id": 2, "title": "Pick-up posters from post-office"
        }]

### Create a Member [POST]

+ Request (application/json)

+ Response 201



## Member [/members/{id}]
Retrieve the specific member with all related data.

+ Parameters
    + id (required, number, `1`) ... Numeric `id` of the Note to perform action with. Has example value.

### Retrieve a Member [GET]
+ Response 200 (application/json)

        { "id": 2, "title": "Pick-up posters from post-office" }

### Delete a Member [DELETE]
This is a soft delete. Eg. member will be marked as deleted and will be removed from all subscriptions.
But the member data will not be deleted from the database before an admin job deletes it.

+ Response 204



## Member email [/members/{id}/email]

### Add a new email to the member [POST]
The request must contain the email adresse and type to be added.
Fields:

- email eg. `test@test.nl`
- type (optional) eg. `work`

+ Request (application/json)

        { "type": "work", "email": "test@test.nl" }

+ Response 201

### Remove an existing email from the member [DELETE]
The request must contain the email to be deleted.
Fields:

- email

+ Request (application/json)

        { "email": "test@test.nl" }

+ Response 204



## Member phone [/members/{id}/phone]

### Add a new phone number to the member [POST]
The request must contain the phone number to be added.
Fields:

- phone eg. `+4583736415`
- type (optional) eg. `work`

+ Request (application/json)

        { "type": "work", "phone": "+4583736415" }

+ Response 201

### Remove an existing phone number from the member [DELETE]
The request must contain the phone number to be deleted.
Fields:

- phone

+ Request (application/json)

        { "phone": "+4583736415" }

+ Response 204




## Member address [/members/{id}/address]

### Add a new address to the member [POST]
The request must contain the address to be added.
Fields:

- address
- type (optional) eg. `work`

+ Request (application/json)

+ Response 201

### Remove an existing address from the member [DELETE]
The request must contain the address to be deleted.
Fields:

- address

+ Response 204



## Member subscriptions [/members/{id}/subscription]

### Add a new subscription to the member [POST]
Fields:

- newsletter
- email

+ Request (application/json)

+ Response 201

### Remove an existing subscription from the member [DELETE]
Fields:

- newsletter
- email (optional). If omitted, all subscription from the member to the newsletter will be deleted.

+ Response 204



## Member permissions [/members/{id}/permission]

### Add a new permission to the member [POST]

+ Request (application/json)

+ Response 201

### Remove an existing permission from the member [DELETE]

+ Response 204



## Member interests [/members/{id}/interest]

### Add a new interest to the member [POST]

+ Request (application/json)

+ Response 201

### Remove an existing interest from the member [DELETE]

+ Response 204



# Group Publishers
These methods are related to the **Publishers** resources.

## Publisher Collection [/publishers]

### List all Publishers [GET]

+ Response 200 (application/json)

        [{
          "id": 1, "title": "Jogging in park"
        }, {
          "id": 2, "title": "Pick-up posters from post-office"
        }]

### Create a Publisher [POST]

+ Request (application/json)

+ Response 201

## Publisher [/publisher/{id}]

+ Parameters
    + id (required, number, `1`) ... Numeric `id` of the Note to perform action with. Has example value.

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

+ Request (application/json)

+ Response 201


## Newsletters [/newsletters/{id}]

+ Parameters
    + id (required, number, `1`) ... Numeric `id` of the Note to perform action with. Has example value.
    
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

## Permission Collection [/permissions]

### List all Permissions [GET]

+ Response 200 (application/json)

        [{
          "id": 1, "title": "Jogging in park"
        }, {
          "id": 2, "title": "Pick-up posters from post-office"
        }]

### Create a Permission [POST]

+ Request (application/json)

+ Response 201

## Permission [/permissions/{id}]

+ Parameters
    + id (required, number, `1`) ... Numeric `id` of the Note to perform action with. Has example value.

### Retrieve a Permission [GET]

+ Response 200

### Delete a Permission [DELETE]

+ Response 204



# Group Interests
These methods are related to the **Interests** resources.

## Interest Collection [/interests]

### List all Interests [GET]

+ Response 200 (application/json)

        [{
          "id": 1, "title": "Jogging in park"
        }, {
          "id": 2, "title": "Pick-up posters from post-office"
        }]

### Create a Interest [POST]

+ Request (application/json)

+ Response 201

## Interest [/interests/{id}]

+ Parameters
    + id (required, number, `1`) ... Numeric `id` of the Note to perform action with. Has example value.

### Retrieve an Interest [GET]

+ Response 200

### Delete an Interest [DELETE]

+ Response 204    


