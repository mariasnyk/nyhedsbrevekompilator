'use strict';

var mysql = require('mysql');

var pool = mysql.createPool({
  host: process.env.RDS_HOSTNAME,
  port: process.env.RDS_PORT ? process.env.RDS_PORT : null,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE ? process.env.RDS_DATABASE : null 
});

// Testing we can connect to database
console.log('Connecting to ' + process.env.RDS_HOSTNAME +' as ' + process.env.RDS_USERNAME + '...');
pool.getConnection(function(err, connection) {
  if (err) {
    console.log('Connection to RDS failed: ', err);
    if (err.code === 'ECONNREFUSED') {
      console.log('Maybe the ENV config is missing.');
    }
    process.exit(1);
  } else {
    connection.release();
  }
});

module.exports = pool;


module.exports.queryOne = function (sql, callback) {
  pool.query(sql, function (err, result) {
    if (err) throw err;
    else if (result.length === 0)
      callback(null, null);
    else if (result.length > 1)
      callback(new Error('Too many results'));
    else
      callback(null, result[0]);
  });
};


module.exports.update = function (tableName, data, callback) {

  if (data.id === undefined) {
    callback('Field id missing.');
  }

  var sql = updateSqlString(tableName, data);
  pool.query(sql, callback);
};



function updateSqlString (tableName, data) {
  var pairs = [];
  for (var column in data) {
    if (column !== 'id')
      pairs.push(column + '=' + pool.escape(data[column]));
  }

  return 'UPDATE ' + tableName + ' SET ' + pairs.join(',') + ' WHERE id = ' + data.id;
}




// mysql> show columns from action_history;
// +----------------+---------------------+------+-----+---------+----------------+
// | Field          | Type                | Null | Key | Default | Extra          |
// +----------------+---------------------+------+-----+---------+----------------+
// | id             | int(11) unsigned    | NO   | PRI | NULL    | auto_increment |
// | member_id      | int(11) unsigned    | NO   | MUL | NULL    |                |
// | action_type_id | tinyint(3) unsigned | NO   | MUL | NULL    |                |
// | description    | varchar(255)        | YES  |     |         |                |
// | created_at     | timestamp           | YES  |     | NULL    |                |
// | info           | text                | YES  |     | NULL    |                |
// +----------------+---------------------+------+-----+---------+----------------+


// mysql> show columns from action_type;
// +-------------+---------------------+------+-----+---------+----------------+
// | Field       | Type                | Null | Key | Default | Extra          |
// +-------------+---------------------+------+-----+---------+----------------+
// | id          | tinyint(3) unsigned | NO   | PRI | NULL    | auto_increment |
// | description | varchar(255)        | NO   |     | NULL    |                |
// +-------------+---------------------+------+-----+---------+----------------+

// mysql> show columns from address;
// +---------------+----------------------------+------+-----+---------+----------------+
// | Field         | Type                       | Null | Key | Default | Extra          |
// +---------------+----------------------------+------+-----+---------+----------------+
// | id            | int(11) unsigned           | NO   | PRI | NULL    | auto_increment |
// | member_id     | int(11) unsigned           | NO   | MUL | NULL    |                |
// | active        | tinyint(1) unsigned        | NO   |     | 1       |                |
// | type          | enum('billing','shipping') | NO   |     | billing |                |
// | system_id     | int(11) unsigned           | NO   | MUL | NULL    |                |
// | road_name     | varchar(255)               | YES  |     |         |                |
// | house_number  | varchar(10)                | YES  |     |         |                |
// | house_letter  | varchar(10)                | YES  |     |         |                |
// | floor         | varchar(10)                | YES  |     |         |                |
// | side_door     | varchar(10)                | YES  |     |         |                |
// | place_name    | varchar(40)                | YES  |     |         |                |
// | city          | varchar(70)                | YES  |     |         |                |
// | postal_number | varchar(32)                | YES  |     |         |                |
// | country       | varchar(70)                | YES  |     | NULL    |                |
// | country_code  | char(2)                    | YES  |     | NULL    |                |
// | created_at    | timestamp                  | YES  |     | NULL    |                |
// | updated_at    | datetime                   | YES  |     | NULL    |                |
// +---------------+----------------------------+------+-----+---------+----------------+


// mysql> show columns from foreign_key;
// +------------+------------------+------+-----+---------+----------------+
// | Field      | Type             | Null | Key | Default | Extra          |
// +------------+------------------+------+-----+---------+----------------+
// | id         | int(11) unsigned | NO   | PRI | NULL    | auto_increment |
// | system_id  | int(11) unsigned | NO   | MUL | NULL    |                |
// | member_id  | int(11) unsigned | NO   | MUL | NULL    |                |
// | system_key | varchar(255)     | YES  |     |         |                |
// +------------+------------------+------+-----+---------+----------------+


// mysql> show columns from email;
// +---------------+---------------------+------+-----+-------------------+----------------+
// | Field         | Type                | Null | Key | Default           | Extra          |
// +---------------+---------------------+------+-----+-------------------+----------------+
// | id            | int(11) unsigned    | NO   | PRI | NULL              | auto_increment |
// | member_id     | int(11) unsigned    | NO   | MUL | NULL              |                |
// | email_address | varchar(255)        | YES  |     |                   |                |
// | system_id     | int(11) unsigned    | NO   | MUL | NULL              |                |
// | active        | tinyint(3) unsigned | NO   |     | 1                 |                |
// | created_at    | timestamp           | YES  |     | CURRENT_TIMESTAMP |                |
// | updated_at    | datetime            | YES  |     | NULL              |                |
// +---------------+---------------------+------+-----+-------------------+----------------+

// mysql> show columns from interest;
// +------------------+---------------------+------+-----+---------+----------------+
// | Field            | Type                | Null | Key | Default | Extra          |
// +------------------+---------------------+------+-----+---------+----------------+
// | id               | int(11) unsigned    | NO   | PRI | NULL    | auto_increment |
// | parent_id        | int(11) unsigned    | YES  |     | NULL    |                |
// | name             | varchar(128)        | NO   |     | NULL    |                |
// | display_name     | varchar(255)        | YES  |     |         |                |
// | description      | varchar(255)        | YES  |     |         |                |
// | active           | tinyint(3) unsigned | NO   |     | 1       |                |
// | mdb_interesse_id | int(11)             | YES  |     | NULL    |                |
// +------------------+---------------------+------+-----+---------+----------------+


// mysql> show columns from interest_line;
// +-------------+---------------------+------+-----+-------------------+----------------+
// | Field       | Type                | Null | Key | Default           | Extra          |
// +-------------+---------------------+------+-----+-------------------+----------------+
// | id          | int(11) unsigned    | NO   | PRI | NULL              | auto_increment |
// | member_id   | int(11) unsigned    | NO   | MUL | NULL              |                |
// | interest_id | int(11) unsigned    | NO   | MUL | NULL              |                |
// | location_id | int(11) unsigned    | NO   | MUL | NULL              |                |
// | active      | tinyint(3) unsigned | YES  |     | 1                 |                |
// | created_at  | timestamp           | YES  |     | CURRENT_TIMESTAMP |                |
// | updated_at  | datetime            | YES  |     | NULL              |                |
// +-------------+---------------------+------+-----+-------------------+----------------+

// mysql> show columns from interest_page_info;
// +--------------+---------------------+------+-----+---------+----------------+
// | Field        | Type                | Null | Key | Default | Extra          |
// +--------------+---------------------+------+-----+---------+----------------+
// | id           | int(10) unsigned    | NO   | PRI | NULL    | auto_increment |
// | interest_id  | int(10) unsigned    | NO   | MUL | NULL    |                |
// | page_id      | int(10) unsigned    | NO   | MUL | NULL    |                |
// | display_name | varchar(255)        | YES  |     | NULL    |                |
// | description  | varchar(255)        | YES  |     | NULL    |                |
// | order        | tinyint(3) unsigned | NO   |     | 0       |                |
// +--------------+---------------------+------+-----+---------+----------------+

// mysql> show columns from location;
// +-----------------+------------------+------+-----+---------+----------------+
// | Field           | Type             | Null | Key | Default | Extra          |
// +-----------------+------------------+------+-----+---------+----------------+
// | id              | int(11) unsigned | NO   | PRI | NULL    | auto_increment |
// | description     | varchar(255)     | NO   |     |         |                |
// | active          | tinyint(4)       | NO   |     | 1       |                |
// | mdb_location_id | int(11)          | YES  |     | NULL    |                |
// +-----------------+------------------+------+-----+---------+----------------+


// mysql> show columns from member;
// +---------------+---------------------------+------+-----+-------------------+----------------+
// | Field         | Type                      | Null | Key | Default           | Extra          |
// +---------------+---------------------------+------+-----+-------------------+----------------+
// | id            | int(11) unsigned          | NO   | PRI | NULL              | auto_increment |
// | firstname     | varchar(255)              | YES  |     |                   |                |
// | lastname      | varchar(255)              | YES  |     |                   |                |
// | coname        | varchar(255)              | YES  |     |                   |                |
// | birth_year    | year(4)                   | YES  |     | NULL              |                |
// | birth_date    | date                      | YES  |     | NULL              |                |
// | gender        | char(1)                   | YES  |     |                   |                |
// | username      | varchar(255)              | YES  |     |                   |                |
// | password      | varchar(255)              | YES  |     |                   |                |
// | status        | enum('inactive','active') | NO   |     | inactive          |                |
// | company       | varchar(255)              | YES  |     |                   |                |
// | company_cvr   | varchar(255)              | YES  |     |                   |                |
// | is_internal   | tinyint(1)                | NO   |     | 0                 |                |
// | robinson_flag | tinyint(1) unsigned       | NO   |     | 0                 |                |
// | created_at    | timestamp                 | YES  |     | CURRENT_TIMESTAMP |                |
// | activated_at  | datetime                  | YES  |     | NULL              |                |
// | updated_at    | datetime                  | YES  |     | NULL              |                |
// | mdb_user_id   | int(11)                   | YES  |     | NULL              |                |
// | external_id   | varchar(255)              | YES  |     | NULL              |                |
// +---------------+---------------------------+------+-----+-------------------+----------------+


// mysql> show columns from opt_out_desc;
// +-------------+------------------+------+-----+---------+----------------+
// | Field       | Type             | Null | Key | Default | Extra          |
// +-------------+------------------+------+-----+---------+----------------+
// | id          | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
// | description | varchar(255)     | YES  |     | NULL    |                |
// +-------------+------------------+------+-----+---------+----------------+

// mysql> show columns from opt_outs;
// +-----------+------------------+------+-----+-------------------+----------------+
// | Field     | Type             | Null | Key | Default           | Extra          |
// +-----------+------------------+------+-----+-------------------+----------------+
// | id        | int(10) unsigned | NO   | PRI | NULL              | auto_increment |
// | email_id  | int(10) unsigned | NO   | MUL | NULL              |                |
// | timestamp | timestamp        | YES  |     | CURRENT_TIMESTAMP |                |
// +-----------+------------------+------+-----+-------------------+----------------+

// mysql> show columns from page;
// +-------+------------------+------+-----+---------+----------------+
// | Field | Type             | Null | Key | Default | Extra          |
// +-------+------------------+------+-----+---------+----------------+
// | id    | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
// | name  | varchar(255)     | NO   |     | NULL    |                |
// +-------+------------------+------+-----+---------+----------------+

// mysql> show columns from permission;
// +-------------------+---------------------+------+-----+---------+----------------+
// | Field             | Type                | Null | Key | Default | Extra          |
// +-------------------+---------------------+------+-----+---------+----------------+
// | id                | int(11) unsigned    | NO   | PRI | NULL    | auto_increment |
// | name              | varchar(255)        | YES  |     | NULL    |                |
// | active            | tinyint(3) unsigned | NO   |     | 1       |                |
// | display_text      | varchar(255)        | YES  |     | NULL    |                |
// | description       | text                | YES  |     | NULL    |                |
// | mdb_nyhedsbrev_id | int(11)             | YES  |     | NULL    |                |
// +-------------------+---------------------+------+-----+---------+----------------+


// mysql> show columns from permission_member;
// +-----------------+---------------------+------+-----+---------+----------------+
// | Field           | Type                | Null | Key | Default | Extra          |
// +-----------------+---------------------+------+-----+---------+----------------+
// | id              | int(11)             | NO   | PRI | NULL    | auto_increment |
// | member_id       | int(11) unsigned    | NO   | MUL | NULL    |                |
// | email_id        | int(11) unsigned    | NO   | MUL | NULL    |                |
// | permission_id   | int(11) unsigned    | NO   | MUL | NULL    |                |
// | location_id     | int(11) unsigned    | NO   | MUL | NULL    |                |
// | active          | tinyint(3) unsigned | YES  |     | 1       |                |
// | joined          | datetime            | YES  |     | NULL    |                |
// | unjoined        | datetime            | YES  |     | NULL    |                |
// | unsub_reason_id | int(11) unsigned    | YES  | MUL | NULL    |                |
// +-----------------+---------------------+------+-----+---------+----------------+

// mysql> show columns from phone;
// +------------+------------------+------+-----+-------------------+----------------+
// | Field      | Type             | Null | Key | Default           | Extra          |
// +------------+------------------+------+-----+-------------------+----------------+
// | id         | int(11) unsigned | NO   | PRI | NULL              | auto_increment |
// | member_id  | int(11) unsigned | NO   | MUL | NULL              |                |
// | type_id    | int(11) unsigned | NO   | MUL | NULL              |                |
// | system_id  | int(11) unsigned | NO   | MUL | NULL              |                |
// | number     | varchar(50)      | NO   |     |                   |                |
// | status     | tinyint(4)       | NO   |     | NULL              |                |
// | created_at | timestamp        | YES  |     | CURRENT_TIMESTAMP |                |
// +------------+------------------+------+-----+-------------------+----------------+

// mysql> show columns from phone_type;
// +-------+------------------+------+-----+---------+----------------+
// | Field | Type             | Null | Key | Default | Extra          |
// +-------+------------------+------+-----+---------+----------------+
// | id    | int(11) unsigned | NO   | PRI | NULL    | auto_increment |
// | type  | varchar(20)      | NO   |     | NULL    |                |
// +-------+------------------+------+-----+---------+----------------+

// mysql> show columns from publisher;
// +------------------+------------------+------+-----+-------------------+----------------+
// | Field            | Type             | Null | Key | Default           | Extra          |
// +------------------+------------------+------+-----+-------------------+----------------+
// | id               | int(11) unsigned | NO   | PRI | NULL              | auto_increment |
// | name             | varchar(255)     | YES  |     |                   |                |
// | display_text     | varchar(255)     | YES  |     |                   |                |
// | from_email       | varchar(255)     | YES  |     |                   |                |
// | from_name        | varchar(255)     | YES  |     |                   |                |
// | url_picture_top  | varchar(255)     | YES  |     |                   |                |
// | active           | tinyint(4)       | NO   |     | 1                 |                |
// | url              | varchar(255)     | YES  |     |                   |                |
// | created_at       | timestamp        | YES  |     | CURRENT_TIMESTAMP |                |
// | mdb_publisher_id | int(11)          | YES  |     | NULL              |                |
// +------------------+------------------+------+-----+-------------------+----------------+

// mysql> show columns from reason_type;
// +-------+------------------+------+-----+---------+----------------+
// | Field | Type             | Null | Key | Default | Extra          |
// +-------+------------------+------+-----+---------+----------------+
// | id    | int(11) unsigned | NO   | PRI | NULL    | auto_increment |
// | text  | varchar(255)     | YES  |     |         |                |
// +-------+------------------+------+-----+---------+----------------+

// mysql> show columns from subscription;
// +-------------------+---------------------+------+-----+---------+----------------+
// | Field             | Type                | Null | Key | Default | Extra          |
// +-------------------+---------------------+------+-----+---------+----------------+
// | id                | int(11) unsigned    | NO   | PRI | NULL    | auto_increment |
// | publisher_id      | int(11) unsigned    | NO   | MUL | NULL    |                |
// | name              | varchar(255)        | YES  |     | NULL    |                |
// | active            | tinyint(3) unsigned | YES  |     | 1       |                |
// | display_text      | varchar(255)        | YES  |     | NULL    |                |
// | description       | text                | YES  |     | NULL    |                |
// | mdb_nyhedsbrev_id | int(11)             | YES  |     | NULL    |                |
// +-------------------+---------------------+------+-----+---------+----------------+

// mysql> show columns from subscription_member;
// +-----------------+---------------------+------+-----+---------+----------------+
// | Field           | Type                | Null | Key | Default | Extra          |
// +-----------------+---------------------+------+-----+---------+----------------+
// | id              | int(11) unsigned    | NO   | PRI | NULL    | auto_increment |
// | member_id       | int(11) unsigned    | NO   | MUL | NULL    |                |
// | email_id        | int(11) unsigned    | NO   | MUL | NULL    |                |
// | subscription_id | int(11) unsigned    | NO   | MUL | NULL    |                |
// | location_id     | int(11) unsigned    | NO   | MUL | NULL    |                |
// | active          | tinyint(3) unsigned | YES  |     | 1       |                |
// | joined          | datetime            | YES  |     | NULL    |                |
// | unjoined        | datetime            | YES  |     | NULL    |                |
// | unsub_reason_id | int(11) unsigned    | YES  | MUL | NULL    |                |
// +-----------------+---------------------+------+-----+---------+----------------+

// mysql> show columns from system;
// +--------+------------------+------+-----+---------+----------------+
// | Field  | Type             | Null | Key | Default | Extra          |
// +--------+------------------+------+-----+---------+----------------+
// | id     | int(11) unsigned | NO   | PRI | NULL    | auto_increment |
// | name   | varchar(255)     | NO   |     |         |                |
// | active | tinyint(4)       | NO   |     | 1       |                |
// +--------+------------------+------+-----+---------+----------------+

// mysql> show columns from unsub_reason;
// +--------------------+------------------+------+-----+---------+----------------+
// | Field              | Type             | Null | Key | Default | Extra          |
// +--------------------+------------------+------+-----+---------+----------------+
// | id                 | int(11) unsigned | NO   | PRI | NULL    | auto_increment |
// | reason_type_id     | int(11) unsigned | NO   | MUL | NULL    |                |
// | custom_reason_text | text             | NO   |     | NULL    |                |
// +--------------------+------------------+------+-----+---------+----------------+


// mysql> show tables;
// +------------------------+
// | Tables_in_userdb       |
// +------------------------+
// | action_history         |
// | action_type            |
// | address                |
// | email                  |
// | foreign_key            |
// | interest               |
// | interest_line          |
// | interest_page_info     |
// | location               |
// | member                 |
// | opt_out_desc           |
// | opt_outs               |
// | page                   |
// | permission             |
// | permission_member      |
// | phone                  |
// | phone_type             |
// | publisher              |
// | reason_type            |
// | smartlink              |
// | smartlink_interest     |
// | smartlink_permission   |
// | smartlink_subscription |
// | subscription           |
// | subscription_member    |
// | system                 |
// | unsub_reason           |
// +------------------------+