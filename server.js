var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var methodOverride = require('method-override');
var path = require('path');
var log = require('./libs/log')(module);
var UsersModel = require('./libs/database').UsersModel;
var PostsModel = require('./libs/database').PostsModel;
var config = require('./libs/config');
var app = express();

app.use(morgan('combined')); // выводим все запросы со статусами в консоль
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override')); // поддержка put и delete
app.use(express.static(path.join(__dirname, "public")));


app.get('/ErrorExample', function (req, res, next) {
    next(new Error('Random error!'));
});

app.get('/api', function (req, res) {
    res.send('API is running');
});

app.options("/*", function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.send(200);
});

app.get('/api/users', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return UsersModel.find(function (err, users) {
        if (!err) {
            return res.send(users);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

app.post('/api/users/login', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return UsersModel.find({"login": req.body.login}, function (err, users) {
        if (!users) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        if (users.length == 0) {
            res.statusCode = 401;
            return res.send({error: '401', message: 'User not registered'});
        }
        var user = users[0];
        if (user.password != req.body.password) {
            res.statusCode = 401;
            return res.send({error: '401', message: 'Wrong password'});
        }
        if (!err) {
            return res.send({status: 'OK', user: user});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

app.post('/api/users/create', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    console.log(req.body);
    var user = new UsersModel({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        login: req.body.login,
        password: req.body.password
    });

    user.save(function (err) {
        if (!err) {
            log.info("user created");
            return res.send({status: 'OK', user: user});
        } else {
            console.log(err);
            if (err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({error: 'Validation error', message: err.message});
            } else {
                res.statusCode = 500;
                res.send({error: 'Server error'});
            }
            log.error('Internal error(%d): %s', res.statusCode, err.message);
        }
    });
});

app.get('/api/users/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return UsersModel.findById(req.params.id, function (err, user) {
        if (!user) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        if (!err) {
            return res.send({status: 'OK', user: user});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

app.delete('/api/users/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return UsersModel.findById(req.params.id, function (err, user) {
        if (!user) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        return user.remove(function (err) {
            if (!err) {
                log.info("user removed");
                return res.send({status: 'OK'});
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({error: 'Server error'});
            }
        });
    });
});

app.get('/api/posts', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return PostsModel.find(function (err, posts) {
        if (!err) {
            return res.send(posts);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

app.post('/api/posts', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    console.log(req.body);
    var post = new PostsModel({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        tags: req.body.tags
    });
    console.log(post);
    post.save(function (err) {
        if (!err) {
            log.info("post created");
            return res.send({status: 'OK', post: post});
        } else {
            console.log(err);
            if (err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({error: 'Validation error', message: err.message});
            } else {
                res.statusCode = 500;
                res.send({error: 'Server error'});
            }
            log.error('Internal error(%d): %s', res.statusCode, err.message);
        }
    });
});

// -------- Error handing

app.use(function (req, res, next) {
    res.status(404);
    log.debug('Not found URL: %s', req.url);
    res.send({error: 'Not found'});
    return;
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    res.send({error: err.message});
    return;
});

// --------


app.listen(config.get('port'), function () {
    console.log('Listening on port: ' + config.get('port'));
})
