/*!
 * Connect - backboneServer
 * Copyright (c) 2011 by Jesse Clark
 * MIT Licensed
 */

/**
 * backboneServer provides a REST backend for a Backbone.js client
 * 
 * @param collections
 * Takes an object of Backbone collections as an argument.
 * Requires bodyParser to run first.
 *
 * Example:
 * 
 * var Backbone = require('backbone');
 * Backbone.sync = require('backbone-stash')('data').sync;
 * var Todo = Backbone.Model.extend({});
 * var Todos = Backbone.Collection.extend({model: Todo});
 * var collections = {todos: new Todos()};
 * express_app.use(express.bodyParser());
 * express_app.use(backboneServer(collections));
 *
 */

var getUrl = function(object) {
    if (object.url instanceof Function) {
        return object.url();
    } else if (typeof object.url === 'string') {
        return object.url;
    }
};

var randomUDID = function () {
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

exports = module.exports = function backboneServer(collections) {
    return function backboneServer(req, res, next) {
        var collection = null;
        var collection_url = null;
        for (cname in collections) {
            var try_coll = collections[cname];
            collection_url = getUrl(try_coll);
            if (req.url.substr(0,collection_url.length) === collection_url) {
                collection = try_coll;
                break;
            }
        }
        if (!collection) {
            return next();
        }
        var found_model = null;
        if (req.url !== collection_url) {
            var separator = (collection_url.charAt(collection_url.length - 1) == '/' ? '' : '/');
            var id = req.url.substr(collection_url.length + separator.length);
            found_model = collection.get(id);
            if (id && !found_model) {
                return next();
            }
        }
        
        switch (req.method) {
            case 'GET':
                if (found_model) {
                    res.send(found_model, 200);
                }
                else {
                    res.send(collection, 200);
                }
                break;
            case 'POST':
                var req_model = req.body;
                // req_model.id = randomUDID()
                var try_id = collection.last() ? collection.last().id + 1 : 1;
                while (collection.get(try_id)) {
                    try_id++;
                }
                req_model.id = try_id;
                collection.create(req_model, {
                    success: function(model, response){res.send(model, 200)},
                    error: function(model, response){res.send(response, 500)}
                });
                break;
            case 'PUT':
                if (!found_model) {
                    return res.send(404);
                }
                found_model.save(req.body, {
                    success: function(model, response){res.send(model, 200)},
                    error: function(model, response){res.send(response, 500)}
                });
                break;
            case 'DELETE':
                if (!found_model) {
                    return res.send(404);
                }
                found_model.destroy({
                    success: function(model, response){res.send(204)},
                    error: function(model, response){res.send(response, 500)}
                });
                break;
            default:
                next();
        }
    }
}
