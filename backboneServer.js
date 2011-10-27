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

var ensureID = function (model) {
    if (typeof model.id === 'undefined') {
        if (model.collection) {
            var highest_id = model.collection.highest_id;
            if (typeof highest_id === 'undefined') {
                highest_id = 0;
                var base = stash.key(getUrl(model));
                _.each(stash.list(), function(val, key) {
                    if (val && key.indexOf(base) === 0 && val.id > highest_id) {
                        highest_id = val.id;
                    }
                });
            }
            var new_id = model.collection.highest_id = highest_id + 1;
            model.set({id: new_id});
        }
        else {
            model.id = model.cid;
        }
    }
};

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
                collection.create(collection.parse([req.body])[0], {
                    success: function(model, response){
                        ensureID(model);
                        res.send(model, 200);
                    },
                    error: function(model, response){res.send(response, 500)}
                });
                break;
            case 'PUT':
                if (!found_model) {
                    return res.send(404);
                }
                found_model.save(found_model.parse(req.body), {
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
